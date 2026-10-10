<script lang="ts">
	import { formatTaken } from '$lib/format';

	let { localDateTime }: { localDateTime: string } = $props();
</script>

<p class="taken">
	<time datetime={localDateTime}>{formatTaken(localDateTime)}</time>
</p>

<style>
	.taken {
		display: flex;
		align-items: center;
		min-height: 48px;
		margin: 0;
		padding: 0 12px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
</style>
