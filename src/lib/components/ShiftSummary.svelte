<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatBytes } from '$lib/format';
	import { percentSorted } from '$lib/stats';

	let {
		totals,
		onnext
	}: {
		totals: { reviewed: number; trashed: number; bytesTrashed: number; libraryNow: number };
		onnext: () => void;
	} = $props();

	const sorted = $derived(percentSorted(totals.reviewed, totals.libraryNow, totals.trashed));
</script>

<main>
	<h2>Shift complete</h2>
	<dl>
		<div>
			<dt class="label">Sorted</dt>
			<dd class="timecode">{sorted.toFixed(1)}%</dd>
		</div>
		<div>
			<dt class="label">Trashed</dt>
			<dd class="timecode">{totals.trashed}</dd>
		</div>
		<div>
			<dt class="label">Space freed</dt>
			<dd class="timecode">{formatBytes(totals.bytesTrashed)}</dd>
		</div>
	</dl>
	<div class="actions">
		<button class="next" onclick={onnext}>Start next shift</button>
		<a href={resolve('/')}>Home</a>
	</div>
</main>

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 24px;
		padding: 24px 12px;
		background: var(--matte);
	}
	h2 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
	}
	dl {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		margin: 0;
		background: var(--hairline);
	}
	dl div {
		padding: 12px;
		background: var(--panel);
	}
	dd {
		margin: 0;
	}
	.timecode {
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--amber);
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.next {
		flex: 1;
		min-height: 48px;
		font: inherit;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}
	a {
		min-height: 48px;
		display: grid;
		place-items: center;
		padding: 0 8px;
		color: var(--text-dim);
	}
</style>
