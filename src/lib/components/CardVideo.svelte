<script module lang="ts">
	// Survives from card to card, so choosing sound once holds for the session.
	let sound = false;
</script>

<script lang="ts">
	let { id }: { id: string } = $props();

	let muted = $state(!sound);

	function toggle() {
		sound = muted;
		muted = !muted;
	}
</script>

<!-- Muted autoplay is what browsers allow before any gesture; sound is opt in. -->
<video
	src="/media/{id}/video"
	poster="/media/{id}/preview"
	{muted}
	autoplay
	loop
	playsinline
	disablepictureinpicture
></video>
<button
	class="sound"
	onpointerdown={(e) => e.stopPropagation()}
	onclick={toggle}
	aria-pressed={!muted}
>
	{muted ? 'Sound off' : 'Sound on'}
</button>
<span class="kind">Video</span>

<style>
	video {
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
	.sound {
		position: absolute;
		right: 12px;
		bottom: 12px;
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
