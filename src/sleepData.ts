export type SleepEntry = {
  date: string;
  bedtime: string;
  wakeTime: string;
  hours: number;
  targetHours: number;
};

const KEY = "fitness_sleep_history";

const today = () => new Date().toISOString().split("T")[0];

function loadAll(): SleepEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(entries: SleepEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function calculateSleepHours(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;

  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);

  let start = bh * 60 + bm;
  let end = wh * 60 + wm;

  if (end <= start) {
    end += 24 * 60;
  }

  return Math.round(((end - start) / 60) * 10) / 10;
}

export function saveSleep(
  bedtime: string,
  wakeTime: string,
  targetHours = 8
) {
  const date = today();
  const entries = loadAll();

  const entry: SleepEntry = {
    date,
    bedtime,
    wakeTime,
    hours: calculateSleepHours(bedtime, wakeTime),
    targetHours,
  };

  const index = entries.findIndex((e) => e.date === date);

  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.unshift(entry);
  }

  saveAll(entries);
  return entry;
}

export function loadSleepHistory(): SleepEntry[] {
  return loadAll().sort((a, b) => b.date.localeCompare(a.date));
}

export function loadLastSleep(): SleepEntry | null {
  const entries = loadSleepHistory();
  return entries[0] ?? null;
}