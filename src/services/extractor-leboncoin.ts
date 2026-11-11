import {
  type NormalizedListing,
  type ListingPhoto,
  NormalizedListingSchema,
} from '../types/listing';
import { normalizeCategoryFromText, mapConditionFromLeboncoinText } from './mapping';

export function extractLeboncoinListing(doc: Document = document): NormalizedListing | null {
  try {
    const url = doc.location?.href || window.location.href;

    // 1. Try Next.js __NEXT_DATA__
    const nextDataEl = doc.getElementById('__NEXT_DATA__');
    if (nextDataEl && nextDataEl.textContent) {
      try {
        const nextData = JSON.parse(nextDataEl.textContent);
        const ad =
          nextData?.props?.pageProps?.ad ||
          nextData?.props?.pageProps?.classified ||
          nextData?.props?.pageProps?.initialData?.ad;

        if (ad) {
          const title = ad.subject || ad.title || '';
          const description = ad.body || ad.description || '';
          const price = Array.isArray(ad.price)
            ? ad.price[0]
            : ad.price_cents
              ? ad.price_cents / 100
              : Number(ad.price) || 0;

          const photos: ListingPhoto[] = [];
          if (ad.images?.urls && Array.isArray(ad.images.urls)) {
            for (const imgUrl of ad.images.urls) {
              if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                photos.push({ url: imgUrl, isCover: photos.length === 0 });
              }
            }
          }

          let rawCondition = 'Très bon état';
          let brand: string | undefined;
          let size: string | undefined;

          if (Array.isArray(ad.attributes)) {
            for (const attr of ad.attributes) {
              const key = String(attr.key || '').toLowerCase();
              const val = String(attr.value_label || attr.value || '');
              if (key.includes('condition') || key.includes('etat')) {
                rawCondition = val;
              } else if (key.includes('brand') || key.includes('marque')) {
                brand = val;
              } else if (key.includes('size') || key.includes('taille')) {
                size = val;
              }
            }
          }

          const categoryName = ad.category_name || ad.category?.name || '';
          const categoryDef = normalizeCategoryFromText(`${categoryName} ${title}`, 'leboncoin');

          const listing: NormalizedListing = {
            id: `leboncoin-${ad.list_id || Date.now()}`,
            source: 'leboncoin',
            originalUrl: url,
            title: title || 'Annonce LeBonCoin',
            description,
            price: Number(price) || 0,
            currency: 'EUR',
            condition: mapConditionFromLeboncoinText(rawCondition),
            brand,
            size,
            location: ad.location?.city || ad.location?.zipcode,
            photos:
              photos.length > 0
                ? photos
                : [{ url: 'https://static.leboncoin.fr/placeholder.jpg', isCover: true }],
            category: {
              sourceCategory: categoryName || categoryDef.leboncoinDefault,
              normalized: categoryDef.normalized,
              targetCategoryName: categoryDef.vintedDefault,
            },
            createdAt: new Date().toISOString(),
          };

          return NormalizedListingSchema.parse(listing);
        }
      } catch (err) {
        console.warn('Saleator: Error parsing __NEXT_DATA__, falling back to DOM/JSON-LD', err);
      }
    }

    // 2. DOM & JSON-LD fallback
    let title = '';
    const titleEl =
      doc.querySelector('h1[data-qa-id="adview_title"]') ||
      doc.querySelector('h1') ||
      doc.querySelector('meta[property="og:title"]');
    title = titleEl?.getAttribute('content') || titleEl?.textContent?.trim() || doc.title;

    let description = '';
    const descEl =
      doc.querySelector('[data-qa-id="adview_description_container"]') ||
      doc.querySelector('meta[property="og:description"]');
    description = descEl?.getAttribute('content') || descEl?.textContent?.trim() || '';

    let price = 0;
    const priceEl =
      doc.querySelector('[data-qa-id="adview_price"]') || doc.querySelector('.adview_price');
    if (priceEl?.textContent) {
      const match = priceEl.textContent
        .replace(/\s+/g, '')
        .replace(',', '.')
        .match(/(\d+(\.\d+)?)/);
      if (match && match[1]) price = parseFloat(match[1]);
    }

    const photos: ListingPhoto[] = [];
    const imgEls = doc.querySelectorAll(
      'img[src*="leboncoin.fr"], [data-qa-id="adview_image"] img',
    );
    for (const img of Array.from(imgEls)) {
      const src = img.getAttribute('src');
      if (src && src.startsWith('http') && !photos.some((p) => p.url === src)) {
        photos.push({ url: src, isCover: photos.length === 0 });
      }
    }

    const categoryDef = normalizeCategoryFromText(title, 'leboncoin');

    const fallbackListing: NormalizedListing = {
      id: `leboncoin-${Date.now()}`,
      source: 'leboncoin',
      originalUrl: url,
      title: title || 'Annonce LeBonCoin',
      description,
      price,
      currency: 'EUR',
      condition: 'very_good',
      photos:
        photos.length > 0
          ? photos
          : [{ url: 'https://static.leboncoin.fr/placeholder.jpg', isCover: true }],
      category: {
        sourceCategory: categoryDef.leboncoinDefault,
        normalized: categoryDef.normalized,
        targetCategoryName: categoryDef.vintedDefault,
      },
      createdAt: new Date().toISOString(),
    };

    return NormalizedListingSchema.parse(fallbackListing);
  } catch (err) {
    console.error('Saleator: Error extracting LeBonCoin listing', err);
    return null;
  }
}
