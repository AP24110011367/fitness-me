/* ---------------------------------------------------
   Progress — weight history and cross-feature
   consistency stats. Reads existing history from
   activityData/waterData/sleepData/workoutData; only
   owns weight storage itself. All localStorage.
--------------------------------------------------- */

export type WeightEntry = {
  date: string; // YYYY-MM-DD
  weight: number;
};

const WEIGHT_HISTORY_KEY = "fitness_app_weight_history";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function loadWeightHistory(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(WEIGHT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // newest first, consistent with the other trackers' history ordering
    return Array.isArray(parsed) ? parsed.sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
  } catch {
    return [];
  }
}

export function saveWeightHistory(history: WeightEntry[]) {
  try {
    localStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

// Logs today's weight. One entry per calendar day — logging again
// today updates today's entry rather than creating a duplicate.
export function logWeight(weight: number): WeightEntry[] {
  const history = loadWeightHistory();
  const today = todayISO();
  const filtered = history.filter((e) => e.date !== today);
  const updated = [{ date: today, weight }, ...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));
  saveWeightHistory(updated);
  return updated;
}

// Starting weight = earliest logged entry, or the profile's
// current weight if nothing has been logged yet.
export function getStartingWeight(history: WeightEntry[], profileCurrentWeight: string | number): number | null {
  if (history.length > 0) {
    const earliest = history[history.length - 1];
    return earliest.weight;
  }
  const w = Number(profileCurrentWeight);
  return w > 0 ? w : null;
}

// Current weight = most recent logged entry, or the profile's
// current weight if nothing has been logged yet.
export function getCurrentWeight(history: WeightEntry[], profileCurrentWeight: string | number): number | null {
  if (history.length > 0) {
    return history[0].weight;
  }
  const w = Number(profileCurrentWeight);
  return w > 0 ? w : null;
}

export type ConsistencyStat = { completed: number; total: number; percent: number };

// Given the calendar dates (YYYY-MM-DD) on which a target was met,
// returns how many of the last `windowDays` calendar days hit it.
export function consistencyFromDates(dates: string[], windowDays = 7): ConsistencyStat {
  const daySet = new Set(dates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let completed = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    if (daySet.has(iso)) completed++;
  }
  return { completed, total: windowDays, percent: Math.round((completed / windowDays) * 100) };
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export { todayISO };
