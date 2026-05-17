/**
 * Get a cropped image from a source and crop coordinates.
 * Uses naturalWidth/naturalHeight to calculate correct scale factors.
 */
export const getCroppedImg = (imageSource, crop, fileName = 'cropped.jpg') => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSource;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Use naturalWidth/naturalHeight — image.width/height are 0 for off-screen images
      const naturalW = image.naturalWidth;
      const naturalH = image.naturalHeight;

      // Ensure cropped dimensions aren't zero
      if (!crop || crop.width === 0 || crop.height === 0) {
        return reject("Crop dimensions are zero");
      }

      // If crop is in percentages, convert to pixels
      let cropX, cropY, cropW, cropH;
      if (crop.unit === '%') {
        cropX = (crop.x / 100) * naturalW;
        cropY = (crop.y / 100) * naturalH;
        cropW = (crop.width / 100) * naturalW;
        cropH = (crop.height / 100) * naturalH;
      } else {
        // crop is in pixels relative to the displayed image
        // We need to find the displayed size. If imageRef is available in context,
        // use it. Otherwise, assume the crop coordinates are already in natural pixels.
        cropX = crop.x;
        cropY = crop.y;
        cropW = crop.width;
        cropH = crop.height;
      }

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(cropW * pixelRatio);
      canvas.height = Math.floor(cropH * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return reject('Canvas is empty');
          }
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve(file);
        },
        'image/jpeg',
        0.92
      );
    };
    image.onerror = (error) => {
      reject(error);
    };
  });
};
