import Link from "next/link";

const QUICK_ACTIONS = [
  {
    href: "/catalog",
    icon: "📋",
    title: "Exercise Catalog",
    description: "Browse all supported exercises and view detailed breakdowns",
    color: "#6366f1",
  },
  {
    href: "/upload",
    icon: "📤",
    title: "Upload Video",
    description: "Upload a recorded video for asynchronous pose analysis",
    color: "#8b5cf6",
  },
  {
    href: "/live",
    icon: "🎥",
    title: "Live Session",
    description: "Stream your webcam for real-time movement evaluation",
    color: "#ec4899",
  },
  {
    href: "/calibrate",
    icon: "🎯",
    title: "Calibrate",
    description: "Record baseline sequences to personalize your evaluator",
    color: "#10b981",
  },
];

const PIPELINE_STEPS = [
  {
    step: "1",
    title: "Capture",
    description: "Webcam or video upload",
    icon: "📹",
  },
  {
    step: "2",
    title: "Extract",
    description: "MediaPipe pose landmarks",
    icon: "🦴",
  },
  {
    step: "3",
    title: "Normalize",
    description: "Scale & temporal alignment",
    icon: "📐",
  },
  {
    step: "4",
    title: "Evaluate",
    description: "Neural network comparison",
    icon: "🧠",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-10" style={{ background: "var(--pke-gradient-hero)" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              L
            </div>
            <span className="pke-badge pke-badge-accent">v0.1.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--pke-text-primary)] tracking-tight mb-2">
            Loser, Lets Move
          </h1>
          <p className="text-base text-[var(--pke-text-secondary)] max-w-xl leading-relaxed">
            AI-powered movement analysis that learns <em>your</em> body. Calibrate
            once, then get real-time form feedback personalized to your
            biomechanics — not a generic standard.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--pke-text-primary)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`pke-card pke-card-interactive p-5 block animate-fade-in stagger-${i + 1}`}
              id={`action-${action.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
                style={{
                  background: `${action.color}18`,
                }}
              >
                {action.icon}
              </div>
              <h3 className="text-sm font-semibold text-[var(--pke-text-primary)] mb-1">
                {action.title}
              </h3>
              <p className="text-xs text-[var(--pke-text-secondary)] leading-relaxed">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--pke-text-primary)] mb-4">
          How It Works
        </h2>
        <div className="pke-card p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PIPELINE_STEPS.map((item, i) => (
              <div key={item.step} className={`text-center animate-fade-in stagger-${i + 1}`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-[var(--pke-accent)]/20 text-[var(--pke-accent)] text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--pke-text-primary)]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--pke-text-muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Build Progress */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--pke-text-primary)] mb-4">
          Build Progress
        </h2>
        <div className="pke-card p-5 space-y-3">
          {[
            { label: "Docker + Backend + Supabase", done: true },
            { label: "Extraction + Normalization", done: true },
            { label: "C++ Module (DTW + Joint Angles)", done: true },
            { label: "ST-GCN Architecture", done: false, inProgress: true },
            { label: "Calibration + Evaluation Services", done: false },
            { label: "Frontend (React/TypeScript)", done: false, inProgress: true },
            { label: "Live Pipeline (WebSocket)", done: false },
            { label: "Pre-training (Fit3D)", done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                  item.done
                    ? "bg-[var(--pke-success)] text-white"
                    : item.inProgress
                    ? "bg-[var(--pke-warning)] text-white"
                    : "bg-[var(--pke-bg-surface)] text-[var(--pke-text-muted)] border border-[var(--pke-border)]"
                }`}
              >
                {item.done ? "✓" : item.inProgress ? "…" : i + 1}
              </span>
              <span
                className={`text-sm ${
                  item.done
                    ? "text-[var(--pke-text-secondary)] line-through"
                    : item.inProgress
                    ? "text-[var(--pke-warning)] font-medium"
                    : "text-[var(--pke-text-muted)]"
                }`}
              >
                {item.label}
              </span>
              {item.inProgress && (
                <span className="pke-badge pke-badge-warning ml-auto">
                  In Progress
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
