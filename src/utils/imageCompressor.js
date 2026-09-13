/**
 * Image Compression Utility for CivicAI
 * 
 * Compresses uploaded images client-side before storage or transmission.
 * Reduces 2MB–12MB camera photos to ~80KB–180KB with high visual fidelity.
 * Prevents localStorage QuotaExceededError and HTTP 413 Payload Too Large on deployed hosts.
 */

export function compressImage(fileOrDataUrl, maxWidth = 1200, maxHeight = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!fileOrDataUrl) {
      return reject(new Error("No image provided for compression"));
    }

    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // If the image is already small, skip aggressive downscaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // If canvas context fails, fallback to original
          return resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to lightweight JPEG data URL
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("Canvas compression failed, falling back to original:", err);
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
      }
    };

    img.onerror = (err) => {
      console.warn("Image load error during compression:", err);
      reject(err);
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      reject(new Error("Unsupported image input type for compression"));
    }
  });
}
