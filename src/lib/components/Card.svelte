<script lang="ts">
	import type { Action } from '$lib/server/db';
	import type { QueueItem } from '$lib/server/queue';
	import DragOverlay from './DragOverlay.svelte';
	import { release, velocity, type Sample } from '$lib/swipe';

	let {
		item,
		from = null,
		disabled = false,
		onrelease
	}: {
		item: QueueItem;
		/** The decision this card is returning from, so undo plays it backwards. */
		from?: Action | null;
		disabled?: boolean;
		onrelease: (action: Action) => void;
	} = $props();

	// Keep in step with the transition durations in the style block.
	const SLIDE_MS = 220;
	const RAZOR_MS = 120;

	let el: HTMLDivElement;
	let dx = $state(0);
	let width = $state(1);
	let dragging = $state(false);
	let leaving = $state<Action | null>(null);
	let origin = { x: 0, y: 0 };
	let samples: Sample[] = [];

	const transform = $derived(
		leaving === 'keep'
			? 'translateX(120%)'
			: leaving === 'trash'
				? 'translateY(110%)'
				: `translateX(${dx}px)`
	);
	const hint = $derived(dx === 0 ? null : dx > 0 ? 'keep' : 'trash');
	const strength = $derived(Math.min(1, Math.abs(dx) / (0.3 * width)));

	/** Plays the exit and resolves when it has finished. */
	export function exit(action: Action): Promise<void> {
		leaving = action;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const ms = reduced ? 0 : action === 'trash' ? RAZOR_MS + SLIDE_MS : SLIDE_MS;
		return new Promise((done) => setTimeout(done, ms));
	}

	/** Brings the card back after a failed decision. */
	export function rest() {
		leaving = null;
		dx = 0;
	}

	function down(e: PointerEvent) {
		if (disabled || leaving || !e.isPrimary || e.button !== 0) return;
		el.setPointerCapture(e.pointerId);
		dragging = true;
		width = el.clientWidth;
		origin = { x: e.clientX, y: e.clientY };
		samples = [{ x: e.clientX, t: e.timeStamp }];
	}

	function move(e: PointerEvent) {
		if (!dragging) return;
		dx = e.clientX - origin.x;
		samples = [...samples.filter((s) => e.timeStamp - s.t < 200), { x: e.clientX, t: e.timeStamp }];
	}

	function up(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		const action = release(
			dx,
			e.clientY - origin.y,
			velocity(samples, e.timeStamp),
			width
		);
		if (action) onrelease(action);
		else dx = 0;
	}

	function cancel() {
		dragging = false;
		dx = 0;
	}
</script>

<div
	class="card"
	class:settle={!dragging}
	class:trashing={leaving === 'trash'}
	class:from-keep={from === 'keep'}
	class:from-trash={from === 'trash'}
	bind:this={el}
	style:transform
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={cancel}
	role="presentation"
>
	<img src="/media/{item.id}/preview" alt="Photo taken {item.localDateTime.slice(0, 10)}" draggable="false" />
	{#if item.type === 'VIDEO'}
		<span class="kind">Video</span>
	{/if}
	{#if dragging}
		<DragOverlay {hint} {strength} />
	{/if}
	<span class="razor" class:cut={leaving === 'trash'}></span>
</div>

<style>
	.card {
		position: absolute;
		inset: 0;
		touch-action: none;
		user-select: none;
		cursor: grab;
	}
	.card:active {
		cursor: grabbing;
	}
	.settle {
		transition: transform 220ms ease-out;
	}
	.trashing {
		transition-delay: 120ms;
	}
	.from-keep {
		animation: in-right 220ms ease-out;
	}
	.from-trash {
		animation: in-bottom 220ms ease-out;
	}
	@keyframes in-right {
		from {
			transform: translateX(120%);
		}
	}
	@keyframes in-bottom {
		from {
			transform: translateY(110%);
		}
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}
	.kind {
		position: absolute;
		left: 12px;
		bottom: 12px;
		padding: 4px 8px;
		background: var(--panel);
		border-radius: 2px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	.razor {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--cut);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 120ms linear;
	}
	.razor.cut {
		transform: scaleX(1);
	}
	@media (prefers-reduced-motion: reduce) {
		.settle,
		.razor {
			transition: none;
		}
		.from-keep,
		.from-trash {
			animation: none;
		}
	}
</style>
