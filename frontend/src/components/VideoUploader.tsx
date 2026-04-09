"use client";

import { useCallback, useRef, useState } from "react";
import { uploadVideo, getUploadStatus } from "@/lib/api";
import type { TaskStatus, TaskStatusResponse } from "@/lib/types";

export default function VideoUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a valid video file (.mp4)");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setTaskStatus(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const startPolling = useCallback((taskId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getUploadStatus(taskId);
        setTaskStatus(status);

        if (
          status.status === ("complete" as TaskStatus) ||
          status.status === ("failed" as TaskStatus)
        ) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch {
        setError("Lost connection to server while polling status");
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 1500);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadVideo(file);
      setTaskStatus({
        task_id: response.task_id,
        status: response.status,
        progress: 0,
        message: response.message,
      });
      startPolling(response.task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [file, startPolling]);

  const resetUploader = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setFile(null);
    setTaskStatus(null);
    setError(null);
    setUploading(false);
  }, []);

  const statusColor = taskStatus
    ? taskStatus.status === ("complete" as TaskStatus)
      ? "var(--pke-success)"
      : taskStatus.status === ("failed" as TaskStatus)
      ? "var(--pke-danger)"
      : "var(--pke-accent)"
    : "var(--pke-accent)";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Drop Zone */}
      {!taskStatus && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer border-[2px] border-dashed p-6
            flex flex-col items-center justify-center gap-4
            transition-all duration-200 h-[480px] w-full
            ${
              isDragging
                ? "border-[#0f172a] bg-[#f8fafc]"
                : "border-[#e2e8f0] hover:border-[#cbd5e1] bg-white"
            }
          `}
        >
          <div className="text-4xl">{isDragging ? "" : ""}</div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--pke-text-primary)]">
              {isDragging
                ? "Drop your video here"
                : "Drag & drop a video, or click to browse"}
            </p>
            <p className="text-xs text-[var(--pke-text-muted)] mt-1">
              Supports .mp4, .mov, .mpeg — max 100 MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/mpeg,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* File Info */}
      {file && !taskStatus && (
        <div className="pke-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl"></span>
            <div>
              <p className="text-sm font-medium text-[var(--pke-text-primary)]">
                {file.name}
              </p>
              <p className="text-xs text-[var(--pke-text-muted)]">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetUploader}
              className="pke-btn pke-btn-ghost pke-btn-sm"
            >
              Remove
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="pke-btn pke-btn-primary pke-btn-sm"
            >
              {uploading ? "Uploading…" : "Upload & Process"}
            </button>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {taskStatus && (
        <div className="pke-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: statusColor,
                  boxShadow:
                    taskStatus.status === ("processing" as TaskStatus)
                      ? `0 0 8px ${statusColor}`
                      : "none",
                  animation:
                    taskStatus.status === ("processing" as TaskStatus)
                      ? "pulse-glow 2s ease-in-out infinite"
                      : "none",
                }}
              />
              <span className="text-sm font-medium text-[var(--pke-text-primary)] capitalize">
                {taskStatus.status}
              </span>
            </div>
            {taskStatus.landmarks_extracted && (
              <span className="pke-badge pke-badge-accent">
                {taskStatus.landmarks_extracted} frames
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="pke-progress">
            <div
              className="pke-progress-bar"
              style={{ width: `${(taskStatus.progress ?? 0) * 100}%` }}
            />
          </div>

          <p className="text-xs text-[var(--pke-text-secondary)]">
            {taskStatus.message}
          </p>

          {(taskStatus.status === ("complete" as TaskStatus) ||
            taskStatus.status === ("failed" as TaskStatus)) && (
            <button
              onClick={resetUploader}
              className="pke-btn pke-btn-secondary pke-btn-sm"
            >
              Upload Another
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[var(--pke-danger)] text-sm text-[var(--pke-danger)]">
          {error}
        </div>
      )}
    </div>
  );
}
