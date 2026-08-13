// Compresión dinámica de imágenes en el cliente (HTML5 Canvas)
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } else {
        resolve(img.src);
      }
    };

    img.onerror = (err) => reject(err);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Helper para gestión de Evidencias en Google Drive y respaldo comprimido en el navegador
export async function uploadEvidenceFile(
  file: File,
  clienteNombre: string
): Promise<{ url: string; driveFileId?: string; isLocalPreview: boolean }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cliente', clienteNombre || 'General');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: data.url,
          driveFileId: data.fileId,
          isLocalPreview: false,
        };
      }
    }
  } catch (error) {
    console.warn('Google Drive API no respondió, creando vista previa Base64 comprimida:', error);
  }

  // Fallback local optimizado: comprimir la imagen en el cliente
  try {
    const compressedDataUrl = await compressImage(file);
    return {
      url: compressedDataUrl,
      isLocalPreview: true,
    };
  } catch (err) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          isLocalPreview: true,
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
