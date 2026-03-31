import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a photo to Firebase Storage at uploads/{sessionId}/original.jpg.
 * Calls onProgress with 0–100 as bytes transfer.
 * Returns the public download URL.
 */
export async function uploadUserPhoto(
  file: File,
  sessionId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const storageRef = ref(storage, `uploads/${sessionId}/original.jpg`);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(pct));
        }
      },
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

/**
 * Delete the user's original photo from Storage after AI processing.
 * Fails silently — caller should not block on this for UX purposes.
 */
export async function deleteUserPhoto(sessionId: string): Promise<void> {
  const storageRef = ref(storage, `uploads/${sessionId}/original.jpg`);
  await deleteObject(storageRef);
}
