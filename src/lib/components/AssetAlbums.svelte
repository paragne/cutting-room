<script lang="ts">
	import * as api from '$lib/api';
	import type { Hotkeys } from '$lib/albumKeys';
	import type { AlbumInfo } from '$lib/server/albums';
	import AlbumSheet from './AlbumSheet.svelte';

	let {
		id = $bindable<string | null>(null),
		albums,
		hotkeys,
		onhotkeys,
		onchange,
		onerror
	}: {
		/** The asset whose albums are shown; null closes the sheet. */
		id: string | null;
		albums: AlbumInfo[];
		hotkeys: Hotkeys;
		onhotkeys: (hotkeys: Hotkeys) => void;
		/** Called after each add or remove, with the albums that now hold the asset. */
		onchange: (id: string, albumIds: string[]) => void;
		onerror: (e: unknown) => void;
	} = $props();

	let member = $state<string[]>([]);

	$effect(() => {
		member = [];
		if (id === null) return;
		let stale = false;
		api.albumsOf(id).then(
			(ids) => !stale && (member = ids),
			(e) => !stale && onerror(e)
		);
		return () => (stale = true);
	});

	async function toggle(albumId: string) {
		if (id === null) return;
		const asset = id;
		const add = !member.includes(albumId);
		try {
			await api.setMember(asset, albumId, add);
		} catch (e) {
			onerror(e);
			return;
		}
		member = add ? [...member, albumId] : member.filter((m) => m !== albumId);
		onchange(asset, member);
	}
</script>

<AlbumSheet
	bind:open={() => id !== null, (open) => !open && (id = null)}
	{albums}
	{hotkeys}
	selected={member}
	onpick={toggle}
	{onhotkeys}
/>
