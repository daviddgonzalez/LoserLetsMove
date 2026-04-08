export default function BuildProgress() {
  const steps = [
    { label: "Docker + Backend + Supabase", done: true },
    { label: "Extraction + Normalization", done: true },
    { label: "C++ Module (DTW + Joint Angles)", done: true },
    { label: "ST-GCN Architecture", done: false, inProgress: true },
    { label: "Calibration + Evaluation Services", done: false },
    { label: "Frontend (React/TypeScript)", done: false, inProgress: true },
    { label: "Live Pipeline (WebSocket)", done: false },
    { label: "Pre-training (Fit3D)", done: false },
  ];

  return (
    <div className="px-6 lg:px-12 py-16 max-w-4xl mx-auto w-full animate-fade-in">
      <h1 className="text-4xl font-extrabold text-[#0f172a] mb-10 tracking-tight uppercase">Build Progress</h1>
      <div className="bg-white p-10 relative border border-[#e2e8f0]">
        <div className="space-y-8 relative z-10">
          {steps.map((item, i) => (
            <div key={i} className="flex items-start gap-5">
              <span className={`w-10 h-10 border-[2px] flex items-center justify-center text-sm font-bold shrink-0 ${item.done ? 'bg-[#10b981] border-[#10b981] text-white' : item.inProgress ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'bg-transparent border-[#cbd5e1] text-[#94a3b8]'}`}>
                {item.done ? '✓' : item.inProgress ? '...' : i + 1}
              </span>
              <div className="pt-2">
                <p className={`text-base font-bold uppercase tracking-wider ${item.done ? 'text-[#94a3b8] line-through decoration-[2px]' : item.inProgress ? 'text-[#0f172a]' : 'text-[#64748b]'}`}>
                  {item.label}
                </p>
                {item.inProgress && (
                  <span className="inline-block mt-2 px-3 py-1 bg-[#0f172a] text-white text-[10px] font-bold uppercase tracking-widest">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
