<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { QueueItem } from '$lib/server/queue';
	import { insidePhoto, swipeStep } from '$lib/viewer';

	let {
		id = $bindable<string | null>(null),
		shots,
		picked,
		ontoggle,
		children
	}: {
		id: string | null;
		shots: QueueItem[];
		/** Ids of the shots to keep. */
		picked: string[];
		ontoggle: (id: string) => void;
		/** The action buttons for the shot on screen. */
		children: Snippet<[QueueItem]>;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	let img = $state<HTMLImageElement>();
	let down: { x: number; y: number } | null = null;
	let swiped = false;

	const index = $derived(shots.findIndex((s) => s.id === id));
	const shot = $derived(shots[index]);

	$effect(() => {
		if (id !== null && !dialog?.open) dialog?.showModal();
		else if (id === null && dialog?.open) dialog.close();
	});

	function go(step: -1 | 1) {
		const next = shots[index + step];
		if (next) id = next.id;
	}

	function onpointerdown(e: PointerEvent) {
		down = { x: e.clientX, y: e.clientY };
		swiped = false;
	}

	function onpointerup(e: PointerEvent) {
		if (!down) return;
		const step = swipeStep(e.clientX - down.x, e.clientY - down.y);
		down = null;
		if (step === 0) return;
		swiped = true;
		go(step);
	}

	function onclick(e: MouseEvent) {
		if (swiped || !img || (e.target as Element).closest('button')) return;
		const box = img.getBoundingClientRect();
		const natural = { width: img.naturalWidth, height: img.naturalHeight };
		if (!insidePhoto({ x: e.clientX, y: e.clientY }, box, natural)) id = null;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') go(-1);
		else if (e.key === 'ArrowRight') go(1);
	}
</script>

<!-- A tap on the matte closes the viewer; Escape and the close button already do, for keyboards. -->
<dialog
	bind:this={dialog}
	onclose={() => (id = null)}
	{onpointerdown}
	{onpointerup}
	{onclick}
	{onkeydown}
	aria-label="Full screen photo"
>
	{#if shot}
		<img bind:this={img} src="/media/{shot.id}/preview" alt="" />
		<div class="top">
			{@render children(shot)}
			<button class="close" aria-label="Close full screen" onclick={() => (id = null)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
			</button>
		</div>
		{#if index > 0}
			<button class="nav prev" aria-label="Previous photo" onclick={() => go(-1)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
			</button>
		{/if}
		{#if index < shots.length - 1}
			<button class="nav next" aria-label="Next photo" onclick={() => go(1)}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
			</button>
		{/if}
		<button
			class="keep"
			class:picked={picked.includes(shot.id)}
			aria-pressed={picked.includes(shot.id)}
			onclick={() => ontoggle(shot.id)}
		>
			{picked.includes(shot.id) ? 'Keeping this shot' : 'Keep this shot'}
		</button>
	{/if}
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
		touch-action: pan-y;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		user-select: none;
	}
	.top {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		gap: 6px;
	}
	.close,
	.nav {
		display: grid;
		place-items: center;
		padding: 0;
		color: var(--text);
		background: color-mix(in srgb, var(--matte) 55%, transparent);
		border: 0;
		border-radius: 4px;
		cursor: pointer;
	}
	.close {
		width: 36px;
		height: 36px;
	}
	.nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 64px;
		height: 120px;
	}
	.prev {
		left: 8px;
	}
	.next {
		right: 8px;
	}
	/* Touch screens swipe instead. */
	@media (pointer: coarse) {
		.nav {
			display: none;
		}
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.nav svg {
		width: 40px;
		height: 40px;
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
