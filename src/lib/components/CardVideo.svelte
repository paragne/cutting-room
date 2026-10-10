<script module lang="ts">
	// Survives from card to card, so choosing sound once holds for the session.
	let sound = false;
</script>

<script lang="ts">
	let { id }: { id: string } = $props();

	let muted = $state(!sound);
	let paused = $state(false);

	function toggle() {
		sound = muted;
		muted = !muted;
	}

	export function togglePlay() {
		paused = !paused;
	}
</script>

<!-- Muted autoplay is what browsers allow before any gesture; sound is opt in. -->
<video
	src="/media/{id}/video"
	poster="/media/{id}/preview"
	{muted}
	bind:paused
	autoplay
	loop
	playsinline
	disablepictureinpicture
></video>
<div class="buttons">
	<button onpointerdown={(e) => e.stopPropagation()} onclick={togglePlay}>
		{paused ? 'Play' : 'Pause'}
	</button>
	<button onpointerdown={(e) => e.stopPropagation()} onclick={toggle} aria-pressed={!muted}>
		{muted ? 'Sound off' : 'Sound on'}
	</button>
</div>

<style>
	video {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}
	.buttons {
		position: absolute;
		left: 12px;
		bottom: 12px;
		display: flex;
		gap: 8px;
	}
	button {
		min-height: 48px;
		padding: 0 12px;
		font: inherit;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
		background: var(--panel);
		border: 1px solid var(--hairline);
		border-radius: 2px;
		cursor: pointer;
	}
</style>
