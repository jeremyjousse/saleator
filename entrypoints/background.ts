import { defineBackground } from 'wxt/utils/define-background';
import { setStoredListing, setTargetPlatform } from '../src/services/storage';
import { downloadImageAsBlob } from '../src/services/image-downloader';

export default defineBackground(() => {
  // Enable opening side panel when clicking the extension action icon
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('Saleator: SidePanel setPanelBehavior error', err);
    });
  }

  // Listen to background messages
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'OPEN_TARGET_PLATFORM') {
      const { target, listing } = message;
      (async () => {
        await setStoredListing(listing);
        await setTargetPlatform(target);

        const targetUrl =
          target === 'vinted'
            ? 'https://www.vinted.fr/items/new'
            : 'https://www.leboncoin.fr/deposer-une-annonce';

        const tab = await chrome.tabs.create({ url: targetUrl });
        sendResponse({ success: true, tabId: tab.id });
      })();
      return true; // Keep channel open for async response
    }

    if (message.type === 'DOWNLOAD_IMAGES') {
      const { urls } = message;
      (async () => {
        const images: { name: string; dataUrl: string }[] = [];
        for (const [idx, url] of (urls as string[]).entries()) {
          try {
            const downloaded = await downloadImageAsBlob(url, `saleator-${idx}.jpg`);
            images.push({ name: downloaded.name, dataUrl: downloaded.dataUrl });
          } catch (e) {
            console.warn('Saleator background: failed to download image', url, e);
          }
        }
        sendResponse({ success: true, images });
      })();
      return true;
    }
  });
});
