import type { NormalizedListing, Platform } from '../types/listing';

export interface StorageData {
  currentListing?: NormalizedListing | null;
  history?: NormalizedListing[];
  targetPlatform?: Platform;
  darkMode?: boolean;
}

const STORAGE_KEYS = {
  CURRENT_LISTING: 'saleator_current_listing',
  HISTORY: 'saleator_history',
  TARGET_PLATFORM: 'saleator_target_platform',
  DARK_MODE: 'saleator_dark_mode',
};

export async function getStoredListing(): Promise<NormalizedListing | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
  const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_LISTING);
  return (result[STORAGE_KEYS.CURRENT_LISTING] as NormalizedListing) || null;
}

export async function setStoredListing(listing: NormalizedListing | null): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_LISTING]: listing });
}

export async function getStoredHistory(): Promise<NormalizedListing[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];
  const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  return (result[STORAGE_KEYS.HISTORY] as NormalizedListing[]) || [];
}

export async function addToHistory(listing: NormalizedListing): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  const history = await getStoredHistory();
  const filtered = history.filter((item) => item.id !== listing.id);
  const updated = [listing, ...filtered].slice(0, 20);
  await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: updated });
}

export async function getTargetPlatform(): Promise<Platform> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return 'leboncoin';
  const result = await chrome.storage.local.get(STORAGE_KEYS.TARGET_PLATFORM);
  return (result[STORAGE_KEYS.TARGET_PLATFORM] as Platform) || 'leboncoin';
}

export async function setTargetPlatform(platform: Platform): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEYS.TARGET_PLATFORM]: platform });
}

export async function getStoredDarkMode(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return false;
  const result = await chrome.storage.local.get(STORAGE_KEYS.DARK_MODE);
  return (result[STORAGE_KEYS.DARK_MODE] as boolean) ?? false;
}

export async function setStoredDarkMode(enabled: boolean): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEYS.DARK_MODE]: enabled });
}
