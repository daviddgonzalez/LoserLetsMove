import Link from "next/link";

const PIPELINE_STEPS = [
  { step: "1", title: "Capture", description: "Webcam or video upload" },
  { step: "2", title: "Extract", description: "MediaPipe pose landmarks" },
  { step: "3", title: "Normalize", description: "Scale & alignment" },
  { step: "4", title: "Evaluate", description: "Neural network analysis" },
];

export default function Home() {
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col justify-center px-6 lg:px-12 w-full max-w-7xl mx-auto -mt-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center h-full w-full justify-items-center">
        <div className="space-y-8 animate-fade-in flex flex-col items-center text-center">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-[#0f172a] tracking-tighter leading-none">
            MyPose
          </h1>
          <p className="text-lg text-[#475569] leading-relaxed max-w-lg mx-auto">
            AI-powered movement analysis that learns your body. Calibrate
            once, then get real-time form feedback personalized to your
            unique biomechanics
          </p>
        </div>

        <div className="animate-slide-in flex justify-center w-full">
          <div className="bg-white p-8 lg:p-10 relative overflow-hidden w-full border border-[#e2e8f0]">
            
            <h2 className="text-sm font-extrabold text-[#0f172a] mb-8 uppercase tracking-widest">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 relative z-10">
              {PIPELINE_STEPS.map((item, i) => (
                <div key={item.step} className={`stagger-${i + 1}`}>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="w-8 h-8 bg-[#0f172a] text-white text-xs font-black flex items-center justify-center -rotate-3">
                      {item.step}
                    </span>
                    <h3 className="text-base font-bold text-[#0f172a] uppercase tracking-wide">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[#475569] ml-12">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
