<script lang="ts">
	import type { Action } from '$lib/server/db';
	import type { QueueItem } from '$lib/server/queue';
	import CardVideo from './CardVideo.svelte';
	import DragOverlay from './DragOverlay.svelte';
	import { release, velocity, type Sample } from '$lib/swipe';
	import { isDoubleTap, isTap, type Point } from '$lib/tap';

	let {
		item,
		disabled = false,
		onrelease,
		onfavorite
	}: {
		item: QueueItem;
		disabled?: boolean;
		onrelease: (action: Action) => void;
		onfavorite: () => void;
	} = $props();

	let el: HTMLDivElement;
	let video = $state<ReturnType<typeof CardVideo>>();
	let dx = $state(0);
	let width = $state(1);
	let dragging = $state(false);
	let origin = { x: 0, y: 0 };
	let samples: Sample[] = [];
	let pressed: Point = { x: 0, y: 0, t: 0 };
	let lastTap: Point | null = null;

	const hint = $derived(dx === 0 ? null : dx > 0 ? 'keep' : 'trash');
	const strength = $derived(Math.min(1, Math.abs(dx) / (0.3 * width)));

	/** Brings the card back after a failed decision. */
	export function rest() {
		dx = 0;
	}

	function down(e: PointerEvent) {
		if (disabled || !e.isPrimary || e.button !== 0) return;
		el.setPointerCapture(e.pointerId);
		dragging = true;
		width = el.clientWidth;
		origin = { x: e.clientX, y: e.clientY };
		pressed = { ...origin, t: e.timeStamp };
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
		const tap = { x: e.clientX, y: e.clientY, t: e.timeStamp };
		if (!isTap(pressed, tap)) return;
		if (inCenter(tap)) video?.togglePlay();
		if (lastTap && isDoubleTap(lastTap, tap)) {
			lastTap = null;
			onfavorite();
		} else lastTap = tap;
	}

	// The middle fifth of each side, so a tap on the buttons or the edges never lands here.
	function inCenter(p: Point): boolean {
		const r = el.getBoundingClientRect();
		return Math.abs(p.x - (r.left + r.width / 2)) < r.width * 0.2 &&
			Math.abs(p.y - (r.top + r.height / 2)) < r.height * 0.2;
	}

	function cancel() {
		dragging = false;
		dx = 0;
	}
</script>

<div
	class="card"
	bind:this={el}
	style:transform={`translateX(${dx}px)`}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={cancel}
	role="presentation"
>
	{#if item.type === 'VIDEO'}
		<CardVideo bind:this={video} id={item.id} />
	{:else}
		<img src="/media/{item.id}/{item.isGif ? 'original' : 'preview'}" alt="Photo taken {item.localDateTime.slice(0, 10)}" draggable="false" />
	{/if}
	{#if dragging}
		<DragOverlay {hint} {strength} />
	{/if}
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
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}
</style>
