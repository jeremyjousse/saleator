export interface DownloadedImage {
  name: string;
  blob: Blob;
  dataUrl: string;
  mimeType: string;
}

export async function downloadImageAsBlob(
  url: string,
  filename?: string,
): Promise<DownloadedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const name = filename || `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return { name, blob, dataUrl, mimeType };
}

export function createFileFromBlob(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function populateFileInput(input: HTMLInputElement, files: File[]): boolean {
  try {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    return true;
  } catch (err) {
    console.error('Saleator: Error populating file input', err);
    return false;
  }
}

export function injectFilesToDropzone(container: HTMLElement | Document, files: File[]): boolean {
  const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
  const dropzone =
    container.querySelector<HTMLElement>(
      '[data-qa-id="dropzone"], [data-testid="dropzone"], div[role="button"], div[class*="dropzone"], .dropzone',
    ) || fileInput?.closest<HTMLElement>('div, label, section');

  const dataTransfer = new DataTransfer();
  for (const f of files) {
    dataTransfer.items.add(f);
  }

  let injected = false;

  if (fileInput) {
    try {
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      injected = true;
    } catch (e) {
      console.warn('Saleator: Error setting input.files directly', e);
    }
  }

  if (dropzone) {
    try {
      dropzone.dispatchEvent(
        new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }),
      );
      dropzone.dispatchEvent(
        new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }),
      );
      dropzone.dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }),
      );
      injected = true;
    } catch (e) {
      console.warn('Saleator: Error dispatching drop event', e);
    }
  }

  return injected;
}
