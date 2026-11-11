import { z } from 'zod';

export const ConditionSchema = z.enum([
  'new_with_tag',
  'new_without_tag',
  'very_good',
  'good',
  'satisfactory',
]);

export type ListingCondition = z.infer<typeof ConditionSchema>;

export const PlatformSchema = z.enum(['vinted', 'leboncoin']);
export type Platform = z.infer<typeof PlatformSchema>;

export const ListingPhotoSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  isCover: z.boolean().default(false),
});
export type ListingPhoto = z.infer<typeof ListingPhotoSchema>;

export const CategoryMappingSchema = z.object({
  sourceCategory: z.string(),
  sourceId: z.string().optional(),
  normalized: z.string(),
  targetCategoryName: z.string().optional(),
  targetCategoryId: z.string().optional(),
});
export type CategoryMapping = z.infer<typeof CategoryMappingSchema>;

export const NormalizedListingSchema = z.object({
  id: z.string(),
  source: PlatformSchema,
  originalUrl: z.string().url(),
  title: z.string().min(1),
  description: z.string().default(''),
  price: z.number().nonnegative(),
  currency: z.literal('EUR').default('EUR'),
  condition: ConditionSchema.default('very_good'),
  category: CategoryMappingSchema,
  brand: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  location: z.string().optional(),
  photos: z.array(ListingPhotoSchema).min(1),
  createdAt: z.string(),
});

export type NormalizedListing = z.infer<typeof NormalizedListingSchema>;

export interface CrossPostState {
  currentListing: NormalizedListing | null;
  targetPlatform: Platform;
  status: 'idle' | 'extracting' | 'extracted' | 'transferring' | 'transferred' | 'error';
  errorMessage: string | null;
  history: NormalizedListing[];
}
