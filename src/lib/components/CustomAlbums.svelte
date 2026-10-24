<script lang="ts">
	import type { CustomForm } from '$lib/customQuery';
	import type { AlbumInfo } from '$lib/server/albums';

	let { form = $bindable(), albums }: { form: CustomForm; albums: AlbumInfo[] } = $props();

	// Matches parseCustom's album limit.
	const MAX_ALBUMS = 50;
</script>

<fieldset>
	<legend>Albums</legend>
	<label>
		<input type="checkbox" bind:checked={form.noAlbum} disabled={form.albums.length > 0} />
		Not in any album
	</label>
	<details>
		<summary>In albums ({form.albums.length} selected)</summary>
		{#each albums as album (album.id)}
			<label>
				<input
					type="checkbox"
					value={album.id}
					bind:group={form.albums}
					disabled={form.noAlbum ||
						(form.albums.length >= MAX_ALBUMS && !form.albums.includes(album.id))}
				/>
				{album.name}
			</label>
		{:else}
			<p>No albums in Immich.</p>
		{/each}
	</details>
</fieldset>

<style>
	fieldset {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
		padding: 12px;
		border: 0;
		border-bottom: 1px solid var(--hairline);
	}
	legend {
		padding: 0 0 4px;
		font-weight: 600;
	}
	label {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
	}
	label:has(:disabled) {
		opacity: 0.45;
	}
	input {
		width: 20px;
		height: 20px;
		margin: 0;
		accent-color: var(--text);
	}
	/* Stays a list item so the disclosure marker shows. */
	summary {
		padding: 13px 0;
		cursor: pointer;
	}
	p {
		margin: 0;
		color: var(--text-dim);
	}
</style>
