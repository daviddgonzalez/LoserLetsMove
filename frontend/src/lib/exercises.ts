import { Exercise } from "./types";

/**
 * Static exercise catalog — matches backend DB seed.
 * Each exercise has metadata for display in the frontend catalog.
 */
export const EXERCISES: Exercise[] = [
  {
    slug: "squat",
    displayName: "Squat",
    description:
      "A fundamental lower-body compound movement targeting quads, glutes, and hamstrings. Keep your chest up, push knees outward, and maintain a neutral spine throughout the movement.",
    targetJoints: [
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
    ],
    difficulty: "Beginner",
    icon: "🏋️",
    color: "#6366f1",
  },
  {
    slug: "deadlift",
    displayName: "Deadlift",
    description:
      "Full-body posterior chain movement engaging the back, glutes, and hamstrings. Hinge at the hips, keep the bar close to your body, and lock out with a straight spine.",
    targetJoints: [
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_shoulder",
      "right_shoulder",
    ],
    difficulty: "Intermediate",
    icon: "💪",
    color: "#8b5cf6",
  },
  {
    slug: "barbell_biceps_curl",
    displayName: "Barbell Biceps Curl",
    description:
      "Isolation exercise for the biceps. Keep elbows pinned to your sides, curl the bar with a controlled tempo, and avoid using momentum from your hips.",
    targetJoints: [
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
      "left_shoulder",
      "right_shoulder",
    ],
    difficulty: "Beginner",
    icon: "💪",
    color: "#ec4899",
  },
  {
    slug: "overhead_press",
    displayName: "Overhead Press",
    description:
      "Shoulder compound movement pressing the bar overhead. Brace your core, press in a straight line, and fully lock out at the top while keeping your ribcage down.",
    targetJoints: [
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
    ],
    difficulty: "Intermediate",
    icon: "🙌",
    color: "#f59e0b",
  },
  {
    slug: "lunge",
    displayName: "Lunge",
    description:
      "Unilateral lower-body exercise improving balance and leg strength. Step forward with control, keep your front knee tracking over your toes, and lower until both knees hit 90°.",
    targetJoints: [
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
    ],
    difficulty: "Beginner",
    icon: "🦵",
    color: "#10b981",
  },
  {
    slug: "push_up",
    displayName: "Push-Up",
    description:
      "Bodyweight upper-body exercise targeting chest, shoulders, and triceps. Maintain a rigid plank position, lower your chest to the ground, and push back up with full arm extension.",
    targetJoints: [
      "left_shoulder",
      "right_shoulder",
      "left_elbow",
      "right_elbow",
      "left_wrist",
      "right_wrist",
    ],
    difficulty: "Beginner",
    icon: "🫸",
    color: "#ef4444",
  },
  {
    slug: "plank",
    displayName: "Plank",
    description:
      "Isometric core stabilization exercise. Hold a rigid straight line from head to heels, engage your core, and avoid letting your hips sag or pike upward.",
    targetJoints: [
      "left_shoulder",
      "right_shoulder",
      "left_hip",
      "right_hip",
      "left_ankle",
      "right_ankle",
    ],
    difficulty: "Beginner",
    icon: "🧘",
    color: "#14b8a6",
  },
];

/**
 * Look up an exercise by slug. Returns undefined if not found.
 */
export function getExerciseBySlug(slug: string): Exercise | undefined {
  return EXERCISES.find((e) => e.slug === slug);
}
