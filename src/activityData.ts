/* ---------------------------------------------------
   Walking tracker — step targets, daily steps, and
   history. All localStorage, no health APIs.
--------------------------------------------------- */

export type FitnessLevel = "Starting" | "Beginner" | "Medium" | "High";

export type StepDay = {
  date: string; // YYYY-MM-DD
  steps: number;
  target: number;
};

/* ---------------------------------------------------
   localStorage keys
--------------------------------------------------- */
const TODAY_KEY = "fitness_app_steps_today";
const HISTORY_KEY = "fitness_app_steps_history";

/* ---------------------------------------------------
   Step target calculation — based on fitness level
   and average daily steps from profile. Starting users
   begin with a reasonable target and increase gradually.
--------------------------------------------------- */
export function getStepTarget(
  level: FitnessLevel,
  avgSteps: number,
  history: StepDay[] = [],
): number {
  const avg = Number(avgSteps) || 0;

  // Base targets per fitness level
  const baseTargets: Record<FitnessLevel, number> = {
    Starting: 3000,
    Beginner: 5000,
    Medium: 7000,
    High: 10000,
  };

  let target = baseTargets[level] || baseTargets.Starting;

  // If user has an average step count, use it as a floor
  // but don't set the target too far above current activity
  if (avg > 0) {
    if (level === "Starting") {
      // Start close to current activity, just a small step up
      target = Math.max(2000, Math.round((avg + 500) / 100) * 100);
    } else if (level === "Beginner") {
      target = Math.max(4000, Math.round((avg + 1000) / 100) * 100);
    } else if (level === "Medium") {
      target = Math.max(6000, Math.round((avg + 1000) / 100) * 100);
    } else {
      target = Math.max(8000, Math.round((avg + 1500) / 100) * 100);
    }
  }

  // Gradual increase: if user has been hitting targets, nudge up
  const recentCompleted = history.slice(0, 3).filter((d) => d.steps >= d.target).length;
  if (recentCompleted >= 3) {
    target = Math.round((target + 500) / 100) * 100;
  }

  return target;
}

/* ---------------------------------------------------
   Date helpers
--------------------------------------------------- */
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ---------------------------------------------------
   Today's steps — storage
--------------------------------------------------- */
export function loadTodaySteps(): number {
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayISO()) {
      // New day — archive yesterday's data to history
      archiveIfNeeded(parsed);
      return 0;
    }
    return Number(parsed.steps) || 0;
  } catch {
    return 0;
  }
}

function archiveIfNeeded(yesterdayData: { date: string; steps: number; target: number }) {
  if (!yesterdayData || !yesterdayData.date) return;
  if (yesterdayData.date === todayISO()) return;
  const history = loadStepHistory();
  // Don't duplicate
  if (history.some((d) => d.date === yesterdayData.date)) return;
  const entry: StepDay = {
    date: yesterdayData.date,
    steps: yesterdayData.steps,
    target: yesterdayData.target,
  };
  const updated = [entry, ...history].slice(0, 90); // keep 90 days
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function saveTodaySteps(steps: number, target: number) {
  try {
    localStorage.setItem(
      TODAY_KEY,
      JSON.stringify({ date: todayISO(), steps, target }),
    );
  } catch {
    // ignore
  }
}

export function addSteps(amount: number, target: number): number {
  const current = loadTodaySteps();
  const updated = Math.max(0, current + amount);
  saveTodaySteps(updated, target);
  return updated;
}

export function setSteps(total: number, target: number): number {
  const updated = Math.max(0, Math.round(total));
  saveTodaySteps(updated, target);
  return updated;
}

/* ---------------------------------------------------
   Step history — past days
--------------------------------------------------- */
export function loadStepHistory(): StepDay[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStepHistory(history: StepDay[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

/* ---------------------------------------------------
   Encouraging message when target not completed
--------------------------------------------------- */
export function getEncouragement(
  steps: number,
  target: number,
  level: FitnessLevel,
): string {
  if (target <= 0) return "Set up your profile to get a step target.";
  if (steps >= target) return "Target complete! Great work getting those steps in.";

  const pct = Math.round((steps / target) * 100);
  const remaining = target - steps;

  if (level === "Starting") {
    if (pct < 25) return `Just getting started — every step counts. ${remaining.toLocaleString()} to go, no rush.`;
    if (pct < 50) return `Nice progress! ${remaining.toLocaleString()} more steps. A short walk will get you there.`;
    if (pct < 75) return `Over halfway — ${remaining.toLocaleString()} steps left. You're doing great.`;
    return `Almost there! Just ${remaining.toLocaleString()} steps to hit your target.`;
  }

  if (pct < 25) return `Keep moving — ${remaining.toLocaleString()} steps to go. A 10-minute walk helps.`;
  if (pct < 50) return `Good start! ${remaining.toLocaleString()} more to reach your target.`;
  if (pct < 75) return `More than halfway — ${remaining.toLocaleString()} steps remaining. Keep going.`;
  return `So close! ${remaining.toLocaleString()} steps to go — a quick walk will do it.`;
}

/* ---------------------------------------------------
   Weekly summary from history
--------------------------------------------------- */
export type WeekSummary = {
  totalSteps: number;
  avgSteps: number;
  daysTracked: number;
  daysCompleted: number;
};

export function getWeekSummary(history: StepDay[]): WeekSummary {
  const last7 = history.slice(0, 7);
  const totalSteps = last7.reduce((s, d) => s + d.steps, 0);
  const daysTracked = last7.length;
  const avgSteps = daysTracked > 0 ? Math.round(totalSteps / daysTracked) : 0;
  const daysCompleted = last7.filter((d) => d.target > 0 && d.steps >= d.target).length;

  return { totalSteps, avgSteps, daysTracked, daysCompleted };
}

export { formatDate, todayISO };
