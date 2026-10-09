<script lang="ts">
	let {
		busy,
		canUndo,
		ontrash,
		onundo,
		onkeep
	}: {
		busy: boolean;
		canUndo: boolean;
		ontrash: () => void;
		onundo: () => void;
		onkeep: () => void;
	} = $props();
</script>

<div class="controls">
	<button class="trash" aria-disabled={busy} onclick={ontrash}>
		Trash <kbd>←</kbd>
	</button>
	<button class="undo" aria-disabled={busy || !canUndo} onclick={onundo}>
		Undo <kbd>Ctrl Z</kbd>
	</button>
	<button class="keep" aria-disabled={busy} onclick={onkeep}>
		Keep <kbd>→</kbd>
	</button>
</div>

<style>
	.controls {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px;
		padding: 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 56px;
		font: inherit;
		font-weight: 600;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
	button[aria-disabled='true'] {
		opacity: 0.45;
		cursor: default;
	}
	.trash {
		color: var(--cut);
	}
	.keep {
		color: var(--keep);
	}
	kbd {
		display: none;
		font: inherit;
		font-size: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	@media (hover: hover) and (pointer: fine) {
		kbd {
			display: block;
		}
	}
</style>
