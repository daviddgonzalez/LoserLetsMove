import VideoUploader from "@/components/VideoUploader";

export const metadata = {
  title: "Upload Video — PKE",
  description:
    "Upload a pre-recorded exercise video for asynchronous pose extraction and movement analysis.",
};

export default function UploadPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pke-text-primary)] tracking-tight">
          Upload Video
        </h1>
        <p className="text-sm text-[var(--pke-text-secondary)] mt-1">
          Upload a pre-recorded exercise video for asynchronous pose extraction
          and analysis
        </p>
      </div>

      {/* Info Banner */}
      <div className="pke-card p-4 flex items-start gap-3 border-l-4 border-l-[var(--pke-info)]">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-sm font-medium text-[var(--pke-text-primary)]">
            How it works
          </p>
          <p className="text-xs text-[var(--pke-text-secondary)] mt-0.5 leading-relaxed">
            Upload an .mp4 video of your exercise. The backend will extract 33
            pose landmarks per frame using MediaPipe, then normalize and prepare
            the data for evaluation against your calibrated baseline.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="max-w-2xl">
        <VideoUploader />
      </div>

      {/* Format Info */}
      <div className="pke-card p-5">
        <h2 className="text-sm font-semibold text-[var(--pke-text-primary)] mb-3">
          Supported Formats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { format: ".mp4", mime: "video/mp4", recommended: true },
            { format: ".mov", mime: "video/quicktime", recommended: false },
            { format: ".mpeg", mime: "video/mpeg", recommended: false },
          ].map((f) => (
            <div
              key={f.format}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--pke-bg-surface)]"
            >
              <span className="text-xl">🎬</span>
              <div>
                <p className="text-sm font-medium text-[var(--pke-text-primary)]">
                  {f.format}
                  {f.recommended && (
                    <span className="ml-2 pke-badge pke-badge-success text-[10px]">
                      Recommended
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[var(--pke-text-muted)] font-mono">
                  {f.mime}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
