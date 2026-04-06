import ExerciseCard from "@/components/ExerciseCard";
import { EXERCISES } from "@/lib/exercises";

export const metadata = {
  title: "Exercise Catalog — PKE",
  description:
    "Browse all supported exercises for calibration and evaluation in the Personalized Kinematic Evaluator.",
};

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pke-text-primary)] tracking-tight">
          Exercise Catalog
        </h1>
        <p className="text-sm text-[var(--pke-text-secondary)] mt-1">
          {EXERCISES.length} exercises available for calibration and evaluation
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXERCISES.map((exercise, i) => (
          <ExerciseCard key={exercise.slug} exercise={exercise} index={i} />
        ))}
      </div>
    </div>
  );
}
