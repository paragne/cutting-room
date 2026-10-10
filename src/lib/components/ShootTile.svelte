<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { QueueItem } from '$lib/server/queue';

	let {
		shot,
		picked,
		disabled,
		ontoggle,
		onfullscreen,
		children
	}: {
		shot: QueueItem;
		picked: boolean;
		disabled: boolean;
		ontoggle: () => void;
		onfullscreen: () => void;
		/** The action buttons. */
		children: Snippet;
	} = $props();
</script>

<div class="tile">
	<button class="pick" class:picked aria-pressed={picked} aria-label="Keep this shot" {disabled} onclick={ontoggle}>
		<img src="/media/{shot.id}/preview" alt="" />
	</button>
	<div class="extras">{@render children()}</div>
	<button class="full" aria-label="View full screen" onclick={onfullscreen}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
	</button>
</div>

<style>
	.tile {
		position: relative;
	}
	.pick {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		padding: 0;
		overflow: hidden;
		background: var(--panel);
		border: 2px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
	.pick.picked {
		border-color: var(--keep);
	}
	.pick:not(.picked) img {
		opacity: 0.7;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.extras {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.full {
		position: absolute;
		right: 6px;
		bottom: 6px;
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		color: var(--text-dim);
		background: color-mix(in srgb, var(--matte) 55%, transparent);
		border: 0;
		border-radius: 4px;
		cursor: pointer;
	}
	.full:hover,
	.full:focus-visible {
		color: #fff;
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	@media (hover: hover) and (pointer: fine) {
		.full,
		.extras {
			opacity: 0;
		}
		.tile:hover .full,
		.tile:hover .extras,
		.tile:focus-within .extras,
		.full:focus-visible {
			opacity: 1;
		}
	}
</style>
