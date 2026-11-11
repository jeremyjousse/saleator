import { describe, it, expect } from 'vitest';
import { NormalizedListingSchema, type NormalizedListing } from '../src/types/listing';

describe('NormalizedListingSchema', () => {
  const validListing: NormalizedListing = {
    id: 'test-123',
    source: 'vinted',
    originalUrl: 'https://www.vinted.fr/items/12345-veste-en-cuir',
    title: 'Veste en cuir vintage',
    description: 'Belle veste en cuir véritable taille L',
    price: 45.5,
    currency: 'EUR',
    condition: 'very_good',
    brand: 'Zara',
    size: 'L',
    photos: [
      { url: 'https://images.vinted.net/photos/1.jpg', isCover: true },
      { url: 'https://images.vinted.net/photos/2.jpg', isCover: false },
    ],
    category: {
      sourceCategory: 'Hommes > Vêtements > Vestes',
      normalized: 'clothing_men',
      targetCategoryName: 'Vêtements',
    },
    createdAt: new Date().toISOString(),
  };

  it('validates a complete normalized listing', () => {
    const result = NormalizedListingSchema.safeParse(validListing);
    expect(result.success).toBe(true);
  });

  it('rejects listing with empty title', () => {
    const invalid = { ...validListing, title: '' };
    const result = NormalizedListingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const invalid = { ...validListing, price: -10 };
    const result = NormalizedListingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects listing with empty photos array', () => {
    const invalid = { ...validListing, photos: [] };
    const result = NormalizedListingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid photo url', () => {
    const invalid = {
      ...validListing,
      photos: [{ url: 'not-a-valid-url', isCover: true }],
    };
    const result = NormalizedListingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('allows zero price (donation / free)', () => {
    const freeListing = { ...validListing, price: 0 };
    const result = NormalizedListingSchema.safeParse(freeListing);
    expect(result.success).toBe(true);
  });
});
