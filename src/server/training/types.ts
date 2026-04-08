export type TrainingActionState = {
  error: string | null;
  success: string | null;
};

export type RoutineActionState = TrainingActionState & {
  nextPath: string | null;
  routineId: string | null;
};
export type StarterPlanActionState = TrainingActionState;
export type WorkoutLaunchActionState = TrainingActionState & {
  nextPath: string | null;
  resumed: boolean;
  routineId: string | null;
  sessionId: string | null;
};
export type WorkoutExerciseBlockActionState = TrainingActionState;
export type WorkoutCompleteActionState = TrainingActionState & {
  nextPath: string | null;
};
export type RunLogActionState = TrainingActionState;
export type RoutineItemActionState = TrainingActionState;
export type ScheduleActionState = TrainingActionState;
export type ExerciseActionState = TrainingActionState;
