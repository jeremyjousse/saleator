<script lang="ts">
  import type { NormalizedListing } from '../types/listing';
  import { CONDITION_LABELS } from '../services/mapping';
  import { Tag, Sparkles, ExternalLink } from 'lucide-svelte';

  interface Props {
    listing: NormalizedListing;
    onupdate?: (updated: NormalizedListing) => void;
  }

  let { listing, onupdate }: Props = $props();

  let activePhotoIndex = $state(0);
  const activePhoto = $derived(listing.photos[activePhotoIndex]);

  function nextPhoto() {
    if (listing.photos.length > 1) {
      activePhotoIndex = (activePhotoIndex + 1) % listing.photos.length;
    }
  }

  function prevPhoto() {
    if (listing.photos.length > 1) {
      activePhotoIndex = (activePhotoIndex - 1 + listing.photos.length) % listing.photos.length;
    }
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Photo Display with Pill Badge -->
  <div
    class="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 group"
  >
    {#if activePhoto}
      <img
        src={activePhoto.url}
        alt={listing.title}
        class="w-full h-full object-cover transition-transform duration-300"
      />
      {#if listing.photos.length > 1}
        <div
          class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold"
        >
          <button type="button" onclick={prevPhoto} class="hover:text-sky-300 px-1">◀</button>
          <span>{activePhotoIndex + 1} / {listing.photos.length}</span>
          <button type="button" onclick={nextPhoto} class="hover:text-sky-300 px-1">▶</button>
        </div>
      {/if}
    {:else}
      <div class="flex items-center justify-center w-full h-full text-gray-400 text-sm">
        Aucune photo
      </div>
    {/if}

    <div class="absolute top-3 right-3">
      <span
        class="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-emerald-600 dark:text-emerald-400 text-sm font-extrabold rounded-full shadow-xs"
      >
        {listing.price.toFixed(2)} €
      </span>
    </div>
  </div>

  <!-- Content details -->
  <div class="flex flex-col gap-2">
    <div class="flex items-start justify-between gap-2">
      <h4 class="font-bold text-base leading-snug line-clamp-2">
        {listing.title}
      </h4>
      <a
        href={listing.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Ouvrir l'annonce originale"
      >
        <ExternalLink class="size-4" />
      </a>
    </div>

    <!-- Tags & Pills -->
    <div class="flex flex-wrap items-center gap-1.5 text-xs font-medium">
      <span
        class="px-2.5 py-1 rounded-full bg-sky-100/80 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300"
      >
        {CONDITION_LABELS[listing.condition].fr}
      </span>

      {#if listing.brand}
        <span
          class="px-2.5 py-1 rounded-full bg-purple-100/80 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 flex items-center gap-1"
        >
          <Tag class="size-3" />
          {listing.brand}
        </span>
      {/if}

      {#if listing.size}
        <span
          class="px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
        >
          Taille : {listing.size}
        </span>
      {/if}

      <span
        class="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1"
      >
        <Sparkles class="size-3" />
        {listing.category.sourceCategory}
      </span>
    </div>

    <!-- Description preview -->
    {#if listing.description}
      <p
        class="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-1 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800"
      >
        {listing.description}
      </p>
    {/if}
  </div>
</div>
