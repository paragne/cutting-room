<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, untrack } from 'svelte';
	import '$lib/theme.css';
	import * as api from '$lib/api';
	import { AssetTools } from '$lib/assetTools.svelte';
	import AssetSheets from '$lib/components/AssetSheets.svelte';
	import CardStage from '$lib/components/CardStage.svelte';
	import ShiftSummary from '$lib/components/ShiftSummary.svelte';
	import ShootHeader from '$lib/components/ShootHeader.svelte';
	import Shoot from '$lib/components/Shoot.svelte';
	import { Clockin } from '$lib/clockin.svelte';
	import { formatRange } from '$lib/format';
	import { command, digit } from '$lib/keys';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const shift = new Clockin({ ...api, page: api.clockinPage }, untrack(() => data.shiftMinutes));
	const tools = new AssetTools(
		(e) => shift.fail(e),
		(id) => {
			if (shift.current?.kind === 'burst' && !picked.includes(id)) picked = [...picked, id];
		}
	);
	let stage = $state<ReturnType<typeof CardStage>>();
	let picked = $state<string[]>([]);
	let loaded = $state(false);

	onMount(async () => {
		await Promise.all([shift.refill(), tools.load()]);
		loaded = true;
	});

	$effect(() => void (shift.expired && goto(resolve('/login'))));

	// The summary shows library totals, so reload them when the shift ends.
	$effect(() => void (shift.shiftOver && invalidateAll()));

	// A new burst starts with nothing picked.
	$effect(() => {
		void shift.current;
		picked = [];
	});

	async function undo() {
		const done = await shift.undo();
		if (!done) return;
		if ('picked' in done) picked = done.picked;
	}

	function onkeydown(e: KeyboardEvent) {
		if (tools.albumFor !== null || tools.infoFor !== null) return;
		const entry = shift.current;
		const cmd = command(e);
		if (cmd === 'undo') {
			e.preventDefault();
			if (!e.repeat) void undo();
			return;
		}
		if (entry?.kind !== 'card') return;
		const album = digit(e);
		if (album !== null) {
			const albumId = tools.albumList.hotkeys[album];
			if (albumId && !e.repeat) void tools.addTo(entry.item.id, albumId);
			return;
		}
		if (!cmd) return;
		e.preventDefault();
		if (e.repeat) return;
		if (cmd === 'favorite') void tools.toggleFavorite(entry.item);
		else if (cmd === 'skip') shift.skip();
		else void stage?.decide(cmd);
	}
</script>

<svelte:window {onkeydown} />

<div class="suite">
	<ShootHeader
		title="Dailies"
		home
		range={shift.current?.kind === 'burst'
			? formatRange(shift.current.items[0]!.localDateTime, shift.current.items.at(-1)!.localDateTime)
			: null}
		reviewed={shift.reviewed}
	/>

	{#if shift.shiftOver}
		<ShiftSummary totals={data.totals} onnext={() => shift.nextShift()} />
	{:else if shift.current?.kind === 'card'}
		<CardStage
			bind:this={stage}
			item={shift.current.item}
			upcoming={shift.upcoming}
			busy={shift.busy}
			{tools}
			canUndo={shift.history.length > 0}
			ondecide={(action) => shift.decideCard(action)}
			onundo={undo}
			onskip={() => shift.skip()}
		/>
	{:else if shift.current?.kind === 'burst'}
		<Shoot
			shots={shift.current.items}
			bind:picked
			busy={shift.busy}
			{tools}
			canUndo={shift.history.length > 0}
			onsettle={(keepers) => shift.settle(keepers)}
			onundo={undo}
			onskip={() => shift.skip()}
		/>
	{:else}
		<main class="message">
			{#if shift.done}
				No unreviewed photos left.
			{:else if loaded}
				Could not load photos.
			{:else}
				Loading photos...
			{/if}
		</main>
	{/if}

	{#if shift.error}
		<p class="error" role="alert">
			Error: {shift.error}
			{#if !shift.current}
				<button onclick={() => shift.refill()}>Retry</button>
			{/if}
		</p>
	{/if}
</div>

<AssetSheets {tools} onerror={(e) => shift.fail(e)} />

<style>
	.suite {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		max-width: 960px;
		margin: 0 auto;
	}
	.message {
		flex: 1;
		display: grid;
		place-items: center;
		background: var(--matte);
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
