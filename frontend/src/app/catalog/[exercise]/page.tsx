import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseBySlug, EXERCISES } from "@/lib/exercises";
import ExerciseClient from "./ExerciseClient";

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
    <div className="space-y-12 py-8 animate-fade-in w-full flex flex-col items-center">
      <nav className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
        <Link href="/catalog" className="hover:text-[#0f172a] transition-colors">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-[#0f172a]">
          {exercise.displayName}
        </span>
      </nav>

      <ExerciseClient exercise={exercise} />
    </div>
  );
}
