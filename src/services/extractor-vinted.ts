import {
  type NormalizedListing,
  type ListingPhoto,
  NormalizedListingSchema,
} from '../types/listing';
import { normalizeCategoryFromText, mapConditionFromVintedText } from './mapping';

export function isVintedItemPhotoUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  if (!rawUrl.includes('vinted.net')) return false;

  // Discard avatars, user profile pictures, logos, icons, badges, UI assets, and small avatar dimensions (50x50, 100x100, f50)
  if (
    rawUrl.includes('/users/') ||
    rawUrl.includes('/avatars/') ||
    rawUrl.includes('/logos/') ||
    rawUrl.includes('/badges/') ||
    rawUrl.includes('/icons/') ||
    rawUrl.includes('/assets/') ||
    rawUrl.includes('/50x50/') ||
    rawUrl.includes('/100x100/') ||
    rawUrl.includes('/f50/') ||
    rawUrl.includes('/f100/')
  ) {
    return false;
  }

  // Must contain /f800/ (or high-res /f1200/)
  return rawUrl.includes('/f800/') || rawUrl.includes('/f1200/');
}

export function cleanAndFilterVintedPhotoUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (!rawUrl.includes('vinted.net')) return null;

  // Strict exclusions
  if (
    rawUrl.includes('/users/') ||
    rawUrl.includes('/avatars/') ||
    rawUrl.includes('/logos/') ||
    rawUrl.includes('/badges/') ||
    rawUrl.includes('/icons/') ||
    rawUrl.includes('/assets/') ||
    rawUrl.includes('/50x50/') ||
    rawUrl.includes('/100x100/') ||
    rawUrl.includes('/f50/') ||
    rawUrl.includes('/f100/')
  ) {
    return null;
  }

  // If already has /f800/ or /f1200/, it's a confirmed item photo
  if (rawUrl.includes('/f800/') || rawUrl.includes('/f1200/')) {
    return rawUrl;
  }

  // If it's an item photo path with /thumb/ or /f300/, upgrade it to /f800/
  if (rawUrl.includes('/t/')) {
    const upgraded = rawUrl.replace(/\/(thumb|f\d{3,4})\//, '/f800/');
    if (upgraded.includes('/f800/')) {
      return upgraded;
    }
  }

  return null;
}

function isInsideIgnoredSection(el: Element): boolean {
  return Boolean(
    el.closest(
      'header, nav, footer, aside, [id="user-menu-button"], [data-testid="user-menu-button"], ' +
        '[data-testid="header"], figure[class*="avatar"], figure[class*="header-avatar"], ' +
        'div[class*="Image__circle"], [data-testid*="similar"], [data-testid*="recommendation"], ' +
        '[data-testid*="related"], [data-testid*="closet"], [data-testid*="user-items"], ' +
        '[data-testid*="feed"], .similar-items, .related-items',
    ),
  );
}

function extractPhotosFromScripts(doc: Document): string[] {
  const urls: string[] = [];
  const scriptElements = doc.querySelectorAll(
    'script[data-js-react-on-rails-store], script.js-react-on-rails-component, script[type="application/json"]',
  );

  for (const script of Array.from(scriptElements)) {
    const content = script.textContent;
    if (!content || (!content.includes('photos') && !content.includes('f800'))) continue;

    try {
      const data = JSON.parse(content);
      const findPhotos = (obj: unknown) => {
        if (!obj || typeof obj !== 'object') return;
        const record = obj as Record<string, unknown>;

        if (Array.isArray(record.photos)) {
          for (const p of record.photos) {
            if (p && typeof p === 'object') {
              const photoRecord = p as Record<string, unknown>;
              const photoUrl =
                photoRecord.full_size_url || photoRecord.url || photoRecord.image_url;
              if (typeof photoUrl === 'string') {
                const clean = cleanAndFilterVintedPhotoUrl(photoUrl);
                if (clean) urls.push(clean);
              }
            }
          }
        }

        for (const key of Object.keys(record)) {
          if (
            key.includes('similar') ||
            key.includes('closet') ||
            key.includes('recommended') ||
            key.includes('user_items')
          ) {
            continue;
          }
          findPhotos(record[key]);
        }
      };

      findPhotos(data);
    } catch {
      // not JSON or parse error, ignore
    }
  }

  return urls;
}

