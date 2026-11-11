import { describe, it, expect } from 'vitest';
import {
  fillLeboncoinForm,
  detectLeboncoinStep,
  findTitleInput,
} from '../src/services/form-filler-leboncoin';
import type { NormalizedListing } from '../src/types/listing';

describe('Leboncoin Form Filler', () => {
  const dummyListing: NormalizedListing = {
    id: 'lbc-test',
    source: 'vinted',
    originalUrl: 'https://vinted.fr/items/123',
    title: 'Ligature clarinette Si bémol Rovner Dark 1R',
    description: 'Très bon état avec couvre bec',
    price: 30,
    currency: 'EUR',
    condition: 'very_good',
    photos: [{ url: 'https://images1.vinted.net/t/01/f800/1.jpg', isCover: true }],
    category: {
      sourceCategory: 'Instruments',
      normalized: 'other',
      targetCategoryName: 'Autres',
    },
    createdAt: new Date().toISOString(),
  };

  it('detects and fills Step 1 (Title)', async () => {
    const doc = document.implementation.createHTMLDocument('LBC Step 1');
    const input = doc.createElement('input');
    input.setAttribute('name', 'subject');
    input.setAttribute('placeholder', 'Quel est le titre de votre annonce ?');
    doc.body.appendChild(input);

    expect(detectLeboncoinStep(doc)).toBe('title');
    expect(findTitleInput(doc)).toBe(input);

    const result = await fillLeboncoinForm(dummyListing, doc);
    expect(result.success).toBe(true);
    expect(input.value).toBe('Ligature clarinette Si bémol Rovner Dark 1R');
  });

  it('detects Step 2 (Photos) when dropzone / file input exists', async () => {
    const doc = document.implementation.createHTMLDocument('LBC Step 2');
    const fileInput = doc.createElement('input');
    fileInput.type = 'file';
    doc.body.appendChild(fileInput);

    expect(detectLeboncoinStep(doc)).toBe('photos');
  });

  it('detects and fills Step 3 (Details & Price)', async () => {
    const doc = document.implementation.createHTMLDocument('LBC Step 3');
    const desc = doc.createElement('textarea');
    desc.setAttribute('name', 'body');
    doc.body.appendChild(desc);

    const price = doc.createElement('input');
    price.setAttribute('name', 'price');
    doc.body.appendChild(price);

    expect(detectLeboncoinStep(doc)).toBe('details');

    const result = await fillLeboncoinForm(dummyListing, doc);
    expect(result.success).toBe(true);
    expect(desc.value).toBe('Très bon état avec couvre bec');
    expect(price.value).toBe('30');
  });
});
