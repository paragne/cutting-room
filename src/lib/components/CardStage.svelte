<script lang="ts">
	import type { AssetTools } from '$lib/assetTools.svelte';
	import type { Action } from '$lib/server/db';
	import type { QueueItem } from '$lib/server/queue';
	import AssetActions from './AssetActions.svelte';
	import AssetInfo from './AssetInfo.svelte';
	import Card from './Card.svelte';
	import Controls from './Controls.svelte';
	import UndoButton from './UndoButton.svelte';

	let {
		item,
		upcoming,
		busy,
		tools,
		canUndo,
		ondecide,
		onundo,
		onskip
	}: {
		item: QueueItem;
		upcoming: QueueItem[];
		busy: boolean;
		tools: AssetTools;
		canUndo: boolean;
		ondecide: (action: Action) => Promise<void>;
		onundo: () => void;
		onskip: () => void;
	} = $props();

	let card = $state<ReturnType<typeof Card>>();

	/** The card stays where it was released while the server call is in flight, and comes back if it failed. */
	export async function decide(action: Action): Promise<void> {
		if (busy || !card) return;
		const shown = item;
		await ondecide(action);
		if (item === shown) card?.rest();
	}
</script>

<AssetInfo localDateTime={item.localDateTime} />

<main class="monitor">
	{#key item.id}
		<Card
			bind:this={card}
			{item}
			disabled={busy}
			onrelease={decide}
			onfavorite={() => tools.toggleFavorite(item)}
		/>
	{/key}
	<div class="actions">
		<AssetActions
			hearted={item.isFavorite}
			inAlbum={tools.inAlbum.includes(item.id)}
			disabled={busy}
			onheart={() => tools.toggleFavorite(item)}
			onalbum={() => (tools.albumFor = item.id)}
			oninfo={() => (tools.infoFor = item.id)}
			onshare={() => tools.share(item.id)}
		/>
	</div>
	<UndoButton disabled={busy || !canUndo} {onundo} />
	{#each upcoming as next (next.id)}
		<img class="preload" src="/media/{next.id}/preview" alt="" aria-hidden="true" />
	{/each}
</main>

<Controls {busy} ontrash={() => decide('trash')} {onskip} onkeep={() => decide('keep')} />

<style>
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
	.preload {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
</style>
