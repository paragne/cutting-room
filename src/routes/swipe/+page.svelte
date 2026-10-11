<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import '$lib/theme.css';
	import * as api from '$lib/api';
	import AssetActions from '$lib/components/AssetActions.svelte';
	import AssetAlbums from '$lib/components/AssetAlbums.svelte';
	import AssetInfo from '$lib/components/AssetInfo.svelte';
	import Card from '$lib/components/Card.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import InfoSheet from '$lib/components/InfoSheet.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import UndoButton from '$lib/components/UndoButton.svelte';
	import { Deck } from '$lib/deck.svelte';
	import type { Hotkeys } from '$lib/albumKeys';
	import { command, digit } from '$lib/keys';
	import { shareOrDownload } from '$lib/share';
	import type { AlbumList } from '$lib/server/albums';
	import type { Action } from '$lib/server/db';

	const modeQuery = new URLSearchParams(
		[...page.url.searchParams].filter(([key]) => key === 'mode' || key === 'album')
	);
	const deck = new Deck({ ...api, page: (cursor) => api.page(cursor, modeQuery) });
	let card = $state<ReturnType<typeof Card>>();
	let from = $state<Action | null>(null);
	let loaded = $state(false);
	let albumList = $state<AlbumList>({ albums: [], hotkeys: {} });
	let albumFor = $state<string | null>(null);
	let infoFor = $state<string | null>(null);
	// Assets this session put in an album; Immich is asked only when the sheet opens.
	let inAlbum = $state<string[]>([]);

	const title = $derived(
		(modeQuery.get('mode') === 'album'
			? albumList.albums.find((a) => a.id === modeQuery.get('album'))?.name
			: undefined) ?? 'Shuffle all'
	);

	onMount(async () => {
		await Promise.all([deck.refill(), loadAlbums()]);
		loaded = true;
	});

	function fail(e: unknown) {
		if (e instanceof api.Unauthorized) deck.expired = true;
		else deck.error = e instanceof Error ? e.message : String(e);
	}

	async function loadAlbums() {
		try {
			albumList = await api.albums();
		} catch (e) {
			fail(e);
		}
	}

	async function saveHotkeys(hotkeys: Hotkeys) {
		try {
			await api.saveHotkeys(hotkeys);
			albumList = { ...albumList, hotkeys };
		} catch (e) {
			fail(e);
		}
	}

	function albumed(id: string, albumIds: string[]) {
		inAlbum = albumIds.length > 0 ? [...inAlbum.filter((i) => i !== id), id] : inAlbum.filter((i) => i !== id);
	}

	async function addToAlbum(albumId: string) {
		const id = deck.current?.id;
		if (!id) return;
		try {
			await api.setMember(id, albumId, true);
			albumed(id, [albumId]);
		} catch (e) {
			fail(e);
		}
	}

	async function share() {
		const id = deck.current?.id;
		if (!id) return;
		try {
			await shareOrDownload(await api.originalFile(id));
		} catch (e) {
			fail(e);
		}
	}

	$effect(() => {
		if (deck.expired) void goto(resolve('/login'));
	});

	async function decide(action: Action) {
		const shown = deck.current;
		if (!shown || deck.busy || !card) return;
		from = null;
		await Promise.all([deck.decide(action), card.exit(action)]);
		if (deck.current === shown) card?.rest();
	}

	function toggleFavorite() {
		if (deck.current) void deck.setFavorite(!deck.current.isFavorite);
	}

	async function undo() {
		const last = deck.history.at(-1);
		if (!last || deck.busy) return;
		await deck.undo();
		from = last.action;
	}

	function onkeydown(e: KeyboardEvent) {
		if (albumFor !== null || infoFor !== null) return;
		const album = digit(e);
		if (album !== null) {
			const albumId = albumList.hotkeys[album];
			if (albumId && !e.repeat) void addToAlbum(albumId);
			return;
		}
		const cmd = command(e);
		if (!cmd) return;
		e.preventDefault();
		if (e.repeat) return;
		if (cmd === 'undo') void undo();
		else if (cmd === 'favorite') toggleFavorite();
		else if (cmd === 'skip') deck.skip();
		else void decide(cmd);
	}
</script>

<svelte:window {onkeydown} />

<div class="suite">
	<header>
		<h1>{title}</h1>
		<p class="timecode"><span class="label">Reviewed</span> {deck.history.length}</p>
		<a href={resolve('/')}>Home</a>
	</header>

	{#if deck.current}
		<AssetInfo localDateTime={deck.current.localDateTime} />
	{/if}

	<main class="monitor">
		{#if deck.current}
			{#key deck.current.id}
				<Card
					bind:this={card}
					item={deck.current}
					{from}
					disabled={deck.busy}
					onrelease={decide}
					onfavorite={toggleFavorite}
				/>
			{/key}
			<div class="actions">
				<AssetActions
					hearted={deck.current.isFavorite}
					inAlbum={inAlbum.includes(deck.current.id)}
					disabled={deck.busy}
					onheart={toggleFavorite}
					onalbum={() => (albumFor = deck.current?.id ?? null)}
					oninfo={() => (infoFor = deck.current?.id ?? null)}
					onshare={share}
				/>
			</div>
		{:else if deck.done}
			<p class="message">That's a wrap. Every clip is cut or kept, and the bin is empty.</p>
		{:else if loaded}
			<p class="message">The reel is stuck. Nothing came back from the lab.</p>
		{:else}
			<p class="message">Threading the reel...</p>
		{/if}
		<UndoButton disabled={deck.busy || deck.history.length === 0} onundo={undo} />
		{#each deck.upcoming as next (next.id)}
			<img class="preload" src="/media/{next.id}/preview" alt="" aria-hidden="true" />
		{/each}
	</main>

	{#if deck.error}
		<p class="error" role="alert">
			Something jammed: {deck.error}
			{#if !deck.current}
				<button onclick={() => deck.refill()}>Retry</button>
			{/if}
		</p>
	{/if}

	<Timeline history={deck.history} />
	<Controls
		busy={deck.busy || !deck.current}
		ontrash={() => decide('trash')}
		onskip={() => deck.skip()}
		onkeep={() => decide('keep')}
	/>
</div>

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
		height: 100dvh;
		max-width: 960px;
		margin: 0 auto;
	}
	header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 0 12px;
		min-height: 48px;
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
	h1 {
		flex: 1;
		margin: 0;
		font-size: 15px;
		font-weight: 600;
		line-height: 1.3;
	}
	.timecode {
		margin: 0;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--amber);
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	header a {
		display: grid;
		place-items: center;
		min-height: 48px;
		padding: 0 8px;
		color: var(--text-dim);
		text-decoration: none;
	}
	.monitor {
		flex: 1;
		min-height: 0;
		position: relative;
		overflow: hidden;
		background: var(--matte);
	}
	.actions {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1;
	}
	.message {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 24px;
		text-align: center;
		color: var(--text-dim);
	}
	.preload {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.error {
		margin: 0;
		padding: 8px 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
	.error button {
		min-height: 48px;
		margin-left: 8px;
		padding: 0 16px;
		font: inherit;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}
</style>
