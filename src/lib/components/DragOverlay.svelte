<script lang="ts">
	import type { Action } from '$lib/server/db';

	let { hint, strength }: { hint: Action | null; strength: number } = $props();
</script>

<span class="tick tl"></span><span class="tick tr"></span>
<span class="tick bl"></span><span class="tick br"></span>
{#if hint}
	<span class="hint {hint}" style:opacity={strength}>{hint === 'keep' ? 'Keep' : 'Trash'}</span>
{/if}

<style>
	.hint {
		position: absolute;
		top: 12px;
		padding: 4px 8px;
		background: var(--panel);
		border-radius: 2px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.keep {
		left: 12px;
		color: var(--keep);
	}
	.trash {
		right: 12px;
		color: var(--cut);
	}
	.tick {
		position: absolute;
		width: 16px;
		height: 16px;
		border: 0 solid var(--text-dim);
	}
	.tl {
		top: 8px;
		left: 8px;
		border-width: 1px 0 0 1px;
	}
	.tr {
		top: 8px;
		right: 8px;
		border-width: 1px 1px 0 0;
	}
	.bl {
		bottom: 8px;
		left: 8px;
		border-width: 0 0 1px 1px;
	}
	.br {
		bottom: 8px;
		right: 8px;
		border-width: 0 1px 1px 0;
	}
</style>
