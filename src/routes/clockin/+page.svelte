<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import '$lib/theme.css';
	import * as api from '$lib/api';
	import { AssetTools } from '$lib/assetTools.svelte';
	import AssetSheets from '$lib/components/AssetSheets.svelte';
	import CardStage from '$lib/components/CardStage.svelte';
	import Shoot from '$lib/components/Shoot.svelte';
	import { Clockin } from '$lib/clockin.svelte';
	import { command, digit } from '$lib/keys';
	import type { Action } from '$lib/server/db';

	const shift = new Clockin({ ...api, page: api.clockinPage });
	const tools = new AssetTools(
		(e) => shift.fail(e),
		(id) => {
			if (shift.current?.kind === 'burst' && !picked.includes(id)) picked = [...picked, id];
		}
	);
	let stage = $state<ReturnType<typeof CardStage>>();
	let from = $state<Action | null>(null);
	let picked = $state<string[]>([]);
	let loaded = $state(false);

	onMount(async () => {
		await Promise.all([shift.refill(), tools.load()]);
		loaded = true;
	});

	$effect(() => void (shift.expired && goto(resolve('/login'))));

	// A new burst starts with nothing picked.
	$effect(() => {
		void shift.current;
		picked = [];
	});

	async function undo() {
		const done = await shift.undo();
		if (!done) return;
		from = 'action' in done ? done.action : null;
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
	<header>
		<h1>Clock in</h1>
		<p class="timecode"><span class="label">Reviewed</span> {shift.reviewed}</p>
		<a href={resolve('/')}>Home</a>
	</header>

	{#if shift.current?.kind === 'card'}
		<CardStage
			bind:this={stage}
			item={shift.current.item}
			upcoming={shift.upcoming}
			{from}
			busy={shift.busy}
			{tools}
			canUndo={shift.history.length > 0}
			ondecide={(action) => {
				from = null;
				return shift.decideCard(action);
			}}
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
				That's a wrap. Every clip is cut or kept, and the bin is empty.
			{:else if loaded}
				The reel is stuck. Nothing came back from the lab.
			{:else}
				Threading the reel...
			{/if}
		</main>
	{/if}

	{#if shift.error}
		<p class="error" role="alert">
			Something jammed: {shift.error}
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
	}
	.timecode {
		margin: 0;
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
