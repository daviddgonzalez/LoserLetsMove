/**
 * TypeScript types mirroring backend Pydantic schemas.
 * Keep in sync with backend/app/utils/schemas.py
 */

// ─── Enums ────────────────────────────────────────────────

export enum TaskStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETE = "complete",
  FAILED = "failed",
}

export enum CalibrationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETE = "complete",
  FAILED = "failed",
}

// ─── Landmark Data ────────────────────────────────────────

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FrameData {
  frame_idx: number;
  landmarks: Landmark[];
}

// ─── Upload ───────────────────────────────────────────────

export interface UploadResponse {
  task_id: string;
  status: TaskStatus;
  message: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  progress: number;
  message: string;
  landmarks_extracted?: number | null;
}

// ─── Calibration ──────────────────────────────────────────

export interface CalibrationStartRequest {
  user_id: string;
  exercise_name: string;
}

export interface CalibrationStartResponse {
  session_id: string;
  status: CalibrationStatus;
  message: string;
}

export interface CalibrationSequenceRequest {
  landmarks?: FrameData[] | null;
  storage_path?: string | null;
}

export interface CalibrationFinalizeResponse {
  session_id: string;
  status: CalibrationStatus;
  centroid_stored: boolean;
  num_sequences: number;
  message: string;
}

// ─── Evaluation ───────────────────────────────────────────

export interface JointError {
  joint_index: number;
  joint_name: string;
  error_score: number;
  description: string;
}

export interface EvaluationRequest {
  user_id: string;
  exercise_name: string;
  landmarks: FrameData[];
}

export interface EvaluationResponse {
  evaluation_id: string;
  passed: boolean;
  distance_to_centroid: number;
  threshold: number;
  joint_errors: JointError[];
  dtw_triggered: boolean;
  message: string;
}

// ─── WebSocket ────────────────────────────────────────────

export interface WSFrameMessage {
  type: "frame";
  frame_idx: number;
  landmarks: number[][]; // [[x, y, z], ...] — 33 entries
}

export interface WSAckMessage {
  type: "ack";
  frames_received: number;
  message: string;
}

export interface WSResultMessage {
  type: "result";
  rep_idx: number;
  passed: boolean;
  distance: number;
  joint_errors: JointError[];
}

export interface WSSessionEndMessage {
  type: "session_end";
  total_frames: number;
  message: string;
}

export type WSIncomingMessage =
  | WSAckMessage
  | WSResultMessage
  | WSSessionEndMessage;

// ─── Exercise Catalog ─────────────────────────────────────

export interface Exercise {
  slug: string;
  displayName: string;
  description: string;
  targetJoints: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
  color: string;
}
