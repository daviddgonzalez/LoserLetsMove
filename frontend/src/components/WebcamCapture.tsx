"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import PoseOverlay from "./PoseOverlay";

interface WebcamCaptureProps {
  /** Called each frame with extracted landmarks (33 items). */
  onLandmarks?: (
    landmarks: { x: number; y: number; z: number }[]
  ) => void;
  /** Whether to actively process frames. */
  active?: boolean;
  /** Width of the video feed. */
  width?: number;
  /** Height of the video feed. */
  height?: number;
}

export default function WebcamCapture({
  onLandmarks,
  active = true,
  width = 640,
  height = 480,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentLandmarks, setCurrentLandmarks] = useState<
    { x: number; y: number; z: number }[] | null
  >(null);

  const { isLoading, isReady, error: mpError, detectPose } = useMediaPipe();

  // Start camera
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: "user",
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for the stream to be ready before playing
          await new Promise<void>((resolve) => {
            videoRef.current!.onloadedmetadata = () => resolve();
          });
          try {
            await videoRef.current.play();
          } catch (e) {
            // Ignore AbortError — happens when component remounts quickly
            if (e instanceof DOMException && e.name === "AbortError") return;
            throw e;
          }
          setCameraReady(true);
        }
      } catch (err) {
        setCameraError(
          err instanceof Error
            ? err.message
            : "Camera access denied"
        );
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [width, height]);

  // Frame processing loop
  const processFrame = useCallback(() => {
    if (!active || !cameraReady || !isReady || !videoRef.current) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const landmarks = detectPose(videoRef.current);
    if (landmarks) {
      const simplified = landmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
      }));
      setCurrentLandmarks(simplified);
      onLandmarks?.(simplified);
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [active, cameraReady, isReady, detectPose, onLandmarks]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [processFrame]);

  return (
    <div className="space-y-3">
      {/* Status Bar */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              cameraReady ? "bg-[var(--pke-success)]" : "bg-[var(--pke-text-muted)]"
            }`}
          />
          <span className="text-[var(--pke-text-secondary)]">
            {cameraReady ? "Camera Active" : "Connecting…"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isReady
                ? "bg-[var(--pke-success)]"
                : isLoading
                ? "bg-[var(--pke-warning)]"
                : "bg-[var(--pke-text-muted)]"
            }`}
          />
          <span className="text-[var(--pke-text-secondary)]">
            {isReady
              ? "MediaPipe Ready"
              : isLoading
              ? "Loading Model…"
              : "MediaPipe Idle"}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div
        className="relative rounded-xl overflow-hidden border border-[var(--pke-border)] bg-black"
        style={{ width, height }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        <PoseOverlay
          landmarks={currentLandmarks}
          width={width}
          height={height}
        />

        {/* Loading Overlay */}
        {(!cameraReady || isLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <div className="w-8 h-8 border-2 border-[var(--pke-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--pke-text-secondary)]">
              {!cameraReady
                ? "Starting camera…"
                : "Loading MediaPipe model…"}
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {(cameraError || mpError) && (
        <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[var(--pke-danger)] text-sm text-[var(--pke-danger)]">
          {cameraError || mpError}
        </div>
      )}
    </div>
  );
}
