<script lang="ts">
	import type { AssetTools } from '$lib/assetTools.svelte';
	import { settleLabel, toggled } from '$lib/select';
	import type { QueueItem } from '$lib/server/queue';
	import AssetActions from './AssetActions.svelte';
	import ShootTile from './ShootTile.svelte';
	import ShootViewer from './ShootViewer.svelte';
	import UndoButton from './UndoButton.svelte';

	let {
		shots,
		picked = $bindable(),
		busy,
		tools,
		canUndo,
		onsettle,
		onundo,
		onskip
	}: {
		shots: QueueItem[];
		/** Ids of the shots to keep. */
		picked: string[];
		busy: boolean;
		tools: AssetTools;
		canUndo: boolean;
		onsettle: (keepers: string[]) => void;
		onundo: () => void;
		onskip: () => void;
	} = $props();

	let viewing = $state<string | null>(null);

	let entered = $state(false);
	// A favorite or an album also ticks its shot, which has to be kept.
	const selecting = $derived(entered || picked.length > 0);

	$effect(() => {
		void shots;
		entered = false;
	});

	function toggle(id: string) {
		entered = true;
		picked = toggled(picked, id);
	}

	function cancel() {
		entered = false;
		picked = [];
	}

	// Favorites and albums change in Immich at once; the page also keeps the shot picked.
	async function heart(shot: QueueItem) {
		await tools.toggleFavorite(shot);
		if (shot.isFavorite && !picked.includes(shot.id)) picked = [...picked, shot.id];
	}
</script>

{#snippet actions(shot: QueueItem, corners: boolean)}
	<AssetActions
		{corners}
		hearted={shot.isFavorite}
		inAlbum={tools.inAlbum.includes(shot.id)}
		disabled={busy}
		onheart={() => heart(shot)}
		onalbum={() => (tools.albumFor = shot.id)}
		oninfo={() => (tools.infoFor = shot.id)}
		onshare={() => tools.share(shot.id)}
	/>
{/snippet}

<div class="stage">
	<main class="monitor">
		<ul>
			{#each shots as shot (shot.id)}
				<li>
					<ShootTile
						{shot}
						picked={picked.includes(shot.id)}
						{selecting}
						disabled={busy}
						ontoggle={() => toggle(shot.id)}
						onhold={() => toggle(shot.id)}
						onfullscreen={() => (viewing = shot.id)}
					>
						{@render actions(shot, true)}
					</ShootTile>
				</li>
			{/each}
		</ul>
	</main>
	<UndoButton disabled={busy || !canUndo} {onundo} />
</div>

<div class="controls">
	{#if selecting}
		<button disabled={busy} onclick={cancel}>Cancel</button>
		<button class="trash" disabled={busy} onclick={() => onsettle(picked)}>
			{settleLabel(picked.length, shots.length)}
		</button>
	{:else}
		<button disabled={busy} onclick={onskip}>Skip</button>
		<button class="trash" disabled={busy} onclick={() => onsettle([])}>Trash all</button>
	{/if}
</div>

<ShootViewer bind:id={viewing} {shots} {picked} ontoggle={toggle}>
	{#snippet children(shot: QueueItem)}
		{@render actions(shot, false)}
	{/snippet}
</ShootViewer>

<style>
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
	.controls {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 8px;
		padding: 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
	button {
		min-height: 56px;
		font: inherit;
		font-weight: 600;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
	.trash:not(:disabled) {
		color: var(--cut);
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
</style>
