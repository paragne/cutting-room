<script lang="ts">
	import { page } from '$app/state';
	import '$lib/theme.css';
	import TopBar from '$lib/components/TopBar.svelte';

	let { children } = $props();
</script>

<div class="app">
	{#if page.url.pathname !== '/login'}<TopBar />{/if}
	<div class="page">{@render children()}</div>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100dvh;
	}
	.page {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
</style>
