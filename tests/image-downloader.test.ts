import { describe, it, expect } from 'vitest';
import { createFileFromBlob, populateFileInput } from '../src/services/image-downloader';

describe('Image Downloader Helpers', () => {
  it('creates File from Blob', () => {
    const blob = new Blob(['dummy content'], { type: 'image/jpeg' });
    const file = createFileFromBlob(blob, 'photo.jpg');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('photo.jpg');
    expect(file.type).toBe('image/jpeg');
  });

  it('populates file input using DataTransfer', () => {
    const input = document.createElement('input');
    input.type = 'file';

    const file1 = new File(['test1'], 'img1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'img2.jpg', { type: 'image/jpeg' });

    let changeTriggered = false;
    input.addEventListener('change', () => {
      changeTriggered = true;
    });

    const success = populateFileInput(input, [file1, file2]);
    expect(success).toBe(true);
    expect(input.files?.length).toBe(2);
    expect(changeTriggered).toBe(true);
  });
});
