import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseBySlug, EXERCISES } from "@/lib/exercises";

interface ExerciseDetailPageProps {
  params: Promise<{ exercise: string }>;
}

export async function generateStaticParams() {
  return EXERCISES.map((ex) => ({ exercise: ex.slug }));
}

export async function generateMetadata({ params }: ExerciseDetailPageProps) {
  const { exercise: slug } = await params;
  const exercise = getExerciseBySlug(slug);
  if (!exercise) return { title: "Not Found — PKE" };
  return {
    title: `${exercise.displayName} — PKE`,
    description: exercise.description,
  };
}

export default async function ExerciseDetailPage({
  params,
}: ExerciseDetailPageProps) {
  const { exercise: slug } = await params;
  const exercise = getExerciseBySlug(slug);
  if (!exercise) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--pke-text-muted)]">
        <Link
          href="/catalog"
          className="hover:text-[var(--pke-text-primary)] transition-colors"
        >
          Catalog
        </Link>
        <span>/</span>
        <span className="text-[var(--pke-text-primary)]">
          {exercise.displayName}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
          style={{
            background: `${exercise.color}18`,
            boxShadow: `0 0 30px ${exercise.color}15`,
          }}
        >
          {exercise.icon}
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[var(--pke-text-primary)] tracking-tight">
              {exercise.displayName}
            </h1>
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
          <p className="text-sm text-[var(--pke-text-secondary)] leading-relaxed max-w-2xl">
            {exercise.description}
          </p>
        </div>
      </div>

      {/* Target Joints */}
      <div className="pke-card p-5">
        <h2 className="text-sm font-semibold text-[var(--pke-text-primary)] mb-3">
          Target Joints
        </h2>
        <div className="flex flex-wrap gap-2">
          {exercise.targetJoints.map((joint) => (
            <span
              key={joint}
              className="px-3 py-1.5 rounded-lg text-sm bg-[var(--pke-bg-surface)] border border-[var(--pke-border)] text-[var(--pke-text-secondary)]"
            >
              {joint.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pke-card p-5">
        <h2 className="text-sm font-semibold text-[var(--pke-text-primary)] mb-4">
          Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href={`/calibrate?exercise=${exercise.slug}`}
            className="pke-btn pke-btn-primary justify-center py-4"
          >
            <span>🎯</span>
            <span>Calibrate</span>
          </Link>
          <Link
            href="/upload"
            className="pke-btn pke-btn-secondary justify-center py-4"
          >
            <span>📤</span>
            <span>Upload Video</span>
          </Link>
          <Link
            href={`/live?exercise=${exercise.slug}`}
            className="pke-btn pke-btn-secondary justify-center py-4"
          >
            <span>🎥</span>
            <span>Live Session</span>
          </Link>
        </div>
      </div>

      {/* How it works for this exercise */}
      <div className="pke-card p-5">
        <h2 className="text-sm font-semibold text-[var(--pke-text-primary)] mb-3">
          Evaluation Process
        </h2>
        <ol className="space-y-3">
          {[
            {
              title: "Calibrate",
              desc: `Record 3–5 sequences of your ${exercise.displayName.toLowerCase()} with correct form`,
            },
            {
              title: "Create Baseline",
              desc: "The ST-GCN model learns your personal biomechanical profile",
            },
            {
              title: "Evaluate",
              desc: `Perform the ${exercise.displayName.toLowerCase()} and get real-time feedback on joint angles`,
            },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--pke-accent)]/20 text-[var(--pke-accent)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--pke-text-primary)]">
                  {item.title}
                </p>
                <p className="text-xs text-[var(--pke-text-muted)]">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
