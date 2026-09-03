"use client";

import { useCallback, useRef } from "react";

export function useScreenShareDetector(onDetected: () => void) {
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const simulate = useCallback(() => {
    onDetectedRef.current();
  }, []);

  const start = useCallback(async () => {
    try {
      const media = navigator.mediaDevices;
      if (media?.getDisplayMedia) {
        const stream = await media.getDisplayMedia({ video: true, audio: false });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      // Permission denied or unavailable — demo still proceeds.
    }
    onDetectedRef.current();
  }, []);

  return { start, simulate };
}
