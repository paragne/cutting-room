<script lang="ts">
	import { resolve } from '$app/paths';
	import * as api from '$lib/api';
	import type { AlbumInfo } from '$lib/server/albums';

	let { onerror }: { onerror: (e: unknown) => void } = $props();

	let albums = $state<AlbumInfo[] | null>(null);
	let albumId = $state('');

	async function loadAlbums() {
		if (albums) return;
		try {
			albums = (await api.albums()).albums;
		} catch (e) {
			onerror(e);
		}
	}
</script>

<nav aria-label="Modes">
	<a class="dailies" href={resolve('/dailies')}>
		<span class="name">Dailies</span>
		<span class="hint">Main mode. All unreviewed photos, random, no filters.</span>
	</a>
	<a href="{resolve('/swipe')}?mode=shuffle">
		<span class="name">Shuffle all</span>
		<span class="hint">Random photos from the whole library</span>
	</a>
	<a href={resolve('/photoshoot')}>
		<span class="name">Photoshoot</span>
		<span class="hint">Pick the best shots from a burst</span>
	</a>
	<div class="album">
		<label for="album"><span class="name">Album</span></label>
		<div class="row">
			<select id="album" bind:value={albumId} onfocus={loadAlbums} onpointerdown={loadAlbums}>
				<option value="">Choose an album</option>
				{#each albums ?? [] as album (album.id)}
					<option value={album.id}>{album.name}</option>
				{/each}
			</select>
			{#if albumId}
				<a class="open" href="{resolve('/swipe')}?mode=album&album={albumId}">Open</a>
			{/if}
		</div>
	</div>
	<a href={resolve('/custom')}>
		<span class="name">Custom</span>
		<span class="hint">Filters and session length</span>
	</a>
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
	}
	a,
	.album {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-height: 48px;
		padding: 8px 12px;
		color: var(--text);
		text-decoration: none;
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}
	.dailies {
		justify-content: flex-end;
		min-height: 40dvh;
		padding: 16px;
		border-color: var(--amber);
	}
	.dailies .name {
		font-size: 24px;
	}
	.name {
		font-weight: 600;
	}
	.hint {
		color: var(--text-dim);
	}
	.row {
		display: flex;
		gap: 8px;
	}
	select {
		flex: 1;
		min-height: 48px;
		min-width: 0;
		padding: 0 12px;
		font: inherit;
		color: var(--text);
		background: var(--matte);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}
	.open {
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: 0 16px;
		font-weight: 600;
		color: var(--amber);
	}
</style>
