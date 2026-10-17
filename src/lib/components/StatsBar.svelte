<script lang="ts">
	import { formatBytes, formatDuration } from '$lib/format';
	import { keepRate, percentSorted, photosLeft, secondsLeft, streak } from '$lib/stats';

	let {
		reviewed,
		trashed,
		bytesTrashed,
		libraryNow,
		activeDays,
		today
	}: {
		reviewed: number;
		trashed: number;
		bytesTrashed: number;
		libraryNow: number;
		activeDays: string[];
		today: string;
	} = $props();

	const sorted = $derived(percentSorted(reviewed, libraryNow, trashed));
	const run = $derived(streak(activeDays, today));
	const left = $derived(photosLeft(libraryNow, reviewed, trashed));
	const rate = $derived(keepRate(reviewed, trashed));
</script>

<dl class="stats">
	<div>
		<dt class="label">Sorted</dt>
		<dd class="timecode">{sorted.toFixed(1)}%</dd>
	</div>
	<div>
		<dt class="label">Trashed</dt>
		<dd class="timecode">{trashed}</dd>
		<dd class="sub">{formatBytes(bytesTrashed)}</dd>
	</div>
	<div>
		<dt class="label">Streak</dt>
		<dd class="timecode">{run} {run === 1 ? 'day' : 'days'}</dd>
	</div>
	<div>
		<dt class="label">Photos left</dt>
		<dd class="timecode">{left}</dd>
	</div>
	<div>
		<dt class="label">Time left</dt>
		<dd class="timecode">{formatDuration(secondsLeft(left))}</dd>
	</div>
	<div>
		<dt class="label">Keep rate</dt>
		<dd class="timecode">{rate === null ? 'none yet' : `${rate.toFixed(0)}%`}</dd>
	</div>
</dl>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		margin: 0;
		background: var(--hairline);
		border-bottom: 1px solid var(--hairline);
	}
	.stats div {
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
	.sub {
		font-variant-numeric: tabular-nums;
		color: var(--text-dim);
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
</style>
