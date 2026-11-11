import { defineContentScript } from 'wxt/utils/define-content-script';
import { extractVintedListing } from '../src/services/extractor-vinted';
import { fillVintedForm } from '../src/services/form-filler-vinted';
import { getStoredListing, getTargetPlatform } from '../src/services/storage';

export default defineContentScript({
  matches: [
    '*://*.vinted.fr/*',
    '*://*.vinted.com/*',
    '*://*.vinted.es/*',
    '*://*.vinted.it/*',
    '*://*.vinted.de/*',
    '*://*.vinted.be/*',
    '*://*.vinted.nl/*',
    '*://*.vinted.pt/*',
  ],
  runAt: 'document_idle',
  main() {
    // Listen for messages from side panel
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ success: true, platform: 'vinted' });
        return true;
      }

      if (message.type === 'EXTRACT_LISTING') {
        const listing = extractVintedListing(document);
        if (listing) {
          sendResponse({ success: true, listing });
        } else {
          sendResponse({
            success: false,
            error: 'Impossible de détecter une annonce Vinted sur cette page.',
          });
        }
        return true;
      }

      if (message.type === 'FILL_FORM') {
        (async () => {
          const result = await fillVintedForm(message.listing, document);
          sendResponse(result);
        })();
        return true;
      }
    });

    // Check if on upload form page and offer floating quick-paste button
    if (window.location.pathname.includes('/items/new')) {
      initVintedBanner();
    }
  },
});

async function initVintedBanner() {
  const listing = await getStoredListing();
  const target = await getTargetPlatform();

  if (!listing || target !== 'vinted') return;

  const banner = document.createElement('div');
  banner.id = 'saleator-vinted-assistant';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: #0ea5e9;
    color: white;
    padding: 12px 18px;
    border-radius: 9999px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(14, 165, 233, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s;
  `;
  banner.innerHTML = `<span>✨ Remplir avec Saleator (${escapeHtml(listing.title.slice(0, 20))}...)</span>`;
  banner.addEventListener('mouseenter', () => (banner.style.transform = 'scale(1.04)'));
  banner.addEventListener('mouseleave', () => (banner.style.transform = 'scale(1)'));
  banner.addEventListener('click', async () => {
    banner.innerText = '⏳ Remplissage en cours...';
    const res = await fillVintedForm(listing, document);
    banner.innerText = res.success ? '✅ Rempli avec succès !' : '⚠️ ' + res.message;
    setTimeout(() => banner.remove(), 4000);
  });

  document.body.appendChild(banner);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
