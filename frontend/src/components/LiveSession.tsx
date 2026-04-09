"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WebcamCapture from "./WebcamCapture";
import { PKEWebSocket } from "@/lib/ws";
import type { WSIncomingMessage, WSResultMessage } from "@/lib/types";

interface LiveSessionProps {
  exerciseName?: string;
}

interface SessionLog {
  time: string;
  type: "ack" | "result" | "info" | "error";
  message: string;
}

export default function LiveSession({ exerciseName }: LiveSessionProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [framesStreamed, setFramesStreamed] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [passedReps, setPassedReps] = useState(0);
  const [lastRepResult, setLastRepResult] = useState<WSResultMessage | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const wsRef = useRef<PKEWebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: SessionLog["type"], message: string) => {
    setLogs((prev) => [
      ...prev.slice(-50), // Keep last 50 logs
      { time: new Date().toLocaleTimeString(), type, message },
    ]);
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleMessage = useCallback(
    (message: WSIncomingMessage) => {
      switch (message.type) {
        case "ack":
          addLog("ack", `Server acknowledged ${message.frames_received} frames`);
          break;
        case "result":
          setRepCount((prev) => prev + 1);
          setPassedReps((prev) => prev + (message.passed ? 1 : 0));
          setTotalDistance((prev) => prev + message.distance);
          setLastRepResult(message);
          addLog(
            "result",
            `Rep ${message.rep_idx}: ${message.passed ? "✅ Good form" : "❌ Form deviation"} (distance: ${message.distance.toFixed(3)})`
          );
          break;
        case "session_end":
          addLog("info", `Session ended. Total frames: ${message.total_frames}`);
          setIsStreaming(false);
          break;
      }
    },
    [addLog]
  );

  const startSession = useCallback(() => {
    const ws = new PKEWebSocket({
      onOpen: () => {
        setIsConnected(true);
        setIsStreaming(true);
        setFramesStreamed(0);
        addLog("info", "Connected to stream server");
      },
      onMessage: handleMessage,
      onError: () => addLog("error", "WebSocket connection error"),
      onClose: () => {
        setIsConnected(false);
        addLog("info", "Disconnected from stream server");
      },
    });

    ws.connect();
    wsRef.current = ws;
  }, [addLog, handleMessage]);

  const stopSession = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.endSession();
      setTimeout(() => {
        wsRef.current?.disconnect();
        wsRef.current = null;
        setIsStreaming(false);
        setIsConnected(false);
      }, 500);
    }
  }, []);

  const handleLandmarks = useCallback(
    (landmarks: { x: number; y: number; z: number }[]) => {
      if (!isStreaming || !wsRef.current) return;

      const formatted = landmarks.map((lm) => [lm.x, lm.y, lm.z]);
      wsRef.current.sendFrame(formatted);
      setFramesStreamed((prev) => prev + 1);
    },
    [isStreaming]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  const averageDistance = repCount > 0 ? totalDistance / repCount : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--pke-text-primary)]">
            Live Session
            {exerciseName && (
              <span className="ml-2 text-[var(--pke-accent)]">
                — {exerciseName}
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--pke-text-secondary)] mt-0.5">
            Stream your movements in real-time for instant feedback
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          {isStreaming && (
            <div className="flex items-center gap-4 text-xs text-[var(--pke-text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--pke-danger)] animate-pulse" />
                LIVE
              </span>
              <span>{framesStreamed} frames</span>
            </div>
          )}

          <button
            onClick={isStreaming ? stopSession : startSession}
            className={`pke-btn pke-btn-sm ${
              isStreaming ? "pke-btn-danger" : "pke-btn-primary"
            }`}
          >
            {isStreaming ? "⏹ Stop" : "▶ Start Streaming"}
          </button>
        </div>
      </div>

      {/* Camera + Feedback + Logs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Camera */}
        <div className="lg:col-span-2">
          <WebcamCapture
            onLandmarks={handleLandmarks}
            active={isStreaming}
            width={640}
            height={480}
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          {/* Example Movement Video */}
          <div className="pke-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--pke-text-primary)]">
                  Example Squat
                </h3>
                <p className="text-xs text-[var(--pke-text-secondary)] mt-1">
                  Watch this ideal squat to match depth, posture, and timing.
                </p>
              </div>
              <span className="text-[11px] text-[var(--pke-text-muted)] uppercase tracking-[0.2em]">
                Reference
              </span>
            </div>
            <video
              controls
              className="w-full rounded-xl border border-[var(--pke-border)] bg-black"
            >
              <source src="/examples/squat.mp4" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
            <p className="mt-3 text-xs text-[var(--pke-text-muted)]">
              Place a demo squat video at <code>/public/examples/squat.mp4</code> in the frontend folder.
            </p>
          </div>
          {/* Live Feedback Panel */}
          <div className="pke-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--pke-text-primary)]">
                  Live Feedback
                </h3>
                <p className="text-xs text-[var(--pke-text-secondary)] mt-1">
                  Instant analysis of reps and movement quality.
                </p>
              </div>
              <span
                className={`px-2 py-1 text-[11px] font-semibold uppercase rounded-full ${
                  isConnected
                    ? "bg-[var(--pke-success)]/10 text-[var(--pke-success)]"
                    : "bg-[var(--pke-text-muted)]/10 text-[var(--pke-text-muted)]"
                }`}
              >
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-[var(--pke-text-primary)]">
              <div className="rounded-xl border border-[var(--pke-border)] p-3 bg-[var(--pke-surface)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pke-text-muted)]">
                  Frames
                </p>
                <p className="mt-2 text-lg font-semibold">{framesStreamed}</p>
              </div>
              <div className="rounded-xl border border-[var(--pke-border)] p-3 bg-[var(--pke-surface)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pke-text-muted)]">
                  Reps detected
                </p>
                <p className="mt-2 text-lg font-semibold">{repCount}</p>
              </div>
              <div className="rounded-xl border border-[var(--pke-border)] p-3 bg-[var(--pke-surface)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pke-text-muted)]">
                  Avg distance
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {averageDistance !== null ? averageDistance.toFixed(3) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--pke-border)] p-3 bg-[var(--pke-surface)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pke-text-muted)]">
                  Pass rate
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {repCount > 0 ? `${Math.round((passedReps / repCount) * 100)}%` : "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--pke-border)] bg-[var(--pke-surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pke-text-muted)]">
                Latest rep feedback
              </p>
              {lastRepResult ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-semibold text-[var(--pke-text-primary)]">
                    Rep {lastRepResult.rep_idx + 1} — {lastRepResult.passed ? "Good form" : "Needs improvement"}
                  </p>
                  <p className="text-[var(--pke-text-secondary)]">
                    Distance: {lastRepResult.distance.toFixed(3)}
                  </p>
                  <p className="text-[var(--pke-text-secondary)]">
                    Joint corrections: {lastRepResult.joint_errors.length}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--pke-text-muted)]">
                  Waiting for the first rep detection to provide live feedback.
                </p>
              )}
            </div>
          </div>

          {/* Session Log */}
          <div className="pke-card flex flex-col h-[320px]">
            <div className="px-4 py-3 border-b border-[var(--pke-border)] flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--pke-text-primary)]">
                Session Log
              </h3>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? "bg-[var(--pke-success)]"
                      : "bg-[var(--pke-text-muted)]"
                  }`}
                />
                <span className="text-[11px] text-[var(--pke-text-muted)]">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-[var(--pke-text-muted)] text-center py-8">
                  Session logs will appear here…
                </p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[var(--pke-text-muted)] shrink-0">
                      {log.time}
                    </span>
                    <span
                      className={
                        log.type === "error"
                          ? "text-[var(--pke-danger)]"
                          : log.type === "result"
                          ? "text-[var(--pke-success)]"
                          : log.type === "ack"
                          ? "text-[var(--pke-accent)]"
                          : "text-[var(--pke-text-secondary)]"
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
