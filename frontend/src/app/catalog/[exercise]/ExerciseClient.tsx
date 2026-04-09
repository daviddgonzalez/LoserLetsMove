"use client";

import { useState } from "react";
import LiveSession from "@/components/LiveSession";
import VideoUploader from "@/components/VideoUploader";

export default function ExerciseClient({ exercise }: { exercise: any }) {
  const [activeTab, setActiveTab] = useState<"upload" | "live">("upload");
  const [hoverTab, setHoverTab] = useState<"upload" | "live" | null>(null);

  const currentHighlight = hoverTab || activeTab;

  return (
    <>
      <div className="w-full max-w-[1300px] px-6 xl:px-12 mx-auto mt-2">
        
        {/* Header Section: Title, Difficulty, and Toggle Pill */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight uppercase">
              {exercise.displayName}
            </h1>
            <span
              className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                exercise.difficulty === "Beginner"
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : exercise.difficulty === "Intermediate"
                  ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                  : "bg-[#ef4444]/10 text-[#ef4444]"
              }`}
            >
              {exercise.difficulty}
            </span>
          </div>

          {/* Pill Toggle Button */}
          <div 
            className="flex items-center bg-[#f8fafc] rounded-full p-1 border border-[#e2e8f0] relative shrink-0"
            onMouseLeave={() => setHoverTab(null)}
          >
            <div 
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm border border-[#e2e8f0] transition-all duration-300 ease-out"
              style={{
                width: 'calc(50% - 4px)',
                left: currentHighlight === 'upload' ? '4px' : 'calc(50%)'
              }}
            />
            <button
              onClick={() => setActiveTab("upload")}
              onMouseEnter={() => setHoverTab("upload")}
              className={`relative z-10 px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors w-32 ${activeTab === 'upload' ? 'text-[#0f172a]' : 'text-[#64748b]'}`}
            >
              Upload Video
            </button>
            <button
              onClick={() => setActiveTab("live")}
              onMouseEnter={() => setHoverTab("live")}
              className={`relative z-10 px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors w-32 ${activeTab === 'live' ? 'text-[#0f172a]' : 'text-[#64748b]'}`}
            >
              Live Session
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm lg:text-base text-[#475569] leading-relaxed max-w-full mb-3">
          {exercise.description}
        </p>

        {/* Joint Pills automatically flowing under description with a masonry-like spacing */}
        {/* We use space-evenly mapping via margin offset to give a zigzag text effect when they wrap */}
        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-3 items-center justify-start max-w-full mt-1">
          <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest mr-2">
            Target Joints:
          </span>
          {exercise.targetJoints.map((joint: string, idx: number) => (
            <span
              key={joint}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#e2e8f0] text-[#0f172a] rounded-full shadow-sm ${idx % 2 !== 0 ? 'ml-2' : ''}`}
            >
              {joint.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {/* Target Muscles Pills directly beneath */}
        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-6 items-center justify-start max-w-full">
          <span className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-widest mr-2">
            Target Muscles:
          </span>
          {exercise.targetMuscles.map((muscle: string, idx: number) => (
            <span
              key={muscle}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#e2e8f0] text-[#0f172a] rounded-full shadow-sm ${idx % 2 !== 0 ? 'ml-2' : ''}`}
            >
              {muscle}
            </span>
          ))}
        </div>

        {/* Media Window - Automatically stretches to full width to exactly match Description margins */}
        <div className="w-full">
          {activeTab === "upload" ? <VideoUploader /> : <LiveSession exerciseName={exercise.displayName} />}
        </div>
      </div>
    </>
  );
}
