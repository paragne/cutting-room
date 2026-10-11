<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<nav>
	<a href={resolve('/')}>Cutting Room</a>
</nav>

<style>
	nav {
		display: flex;
		justify-content: center;
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
	a {
		display: grid;
		align-items: center;
		min-height: 48px;
		padding: 0 16px;
		font-size: 15px;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}
</style>
