<script lang="ts">
	import type { AssetTools } from '$lib/assetTools.svelte';
	import AssetAlbums from './AssetAlbums.svelte';
	import InfoSheet from './InfoSheet.svelte';

	let { tools, onerror }: { tools: AssetTools; onerror: (e: unknown) => void } = $props();
</script>

<AssetAlbums
	bind:id={tools.albumFor}
	albums={tools.albumList.albums}
	hotkeys={tools.albumList.hotkeys}
	onhotkeys={(hotkeys) => tools.saveHotkeys(hotkeys)}
	onchange={(id, albumIds) => tools.albumed(id, albumIds)}
	{onerror}
/>
<InfoSheet bind:id={tools.infoFor} />
