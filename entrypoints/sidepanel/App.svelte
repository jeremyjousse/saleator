<script lang="ts">
  import { onMount } from 'svelte';
  import type { NormalizedListing, Platform } from '../../src/types/listing';
  import {
    getStoredListing,
    setStoredListing,
    getStoredHistory,
    addToHistory,
    getTargetPlatform,
    setTargetPlatform,
    getStoredDarkMode,
    setStoredDarkMode,
  } from '../../src/services/storage';
  import { sendMessageToActiveTab } from '../../src/services/messaging';

  import BentoCard from '../../src/components/BentoCard.svelte';
  import PlatformSwitch from '../../src/components/PlatformSwitch.svelte';
  import ListingCard from '../../src/components/ListingCard.svelte';
  import MappingEditor from '../../src/components/MappingEditor.svelte';
  import HistoryWidget from '../../src/components/HistoryWidget.svelte';

  import {
    Sparkles,
    Sun,
    Moon,
    ArrowUpRight,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Copy,
    RotateCcw,
  } from 'lucide-svelte';

  // Svelte 5 Runes State
  let currentListing = $state<NormalizedListing | null>(null);
  let targetPlatform = $state<Platform>('leboncoin');
  let history = $state<NormalizedListing[]>([]);
  let isDarkMode = $state(false);
  let isExtracting = $state(false);
  let isTransferring = $state(false);
  let statusMessage = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);

  const sourcePlatform = $derived<Platform>(
    targetPlatform === 'leboncoin' ? 'vinted' : 'leboncoin',
  );

  onMount(async () => {
    isDarkMode = await getStoredDarkMode();
    applyDarkMode(isDarkMode);

    currentListing = await getStoredListing();
    targetPlatform = await getTargetPlatform();
    history = await getStoredHistory();
  });

  function applyDarkMode(enabled: boolean) {
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    applyDarkMode(isDarkMode);
    await setStoredDarkMode(isDarkMode);
  }

  async function handleTogglePlatforms() {
    targetPlatform = targetPlatform === 'leboncoin' ? 'vinted' : 'leboncoin';
    await setTargetPlatform(targetPlatform);
  }

  async function handleExtractFromActiveTab() {
    isExtracting = true;
    errorMessage = null;
    statusMessage = 'Extraction en cours...';

    try {
      const response = await sendMessageToActiveTab<{
        success: boolean;
        listing?: NormalizedListing;
        error?: string;
      }>({ type: 'EXTRACT_LISTING' });

      if (response && response.success && response.listing) {
        currentListing = response.listing;
        await setStoredListing(currentListing);
        await addToHistory(currentListing);
        history = await getStoredHistory();
        statusMessage = 'Annonce extraite avec succès !';
      } else {
        errorMessage =
          response?.error ||
          "Impossible d'extraire l'annonce. Êtes-vous bien sur une page d'annonce Vinted ou LeBonCoin ?";
        statusMessage = null;
      }
    } catch (err) {
      errorMessage = `Erreur: ${err instanceof Error ? err.message : String(err)}`;
      statusMessage = null;
    } finally {
      isExtracting = false;
      setTimeout(() => (statusMessage = null), 4000);
    }
  }

  async function handleTransferToTarget() {
    if (!currentListing) return;

    isTransferring = true;
    errorMessage = null;
    statusMessage = `Ouverture de ${targetPlatform === 'leboncoin' ? 'LeBonCoin' : 'Vinted'}...`;

    try {
      // Store listing and target
      await setStoredListing(currentListing);
      await setTargetPlatform(targetPlatform);

      // Open target creation page
      await chrome.runtime.sendMessage({
        type: 'OPEN_TARGET_PLATFORM',
        target: targetPlatform,
        listing: currentListing,
      });

      statusMessage = 'Page cible ouverte. L’assistant de pré-remplissage est actif !';
    } catch (err) {
      errorMessage = `Erreur de transfert: ${err instanceof Error ? err.message : String(err)}`;
      statusMessage = null;
    } finally {
      isTransferring = false;
    }
  }

  async function handleFillStep(step?: 'title' | 'photos' | 'details') {
    if (!currentListing) return;

    isTransferring = true;
    errorMessage = null;
    statusMessage = step ? `Injection de l'étape ${step}...` : "Injection de l'étape active...";

    try {
      const response = await sendMessageToActiveTab<{
        success: boolean;
        message: string;
        step?: string;
      }>({
        type: 'FILL_FORM',
        listing: currentListing,
        step,
      });

      if (response && response.success) {
        statusMessage = response.message || 'Formulaire rempli avec succès !';
      } else {
        errorMessage = response?.message || 'Impossible de remplir le formulaire sur cette page.';
        statusMessage = null;
      }
    } catch (err) {
      errorMessage = `Erreur: ${err instanceof Error ? err.message : String(err)}`;
      statusMessage = null;
    } finally {
      isTransferring = false;
    }
  }

  function handleSelectHistoryItem(item: NormalizedListing) {
    currentListing = item;
    setStoredListing(item);
  }

  function handleUpdateListing(updated: NormalizedListing) {
    currentListing = updated;
    setStoredListing(updated);
  }

  async function handleResetAll() {
    currentListing = null;
    statusMessage = 'Réinitialisation effectuée.';
    errorMessage = null;
    isExtracting = false;
    isTransferring = false;
    await setStoredListing(null);
    setTimeout(() => {
      if (statusMessage === 'Réinitialisation effectuée.') {
        statusMessage = null;
      }
    }, 2000);
  }
