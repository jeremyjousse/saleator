<script lang="ts">
  import type { Platform } from '../types/listing';
  import { ArrowRightLeft } from 'lucide-svelte';

  interface Props {
    sourcePlatform: Platform;
    targetPlatform: Platform;
    ontoggle: () => void;
  }

  let { sourcePlatform, targetPlatform, ontoggle }: Props = $props();
</script>

<div
  class="flex items-center justify-between p-3 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl gap-2 border border-gray-200/50 dark:border-gray-700/50"
>
  <div class="flex items-center gap-2 flex-1">
    {#if sourcePlatform === 'vinted'}
      <span
        class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-xl bg-sky-500 text-white shadow-xs"
      >
        Vinted
      </span>
    {:else}
      <span
        class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-xl bg-orange-500 text-white shadow-xs"
      >
        LeBonCoin
      </span>
    {/if}
    <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Source</span>
  </div>

  <button
    type="button"
    onclick={ontoggle}
    class="p-2 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-xs transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-sky-500"
    aria-label="Inverser les plateformes"
    title="Inverser Source et Destination"
  >
    <ArrowRightLeft class="size-4" />
  </button>

  <div class="flex items-center gap-2 flex-1 justify-end">
    <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Cible</span>
    {#if targetPlatform === 'vinted'}
      <span
        class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-xl bg-sky-500 text-white shadow-xs"
      >
        Vinted
      </span>
    {:else}
      <span
        class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-xl bg-orange-500 text-white shadow-xs"
      >
        LeBonCoin
      </span>
    {/if}
  </div>
</div>
