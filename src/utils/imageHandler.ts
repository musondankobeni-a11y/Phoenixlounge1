/**
 * Phoenix Lounge Kabwe - Universal Responsive Image Handler
 * Handles all photo formats (JPEG, PNG, WebP, AVIF, SVG, HEIC fallback)
 * Resizes and optimizes client-side for smooth mobile & desktop rendering and rapid Firestore syncing.
 */

export async function processImageFile(file: File, maxWidth = 640, maxHeight = 640, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read as text / data URL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP (or fallback to JPEG) for high compression & crisp visual quality
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl && dataUrl.startsWith('data:image/webp')) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // Fallback to JPEG below
        }

        const fallbackUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(fallbackUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to parse image file.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  return false;
}
