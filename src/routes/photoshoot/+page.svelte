<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import '$lib/theme.css';
	import * as api from '$lib/api';
	import { AssetTools } from '$lib/assetTools.svelte';
	import AssetSheets from '$lib/components/AssetSheets.svelte';
	import Shoot from '$lib/components/Shoot.svelte';
	import ShootHeader from '$lib/components/ShootHeader.svelte';
	import { formatRange, shootTitle } from '$lib/format';
	import type { QueueItem } from '$lib/server/queue';

	interface Settled {
		shots: QueueItem[];
		picked: string[];
		/** Decisions still on the server, newest last. */
		decided: string[];
	}

	const tools = new AssetTools(fail, (id) => {
		if (!picked.includes(id)) picked = [...picked, id];
	});
	let shots = $state<QueueItem[]>([]);
	let picked = $state<string[]>([]);
	let last = $state<Settled | null>(null);
	let loading = $state(true);
	let busy = $state(false);
	let error = $state<string | null>(null);

	const range = $derived(
		shots.length === 0
			? null
			: formatRange(shots[0]!.localDateTime, shots[shots.length - 1]!.localDateTime)
	);

	onMount(() => {
		void next();
		void tools.load();
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
			tools.inAlbum = [];
		});
		loading = false;
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

<div class="suite">
	<ShootHeader title={shots.length > 0 ? shootTitle(shots[0]!.localDateTime) : 'Photoshoot'} {range} />

	{#if shots.length > 0}
		<Shoot
			{shots}
			bind:picked
			{busy}
			{tools}
			canUndo={last !== null}
			onsettle={settle}
			onundo={undo}
			onskip={next}
		/>
	{:else}
		<main class="message">
			{#if loading}
				Loading photoshoot...
			{:else if !error}
				No photoshoot found. Try again.
			{/if}
		</main>
	{/if}

	{#if error}
		<p class="error" role="alert">Error: {error}</p>
	{/if}
</div>

<AssetSheets {tools} onerror={fail} />

<style>
	.suite {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-width: 960px;
		margin: 0 auto;
	}
	.message {
		flex: 1;
		display: grid;
		place-items: center;
		padding: 24px;
		text-align: center;
		color: var(--text-dim);
		background: var(--matte);
	}
	.error {
		margin: 0;
		padding: 8px 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
</style>
