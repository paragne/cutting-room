<script lang="ts">
	import { resolve } from '$app/paths';

	let { range, reviewed }: { range: string | null; reviewed: number } = $props();
</script>

<header>
	<div class="title">
		<h1>Photoshoot</h1>
		{#if range}<p class="range">{range}</p>{/if}
	</div>
	<p class="timecode"><span class="label">Reviewed</span> {reviewed}</p>
	<a href={resolve('/swipe')}>Swipe</a>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 4px 12px;
		min-height: 48px;
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
	.title {
		flex: 1;
	}
	h1 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
		line-height: 1.3;
	}
	.range {
		margin: 0;
		font-variant-numeric: tabular-nums;
		color: var(--text-dim);
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
	a {
		display: grid;
		align-items: center;
		min-height: 48px;
		padding: 0 8px;
		color: var(--text-dim);
		text-decoration: none;
	}
</style>
