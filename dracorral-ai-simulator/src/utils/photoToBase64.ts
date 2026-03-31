// Convert a File object to a base64 string (without the data URL prefix)
export const photoToBase64 = (
  file: File,
): Promise<{
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:image/xxx;base64," prefix
      const base64 = dataUrl.split(',')[1];
      const mimeType = (file.type || 'image/jpeg') as
        | 'image/jpeg'
        | 'image/png'
        | 'image/webp';
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};