export function extractVintedListing(doc: Document = document): NormalizedListing | null {
  try {
    const url = doc.location?.href || window.location.href;

    // 1. Try extracting structured JSON-LD data
    let jsonLdData: Record<string, unknown> | null = null;
    const jsonLdElements = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const el of Array.from(jsonLdElements)) {
      try {
        const parsed = JSON.parse(el.textContent || '{}');
        if (parsed['@type'] === 'Product' || parsed['@type'] === 'ItemPage') {
          jsonLdData = parsed;
          break;
        }
      } catch {
        // ignore parse error
      }
    }

    // Extract Title
    let title = '';
    if (jsonLdData?.name && typeof jsonLdData.name === 'string') {
      title = jsonLdData.name;
    } else {
      const titleEl =
        doc.querySelector('h1[data-testid="item-title"]') ||
        doc.querySelector('h1') ||
        doc.querySelector('meta[property="og:title"]');
      title =
        titleEl?.getAttribute('content') ||
        titleEl?.textContent?.trim() ||
        (doc.title ? doc.title.split('|')[0]?.trim() || '' : '');
    }

    // Extract Description
    let description = '';
    if (jsonLdData?.description && typeof jsonLdData.description === 'string') {
      description = jsonLdData.description;
    } else {
      const descEl =
        doc.querySelector('[itemprop="description"]') ||
        doc.querySelector('[data-testid="item-description"]') ||
        doc.querySelector('meta[property="og:description"]');
      description = descEl?.getAttribute('content') || descEl?.textContent?.trim() || '';
    }

    // Extract Price
    let price = 0;
    if (jsonLdData?.offers && typeof jsonLdData.offers === 'object') {
      const offers = jsonLdData.offers as Record<string, unknown>;
      if (offers.price) {
        price = parseFloat(String(offers.price));
      }
    }
    if (!price || isNaN(price)) {
      const priceEl =
        doc.querySelector('[data-testid="item-price"]') ||
        doc.querySelector('.item-price') ||
        doc.querySelector('[itemprop="price"]');
      const rawPrice = priceEl?.getAttribute('content') || priceEl?.textContent || '';
      const matched = rawPrice
        .replace(/\s+/g, '')
        .replace(',', '.')
        .match(/(\d+(\.\d+)?)/);
      if (matched && matched[1]) {
        price = parseFloat(matched[1]);
      }
    }

    // Extract Photos: gather candidate photos from all listing-specific sources
    const candidateUrls: string[] = [];

    // Source A: JSON-LD images
    if (jsonLdData?.image) {
      const rawImages = Array.isArray(jsonLdData.image) ? jsonLdData.image : [jsonLdData.image];
      for (const img of rawImages) {
        if (typeof img === 'string') {
          const clean = cleanAndFilterVintedPhotoUrl(img);
          if (clean) candidateUrls.push(clean);
        }
      }
    }

    // Source B: Embedded React on Rails / Redux stores
    const scriptUrls = extractPhotosFromScripts(doc);
    for (const sUrl of scriptUrls) {
      candidateUrls.push(sUrl);
    }

    // Source C: DOM Gallery extraction (always queried to capture all gallery items beyond cover image)
    const galleryContainers = [
      doc.querySelector('[data-testid*="item-photos"]'),
      doc.querySelector('[data-testid*="item-photo-carousel"]'),
      doc.querySelector('.item-photos'),
      doc.querySelector('.item-page__main-photos'),
      doc.querySelector('.main-photo-carousel'),
      doc.querySelector('[data-testid="item-view"]'),
    ];

    const gallery = galleryContainers.find(Boolean);
    const scope = gallery || doc.querySelector('main') || doc.body;

    const photoElements = scope.querySelectorAll(
      '[data-testid*="item-photo"] a, [data-testid*="item-photo"] img, [data-testid*="item-photo"], ' +
        '[data-testid*="item-photos"] a, [data-testid*="item-photos"] img, ' +
        'a.item-photo, img.item-photo, figure.item-photo img, ' +
        '[data-testid*="carousel"] a, [data-testid*="carousel"] img, ' +
        '[data-testid*="gallery"] a, [data-testid*="gallery"] img',
    );

    for (const el of Array.from(photoElements)) {
      if (isInsideIgnoredSection(el)) {
        continue;
      }

      const href = el.getAttribute('href');
      const src =
        el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-original');

      if (href) {
        const clean = cleanAndFilterVintedPhotoUrl(href);
        if (clean) candidateUrls.push(clean);
      }
      if (src) {
        const clean = cleanAndFilterVintedPhotoUrl(src);
        if (clean) candidateUrls.push(clean);
      }
    }

    // Source D: Fallback to og:image if still empty
    if (candidateUrls.length === 0) {
      const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      if (ogImg) {
        const clean = cleanAndFilterVintedPhotoUrl(ogImg);
        if (clean) candidateUrls.push(clean);
      }
    }

    // Deduplicate photos while preserving order and stripping query cache busters for identity
    const photos: ListingPhoto[] = [];
    const seenBaseUrls = new Set<string>();

    for (const cleanUrl of candidateUrls) {
      const baseKey = cleanUrl.split('?')[0] || cleanUrl;
      if (!seenBaseUrls.has(baseKey)) {
        seenBaseUrls.add(baseKey);
        photos.push({ url: cleanUrl, isCover: photos.length === 0 });
      }
    }

    // Extract Brand, Size, Condition from details list
    let brand: string | undefined;
    let size: string | undefined;
    let rawCondition = 'Très bon état';

    const detailRows = doc.querySelectorAll(
      '[data-testid="item-attributes"] .details-list__item, .details-list__item',
    );
    for (const row of Array.from(detailRows)) {
      const text = row.textContent?.toLowerCase() || '';
      const val = row.querySelector('.details-list__item-value')?.textContent?.trim();

      if (text.includes('marque') || text.includes('brand')) {
        brand = val || row.textContent?.replace(/marque/i, '').trim();
      } else if (text.includes('taille') || text.includes('size')) {
        size = val || row.textContent?.replace(/taille/i, '').trim();
      } else if (text.includes('état') || text.includes('condition')) {
        rawCondition = val || row.textContent?.replace(/état/i, '').trim() || rawCondition;
      }
    }

    // Extract Category / Breadcrumbs
    const breadcrumbEls = doc.querySelectorAll(
      'nav[aria-label="Breadcrumb"] a, .breadcrumbs__item a',
    );
    const breadcrumbs = Array.from(breadcrumbEls)
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .join(' > ');

    const categoryDef = normalizeCategoryFromText(`${breadcrumbs} ${title}`, 'vinted');

    const listing: NormalizedListing = {
      id: `vinted-${Date.now()}`,
      source: 'vinted',
      originalUrl: url,
      title: title || 'Annonce Vinted',
      description,
      price: price || 0,
      currency: 'EUR',
      condition: mapConditionFromVintedText(rawCondition),
      brand,
      size,
      photos:
        photos.length > 0
          ? photos
          : [{ url: 'https://images.vinted.net/placeholder.jpg', isCover: true }],
      category: {
        sourceCategory: breadcrumbs || categoryDef.vintedDefault,
        normalized: categoryDef.normalized,
        targetCategoryName: categoryDef.leboncoinDefault,
      },
      createdAt: new Date().toISOString(),
    };

    return NormalizedListingSchema.parse(listing);
  } catch (err) {
    console.error('Saleator: Error extracting Vinted listing', err);
    return null;
  }
}
