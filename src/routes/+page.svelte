<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as api from '$lib/api';
	import ModePicker from '$lib/components/ModePicker.svelte';
	import StatsBar from '$lib/components/StatsBar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let error = $state<string | null>(null);

	function fail(e: unknown) {
		if (e instanceof api.Unauthorized) void goto(resolve('/login'));
		else error = e instanceof Error ? e.message : String(e);
	}
</script>

<div class="suite">
	<StatsBar
		reviewed={data.reviewed}
		trashed={data.trashed}
		bytesTrashed={data.bytesTrashed}
		libraryNow={data.libraryNow}
		activeDays={data.activeDays}
		today={api.localDay(new Date())}
	/>

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
	.error {
		margin: 0;
		padding: 8px 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
</style>
