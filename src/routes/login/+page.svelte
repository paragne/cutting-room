<script lang="ts">
	import type { PageProps } from './$types';
	import '$lib/theme.css';

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
		padding: 12px;
		align-items: end;
	}

	form {
		display: grid;
		gap: 8px;
		width: 100%;
		max-width: 24rem;
		margin: 0 auto 25dvh;
		padding: 12px;
		background: var(--panel);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}

	label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}

	input,
	button {
		min-height: 48px;
		padding: 0 12px;
		font: inherit;
		color: var(--text);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}

	input {
		background: var(--matte);
	}

	button {
		font-weight: 600;
		color: var(--amber);
		background: var(--panel-raised);
		cursor: pointer;
	}

	p {
		margin: 0;
		color: var(--cut);
	}
</style>
