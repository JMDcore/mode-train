const weekdayMap = {
  monday: { shortLabel: "Lun", fullLabel: "Lunes", order: 0 },
  tuesday: { shortLabel: "Mar", fullLabel: "Martes", order: 1 },
  wednesday: { shortLabel: "Mie", fullLabel: "Miercoles", order: 2 },
  thursday: { shortLabel: "Jue", fullLabel: "Jueves", order: 3 },
  friday: { shortLabel: "Vie", fullLabel: "Viernes", order: 4 },
  saturday: { shortLabel: "Sab", fullLabel: "Sabado", order: 5 },
  sunday: { shortLabel: "Dom", fullLabel: "Domingo", order: 6 },
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
