<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<nav>
	<a class="title" href={resolve('/')}>Cutting Room</a>
	{#if page.url.pathname === '/'}
		<form method="post" action="/logout">
			<button type="submit" aria-label="Log out" title="Log out">
				<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
					<path
						fill="currentColor"
						d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"
					/>
				</svg>
			</button>
		</form>
	{/if}
</nav>

<style>
	nav {
		position: relative;
		display: flex;
		justify-content: center;
		background: var(--panel);
		border-bottom: 1px solid var(--hairline);
	}
	.title {
		display: grid;
		align-items: center;
		min-height: 48px;
		padding: 0 16px;
		font-size: 15px;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}
	form {
		position: absolute;
		top: 0;
		right: 0;
	}
	button {
		display: grid;
		place-items: center;
		min-width: 48px;
		min-height: 48px;
		padding: 0;
		color: var(--text-dim);
		background: none;
		border: 0;
		cursor: pointer;
	}
</style>