</script>

<main class="flex flex-col min-h-screen p-4 max-w-md mx-auto gap-4">
  <!-- Header Bar -->
  <header class="flex items-center justify-between px-1">
    <div class="flex items-center gap-2">
      <div
        class="size-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20"
      >
        <Sparkles class="size-5" />
      </div>
      <div>
        <h1 class="font-extrabold text-lg tracking-tight">Saleator</h1>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          Duplicateur Vinted ⇄ LeBonCoin
        </p>
      </div>
    </div>

    <div class="flex items-center gap-1.5">
      {#if currentListing || errorMessage}
        <button
          type="button"
          onclick={handleResetAll}
          class="p-2.5 rounded-2xl bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-gray-200/60 dark:border-gray-700/60 transition-colors shadow-xs"
          aria-label="Réinitialiser"
          title="Réinitialiser à zéro"
        >
          <RotateCcw class="size-4" />
        </button>
      {/if}

      <!-- Theme toggle -->
      <button
        type="button"
        onclick={toggleDarkMode}
        class="p-2.5 rounded-2xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/60 transition-colors shadow-xs"
        aria-label="Basculer Dark Mode"
      >
        {#if isDarkMode}
          <Sun class="size-4 text-amber-400" />
        {:else}
          <Moon class="size-4 text-indigo-500" />
        {/if}
      </button>
    </div>
  </header>

  <!-- Status / Alert Banners -->
  {#if statusMessage}
    <div
      class="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in"
    >
      <CheckCircle2 class="size-4 text-emerald-500 flex-shrink-0" />
      <span>{statusMessage}</span>
    </div>
  {/if}

  {#if errorMessage}
    <div
      class="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold"
    >
      <div class="flex items-center gap-2">
        <AlertCircle class="size-4 text-rose-500 flex-shrink-0" />
        <span>{errorMessage}</span>
      </div>
      <button
        type="button"
        onclick={handleResetAll}
        class="px-2.5 py-1 rounded-xl bg-rose-200/80 dark:bg-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-bold text-[11px] whitespace-nowrap transition-colors"
      >
        Repartir à 0
      </button>
    </div>
  {/if}

  <!-- Bento Grid Section -->
  <div class="grid grid-cols-1 gap-4">
    <!-- Card 1: Platform & Extract Control -->
    <BentoCard title="Plateformes & Capture" subtitle="Sélectionnez la direction du transfert">
      <div class="flex flex-col gap-3 mt-2">
        <PlatformSwitch {sourcePlatform} {targetPlatform} ontoggle={handleTogglePlatforms} />

        <button
          type="button"
          onclick={handleExtractFromActiveTab}
          disabled={isExtracting}
          class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw class={`size-4 ${isExtracting ? 'animate-spin' : ''}`} />
          {isExtracting ? 'Analyse de la page...' : `Extraire depuis l'onglet actif`}
        </button>
      </div>
    </BentoCard>

    <!-- Card 2: Extracted Listing Details -->
    {#if currentListing}
      <BentoCard
        title="Annonce Détectée"
        subtitle={currentListing.source === 'vinted' ? 'Source Vinted' : 'Source LeBonCoin'}
        badge={`${currentListing.photos.length} photos`}
        badgeColor="green"
      >
        {#snippet headerAction()}
          <button
            type="button"
            onclick={handleResetAll}
            class="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Effacer et repartir à 0"
          >
            <RotateCcw class="size-3.5" />
          </button>
        {/snippet}
        <ListingCard listing={currentListing} onupdate={handleUpdateListing} />
      </BentoCard>

      <!-- Card 3: Mapping & Adjustments -->
      <BentoCard
        title="Mapping & Attributs"
        subtitle={`Adaptation pour ${targetPlatform === 'leboncoin' ? 'LeBonCoin' : 'Vinted'}`}
        variant="highlight"
      >
        <MappingEditor listing={currentListing} {targetPlatform} onchange={handleUpdateListing} />
      </BentoCard>

      <!-- Card 4: Action Transfer Button -->
      <BentoCard variant="lime">
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold uppercase tracking-wider text-lime-900 dark:text-lime-200"
            >
              Assistant de dépôt
            </span>
            <span class="text-xs text-lime-800/80 dark:text-lime-300 font-semibold">
              Vers {targetPlatform === 'leboncoin' ? 'LeBonCoin' : 'Vinted'}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onclick={handleTransferToTarget}
              disabled={isTransferring}
              class="w-full py-3 px-3 rounded-2xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <ArrowUpRight class="size-4" />
              Ouvrir le formulaire
            </button>

            <button
              type="button"
              onclick={() => handleFillStep()}
              disabled={isTransferring}
              class="w-full py-3 px-3 rounded-2xl bg-lime-900/10 dark:bg-lime-200/10 hover:bg-lime-900/20 text-lime-950 dark:text-lime-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-lime-800/20 transition-all active:scale-[0.98]"
              title="Détecte et injecte automatiquement l'étape visible sur l'onglet actif"
            >
              <Copy class="size-4" />
              Injecter cette étape
            </button>
          </div>

          <!-- Wizard Quick Step Pills -->
          <div
            class="flex items-center justify-between gap-1.5 pt-2 border-t border-lime-800/20 text-[11px]"
          >
            <span class="font-medium text-lime-950/70 dark:text-lime-300/70"
              >Étapes manuelles :</span
            >
            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => handleFillStep('title')}
                class="px-2 py-1 rounded-xl bg-white/70 dark:bg-gray-800/70 text-lime-950 dark:text-lime-200 font-semibold hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-2xs"
                title="Injecter le titre"
              >
                1. Titre
              </button>
              <button
                type="button"
                onclick={() => handleFillStep('photos')}
                class="px-2 py-1 rounded-xl bg-white/70 dark:bg-gray-800/70 text-lime-950 dark:text-lime-200 font-semibold hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-2xs"
                title="Déposer les photos"
              >
                2. Photos ({currentListing.photos.length})
              </button>
              <button
                type="button"
                onclick={() => handleFillStep('details')}
                class="px-2 py-1 rounded-xl bg-white/70 dark:bg-gray-800/70 text-lime-950 dark:text-lime-200 font-semibold hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-2xs"
                title="Injecter description et prix"
              >
                3. Détails
              </button>
            </div>
          </div>
        </div>
      </BentoCard>
    {:else}
      <!-- Empty State Card -->
      <BentoCard variant="sky">
        <div class="flex flex-col items-center justify-center py-6 text-center gap-2">
          <div
            class="p-3 bg-sky-200/60 dark:bg-sky-900/40 rounded-2xl text-sky-700 dark:text-sky-300"
          >
            <Sparkles class="size-6" />
          </div>
          <h4 class="font-bold text-sm text-sky-950 dark:text-sky-100">Prêt pour l'extraction</h4>
          <p class="text-xs text-sky-900/70 dark:text-sky-300 max-w-xs">
            Ouvrez une annonce sur Vinted ou LeBonCoin, puis cliquez sur « Extraire depuis l'onglet
            actif ».
          </p>
        </div>
      </BentoCard>
    {/if}

    <!-- Card 5: Recent History -->
    <BentoCard
      title="Historique Récent"
      subtitle="Vos dernières annonces extraites"
      badge={`${history.length}`}
      badgeColor="purple"
    >
      <HistoryWidget {history} onselect={handleSelectHistoryItem} />
    </BentoCard>
  </div>
</main>
