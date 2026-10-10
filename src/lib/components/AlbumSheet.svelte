<script lang="ts">
	import { bind, DIGITS, digitOf, type Hotkeys } from '$lib/albumKeys';
	import type { AlbumInfo } from '$lib/server/albums';

	let {
		open = $bindable(false),
		albums,
		hotkeys,
		onpick,
		onhotkeys
	}: {
		open: boolean;
		albums: AlbumInfo[];
		hotkeys: Hotkeys;
		onpick: (albumId: string) => void;
		onhotkeys: (hotkeys: Hotkeys) => void;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (open && !dialog?.open) dialog?.showModal();
		else if (!open && dialog?.open) dialog.close();
	});

	function setKey(albumId: string, value: string) {
		onhotkeys(bind(hotkeys, albumId, value === '' ? null : value));
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="album-title">
	<h2 id="album-title" class="label">Add to album</h2>
	{#if albums.length === 0}
		<p class="empty">No albums in Immich yet.</p>
	{:else}
		<ul>
			{#each albums as album (album.id)}
				<li>
					<button class="pick" onclick={() => onpick(album.id)}>
						<span class="name">{album.name}</span>
						<span class="count">{album.assetCount}</span>
					</button>
					<label>
						<span class="label">Key</span>
						<select
							value={digitOf(hotkeys, album.id) ?? ''}
							onchange={(e) => setKey(album.id, e.currentTarget.value)}
						>
							<option value="">None</option>
							{#each DIGITS as d (d)}
								<option value={d}>{d}</option>
							{/each}
						</select>
					</label>
				</li>
			{/each}
		</ul>
	{/if}
	<button class="close" onclick={() => (open = false)}>Close</button>
</dialog>

<style>
	dialog {
		width: min(100%, 960px);
		max-width: none;
		max-height: 70dvh;
		margin: auto auto 0;
		padding: 12px;
		overflow-y: auto;
		color: var(--text);
		background: var(--panel);
		border: 0;
		border-top: 1px solid var(--hairline);
	}
	dialog::backdrop {
		background: color-mix(in srgb, var(--matte) 70%, transparent);
	}
	.label {
		margin: 0;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	ul {
		margin: 8px 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}
	.pick {
		flex: 1;
		display: flex;
		justify-content: space-between;
		gap: 8px;
		text-align: left;
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.count {
		font-variant-numeric: tabular-nums;
		color: var(--text-dim);
	}
	label {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
	}
	select,
	button {
		min-height: 48px;
		padding: 0 12px;
		font: inherit;
		color: var(--text);
		background: var(--panel-raised);
		border: 1px solid var(--hairline);
		border-radius: 4px;
		cursor: pointer;
	}
	select {
		min-height: 32px;
		padding: 0 4px;
	}
	.close {
		width: 100%;
	}
	.empty {
		color: var(--text-dim);
	}
</style>
