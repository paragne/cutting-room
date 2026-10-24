<script lang="ts">
	import CustomAlbums from './CustomAlbums.svelte';
	import type { CustomForm } from '$lib/customQuery';
	import type { AlbumInfo } from '$lib/server/albums';

	let { form = $bindable(), albums }: { form: CustomForm; albums: AlbumInfo[] } = $props();

	const placed = $derived(!!(form.country.trim() || form.state.trim() || form.city.trim()));
	const cameraNamed = $derived(!!(form.make.trim() || form.model.trim() || form.lens.trim()));
</script>

<fieldset>
	<legend>Media</legend>
	<label>
		<span>Type</span>
		<select bind:value={form.type}>
			<option value="">Photos and videos</option>
			<option value="photo">Photos</option>
			<option value="video">Videos</option>
		</select>
	</label>
	<label>
		<span>File extension</span>
		<input bind:value={form.ext} placeholder="Any, for example heic" maxlength="6" />
	</label>
	<label>
		<span>Source</span>
		<select bind:value={form.camera}>
			<option value="">Any</option>
			<option value="yes">Has camera data</option>
			<option value="no" disabled={cameraNamed}>No camera data</option>
		</select>
	</label>
</fieldset>

<fieldset>
	<legend>Dates</legend>
	<div class="pair">
		<label>
			<span>From</span>
			<input type="date" bind:value={form.from} max={form.to || undefined} />
		</label>
		<label>
			<span>To</span>
			<input type="date" bind:value={form.to} min={form.from || undefined} />
		</label>
	</div>
</fieldset>

<CustomAlbums bind:form {albums} />

<fieldset>
	<legend>Location</legend>
	<label class="check">
		<input type="checkbox" bind:checked={form.noLocation} disabled={placed} />
		No location
	</label>
	{#each ['country', 'state', 'city'] as const as key (key)}
		<label>
			<span>{key}</span>
			<input bind:value={form[key]} disabled={form.noLocation} maxlength="100" />
		</label>
	{/each}
</fieldset>

<fieldset>
	<legend>Camera</legend>
	{#each [['make', 'Make'], ['model', 'Model'], ['lens', 'Lens']] as const as [key, name] (key)}
		<label>
			<span>{name}</span>
			<input bind:value={form[key]} disabled={form.camera === 'no'} maxlength="100" />
		</label>
	{/each}
</fieldset>

<fieldset>
	<legend>Rating</legend>
	<div class="pair">
		<label>
			<span>Favorite</span>
			<select bind:value={form.favorite}>
				<option value="">Any</option>
				<option value="yes">Favorites</option>
				<option value="no">Not favorites</option>
			</select>
		</label>
		<label>
			<span>Stars</span>
			<select bind:value={form.rating}>
				<option value="">Any</option>
				<option value="none">Unrated</option>
				{#each ['1', '2', '3', '4'] as n (n)}
					<option value={n}>{n} or more</option>
				{/each}
				<option value="5">5</option>
			</select>
		</label>
	</div>
</fieldset>

<fieldset>
	<legend>Session</legend>
	<label>
		<span>Show</span>
		<select bind:value={form.group}>
			<option value="both">Singles and photoshoots</option>
			<option value="singles">Singles only</option>
			<option value="shoots">Photoshoots only</option>
		</select>
	</label>
	<label>
		<span>Reviewed</span>
		<select bind:value={form.reviewed}>
			<option value="no">Unreviewed only</option>
			<option value="yes">Kept before</option>
			<option value="both">Both</option>
		</select>
	</label>
	<div class="pair">
		<label>
			<span>Order</span>
			<select bind:value={form.shuffle}>
				<option value={false}>Oldest first</option>
				<option value={true}>Shuffled</option>
			</select>
		</label>
		<label>
			<span>Length</span>
			<select bind:value={form.minutes}>
				<option value="">No limit</option>
				{#each ['5', '10', '15', '30', '60'] as m (m)}
					<option value={m}>{m} min</option>
				{/each}
			</select>
		</label>
	</div>
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
		flex-direction: column;
		gap: 4px;
	}
	label span {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	input:not([type='checkbox']),
	select {
		box-sizing: border-box;
		min-height: 48px;
		min-width: 0;
		padding: 0 12px;
		font: inherit;
		color: var(--text);
		background: var(--matte);
		border: 1px solid var(--hairline);
		border-radius: 4px;
	}
	label:has(:disabled) {
		opacity: 0.45;
	}
	.check {
		flex-direction: row;
		align-items: center;
		gap: 12px;
		min-height: 48px;
	}
	.check input {
		width: 20px;
		height: 20px;
		margin: 0;
		accent-color: var(--text);
	}
</style>
