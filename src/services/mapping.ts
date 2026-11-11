import type { ListingCondition, Platform } from '../types/listing';

export interface CategoryDefinition {
  normalized: string;
  label: string;
  vintedKeywords: string[];
  leboncoinKeywords: string[];
  vintedDefault: string;
  leboncoinDefault: string;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    normalized: 'clothing_women',
    label: 'Vêtements Femme',
    vintedKeywords: ['femme', 'robe', 'jupe', 'top', 'chemisier', 'manteau femme'],
    leboncoinKeywords: ['vêtements femme', 'mode femme', 'robe', 'jupe'],
    vintedDefault: 'Femmes > Vêtements',
    leboncoinDefault: 'Vêtements',
  },
  {
    normalized: 'clothing_men',
    label: 'Vêtements Homme',
    vintedKeywords: ['homme', 'costume', 'chemise homme', 'pantalon homme', 'jean homme'],
    leboncoinKeywords: ['vêtements homme', 'mode homme', 'costume'],
    vintedDefault: 'Hommes > Vêtements',
    leboncoinDefault: 'Vêtements',
  },
  {
    normalized: 'shoes_women',
    label: 'Chaussures Femme',
    vintedKeywords: ['chaussures femme', 'escarpins', 'bottes femme', 'sandales femme'],
    leboncoinKeywords: ['chaussures femme', 'escarpins', 'bottes'],
    vintedDefault: 'Femmes > Chaussures',
    leboncoinDefault: 'Chaussures',
  },
  {
    normalized: 'shoes_men',
    label: 'Chaussures Homme',
    vintedKeywords: ['chaussures homme', 'baskets homme', 'sneakers homme', 'mocassins'],
    leboncoinKeywords: ['chaussures homme', 'baskets homme', 'sneakers'],
    vintedDefault: 'Hommes > Chaussures',
    leboncoinDefault: 'Chaussures',
  },
  {
    normalized: 'accessories',
    label: 'Sacs & Accessoires',
    vintedKeywords: ['sac', 'ceinture', 'chapeau', 'écharpe', 'bijoux', 'montre'],
    leboncoinKeywords: ['accessoires & bagagerie', 'montres & bijoux', 'sacs'],
    vintedDefault: 'Femmes > Accessoires > Sacs',
    leboncoinDefault: 'Accessoires & Bagagerie',
  },
  {
    normalized: 'kids',
    label: 'Enfants & Bébés',
    vintedKeywords: ['enfant', 'bébé', 'garçon', 'fille', 'poussette'],
    leboncoinKeywords: ['équipement bébé', 'vêtements bébé', 'jeux & jouets'],
    vintedDefault: 'Enfants',
    leboncoinDefault: 'Équipement bébé',
  },
  {
    normalized: 'home',
    label: 'Maison & Décoration',
    vintedKeywords: ['maison', 'déco', 'textile', 'vaisselle', 'coussin'],
    leboncoinKeywords: ['ameublement', 'décoration', 'arts de la table'],
    vintedDefault: 'Maison > Décoration',
    leboncoinDefault: 'Décoration',
  },
  {
    normalized: 'entertainment',
    label: 'Livres, Jeux & Musique',
    vintedKeywords: ['livre', 'jeu vidéo', 'vinyle', 'cd', 'dvd', 'jeux de société'],
    leboncoinKeywords: ['livres', 'jeux vidéo', 'cd / musique', 'dvd / films'],
    vintedDefault: 'Divertissement > Jeux vidéo',
    leboncoinDefault: 'Jeux vidéo',
  },
  {
    normalized: 'other',
    label: 'Autre',
    vintedKeywords: [],
    leboncoinKeywords: [],
    vintedDefault: 'Autres',
    leboncoinDefault: 'Autres',
  },
];

export const CONDITION_LABELS: Record<ListingCondition, { fr: string; en: string }> = {
  new_with_tag: { fr: 'Neuf avec étiquette', en: 'New with tags' },
  new_without_tag: { fr: 'Neuf sans étiquette', en: 'New without tags' },
  very_good: { fr: 'Très bon état', en: 'Very good' },
  good: { fr: 'Bon état', en: 'Good' },
  satisfactory: { fr: 'État satisfaisant', en: 'Satisfactory' },
};

export function normalizeCategoryFromText(rawText: string, source: Platform): CategoryDefinition {
  const lower = rawText.toLowerCase();

  for (const cat of CATEGORY_DEFINITIONS) {
    const keywords = source === 'vinted' ? cat.vintedKeywords : cat.leboncoinKeywords;
    if (keywords.some((kw) => lower.includes(kw))) {
      return cat;
    }
  }

  return CATEGORY_DEFINITIONS.find((c) => c.normalized === 'other')!;
}

export function mapConditionFromVintedText(raw: string): ListingCondition {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('sans étiquette') || lower.includes('without tag')) return 'new_without_tag';
  if (lower.includes('étiquette') || lower.includes('tag')) return 'new_with_tag';
  if (lower.includes('très bon') || lower.includes('tres bon') || lower.includes('very good')) {
    return 'very_good';
  }
  if (lower.includes('bon état') || lower.includes('good')) return 'good';
  if (lower.includes('satisfaisant') || lower.includes('fair')) return 'satisfactory';
  return 'very_good';
}

export function mapConditionFromLeboncoinText(raw: string): ListingCondition {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('neuf')) return 'new_with_tag';
  if (lower.includes('très bon') || lower.includes('tres bon')) return 'very_good';
  if (lower.includes('bon état')) return 'good';
  if (lower.includes('satisfaisant')) return 'satisfactory';
  return 'very_good';
}

export function getConditionTargetLabel(
  condition: ListingCondition,
  targetPlatform: Platform,
): string {
  if (targetPlatform === 'leboncoin') {
    switch (condition) {
      case 'new_with_tag':
      case 'new_without_tag':
        return 'État neuf';
      case 'very_good':
        return 'Très bon état';
      case 'good':
        return 'Bon état';
      case 'satisfactory':
        return 'État satisfaisant';
    }
  }

  // Target: Vinted
  switch (condition) {
    case 'new_with_tag':
      return 'Neuf avec étiquette';
    case 'new_without_tag':
      return 'Neuf sans étiquette';
    case 'very_good':
      return 'Très bon état';
    case 'good':
      return 'Bon état';
    case 'satisfactory':
      return 'Satisfaisant';
  }
}
