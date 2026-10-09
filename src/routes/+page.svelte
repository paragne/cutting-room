<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import '$lib/theme.css';
	import * as api from '$lib/api';
	import AssetInfo from '$lib/components/AssetInfo.svelte';
	import Card from '$lib/components/Card.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import { Deck } from '$lib/deck.svelte';
	import { command } from '$lib/keys';
	import type { Action } from '$lib/server/db';

	const deck = new Deck(api);
	let card = $state<ReturnType<typeof Card>>();
	let from = $state<Action | null>(null);
	let loaded = $state(false);
	let detailsOpen = $state(false);

	onMount(async () => {
		await deck.refill();
		loaded = true;
	});

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

	async function undo() {
		const last = deck.history.at(-1);
		if (!last || deck.busy) return;
		await deck.undo();
		from = last.action;
	}

	function onkeydown(e: KeyboardEvent) {
		const cmd = command(e);
		if (!cmd) return;
		e.preventDefault();
		if (e.repeat) return;
		if (cmd === 'undo') void undo();
		else void decide(cmd);
	}
</script>

<svelte:window {onkeydown} />

<div class="suite">
	<header>
		<h1>Shuffle all</h1>
		<p class="timecode"><span class="label">Reviewed</span> {deck.history.length}</p>
		<form method="post" action="/logout">
			<button type="submit">Log out</button>
		</form>
	</header>

	{#if deck.current}
		<AssetInfo item={deck.current} bind:open={detailsOpen} />
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
				/>
			{/key}
		{:else if deck.done}
			<p class="message">That's a wrap. Every clip is cut or kept, and the bin is empty.</p>
		{:else if loaded}
			<p class="message">The reel is stuck. Nothing came back from the lab.</p>
		{:else}
			<p class="message">Threading the reel...</p>
		{/if}
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
		canUndo={deck.history.length > 0}
		ontrash={() => decide('trash')}
		onundo={undo}
		onkeep={() => decide('keep')}
	/>
</div>

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
	header button {
		min-height: 48px;
		padding: 0 8px;
		font: inherit;
		color: var(--text-dim);
		background: none;
		border: 0;
		cursor: pointer;
	}
	.monitor {
		flex: 1;
		min-height: 0;
		position: relative;
		overflow: hidden;
		background: var(--matte);
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
