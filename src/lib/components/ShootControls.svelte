<script lang="ts">
	let {
		busy,
		empty,
		keeping,
		trashing,
		onskip,
		onsettle,
		ontrashall
	}: {
		busy: boolean;
		empty: boolean;
		keeping: number;
		trashing: number;
		onskip: () => void;
		onsettle: () => void;
		ontrashall: () => void;
	} = $props();
</script>

<div class="controls">
	<button disabled={busy} onclick={onskip}>Skip</button>
	<button class="settle" disabled={busy || empty} onclick={onsettle}>
		{keeping === 0 ? 'Keep all' : `Keep ${keeping}, trash ${trashing}`}
	</button>
	<button class="trash" disabled={busy || empty} onclick={ontrashall}>Trash all</button>
</div>

<style>
	.controls {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		padding: 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
	button {
		min-height: 56px;
		font: inherit;
		font-weight: 600;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
	.settle:not(:disabled) {
		color: var(--keep);
	}
	.trash:not(:disabled) {
		color: var(--cut);
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
</style>
