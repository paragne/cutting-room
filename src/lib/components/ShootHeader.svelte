<script lang="ts">
	let { title, range }: { title: string; range: string | null } = $props();
</script>

<header>
	<div class="title">
		<h1>{title}</h1>
		{#if range}<p class="range">{range}</p>{/if}
	</div>
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
</style>
