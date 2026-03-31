import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'captured' | 'error';

interface UseCameraReturn {
  status: CameraStatus;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  capturePreviewUrl: string | null;
  errorMessage: string | null;
  start: () => Promise<void>;
  capture: () => Promise<File | null>;
  retake: () => void;
  stop: () => void;
}

const CAPTURE_WIDTH = 1024;
const CAPTURE_QUALITY = 0.92;

/** Friendly Spanish messages for known camera error names */
function friendlyError(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Necesitamos permiso para usar la cámara. Ve a ajustes y permite el acceso.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No encontramos una cámara en tu dispositivo.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo.';
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return 'Tu cámara no soporta la configuración requerida.';
      case 'AbortError':
        return 'La cámara fue interrumpida. Intenta de nuevo.';
      default:
        break;
    }
  }
  return 'No pudimos acceder a la cámara. Verifica los permisos e intenta de nuevo.';
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [capturePreviewUrl, setCapturePreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Stop all camera tracks and release stream */
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Revoke capture preview URL if any
    if (capturePreviewUrl) {
      URL.revokeObjectURL(capturePreviewUrl);
    }
    setCapturePreviewUrl(null);
    setStatus('idle');
    setErrorMessage(null);
  }, [capturePreviewUrl]);

  /** Request camera access and start video feed */
  const start = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS Safari requires these attributes to autoplay
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setStatus('active');
    } catch (err) {
      setErrorMessage(friendlyError(err));
      setStatus('error');
    }
  }, []);

  /** Capture a frame from the live video and return it as a JPEG File */
  const capture = useCallback(async (): Promise<File | null> => {
    const video = videoRef.current;
    if (!video || status !== 'active') return null;

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    // Compute output dimensions keeping aspect ratio, max CAPTURE_WIDTH on longest side
    const scale = Math.min(1, CAPTURE_WIDTH / Math.max(videoWidth, videoHeight));
    const outW = Math.round(videoWidth * scale);
    const outH = Math.round(videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror the selfie horizontally (natural selfie behaviour)
    ctx.translate(outW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, outW, outH);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          setCapturePreviewUrl(previewUrl);
          setStatus('captured');

          // Stop live feed — we have the snapshot
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }

          const file = new File([blob], `selfie-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          resolve(file);
        },
        'image/jpeg',
        CAPTURE_QUALITY,
      );
    });
  }, [status]);

  /** Discard captured preview and restart live feed */
  const retake = useCallback(async () => {
    if (capturePreviewUrl) {
      URL.revokeObjectURL(capturePreviewUrl);
      setCapturePreviewUrl(null);
    }
    setStatus('idle');
    // Restart stream
    await start();
  }, [capturePreviewUrl, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (capturePreviewUrl) {
        URL.revokeObjectURL(capturePreviewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    videoRef,
    capturePreviewUrl,
    errorMessage,
    start,
    capture,
    retake,
    stop,
  };
}
