import LiveSession from "@/components/LiveSession";

export const metadata = {
  title: "Live Session — PKE",
  description:
    "Stream your webcam in real-time for instant movement evaluation using MediaPipe and WebSocket.",
};

export default function LivePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pke-text-primary)] tracking-tight">
          Live Session
        </h1>
        <p className="text-sm text-[var(--pke-text-secondary)] mt-1">
          Stream your webcam for real-time movement evaluation — landmarks are
          extracted client-side and sent to the server via WebSocket
        </p>
      </div>

      {/* Requirements */}
      <div className="pke-card p-4 flex items-start gap-3 border-l-4 border-l-[var(--pke-warning)]">
        <span className="text-lg">⚠️</span>
        <div>
          <p className="text-sm font-medium text-[var(--pke-text-primary)]">
            Requirements
          </p>
          <ul className="text-xs text-[var(--pke-text-secondary)] mt-1 space-y-0.5 list-disc list-inside">
            <li>Camera access must be granted</li>
            <li>Backend server must be running on port 8000</li>
            <li>WebGL support required for MediaPipe GPU acceleration</li>
            <li>Calibration for the exercise should be completed first</li>
          </ul>
        </div>
      </div>

      {/* Live Session Component */}
      <LiveSession />
    </div>
  );
}
