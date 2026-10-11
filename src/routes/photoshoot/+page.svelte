<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import '$lib/theme.css';
	import * as api from '$lib/api';
	import AssetActions from '$lib/components/AssetActions.svelte';
	import AssetAlbums from '$lib/components/AssetAlbums.svelte';
	import InfoSheet from '$lib/components/InfoSheet.svelte';
	import ShootControls from '$lib/components/ShootControls.svelte';
	import ShootHeader from '$lib/components/ShootHeader.svelte';
	import ShootTile from '$lib/components/ShootTile.svelte';
	import ShootViewer from '$lib/components/ShootViewer.svelte';
	import UndoButton from '$lib/components/UndoButton.svelte';
	import type { Hotkeys } from '$lib/albumKeys';
	import { formatRange, shootTitle } from '$lib/format';
	import { shareOrDownload } from '$lib/share';
	import type { AlbumList } from '$lib/server/albums';
	import type { QueueItem } from '$lib/server/queue';

	interface Settled {
		shots: QueueItem[];
		picked: string[];
		/** Decisions still on the server, newest last. */
		decided: string[];
	}

	let shots = $state<QueueItem[]>([]);
	let picked = $state<string[]>([]);
	let inAlbum = $state<string[]>([]);
	let last = $state<Settled | null>(null);
	let albumList = $state<AlbumList>({ albums: [], hotkeys: {} });
	let albumFor = $state<string | null>(null);
	let infoFor = $state<string | null>(null);
	let viewing = $state<string | null>(null);
	let loading = $state(true);
	let busy = $state(false);
	let error = $state<string | null>(null);

	const trashing = $derived(shots.length - picked.length);
	const range = $derived(
		shots.length === 0
			? null
			: formatRange(shots[0]!.localDateTime, shots[shots.length - 1]!.localDateTime)
	);

	onMount(() => {
		void next();
		void run(async () => {
			albumList = await api.albums();
		});
	});

	function fail(e: unknown) {
		if (e instanceof api.Unauthorized) void goto(resolve('/login'));
		else error = e instanceof Error ? e.message : String(e);
	}

	async function run(fn: () => Promise<void>) {
		busy = true;
		error = null;
		try {
			await fn();
		} catch (e) {
			fail(e);
		}
		busy = false;
	}

	async function next() {
		loading = true;
		await run(async () => {
			const page = await api.page(null, new URLSearchParams({ mode: 'photoshoot' }));
			shots = page.items;
			picked = [];
			inAlbum = [];
		});
		loading = false;
	}

	function pick(id: string) {
		if (!picked.includes(id)) picked = [...picked, id];
	}

	function toggle(id: string) {
		picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
	}

	// Favorites and albums change in Immich at once; either one also keeps the shot.
	function heart(shot: QueueItem) {
		void run(async () => {
			await api.setFavorite(shot.id, !shot.isFavorite);
			shot.isFavorite = !shot.isFavorite;
			if (shot.isFavorite) pick(shot.id);
		});
	}

	function albumed(id: string, albumIds: string[]) {
		inAlbum = albumIds.length > 0 ? [...inAlbum.filter((i) => i !== id), id] : inAlbum.filter((i) => i !== id);
		if (albumIds.length > 0) pick(id);
	}

	async function saveHotkeys(hotkeys: Hotkeys) {
		await run(async () => {
			await api.saveHotkeys(hotkeys);
			albumList = { ...albumList, hotkeys };
		});
	}

	function share(id: string) {
		void run(async () => void (await shareOrDownload(await api.originalFile(id))));
	}

	// The grid stays as it is until every request is done, so a failed one can be retried.
	async function settle(keepers: string[]) {
		const settled: Settled = { shots: [...shots], picked: [...keepers], decided: [] };
		await run(async () => {
			for (const shot of shots) {
				await api.decide(shot.id, keepers.includes(shot.id) ? 'keep' : 'trash');
				settled.decided.push(shot.id);
			}
		});
		last = settled;
		if (error) shots = shots.filter((s) => !settled.decided.includes(s.id));
		else await next();
	}

	// Takes back the last settled burst and shows it again, as it was picked.
	async function undo() {
		if (!last || busy) return;
		const back = last;
		await run(async () => {
			while (back.decided.length > 0) {
				await api.undo(back.decided[back.decided.length - 1]!);
				back.decided.pop();
			}
			shots = back.shots;
			picked = back.picked;
			last = null;
		});
	}
</script>

{#snippet actions(shot: QueueItem, corners: boolean)}
	<AssetActions
		{corners}
		hearted={shot.isFavorite}
		inAlbum={inAlbum.includes(shot.id)}
		disabled={busy}
		onheart={() => heart(shot)}
		onalbum={() => (albumFor = shot.id)}
		oninfo={() => (infoFor = shot.id)}
		onshare={() => share(shot.id)}
	/>
{/snippet}

<div class="suite">
	<ShootHeader title={shots.length > 0 ? shootTitle(shots[0]!.localDateTime) : 'Photoshoot'} {range} />

	<div class="stage">
		<main class="monitor">
			{#if shots.length > 0}
				<ul>
					{#each shots as shot (shot.id)}
						<li>
							<ShootTile
								{shot}
								picked={picked.includes(shot.id)}
								disabled={busy}
								ontoggle={() => toggle(shot.id)}
								onfullscreen={() => (viewing = shot.id)}
							>
								{@render actions(shot, true)}
							</ShootTile>
						</li>
					{/each}
				</ul>
			{:else if loading}
				<p class="message">Loading photoshoot...</p>
			{:else if !error}
				<p class="message">No photoshoot found. Try again.</p>
			{/if}
		</main>
		<UndoButton disabled={busy || last === null} onundo={undo} />
	</div>

	{#if error}
		<p class="error" role="alert">Error: {error}</p>
	{/if}

	<ShootControls
		{busy}
		empty={shots.length === 0}
		keeping={picked.length}
		{trashing}
		onskip={next}
		onsettle={() => settle(picked.length > 0 ? picked : shots.map((s) => s.id))}
		ontrashall={() => settle([])}
	/>
</div>

<ShootViewer bind:id={viewing} {shots} {picked} ontoggle={toggle}>
	{#snippet children(shot: QueueItem)}
		{@render actions(shot, false)}
	{/snippet}
</ShootViewer>

<AssetAlbums
	bind:id={albumFor}
	albums={albumList.albums}
	hotkeys={albumList.hotkeys}
	onhotkeys={saveHotkeys}
	onchange={albumed}
	onerror={fail}
/>
<InfoSheet bind:id={infoFor} />

<style>
	.suite {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-width: 960px;
		margin: 0 auto;
	}
	.stage {
		position: relative;
		flex: 1;
		min-height: 0;
		display: flex;
	}
	.monitor {
		flex: 1;
		overflow-y: auto;
		background: var(--matte);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
		gap: 8px;
		margin: 0;
		padding: 8px;
		list-style: none;
	}
	.message {
		display: grid;
		place-items: center;
		min-height: 100%;
		margin: 0;
		padding: 24px;
		text-align: center;
		color: var(--text-dim);
	}
	.error {
		margin: 0;
		padding: 8px 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
</style>
