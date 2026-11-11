import type { NormalizedListing } from '../types/listing';
import { injectFilesToDropzone, dataUrlToFile, downloadImageAsBlob } from './image-downloader';

export type LeboncoinWizardStep = 'title' | 'photos' | 'details' | 'unknown';

export function findTitleInput(doc: Document = document): HTMLInputElement | null {
  return (
    doc.querySelector<HTMLInputElement>('input[name="subject"]') ||
    doc.querySelector<HTMLInputElement>('input[name="title"]') ||
    doc.querySelector<HTMLInputElement>('#subject') ||
    doc.querySelector<HTMLInputElement>('#title') ||
    doc.querySelector<HTMLInputElement>('[data-qa-id="subject"]') ||
    doc.querySelector<HTMLInputElement>('[data-qa-id*="title"]') ||
    doc.querySelector<HTMLInputElement>('input[placeholder*="titre" i]') ||
    doc.querySelector<HTMLInputElement>('input[placeholder*="vendez" i]') ||
    doc.querySelector<HTMLInputElement>('main form input[type="text"]') ||
    doc.querySelector<HTMLInputElement>('main input[type="text"]')
  );
}

export function findDescriptionInput(doc: Document = document): HTMLTextAreaElement | null {
  return (
    doc.querySelector<HTMLTextAreaElement>('textarea[name="body"]') ||
    doc.querySelector<HTMLTextAreaElement>('textarea[name="description"]') ||
    doc.querySelector<HTMLTextAreaElement>('#body') ||
    doc.querySelector<HTMLTextAreaElement>('#description') ||
    doc.querySelector<HTMLTextAreaElement>('[data-qa-id="body"]') ||
    doc.querySelector<HTMLTextAreaElement>('textarea[placeholder*="description" i]') ||
    doc.querySelector<HTMLTextAreaElement>('main textarea')
  );
}

export function findPriceInput(doc: Document = document): HTMLInputElement | null {
  return (
    doc.querySelector<HTMLInputElement>('input[name="price"]') ||
    doc.querySelector<HTMLInputElement>('#price') ||
    doc.querySelector<HTMLInputElement>('[data-qa-id="price"]') ||
    doc.querySelector<HTMLInputElement>('input[inputmode="numeric"]') ||
    doc.querySelector<HTMLInputElement>('input[type="number"]')
  );
}

export function findFileInput(doc: Document = document): HTMLInputElement | null {
  const inputs = doc.querySelectorAll<HTMLInputElement>('input[type="file"]');
  for (const input of Array.from(inputs)) {
    if (!input.closest('header, nav, [data-testid="user-menu-button"]')) {
      return input;
    }
  }
  return null;
}

export function detectLeboncoinStep(doc: Document = document): LeboncoinWizardStep {
  if (findTitleInput(doc)) {
    return 'title';
  }

  if (
    findFileInput(doc) ||
    doc.querySelector('[data-qa-id="dropzone"], [data-testid="dropzone"], [data-qa-id="upload"]')
  ) {
    return 'photos';
  }

  if (findDescriptionInput(doc) || findPriceInput(doc)) {
    return 'details';
  }

  return 'unknown';
}

export async function fillLeboncoinForm(
  listing: NormalizedListing,
  doc: Document = document,
  targetStep?: LeboncoinWizardStep,
): Promise<{ success: boolean; message: string; step: LeboncoinWizardStep }> {
  try {
    const detected = detectLeboncoinStep(doc);
    const activeStep = targetStep && targetStep !== 'unknown' ? targetStep : detected;
    let filledFields = 0;
    const actionsDone: string[] = [];

    const setValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
      try {
        element.focus();
      } catch {
        // ignore focus errors
      }
      const prototype = Object.getPrototypeOf(element);
      const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(element, value);
      } else {
        element.value = value;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    // 1. Try filling Title if input exists and step allows it
    const titleInput = findTitleInput(doc);
    if (titleInput && (!targetStep || targetStep === 'title')) {
      setValue(titleInput, listing.title);
      filledFields++;
      actionsDone.push('Titre rempli');
    }

    // 2. Try injecting Photos if file input / dropzone exists and step allows it
    const fileInput = findFileInput(doc);
    const hasPhotoZone =
      Boolean(fileInput) ||
      Boolean(
        doc.querySelector(
          '[data-qa-id="dropzone"], [data-testid="dropzone"], [data-qa-id="upload"]',
        ),
      );

    if (hasPhotoZone && (!targetStep || targetStep === 'photos') && listing.photos.length > 0) {
      const files: File[] = [];

      // A. Try downloading via background service worker (avoids content-script CORS)
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          const urls = listing.photos.slice(0, 10).map((p) => p.url);
          const res = await chrome.runtime.sendMessage({
            type: 'DOWNLOAD_IMAGES',
            urls,
          });
          if (res?.success && Array.isArray(res.images)) {
            for (const img of res.images) {
              files.push(dataUrlToFile(img.dataUrl, img.name));
            }
          }
        } catch (e) {
          console.warn('Saleator: Background download failed, trying fallback', e);
        }
      }

      // B. Direct fetch fallback (for local tests or when background is unavailable)
      if (files.length === 0) {
        for (const [idx, photo] of listing.photos.slice(0, 10).entries()) {
          try {
            const downloaded = await downloadImageAsBlob(photo.url, `leboncoin-${idx}.jpg`);
            files.push(dataUrlToFile(downloaded.dataUrl, downloaded.name));
          } catch (e) {
            console.warn('Saleator: Direct fetch fallback failed', photo.url, e);
          }
        }
      }

      if (files.length > 0) {
        const injected = injectFilesToDropzone(doc, files);
        if (injected) {
          filledFields += files.length;
          actionsDone.push(`${files.length} photos déposées`);
        }
      }
    }

    // 3. Try filling Description & Price if inputs exist and step allows it
    const descInput = findDescriptionInput(doc);
    if (descInput && (!targetStep || targetStep === 'details')) {
      setValue(descInput, listing.description);
      filledFields++;
      actionsDone.push('Description remplie');
    }

    const priceInput = findPriceInput(doc);
    if (priceInput && listing.price > 0 && (!targetStep || targetStep === 'details')) {
      setValue(priceInput, Math.round(listing.price).toString());
      filledFields++;
      actionsDone.push('Prix rempli');
    }

    if (filledFields === 0) {
      return {
        success: false,
        step: activeStep,
        message:
          activeStep === 'photos'
            ? 'Zone de dépôt des photos introuvable sur cette étape.'
            : 'Aucun champ correspondant trouvé sur cette page.',
      };
    }

    return {
      success: true,
      step: activeStep,
      message: `${actionsDone.join(', ')} ! Cliquez sur Continuer.`,
    };
  } catch (err) {
    return {
      success: false,
      step: 'unknown',
      message: `Erreur: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
