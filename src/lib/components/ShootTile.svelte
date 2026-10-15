<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { QueueItem } from '$lib/server/queue';
	import KeepBox from './KeepBox.svelte';

	/** Longest press, in ms, that still counts as a tap. */
	const HOLD_MS = 300;

	let {
		shot,
		picked,
		selecting = false,
		disabled,
		ontoggle,
		onfullscreen,
		onhold,
		children
	}: {
		shot: QueueItem;
		picked: boolean;
		/** In select mode a tap ticks the shot instead of opening it. */
		selecting?: boolean;
		disabled: boolean;
		ontoggle: () => void;
		onfullscreen: () => void;
		onhold?: () => void;
		/** The action buttons. */
		children: Snippet;
	} = $props();

	let timer: ReturnType<typeof setTimeout> | undefined;
	let held = false;

	function onpointerdown() {
		held = false;
		if (selecting || !onhold) return;
		timer = setTimeout(() => {
			held = true;
			onhold();
		}, HOLD_MS);
	}

	function cancelHold() {
		clearTimeout(timer);
	}

	function onclick() {
		if (held) held = false;
		else if (selecting) ontoggle();
		else onfullscreen();
	}
</script>

<div class="tile">
	<button
		class="pick"
		class:picked={selecting && picked}
		class:dim={selecting && !picked}
		aria-label={selecting ? 'Keep this photo' : 'View full screen'}
		aria-pressed={selecting ? picked : undefined}
		{disabled}
		{onpointerdown}
		onpointerup={cancelHold}
		onpointerleave={cancelHold}
		onpointercancel={cancelHold}
		oncontextmenu={(e) => e.preventDefault()}
		{onclick}
	>
		<img src="/media/{shot.id}/preview" alt="" />
	</button>
	<div class="extras">{@render children()}</div>
	{#if selecting}
		<div class="keep"><KeepBox {picked} /></div>
	{/if}
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
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	/* Touch has no hover, and holding a photo is how it gets selected. */
	.extras {
		display: none;
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.keep {
		position: absolute;
		top: 6px;
		right: 6px;
		pointer-events: none;
	}
	.pick.dim img {
		opacity: 0.7;
	}
	@media (hover: hover) and (pointer: fine) {
		.tile:hover .extras,
		.tile:has(:focus-visible) .extras {
			display: block;
		}
	}
</style>
