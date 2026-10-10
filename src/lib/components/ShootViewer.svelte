<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id = $bindable<string | null>(null),
		picked,
		ontoggle,
		children
	}: {
		id: string | null;
		picked: boolean;
		ontoggle: () => void;
		/** The action buttons. */
		children: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (id !== null && !dialog?.open) dialog?.showModal();
		else if (id === null && dialog?.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (id = null)} aria-label="Full screen shot">
	{#if id !== null}
		<img src="/media/{id}/preview" alt="" />
	{/if}
	<div class="top">
		{@render children()}
		<button class="close" aria-label="Close full screen" onclick={() => (id = null)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
		</button>
	</div>
	<button class="keep" class:picked aria-pressed={picked} onclick={ontoggle}>
		{picked ? 'Keeping this shot' : 'Keep this shot'}
	</button>
</dialog>

<style>
	dialog {
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		background: var(--matte);
		border: 0;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.top {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		gap: 6px;
	}
	.close {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		color: var(--text);
		background: color-mix(in srgb, var(--matte) 55%, transparent);
		border: 0;
		border-radius: 4px;
		cursor: pointer;
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.keep {
		position: absolute;
		left: 50%;
		bottom: 16px;
		transform: translateX(-50%);
		min-height: 56px;
		padding: 0 24px;
		font: inherit;
		font-weight: 600;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
	.keep.picked {
		color: var(--keep);
		border-color: var(--keep);
	}
</style>
