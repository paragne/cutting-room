<script lang="ts">
	let { picked }: { picked: boolean } = $props();
</script>

<span class="keepbox" class:picked>
	<span class="label">KEEP?</span>
	<span class="box">
		{#if picked}
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
		{/if}
	</span>
</span>

<style>
	.keepbox {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		color: var(--text);
		background: color-mix(in srgb, var(--matte) 70%, transparent);
		border-radius: 4px;
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
	}
	.box {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 2px solid var(--text-dim);
		border-radius: 4px;
	}
	.picked {
		color: var(--keep);
	}
	.picked .box {
		border-color: var(--keep);
	}
	svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 3;
	}
</style>
