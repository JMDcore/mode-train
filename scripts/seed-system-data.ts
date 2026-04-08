import { isNull } from "drizzle-orm";

import { getDbPool } from "../src/server/db/client";
import { getDb } from "../src/server/db";
import { exerciseCategories, exercises } from "../src/server/db/schema";

const categorySeed = [
  { slug: "upper-body", name: "Upper Body" },
  { slug: "lower-body", name: "Lower Body" },
  { slug: "running", name: "Running" },
];

const exerciseSeed = [
  {
    name: "Bench Press",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Chest",
    equipment: "Barbell",
    tags: ["push", "compound"],
  },
  {
    name: "Incline Dumbbell Press",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Chest",
    equipment: "Dumbbells",
    tags: ["push", "upper-chest"],
  },
  {
    name: "Chest-Supported Row",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Back",
    equipment: "Machine",
    tags: ["pull", "back"],
  },
  {
    name: "Pull-Up",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Back",
    equipment: "Bodyweight",
    tags: ["pull", "bodyweight"],
  },
  {
    name: "Overhead Press",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Shoulders",
    equipment: "Barbell",
    tags: ["push", "shoulders"],
  },
  {
    name: "Lat Pulldown",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Back",
    equipment: "Machine",
    tags: ["pull", "lats"],
  },
  {
    name: "Seated Cable Row",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Back",
    equipment: "Cable",
    tags: ["pull", "mid-back"],
  },
  {
    name: "Lateral Raise",
    categorySlug: "upper-body",
    primaryMuscleGroup: "Shoulders",
    equipment: "Dumbbells",
    tags: ["delts", "isolation"],
  },
  {
    name: "Back Squat",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Legs",
    equipment: "Barbell",
    tags: ["legs", "compound"],
  },
  {
    name: "Romanian Deadlift",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Hamstrings",
    equipment: "Barbell",
    tags: ["posterior-chain", "hinge"],
  },
  {
    name: "Walking Lunges",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Legs",
    equipment: "Dumbbells",
    tags: ["legs", "unilateral"],
  },
  {
    name: "Leg Press",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Legs",
    equipment: "Machine",
    tags: ["legs", "machine"],
  },
  {
    name: "Hip Thrust",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Glutes",
    equipment: "Barbell",
    tags: ["glutes", "posterior-chain"],
  },
  {
    name: "Bulgarian Split Squat",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Legs",
    equipment: "Dumbbells",
    tags: ["legs", "unilateral"],
  },
  {
    name: "Leg Curl",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Hamstrings",
    equipment: "Machine",
    tags: ["hamstrings", "isolation"],
  },
  {
    name: "Plank",
    categorySlug: "lower-body",
    primaryMuscleGroup: "Core",
    equipment: "Bodyweight",
    tags: ["core", "stability"],
  },
  {
    name: "Easy Run",
    categorySlug: "running",
    primaryMuscleGroup: "Cardio",
    equipment: "Shoes",
    tags: ["easy", "running"],
  },
  {
    name: "Tempo Run",
    categorySlug: "running",
    primaryMuscleGroup: "Cardio",
    equipment: "Shoes",
    tags: ["tempo", "running"],
  },
  {
    name: "Long Run",
    categorySlug: "running",
    primaryMuscleGroup: "Cardio",
    equipment: "Shoes",
    tags: ["long", "running"],
  },
];

async function main() {
  const db = getDb();

  const existingCategories = await db
    .select({
      id: exerciseCategories.id,
      slug: exerciseCategories.slug,
    })
    .from(exerciseCategories)
    .where(isNull(exerciseCategories.ownerUserId));

  const categoryBySlug = new Map(
    existingCategories.map((category) => [category.slug, category.id]),
  );

  for (const category of categorySeed) {
    if (categoryBySlug.has(category.slug)) {
      continue;
    }

    const [insertedCategory] = await db
      .insert(exerciseCategories)
      .values({
        slug: category.slug,
        name: category.name,
        isSystem: true,
      })
      .returning({
        id: exerciseCategories.id,
        slug: exerciseCategories.slug,
      });

    categoryBySlug.set(insertedCategory.slug, insertedCategory.id);
  }

  const existingExercises = await db
    .select({
      name: exercises.name,
    })
    .from(exercises)
    .where(isNull(exercises.ownerUserId));

  const exerciseNames = new Set(existingExercises.map((exercise) => exercise.name));

  let insertedCount = 0;

  for (const exercise of exerciseSeed) {
    if (exerciseNames.has(exercise.name)) {
      continue;
    }

    const categoryId = categoryBySlug.get(exercise.categorySlug);

    if (!categoryId) {
      throw new Error(`Categoria no encontrada para ${exercise.name}.`);
    }

    await db.insert(exercises).values({
      categoryId,
      name: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      equipment: exercise.equipment,
      tags: exercise.tags,
      isSystem: true,
    });

    insertedCount += 1;
  }

  await getDbPool().end();

  console.log("Seed ok:", {
    categories: categoryBySlug.size,
    insertedExercises: insertedCount,
  });
}

main().catch((error) => {
  console.error(error);
  void getDbPool().end().catch(() => undefined);
  process.exit(1);
});
