"use client";

import Link from "next/link";
import type { Exercise } from "@/lib/types";

interface ExerciseCardProps {
  exercise: Exercise;
  index?: number;
}

export default function ExerciseCard({ exercise, index = 0 }: ExerciseCardProps) {
  return (
    <Link
      href={`/catalog/${exercise.slug}`}
      className={`pke-card pke-card-interactive block p-5 animate-fade-in stagger-${index + 1}`}
      id={`exercise-card-${exercise.slug}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{
            background: `${exercise.color}18`,
            boxShadow: `0 0 20px ${exercise.color}15`,
          }}
        >
          {exercise.icon}
        </div>
        <span
          className={`pke-badge ${
            exercise.difficulty === "Beginner"
              ? "pke-badge-success"
              : exercise.difficulty === "Intermediate"
              ? "pke-badge-warning"
              : "pke-badge-danger"
          }`}
        >
          {exercise.difficulty}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-[var(--pke-text-primary)] mb-1.5">
        {exercise.displayName}
      </h3>
      <p className="text-sm text-[var(--pke-text-secondary)] leading-relaxed line-clamp-2 mb-4">
        {exercise.description}
      </p>

      {/* Target Joints */}
      <div className="flex flex-wrap gap-1.5">
        {exercise.targetJoints.slice(0, 3).map((joint) => (
          <span
            key={joint}
            className="text-[11px] px-2 py-1 rounded-md bg-[var(--pke-bg-surface)] text-[var(--pke-text-muted)] border border-[var(--pke-border)]"
          >
            {joint.replace(/_/g, " ")}
          </span>
        ))}
        {exercise.targetJoints.length > 3 && (
          <span className="text-[11px] px-2 py-1 rounded-md text-[var(--pke-text-muted)]">
            +{exercise.targetJoints.length - 3} more
          </span>
        )}
      </div>

      {/* Hover Arrow */}
      <div className="mt-4 flex items-center gap-1 text-xs text-[var(--pke-accent)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        View details →
      </div>
    </Link>
  );
}
