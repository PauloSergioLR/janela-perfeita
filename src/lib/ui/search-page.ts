import type { ActivityId, City } from "@/types";

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_DATE_RANGE_DAYS = 6;

export interface SearchDateOption {
  value: string;
  label: string;
}

export interface SearchSubmitState {
  city: City | null;
  activityId: ActivityId | "";
  date: string;
}

function formatDateInputValue(date: Date): string {
  const localDate = new Date(date);

  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());

  return localDate.toISOString().slice(0, 10);
}

export function buildSearchDateOptions(
  baseDate = new Date(),
): SearchDateOption[] {
  return Array.from({ length: SEARCH_DATE_RANGE_DAYS + 1 }, (_, offset) => {
    const date = new Date(baseDate);

    date.setDate(baseDate.getDate() + offset);

    return {
      value: formatDateInputValue(date),
      label:
        offset === 0
          ? "Hoje"
          : new Intl.DateTimeFormat("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            }).format(date),
    };
  });
}

export function formatCityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

export function canSubmitSearch({
  city,
  activityId,
  date,
}: SearchSubmitState): boolean {
  return city !== null && activityId !== "" && date.trim().length > 0;
}

