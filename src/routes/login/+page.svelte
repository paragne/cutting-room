<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Log in</title>
</svelte:head>

<main>
	<form method="post">
		<label for="password">Password</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
		{#if form?.message}
			<p role="alert">{form.message}</p>
		{/if}
		<button type="submit">Log in</button>
	</form>
</main>

<style>
	main {
		display: grid;
		min-height: 100dvh;
		padding: 1rem;
		align-items: end;
	}

	form {
		display: grid;
		gap: 0.5rem;
		width: 100%;
		max-width: 24rem;
		margin: 0 auto 25dvh;
	}

	input,
	button {
		font: inherit;
		padding: 0.75rem;
	}
</style>
