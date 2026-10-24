<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import CustomFields from '$lib/components/CustomFields.svelte';
	import { customForm, customQuery } from '$lib/customQuery';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let form = $state(customForm(page.url.searchParams));

	// The settings go into this page's URL, so Back from the session returns to them.
	function start(e: SubmitEvent) {
		e.preventDefault();
		// resolve() returns a pathname only, so the rule rejects any query string.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(`${resolve('/custom')}?${customQuery(form)}`, {});
	}
</script>

<form class="suite" onsubmit={start}>
	<h1>Custom</h1>
	<div class="fields">
		<CustomFields bind:form albums={data.albums} />
	</div>
	<div class="actions">
		<button type="submit">Start session</button>
	</div>
</form>

<style>
	.suite {
		display: flex;
		flex-direction: column;
		max-width: 960px;
		height: 100%;
		margin: 0 auto;
	}
	h1 {
		margin: 0;
		padding: 12px;
		font-size: 15px;
		font-weight: 600;
		border-bottom: 1px solid var(--hairline);
	}
	.fields {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
	.actions {
		padding: 12px;
		background: var(--panel);
		border-top: 1px solid var(--hairline);
	}
	button {
		width: 100%;
		min-height: 48px;
		font: inherit;
		font-weight: 600;
		color: var(--amber);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
</style>
