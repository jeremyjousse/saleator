import type { NormalizedListing, Platform } from '../types/listing';

export type ExtensionMessage =
  | { type: 'EXTRACT_LISTING' }
  | { type: 'FILL_FORM'; listing: NormalizedListing; step?: 'title' | 'photos' | 'details' }
  | { type: 'OPEN_TARGET_PLATFORM'; target: Platform; listing: NormalizedListing }
  | { type: 'PING' };

export type ExtensionResponse =
  | { success: true; data?: unknown; listing?: NormalizedListing | null; message?: string }
  | { success: false; error: string };

export async function sendMessageToActiveTab<T = unknown>(
  message: ExtensionMessage,
): Promise<T | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null;

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return null;

  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, message);
    return response as T;
  } catch (err) {
    console.warn('Saleator: Error sending message to active tab', err);
    return null;
  }
}

export async function openPlatformTab(platform: Platform): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null;

  const url =
    platform === 'vinted'
      ? 'https://www.vinted.fr/items/new'
      : 'https://www.leboncoin.fr/deposer-une-annonce';

  return chrome.tabs.create({ url });
}
