export type TrainingFocusKey =
  | "general"
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "running";

export type TrainingFocusMeta = {
  key: TrainingFocusKey;
  label: string;
};

export const trainingFocusOptions: TrainingFocusMeta[] = [
  { key: "general", label: "General" },
  { key: "chest", label: "Pecho" },
  { key: "back", label: "Espalda" },
  { key: "shoulders", label: "Hombros" },
  { key: "arms", label: "Brazos" },
  { key: "legs", label: "Piernas" },
  { key: "running", label: "Running" },
];

type FocusRule = {
  key: TrainingFocusKey;
  label: string;
  nameKeywords: string[];
  groupKeywords: string[];
};

const focusRules: FocusRule[] = [
  {
    key: "running",
    label: "Running",
    nameKeywords: [
      "run",
      "running",
      "correr",
      "carrera",
      "rodaje",
      "tempo",
      "interval",
      "tirada",
      "cardio",
    ],
    groupKeywords: ["cardio", "running"],
  },
  {
    key: "chest",
    label: "Pecho",
    nameKeywords: ["pecho", "chest", "push", "empuje", "press", "bench"],
    groupKeywords: ["pecho", "chest", "pectoral"],
  },
  {
    key: "back",
    label: "Espalda",
    nameKeywords: ["espalda", "back", "pull", "tiron", "remo", "row", "lat", "dorsal"],
    groupKeywords: ["espalda", "back", "lat", "dorsal", "trap"],
  },
  {
    key: "shoulders",
    label: "Hombros",
    nameKeywords: ["hombro", "hombros", "shoulder", "delts", "deltoid"],
    groupKeywords: ["hombro", "shoulder", "deltoid", "delts"],
  },
  {
    key: "arms",
    label: "Brazos",
    nameKeywords: ["brazo", "brazos", "arm", "arms", "biceps", "triceps", "curl"],
    groupKeywords: ["brazo", "biceps", "triceps", "forearm", "antebrazo"],
  },
  {
    key: "legs",
    label: "Piernas",
    nameKeywords: [
      "pierna",
      "piernas",
      "leg",
      "legs",
      "squat",
      "quad",
      "quads",
      "glute",
      "hamstring",
      "femoral",
      "isquio",
      "gemelo",
      "lower",
    ],
    groupKeywords: [
      "pierna",
      "leg",
      "quad",
      "quads",
      "glute",
      "gluteo",
      "hamstring",
      "isquio",
      "calf",
      "gemelo",
      "femoral",
    ],
  },
  {
    key: "general",
    label: "General",
    nameKeywords: ["general", "full", "full body", "total", "torso", "upper"],
    groupKeywords: ["general", "core", "abs", "full"],
  },
];

export function getTrainingFocusMeta(key: TrainingFocusKey): TrainingFocusMeta {
  return trainingFocusOptions.find((option) => option.key === key) ?? trainingFocusOptions[0]!;
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function includesKeyword(haystack: string, keyword: string) {
  const normalizedKeyword = normalize(keyword);
  return haystack.includes(normalizedKeyword);
}

function scoreName(rule: FocusRule, normalizedName: string) {
  return rule.nameKeywords.reduce((score, keyword) => {
    return includesKeyword(normalizedName, keyword) ? score + 4 : score;
  }, 0);
}

function scoreMuscleGroups(rule: FocusRule, normalizedGroups: string[]) {
  return normalizedGroups.reduce((score, group) => {
    const matched = rule.groupKeywords.some(
      (keyword) => group.includes(normalize(keyword)) || normalize(keyword).includes(group),
    );

    return matched ? score + 2 : score;
  }, 0);
}

export function resolveTrainingFocus(params: {
  name?: string | null;
  muscleGroups?: Array<string | null | undefined>;
}): TrainingFocusMeta {
  const normalizedName = normalize(params.name ?? "");
  const normalizedGroups = (params.muscleGroups ?? [])
    .map((value) => normalize(value ?? ""))
    .filter(Boolean);

  const scored = focusRules
    .map((rule) => ({
      key: rule.key,
      label: rule.label,
      score: scoreName(rule, normalizedName) + scoreMuscleGroups(rule, normalizedGroups),
    }))
    .sort((left, right) => right.score - left.score);

  const winner = scored[0];

  if (winner && winner.score > 0) {
    return {
      key: winner.key,
      label: winner.label,
    };
  }

  return {
    key: "general",
    label: "General",
  };
}
