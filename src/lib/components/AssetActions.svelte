<script lang="ts">
	let {
		corners = false,
		hearted,
		inAlbum,
		disabled,
		onheart,
		onalbum,
		oninfo,
		onshare
	}: {
		/** Spread the buttons over the corners of the positioned parent instead of a row. */
		corners?: boolean;
		hearted: boolean;
		inAlbum: boolean;
		disabled: boolean;
		onheart: () => void;
		onalbum: () => void;
		oninfo: () => void;
		onshare: () => void;
	} = $props();
</script>

<div class="actions" class:corners>
	<button class="heart" aria-label="Favorite this shot" aria-pressed={hearted} {disabled} onclick={onheart}>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.4 5c2 0 3.6 1.1 5.6 3.3C14 6.1 15.6 5 17.6 5 21 5 22.8 8.6 21.3 11.8 19 16.4 12 21 12 21z" />
		</svg>
	</button>
	<button class="album" aria-label="Add this shot to an album" aria-pressed={inAlbum} {disabled} onclick={onalbum}>
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v14H3zM3 6l2-3h14l2 3M9 12h6" /></svg>
	</button>
	<button class="info" aria-label="Show details" {disabled} onclick={oninfo}>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" />
		</svg>
	</button>
	<button class="share" aria-label="Share this shot" {disabled} onclick={onshare}>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 15V3M8 7l4-4 4 4M5 12v8h14v-8" />
		</svg>
	</button>
</div>

<style>
	.actions {
		display: flex;
		gap: 6px;
	}
	.corners {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.corners button {
		position: absolute;
		pointer-events: auto;
	}
	.corners .heart {
		top: 6px;
		right: 48px;
	}
	.corners .album {
		top: 6px;
		right: 6px;
	}
	.corners .info {
		top: 6px;
		left: 6px;
	}
	.corners .share {
		bottom: 6px;
		left: 6px;
	}
	button {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		color: var(--text);
		background: color-mix(in srgb, var(--matte) 55%, transparent);
		border: 0;
		border-radius: 4px;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		color: var(--amber);
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	button[aria-pressed='true'] svg {
		fill: currentColor;
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
</style>
