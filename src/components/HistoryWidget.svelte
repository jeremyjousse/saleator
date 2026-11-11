<script lang="ts">
  import type { NormalizedListing } from '../types/listing';
  import { History, ChevronRight } from 'lucide-svelte';

  interface Props {
    history: NormalizedListing[];
    onselect: (listing: NormalizedListing) => void;
  }

  let { history, onselect }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  {#if history.length === 0}
    <p class="text-xs text-gray-400 dark:text-gray-500 py-3 text-center">
      Aucun historique récent pour le moment.
    </p>
  {:else}
    <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
      {#each history as item (item.id)}
        <button
          type="button"
          onclick={() => onselect(item)}
          class="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 transition-colors text-left group"
        >
          <div class="flex items-center gap-2.5 overflow-hidden">
            {#if item.photos[0]}
              <img
                src={item.photos[0].url}
                alt=""
                class="size-8 rounded-lg object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700"
              />
            {:else}
              <div
                class="size-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"
              >
                <History class="size-4 text-gray-400" />
              </div>
            {/if}

            <div class="flex flex-col min-w-0">
              <span class="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">
                {item.title}
              </span>
              <span class="text-[10px] text-gray-400 dark:text-gray-500">
                {item.source === 'vinted' ? 'Vinted' : 'LeBonCoin'} • {item.price.toFixed(2)} €
              </span>
            </div>
          </div>

          <ChevronRight
            class="size-4 text-gray-400 group-hover:text-sky-500 transition-colors flex-shrink-0"
          />
        </button>
      {/each}
    </div>
  {/if}
</div>
