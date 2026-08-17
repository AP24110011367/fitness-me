import React, { useState } from "react";
import {
  Scale,
  ArrowLeft,
  Check,
  Pencil,
  X,
  Dumbbell,
  Footprints,
  Droplet,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  type WeightEntry,
  loadWeightHistory,
  logWeight,
  getStartingWeight,
  getCurrentWeight,
  consistencyFromDates,
  formatDate,
} from "@/progressData";
import { loadHistory as loadWorkoutHistory, type WorkoutHistoryEntry } from "@/workoutData";
import { loadStepHistory } from "@/activityData";
import { loadWaterHistory } from "@/waterData";
import { loadSleepHistory } from "@/sleepData";

type Props = {
  profile: any;
  onSaveProfile: (data: any) => void;
  onBack: () => void;
};

/* ---------------------------------------------------
   Weight trend chart — plain SVG polyline, same
   hand-rolled-SVG approach already used for the
   progress rings elsewhere in the app. No chart library.
--------------------------------------------------- */
function WeightChart({ points }: { points: WeightEntry[] }) {
  if (points.length < 2) return null;

  const ordered = [...points].reverse(); // oldest -> newest, left to right
  const weights = ordered.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const width = 300;
  const height = 110;
  const padY = 14;
  const stepX = ordered.length > 1 ? width / (ordered.length - 1) : 0;

  const coords = ordered.map((p, i) => {
    const x = ordered.length > 1 ? i * stepX : width / 2;
    const y = height - padY - ((p.weight - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="weight-chart-svg" preserveAspectRatio="none">
      <polyline points={linePoints} fill="none" stroke="#1F7A5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={ordered[i].date} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4 : 2.5} fill="#1F7A5C" />
      ))}
    </svg>
  );
}

