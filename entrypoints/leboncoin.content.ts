import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractLeboncoinListing } from '../src/services/extractor-leboncoin';
import {
  fillLeboncoinForm,
  detectLeboncoinStep,
  type LeboncoinWizardStep,
} from '../src/services/form-filler-leboncoin';
import { getStoredListing, getTargetPlatform } from '../src/services/storage';

export default defineContentScript({
  matches: ['*://*.leboncoin.fr/*'],
  runAt: 'document_idle',
  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ success: true, platform: 'leboncoin' });
        return true;
      }

      if (message.type === 'EXTRACT_LISTING') {
        const listing = extractLeboncoinListing(document);
        if (listing) {
          sendResponse({ success: true, listing });
        } else {
          sendResponse({
            success: false,
            error: 'Impossible de détecter une annonce LeBonCoin sur cette page.',
          });
        }
        return true;
      }

      if (message.type === 'FILL_FORM') {
        (async () => {
          const result = await fillLeboncoinForm(message.listing, document, message.step);
          sendResponse(result);
        })();
        return true;
      }
    });

    if (window.location.pathname.includes('/deposer-une-annonce')) {
      initLeboncoinWizardAssistant();
    }
  },
});

async function initLeboncoinWizardAssistant() {
  const listing = await getStoredListing();
  const target = await getTargetPlatform();

  if (!listing || target !== 'leboncoin') return;

  let banner = document.getElementById('saleator-lbc-assistant');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'saleator-lbc-assistant';
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      background: #f97316;
      color: white;
      padding: 12px 18px;
      border-radius: 9999px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.5);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s, background-color 0.2s;
    `;
    banner.addEventListener('mouseenter', () => (banner!.style.transform = 'scale(1.04)'));
    banner.addEventListener('mouseleave', () => (banner!.style.transform = 'scale(1)'));
    document.body.appendChild(banner);
  }

  let cachedStep: LeboncoinWizardStep | null = null;
  let isActionRunning = false;

  const updateBannerText = () => {
    if (!banner || isActionRunning) return;
    const step = detectLeboncoinStep(document);

    // Prevent unnecessary DOM writes that trigger re-render
    if (step === cachedStep) return;
    cachedStep = step;

    if (step === 'title') {
      banner.innerHTML = `<span>✨ Remplir Titre : "${escapeHtml(listing.title.slice(0, 20))}..."</span>`;
    } else if (step === 'photos') {
      banner.innerHTML = `<span>📸 Déposer les ${listing.photos.length} photos</span>`;
    } else if (step === 'details') {
      banner.innerHTML = `<span>📝 Remplir Description & Prix (${listing.price} €)</span>`;
    } else {
      banner.innerHTML = `<span>✨ Remplir avec Saleator (${escapeHtml(listing.title.slice(0, 18))}...)</span>`;
    }
  };

  updateBannerText();

  banner.onclick = async () => {
    if (!banner || isActionRunning) return;
    isActionRunning = true;
    banner.innerText = '⏳ Injection en cours...';

    try {
      const res = await fillLeboncoinForm(listing, document);
      banner.innerText = res.success ? `✅ ${res.message}` : `⚠️ ${res.message}`;
    } catch (e) {
      banner.innerText = `⚠️ Erreur: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      setTimeout(() => {
        isActionRunning = false;
        cachedStep = null; // force fresh refresh after action
        updateBannerText();
      }, 2000);
    }
  };

  // Debounced step change watcher (prevents infinite DOM mutation loops)
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedUpdate = () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      updateBannerText();
    }, 300);
  };

  // Listen to user clicks (e.g. clicking "Continuer" or tab switches)
  document.addEventListener('click', debouncedUpdate, { passive: true });

  // Listen to popstate (back/forward or Next.js shallow routing)
  window.addEventListener('popstate', debouncedUpdate, { passive: true });

  // Light, debounced mutation observer strictly ignoring self-mutations
  const observer = new MutationObserver((mutations) => {
    // If all mutations are from our banner, ignore completely
    const isSelf = mutations.every(
      (m) => m.target === banner || (banner && banner.contains(m.target as Node)),
    );
    if (isSelf) return;

    debouncedUpdate();
  });

  const mainContainer = document.querySelector('main') || document.body;
  observer.observe(mainContainer, { childList: true, subtree: true });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
