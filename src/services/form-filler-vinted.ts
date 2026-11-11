import type { NormalizedListing } from '../types/listing';
import { populateFileInput, createFileFromBlob, downloadImageAsBlob } from './image-downloader';

export async function fillVintedForm(
  listing: NormalizedListing,
  doc: Document = document,
): Promise<{ success: boolean; message: string }> {
  try {
    let filledFields = 0;

    // Helper to safely trigger React/Svelte state change on input
    const setValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
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

    // 1. Title
    const titleInput = doc.querySelector<HTMLInputElement>(
      'input[name="title"], input[data-testid="item-title-input"], #title, input[placeholder*="titre" i]',
    );
    if (titleInput) {
      setValue(titleInput, listing.title);
      filledFields++;
    }

    // 2. Description
    const descInput = doc.querySelector<HTMLTextAreaElement>(
      'textarea[name="description"], textarea[data-testid="item-description-input"], #description, textarea[placeholder*="description" i]',
    );
    if (descInput) {
      setValue(descInput, listing.description);
      filledFields++;
    }

    // 3. Price
    const priceInput = doc.querySelector<HTMLInputElement>(
      'input[name="price"], input[data-testid="item-price-input"], #price',
    );
    if (priceInput && listing.price > 0) {
      setValue(priceInput, listing.price.toString());
      filledFields++;
    }

    // 4. Photos
    const fileInput = doc.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput && listing.photos.length > 0) {
      const files: File[] = [];
      for (const [idx, photo] of listing.photos.slice(0, 10).entries()) {
        try {
          const downloaded = await downloadImageAsBlob(photo.url, `vinted-${idx}.jpg`);
          files.push(createFileFromBlob(downloaded.blob, downloaded.name));
        } catch (e) {
          console.warn('Saleator: Could not download image for file input', photo.url, e);
        }
      }
      if (files.length > 0) {
        populateFileInput(fileInput, files);
        filledFields++;
      }
    }

    return {
      success: filledFields > 0,
      message: `Rempli ${filledFields} champ(s) sur Vinted.`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Erreur lors du pré-remplissage Vinted: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
