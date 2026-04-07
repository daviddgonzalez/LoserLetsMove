"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/catalog", label: "Catalog", icon: "📋" },
  { href: "/upload", label: "Upload", icon: "📤" },
  { href: "/live", label: "Live Session", icon: "🎥" },
  { href: "/calibrate", label: "Calibrate", icon: "🎯" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 pke-glass md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Loser, Lets Move
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="pke-btn-ghost p-2 text-xl"
          aria-label="Toggle menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          bg-[var(--pke-bg-secondary)] border-r border-[var(--pke-border)]
          transition-transform duration-300 ease-in-out
          w-[var(--pke-sidebar-width)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:sticky md:z-auto md:h-screen md:shrink-0
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-[var(--pke-border)]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
            L
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--pke-text-primary)] tracking-tight">
              Loser, Lets Move
            </h1>
            <p className="text-[10px] text-[var(--pke-text-muted)] leading-none">
              Kinematic Evaluator
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${
                    isActive
                      ? "bg-[var(--pke-accent-glow)] text-[var(--pke-accent-hover)] border border-[var(--pke-accent)]/20"
                      : "text-[var(--pke-text-secondary)] hover:text-[var(--pke-text-primary)] hover:bg-[var(--pke-bg-card)]"
                  }
                `}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--pke-accent)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--pke-border)]">
          <div className="flex items-center gap-2 text-[11px] text-[var(--pke-text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--pke-success)]" />
            Backend: {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^https?:\/\//, '')}
          </div>
        </div>
      </aside>
    </>
  );
}
