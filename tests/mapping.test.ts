import { describe, it, expect } from 'vitest';
import {
  normalizeCategoryFromText,
  mapConditionFromVintedText,
  mapConditionFromLeboncoinText,
  getConditionTargetLabel,
} from '../src/services/mapping';

describe('Mapping Services', () => {
  describe('normalizeCategoryFromText', () => {
    it('maps Vinted robe keyword to clothing_women', () => {
      const cat = normalizeCategoryFromText('Femmes > Vêtements > Robe longue', 'vinted');
      expect(cat.normalized).toBe('clothing_women');
      expect(cat.leboncoinDefault).toBe('Vêtements');
    });

    it('maps Vinted costume keyword to clothing_men', () => {
      const cat = normalizeCategoryFromText('Hommes > Costume mariage', 'vinted');
      expect(cat.normalized).toBe('clothing_men');
    });

    it('maps LeBonCoin chaussures keyword to shoes', () => {
      const cat = normalizeCategoryFromText('Chaussures femme taille 38', 'leboncoin');
      expect(cat.normalized).toBe('shoes_women');
    });

    it('maps unknown keywords to other fallback category', () => {
      const cat = normalizeCategoryFromText('Objet insolite xpto', 'vinted');
      expect(cat.normalized).toBe('other');
    });
  });

  describe('mapConditionFromVintedText', () => {
    it('maps "Neuf avec étiquette"', () => {
      expect(mapConditionFromVintedText('Neuf avec étiquette')).toBe('new_with_tag');
    });

    it('maps "Neuf sans étiquette"', () => {
      expect(mapConditionFromVintedText('Neuf sans étiquette')).toBe('new_without_tag');
    });

    it('maps "Très bon état"', () => {
      expect(mapConditionFromVintedText('Très bon état')).toBe('very_good');
    });

    it('maps "Bon état"', () => {
      expect(mapConditionFromVintedText('Bon état')).toBe('good');
    });

    it('maps "Satisfaisant"', () => {
      expect(mapConditionFromVintedText('Satisfaisant')).toBe('satisfactory');
    });

    it('defaults to very_good on unknown text', () => {
      expect(mapConditionFromVintedText('Inconnu')).toBe('very_good');
    });
  });

  describe('mapConditionFromLeboncoinText', () => {
    it('maps "État neuf"', () => {
      expect(mapConditionFromLeboncoinText('État neuf')).toBe('new_with_tag');
    });

    it('maps "Très bon état"', () => {
      expect(mapConditionFromLeboncoinText('Très bon état')).toBe('very_good');
    });

    it('maps "Bon état"', () => {
      expect(mapConditionFromLeboncoinText('Bon état')).toBe('good');
    });

    it('maps "État satisfaisant"', () => {
      expect(mapConditionFromLeboncoinText('État satisfaisant')).toBe('satisfactory');
    });
  });

  describe('getConditionTargetLabel', () => {
    it('returns LeBonCoin target labels', () => {
      expect(getConditionTargetLabel('new_with_tag', 'leboncoin')).toBe('État neuf');
      expect(getConditionTargetLabel('very_good', 'leboncoin')).toBe('Très bon état');
      expect(getConditionTargetLabel('satisfactory', 'leboncoin')).toBe('État satisfaisant');
    });

    it('returns Vinted target labels', () => {
      expect(getConditionTargetLabel('new_with_tag', 'vinted')).toBe('Neuf avec étiquette');
      expect(getConditionTargetLabel('new_without_tag', 'vinted')).toBe('Neuf sans étiquette');
      expect(getConditionTargetLabel('very_good', 'vinted')).toBe('Très bon état');
    });
  });
});
