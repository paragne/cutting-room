<script lang="ts">
	import type { Cut } from '$lib/deck.svelte';

	let { history }: { history: Cut[] } = $props();

	// Older clips scroll off the left edge; the strip only needs the recent run.
	const recent = $derived(history.slice(-120));
	const kept = $derived(history.filter((c) => c.action === 'keep').length);
</script>

<div class="timeline" role="img" aria-label="This session: {kept} kept, {history.length - kept} trashed">
	{#each recent as cut (cut.item.id)}
		<span class="clip {cut.action}"></span>
	{/each}
	<span class="playhead"></span>
</div>

<style>
	.timeline {
		display: flex;
		align-items: stretch;
		justify-content: flex-end;
		gap: 2px;
		height: 28px;
		padding: 4px 12px;
		overflow: hidden;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
	.clip {
		flex: none;
		width: 8px;
		border-radius: 2px;
	}
	.keep {
		background: var(--keep);
	}
	.trash {
		background: var(--cut);
	}
	.playhead {
		flex: none;
		width: 2px;
		margin-left: 2px;
		background: var(--amber);
	}
</style>
