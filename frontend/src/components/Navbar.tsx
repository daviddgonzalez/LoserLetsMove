"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { EXERCISES } from "@/lib/exercises";

export default function Navbar() {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 w-full z-50 bg-white border-b border-[#e2e8f0] h-16 flex items-center px-6 lg:px-12 flex-shrink-0">
      <Link href="/" className="flex items-center mr-10">
        <span className="text-xl font-bold text-[#0f172a] tracking-tight">
          MyPose
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold uppercase tracking-wider">
        <Link href="/" className="shimmer-nav px-3 py-2 text-[#475569] hover:text-[#0f172a] transition-colors">
          Home
        </Link>
        
        <div className="relative" ref={catalogRef}>
          <button 
            onClick={() => setCatalogOpen(!catalogOpen)}
            className="shimmer-nav px-3 py-2 text-[#475569] hover:text-[#0f172a] transition-colors flex items-center gap-1 cursor-pointer uppercase font-semibold tracking-wider"
          >
            Catalog
            <svg className={`w-4 h-4 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {catalogOpen && (
            <div className="absolute top-full left-0 mt-0 w-64 bg-white border border-[#e2e8f0] shadow-md py-2 flex flex-col z-50">
              {EXERCISES.map(ex => (
                <Link
                  key={ex.slug}
                  href={`/catalog/${ex.slug}`}
                  onClick={() => setCatalogOpen(false)}
                  className="px-5 py-3 hover:bg-[#f8fafc] text-[#0f172a] text-sm font-semibold transition-colors text-left border-b border-[#f1f5f9] last:border-0"
                >
                  {ex.displayName}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/build-progress" className="shimmer-nav px-3 py-2 text-[#475569] hover:text-[#0f172a] transition-colors">
          Build Progress
        </Link>
      </nav>
      
      <div className="ml-auto hidden md:flex items-center gap-2 text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest" suppressHydrationWarning>
        <span className="w-1.5 h-1.5 bg-[#10b981]" />
        API: {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^https?:\/\//, '')}
      </div>
    </header>
  );
}
