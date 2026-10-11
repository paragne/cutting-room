<script lang="ts">
	import type { AssetTools } from '$lib/assetTools.svelte';
	import type { QueueItem } from '$lib/server/queue';
	import AssetActions from './AssetActions.svelte';
	import ShootControls from './ShootControls.svelte';
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

	function toggle(id: string) {
		picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
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
						disabled={busy}
						ontoggle={() => toggle(shot.id)}
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

<ShootControls
	{busy}
	empty={false}
	keeping={picked.length}
	trashing={shots.length - picked.length}
	{onskip}
	onsettle={() => onsettle(picked.length > 0 ? picked : shots.map((s) => s.id))}
	ontrashall={() => onsettle([])}
/>

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
</style>
