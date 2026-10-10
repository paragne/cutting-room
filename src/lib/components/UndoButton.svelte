<script lang="ts">
	let { disabled, onundo }: { disabled: boolean; onundo: () => void } = $props();
</script>

<button class="undo" aria-disabled={disabled} onclick={onundo}>
	Undo <kbd>Ctrl Z</kbd>
</button>

<style>
	.undo {
		position: absolute;
		right: 12px;
		bottom: 12px;
		z-index: 1;
		min-height: 48px;
		padding: 0 12px;
		font: inherit;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
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
	kbd {
		display: none;
		font: inherit;
		color: var(--text-dim);
	}
	@media (hover: hover) and (pointer: fine) {
		kbd {
			display: inline;
		}
	}
</style>
