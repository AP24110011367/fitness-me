export type WaterEntry = {
  date: string;
  ml: number;
  targetMl: number;
  drinks: number;
};

const KEY = "fitness_water_history";

const today = () => new Date().toISOString().split("T")[0];

function loadAll(): WaterEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(entries: WaterEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function getWaterTargetMl(profile: any): number {
  const weight = Number(profile?.currentWeight);

  if (!weight || weight <= 0) return 2000;

  const target = Math.round((weight * 30) / 50) * 50;

  return Math.min(3500, Math.max(1500, target));
}

export function loadTodayWater(): number {
  const entry = loadAll().find((item) => item.date === today());
  return entry?.ml ?? 0;
}

export function loadWaterHistory(): WaterEntry[] {
  return loadAll().sort((a, b) => b.date.localeCompare(a.date));
}

export function addWater(ml: number, targetMl: number) {
  const date = today();
  const entries = loadAll();
  const existing = entries.find((e) => e.date === date);

  if (existing) {
    existing.ml += ml;
    existing.targetMl = targetMl;
    existing.drinks += 1;
  } else {
    entries.unshift({
      date,
      ml,
      targetMl,
      drinks: 1,
    });
  }

  saveAll(entries);
  return loadTodayWater();
}

export function setTodayWater(ml: number, targetMl: number) {
  const date = today();
  const entries = loadAll();
  const existing = entries.find((e) => e.date === date);

  if (existing) {
    existing.ml = Math.max(0, ml);
    existing.targetMl = targetMl;
  } else {
    entries.unshift({
      date,
      ml: Math.max(0, ml),
      targetMl,
      drinks: 0,
    });
  }

  saveAll(entries);
}

export function loadTodayWaterEntry(): WaterEntry {
  const targetMl = getWaterTargetMl(
    (() => {
      try {
        return JSON.parse(localStorage.getItem("fitness_app_profile") || "{}");
      } catch {
        return {};
      }
    })()
  );

  const existing = loadAll().find((e) => e.date === today());

  return (
    existing ?? {
      date: today(),
      ml: 0,
      targetMl,
      drinks: 0,
    }
  );
}

export function mlToLiters(ml: number): number {
  return ml / 1000;
}