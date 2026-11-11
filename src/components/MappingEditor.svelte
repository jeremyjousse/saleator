<script lang="ts">
  import type { NormalizedListing, Platform, ListingCondition } from '../types/listing';
  import {
    CATEGORY_DEFINITIONS,
    CONDITION_LABELS,
    getConditionTargetLabel,
  } from '../services/mapping';

  interface Props {
    listing: NormalizedListing;
    targetPlatform: Platform;
    onchange: (updated: NormalizedListing) => void;
  }

  let { listing, targetPlatform, onchange }: Props = $props();

  let selectedNormalizedCategory = $state('');
  let selectedCondition = $state<ListingCondition>('very_good');
  let customPrice = $state(0);

  $effect(() => {
    selectedNormalizedCategory = listing.category.normalized;
    selectedCondition = listing.condition;
    customPrice = listing.price;
  });

  function handleCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedNormalizedCategory = target.value;
    const catDef = CATEGORY_DEFINITIONS.find((c) => c.normalized === selectedNormalizedCategory);

    const updated: NormalizedListing = {
      ...listing,
      category: {
        ...listing.category,
        normalized: selectedNormalizedCategory,
        targetCategoryName:
          targetPlatform === 'leboncoin' ? catDef?.leboncoinDefault : catDef?.vintedDefault,
      },
    };
    onchange(updated);
  }

  function handleConditionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedCondition = target.value as ListingCondition;
    onchange({
      ...listing,
      condition: selectedCondition,
    });
  }

  function handlePriceChange(event: Event) {
    const target = event.target as HTMLInputElement;
    customPrice = parseFloat(target.value) || 0;
    onchange({
      ...listing,
      price: customPrice,
    });
  }
</script>

<div class="flex flex-col gap-3 text-xs">
  <!-- Target Category Selector -->
  <div class="flex flex-col gap-1">
    <label for="category-select" class="font-semibold text-gray-700 dark:text-gray-300">
      Catégorie cible ({targetPlatform === 'leboncoin' ? 'LeBonCoin' : 'Vinted'})
    </label>
    <select
      id="category-select"
      value={selectedNormalizedCategory}
      onchange={handleCategoryChange}
      class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
    >
      {#each CATEGORY_DEFINITIONS as cat}
        <option value={cat.normalized}>
          {cat.label} ({targetPlatform === 'leboncoin' ? cat.leboncoinDefault : cat.vintedDefault})
        </option>
      {/each}
    </select>
  </div>

  <!-- Condition Selector -->
  <div class="grid grid-cols-2 gap-2">
    <div class="flex flex-col gap-1">
      <label for="condition-select" class="font-semibold text-gray-700 dark:text-gray-300">
        État
      </label>
      <select
        id="condition-select"
        value={selectedCondition}
        onchange={handleConditionChange}
        class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-2 font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        {#each Object.entries(CONDITION_LABELS) as [key, val]}
          <option value={key}>{val.fr}</option>
        {/each}
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label for="price-input" class="font-semibold text-gray-700 dark:text-gray-300">
        Prix (€)
      </label>
      <input
        id="price-input"
        type="number"
        min="0"
        step="0.5"
        value={customPrice}
        oninput={handlePriceChange}
        class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-2 font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  </div>

  <!-- Preview Target Condition Badge -->
  <div
    class="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400"
  >
    <span>Correspondance cible :</span>
    <span class="font-semibold text-gray-800 dark:text-gray-200">
      {getConditionTargetLabel(selectedCondition, targetPlatform)}
    </span>
  </div>
</div>
