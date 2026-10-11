<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as api from '$lib/api';
	import ModePicker from '$lib/components/ModePicker.svelte';
	import { formatBytes } from '$lib/format';
	import { percentSorted, streak } from '$lib/stats';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let error = $state<string | null>(null);

	const sorted = $derived(percentSorted(data.reviewed, data.libraryNow, data.trashed));
	const run = $derived(streak(data.activeDays, api.localDay(new Date())));

	function fail(e: unknown) {
		if (e instanceof api.Unauthorized) void goto(resolve('/login'));
		else error = e instanceof Error ? e.message : String(e);
	}
</script>

<div class="suite">
	<header>
		<form method="post" action="/logout">
			<button type="submit">Log out</button>
		</form>
	</header>

	<dl class="stats">
		<div>
			<dt class="label">Sorted</dt>
			<dd class="timecode">{sorted.toFixed(1)}%</dd>
		</div>
		<div>
			<dt class="label">Trashed</dt>
			<dd class="timecode">{data.trashed}</dd>
			<dd class="sub">{formatBytes(data.bytesTrashed)}</dd>
		</div>
		<div>
			<dt class="label">Streak</dt>
			<dd class="timecode">{run} {run === 1 ? 'day' : 'days'}</dd>
		</div>
	</dl>

	<ModePicker onerror={fail} />

	{#if error}
		<p class="error" role="alert">Error: {error}</p>
	{/if}
</div>

<style>
	.suite {
		max-width: 960px;
		margin: 0 auto;
	}
	header {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 16px;
		padding: 0 12px;
		min-height: 48px;
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
	header button {
		min-height: 48px;
		padding: 0 8px;
		font: inherit;
		color: var(--text-dim);
		background: none;
		border: 0;
		cursor: pointer;
	}
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
	.error {
		margin: 0;
		padding: 8px 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
</style>
