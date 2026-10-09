<script lang="ts">
	import { assetInfo } from '$lib/api';
	import { formatBytes, formatTaken } from '$lib/format';
	import type { AssetInfo } from '$lib/server/assetInfo';
	import type { QueueItem } from '$lib/server/queue';

	let { item, open = $bindable(false) }: { item: QueueItem; open: boolean } = $props();

	let info = $state<AssetInfo | null>(null);
	let failed = $state(false);

	$effect(() => {
		const id = item.id;
		info = null;
		failed = false;
		if (!open) return;
		let stale = false;
		assetInfo(id).then(
			(loaded) => !stale && (info = loaded),
			() => !stale && (failed = true)
		);
		return () => (stale = true);
	});

	const rows = $derived(
		info
			? ([
					['File', info.fileName],
					['Camera', info.camera],
					['Lens', info.lens],
					['Dimensions', info.width && info.height ? `${info.width} × ${info.height}` : null],
					['File size', info.sizeBytes === null ? null : formatBytes(info.sizeBytes)],
					['Place', info.place]
				] as const).filter(([, value]) => value)
			: []
	);
</script>

<details class="info" bind:open>
	<summary>
		<time datetime={item.localDateTime}>{formatTaken(item.localDateTime)}</time>
		<span class="label">Details</span>
	</summary>
	{#if failed}
		<p class="note">Details unavailable.</p>
	{:else if info}
		<dl>
			{#each rows as [name, value] (name)}
				<dt class="label">{name}</dt>
				<dd>{value}</dd>
			{/each}
		</dl>
	{:else}
		<p class="note">Loading...</p>
	{/if}
</details>

<style>
	.info {
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 48px;
		padding: 0 12px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 16px;
		margin: 0;
		padding: 4px 12px 12px;
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.note {
		margin: 0;
		padding: 4px 12px 12px;
		color: var(--text-dim);
	}
</style>