/* ---------------------------------------------------
   Consistency row — reused for workout / walking /
   water / sleep, same visual language as the app's
   existing progress bars.
--------------------------------------------------- */
function ConsistencyRow({
  icon: Icon,
  color,
  tint,
  label,
  completed,
  total,
  percent,
}: {
  icon: any;
  color: string;
  tint: string;
  label: string;
  completed: number;
  total: number;
  percent: number;
}) {
  return (
    <div className="progress-consistency-row">
      <span className="plan-icon" style={{ background: tint, color }}>
        <Icon size={16} />
      </span>
      <div className="progress-consistency-text">
        <div className="progress-row-top">
          <span className="progress-label">{label}</span>
          <span className="progress-value">{completed}/{total} days</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage({ profile, onSaveProfile, onBack }: Props) {
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => loadWeightHistory());
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const [workoutHistory] = useState<WorkoutHistoryEntry[]>(() => loadWorkoutHistory());
  const [stepHistory] = useState(() => loadStepHistory());
  const [waterHistory] = useState(() => loadWaterHistory());
  const [sleepHistory] = useState(() => loadSleepHistory());

  const startingWeight = getStartingWeight(weightHistory, profile.currentWeight);
  const currentWeight = getCurrentWeight(weightHistory, profile.currentWeight);
  const targetWeight = Number(profile.targetWeight) || null;
  const weightChange =
    startingWeight != null && currentWeight != null ? Math.round((currentWeight - startingWeight) * 10) / 10 : null;

  const startEditWeight = () => {
    setWeightInput(currentWeight != null ? String(currentWeight) : "");
    setEditingWeight(true);
  };

  const saveWeight = () => {
    const val = Number(weightInput);
    if (isNaN(val) || val <= 0) {
      setEditingWeight(false);
      return;
    }
    const updated = logWeight(Math.round(val * 10) / 10);
    setWeightHistory(updated);
    // Keep the profile's current weight in sync so it stays consistent
    // across Profile, Home and Progress.
    onSaveProfile({ ...profile, currentWeight: String(Math.round(val * 10) / 10) });
    setEditingWeight(false);
    setWeightInput("");
  };

  // ---- Consistency stats (last 7 days), reusing each tracker's own
  // stored target-per-day so nothing here duplicates their logic. ----
  const workoutDates = Array.from(new Set<string>(workoutHistory.map((e) => e.date.split("T")[0])));
  const workoutConsistency = consistencyFromDates(workoutDates, 7);

  const walkingDates = stepHistory.filter((d: any) => d.target > 0 && d.steps >= d.target).map((d: any) => d.date);
  const walkingConsistency = consistencyFromDates(walkingDates, 7);

  const waterDates = waterHistory.filter((d: any) => d.ml >= d.targetMl).map((d: any) => d.date);
  const waterConsistency = consistencyFromDates(waterDates, 7);

  const sleepDates = sleepHistory.filter((d: any) => d.hours >= d.targetHours - 0.5).map((d: any) => d.date);
  const sleepConsistency = consistencyFromDates(sleepDates, 7);

  const totalWorkouts = workoutHistory.length;
  const recentWorkouts = workoutHistory.slice(0, 5);
  const latestSuggestion = workoutHistory.length > 0 ? workoutHistory[0].nextSuggestion : null;

  const WeightTrendIcon = weightChange == null || weightChange === 0 ? Minus : weightChange < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to Home">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-title">
          <span className="page-header-icon" style={{ background: "#E4F3EC", color: "#1F7A5C" }}>
            <Scale size={18} />
          </span>
          <h1>Progress</h1>
        </div>
        <span className="icon-btn-spacer" />
      </header>

      <div className="page-content">
        {/* Weight */}
        <p className="steps-section-label" style={{ marginTop: 0 }}>Weight</p>
        <div className="steps-stats-row">
          <div className="step-stat-box">
            <span className="step-stat-value" style={{ color: "#171A1F" }}>{startingWeight != null ? `${startingWeight}kg` : "—"}</span>
            <span className="step-stat-label">Starting</span>
          </div>
          <div className="step-stat-box">
            <span className="step-stat-value" style={{ color: "#1F7A5C" }}>{currentWeight != null ? `${currentWeight}kg` : "—"}</span>
            <span className="step-stat-label">Current</span>
          </div>
          <div className="step-stat-box">
            <span className="step-stat-value" style={{ color: "#171A1F" }}>{targetWeight ? `${targetWeight}kg` : "—"}</span>
            <span className="step-stat-label">Target</span>
          </div>
        </div>

        <div className="progress-weight-change">
          <WeightTrendIcon size={16} style={{ color: weightChange && weightChange < 0 ? "#1F7A5C" : weightChange && weightChange > 0 ? "#FF6B4A" : "#6B7280" }} />
          <span>
            {weightChange == null
              ? "Log your weight to start tracking change."
              : weightChange === 0
                ? "No change since you started."
                : `${weightChange > 0 ? "+" : ""}${weightChange}kg since you started.`}
          </span>
        </div>

        <div className="steps-edit-section">
          <p className="steps-section-label">Log today's weight</p>
          {editingWeight ? (
            <div className="steps-edit-row">
              <input
                type="number"
                className="input steps-edit-input"
                value={weightInput}
                min="0"
                step="0.1"
                onChange={(e) => setWeightInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveWeight(); } }}
                autoFocus
              />
              <button className="icon-btn" onClick={saveWeight} aria-label="Save"><Check size={18} /></button>
              <button className="icon-btn" onClick={() => { setEditingWeight(false); setWeightInput(""); }} aria-label="Cancel"><X size={18} /></button>
            </div>
          ) : (
            <div className="steps-edit-row">
              <span className="steps-current-total">{currentWeight != null ? `${currentWeight} kg` : "Not logged yet"}</span>
              <button className="icon-btn" onClick={startEditWeight} aria-label="Log weight"><Pencil size={16} /></button>
            </div>
          )}
        </div>

        {weightHistory.length >= 2 && (
          <div className="summary-card">
            <p className="summary-title">Weight trend</p>
            <WeightChart points={weightHistory.slice(0, 30)} />
          </div>
        )}

        {weightHistory.length > 0 && (
          <div className="steps-history-section">
            <p className="steps-section-label">Weight history</p>
            <div className="steps-history-list">
              {weightHistory.slice(0, 30).map((w) => (
                <div className="steps-history-row" key={w.date}>
                  <span className="steps-history-date">{formatDate(w.date)}</span>
                  <span className="steps-history-steps">{w.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consistency */}
        <p className="steps-section-label">This week's consistency</p>
        <div className="progress-consistency-card">
          <ConsistencyRow
            icon={Dumbbell}
            color="#FF6B4A"
            tint="#FFEBE5"
            label="Workout"
            completed={workoutConsistency.completed}
            total={workoutConsistency.total}
            percent={workoutConsistency.percent}
          />
          <ConsistencyRow
            icon={Footprints}
            color="#3B82F6"
            tint="#E7F0FE"
            label="Walking"
            completed={walkingConsistency.completed}
            total={walkingConsistency.total}
            percent={walkingConsistency.percent}
          />
          <ConsistencyRow
            icon={Droplet}
            color="#0EA5B7"
            tint="#E1F5F7"
            label="Water"
            completed={waterConsistency.completed}
            total={waterConsistency.total}
            percent={waterConsistency.percent}
          />
          <ConsistencyRow
            icon={Moon}
            color="#7C6FF0"
            tint="#EEEBFD"
            label="Sleep"
            completed={sleepConsistency.completed}
            total={sleepConsistency.total}
            percent={sleepConsistency.percent}
          />
        </div>

        {/* Workout progression */}
        <p className="steps-section-label">Workout progression</p>
        <div className="steps-stats-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="step-stat-box">
            <span className="step-stat-value" style={{ color: "#FF6B4A" }}>{totalWorkouts}</span>
            <span className="step-stat-label">Workouts completed</span>
          </div>
          <div className="step-stat-box">
            <span className="step-stat-value" style={{ color: "#FF6B4A" }}>{workoutConsistency.percent}%</span>
            <span className="step-stat-label">Consistency (7d)</span>
          </div>
        </div>

        {latestSuggestion && (
          <div className="summary-card">
            <p className="summary-title">Latest progression tip</p>
            <p className="summary-subtext">{latestSuggestion}</p>
          </div>
        )}

        {recentWorkouts.length > 0 && (
          <div className="steps-history-section">
            <p className="steps-section-label">Recent sessions</p>
            <div className="steps-history-list">
              {recentWorkouts.map((w) => (
                <div className="steps-history-row" key={w.id}>
                  <span className="steps-history-date">{formatDate(w.date.split("T")[0])}</span>
                  <span className="steps-history-steps">
                    {w.completedSets}
                    <span className="steps-history-target">{" / "}{w.totalSets} sets</span>
                  </span>
                  <span className="steps-history-badge">{w.difficulty}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
