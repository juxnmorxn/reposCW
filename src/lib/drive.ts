// Helper para gestión de Evidencias en Google Drive y respaldo en el navegador
export async function uploadEvidenceFile(
  file: File,
  clienteNombre: string
): Promise<{ url: string; driveFileId?: string; isLocalPreview: boolean }> {
  try {
    // Si la API de Google Drive está configurada en backend (vía API Route /api/upload)
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
    console.warn('Google Drive API no respondió, creando vista previa Base64 local:', error);
  }

  // Fallback local instantáneo: Convertir imagen a Data URL base64 para vista previa local
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        isLocalPreview: true,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
