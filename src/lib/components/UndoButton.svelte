<script lang="ts">
	let { disabled, onundo }: { disabled: boolean; onundo: () => void } = $props();
</script>

<button class="undo" aria-disabled={disabled} aria-label="Undo" title="Undo (Ctrl Z)" onclick={onundo}>
	<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
		<path
			fill="currentColor"
			d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z"
		/>
	</svg>
</button>

<style>
	.undo {
		position: absolute;
		right: 12px;
		bottom: 12px;
		z-index: 1;
		display: grid;
		place-items: center;
		min-width: 48px;
		min-height: 48px;
		padding: 0;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--hairline);
		border-radius: 2px;
		cursor: pointer;
	}
	.undo[aria-disabled='true'] {
		opacity: 0.45;
		cursor: default;
	}
</style>
