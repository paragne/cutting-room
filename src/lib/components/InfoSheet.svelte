<script lang="ts">
	import { assetInfo } from '$lib/api';
	import { infoRows } from '$lib/format';
	import type { AssetInfo } from '$lib/server/assetInfo';

	let { id = $bindable<string | null>(null) }: { id: string | null } = $props();

	let dialog = $state<HTMLDialogElement>();
	let info = $state<AssetInfo | null>(null);
	let failed = $state(false);

	$effect(() => {
		info = null;
		failed = false;
		if (id === null) {
			if (dialog?.open) dialog.close();
			return;
		}
		if (!dialog?.open) dialog?.showModal();
		let stale = false;
		assetInfo(id).then(
			(loaded) => !stale && (info = loaded),
			() => !stale && (failed = true)
		);
		return () => (stale = true);
	});
</script>

<dialog bind:this={dialog} onclose={() => (id = null)} aria-labelledby="info-title">
	<h2 id="info-title" class="label">Details</h2>
	{#if failed}
		<p class="note">Details unavailable.</p>
	{:else if info}
		<dl>
			{#each infoRows(info) as [name, value] (name)}
				<dt class="label">{name}</dt>
				<dd>{value}</dd>
			{/each}
		</dl>
	{:else}
		<p class="note">Loading...</p>
	{/if}
	<button onclick={() => (id = null)}>Close</button>
</dialog>

<style>
	dialog {
		width: min(100%, 960px);
		max-width: none;
		margin: auto auto 0;
		padding: 12px;
		color: var(--text);
		background: var(--panel);
		border: 0;
		border-top: 1px solid var(--hairline);
	}
	dialog::backdrop {
		background: color-mix(in srgb, var(--matte) 70%, transparent);
	}
	.label {
		margin: 0;
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
		margin: 8px 0;
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.note {
		color: var(--text-dim);
	}
	button {
		width: 100%;
		min-height: 48px;
		font: inherit;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
</style>
