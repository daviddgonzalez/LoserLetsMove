"use client";

/**
 * React hook for MediaPipe PoseLandmarker.
 * Initializes the model lazily and provides pose detection from video elements.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// MediaPipe types
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseLandmarkerResult {
  landmarks: NormalizedLandmark[][];
  worldLandmarks: NormalizedLandmark[][];
}

export interface UseMediaPipeReturn {
  /** Whether the model is currently loading. */
  isLoading: boolean;
  /** Whether the model is ready for inference. */
  isReady: boolean;
  /** Any error that occurred during initialization. */
  error: string | null;
  /**
   * Detect pose landmarks from a video element.
   * Returns an array of 33 landmarks (or null if detection fails).
   */
  detectPose: (
    video: HTMLVideoElement,
    timestampMs?: number
  ) => NormalizedLandmark[] | null;
}

export function useMediaPipe(): UseMediaPipeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    async function init() {
      setIsLoading(true);
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { PoseLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          }
        );

        landmarkerRef.current = poseLandmarker;
        setIsReady(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize MediaPipe";
        console.error("MediaPipe init error:", message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  const detectPose = useCallback(
    (
      video: HTMLVideoElement,
      timestampMs?: number
    ): NormalizedLandmark[] | null => {
      if (!landmarkerRef.current || !isReady) return null;

      try {
        const ts = timestampMs ?? performance.now();
        const result: PoseLandmarkerResult =
          landmarkerRef.current.detectForVideo(video, ts);

        if (result.landmarks && result.landmarks.length > 0) {
          return result.landmarks[0]; // First (and only) detected pose
        }
        return null;
      } catch (err) {
        console.warn("Pose detection error:", err);
        return null;
      }
    },
    [isReady]
  );

  return { isLoading, isReady, error, detectPose };
}
