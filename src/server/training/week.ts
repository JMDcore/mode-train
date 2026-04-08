const weekdayMap = {
  monday: { shortLabel: "Mon", fullLabel: "Monday", order: 0 },
  tuesday: { shortLabel: "Tue", fullLabel: "Tuesday", order: 1 },
  wednesday: { shortLabel: "Wed", fullLabel: "Wednesday", order: 2 },
  thursday: { shortLabel: "Thu", fullLabel: "Thursday", order: 3 },
  friday: { shortLabel: "Fri", fullLabel: "Friday", order: 4 },
  saturday: { shortLabel: "Sat", fullLabel: "Saturday", order: 5 },
  sunday: { shortLabel: "Sun", fullLabel: "Sunday", order: 6 },
} as const;

export type WeekdayKey = keyof typeof weekdayMap;

export function getWeekdayShortLabel(dayKey: string) {
  return weekdayMap[dayKey as WeekdayKey]?.shortLabel ?? dayKey;
}

export function compareWeekdayOrder(left: string, right: string) {
  const leftOrder = weekdayMap[left as WeekdayKey]?.order ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = weekdayMap[right as WeekdayKey]?.order ?? Number.MAX_SAFE_INTEGER;

  return leftOrder - rightOrder;
}
