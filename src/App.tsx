import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Home as HomeIcon,
  User,
  Dumbbell,
  Apple,
  Footprints,
  Droplet,
  Moon,
  TrendingUp,
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Check,
  Trash2,
  Plus,
} from "lucide-react";
import WorkoutPage from "@/WorkoutPage";
import FoodPage from "@/FoodPage";
import { loadMessMenu, loadFoodLog, generateFoodGuidance, getTodayMenu } from "@/foodData";
import ActivityPage from "@/ActivityPage";
import WaterPage from "@/WaterPage";
import SleepPage from "@/SleepPage";
import ProgressPage from "@/ProgressPage";
import {
  loadTodaySteps,
  getStepTarget as getActivityStepTarget,
  loadStepHistory,
  type FitnessLevel,
} from "@/activityData";
import { loadTodayWater, mlToLiters } from "@/waterData";
import { loadLastSleep } from "@/sleepData";
import { loadHistory as loadWorkoutHistory } from "@/workoutData";

/* ---------------------------------------------------
   Category config — single source of truth for icon,
   label and color per section.
--------------------------------------------------- */
const CATEGORIES = {
  home: { label: "Home", icon: HomeIcon, color: "#1F7A5C", tint: "#E4F3EC" },
  profile: { label: "My Details", icon: User, color: "#1F7A5C", tint: "#E4F3EC" },
  workout: { label: "Workout", icon: Dumbbell, color: "#FF6B4A", tint: "#FFEBE5" },
  food: { label: "Food", icon: Apple, color: "#F5A524", tint: "#FDF1DC" },
  activity: { label: "Activity", icon: Footprints, color: "#3B82F6", tint: "#E7F0FE" },
  water: { label: "Water", icon: Droplet, color: "#0EA5B7", tint: "#E1F5F7" },
  sleep: { label: "Sleep", icon: Moon, color: "#7C6FF0", tint: "#EEEBFD" },
  progress: { label: "Progress", icon: TrendingUp, color: "#1F7A5C", tint: "#E4F3EC" },
  settings: { label: "Settings", icon: SettingsIcon, color: "#6B7280", tint: "#EEF0F2" },
} as const;

const DASHBOARD_ORDER = ["workout", "food", "activity", "water", "sleep", "progress"] as const;
const BOTTOM_TABS = ["home", "workout", "food", "activity"] as const;
const MORE_ITEMS = ["profile", "water", "sleep", "progress", "settings"] as const;

type CategoryKey = keyof typeof CATEGORIES;
type Profile = {
  name: string;
  age: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  goals: string[];
  fitnessLevel: FitnessLevel;
  workoutTime: string;
  wakeTime: string;
  sleepTime: string;
  dailySchedule: string;
  avgSteps: string;
  waterIntake: string;
  equipment: string[];
};

type FormFieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

type ChipGroupProps = {
  options: string[];
  selected: string | string[];
  onToggle: (value: string) => void;
  multi?: boolean;
};

type ProfileFormProps = {
  initial: Profile;
  onSave: (data: Profile) => void;
  onCancel?: () => void;
  showCancel: boolean;
};

type PageShellProps = {
  id: CategoryKey;
  onBack?: () => void;
  children: React.ReactNode;
};

type EquipmentManagerProps = {
  equipment: string[];
  onChange: (newEquipment: string[]) => void;
};

type ProfilePageProps = {
  profile: Profile;
  onSave: (data: Profile) => void;
  onBack?: () => void;
};

type SetupScreenProps = {
  onSave: (data: Profile) => void;
};

type PlanRowProps = {
  icon: LucideIcon;
  color: string;
  tint: string;
  label: string;
  value: string;
  sub?: string | null;
  onClick: () => void;
};

type ProgressRowProps = {
  label: string;
  current: number;
  target: number;
  unit: string;
};

const TODAY = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

/* ---------------------------------------------------
   Profile — first-time setup + edit, persisted to
   localStorage. No backend, no accounts.
--------------------------------------------------- */
const PROFILE_KEY = "fitness_app_profile";

const FITNESS_LEVELS = ["Starting", "Beginner", "Medium", "High"];
const GOAL_OPTIONS = [
  "Fat loss",
  "Weight loss",
  "General fitness",
  "Strength",
  "Muscle building",
  "Better stamina",
];
const WORKOUT_TIME_OPTIONS = ["Morning", "Evening"];
const EQUIPMENT_OPTIONS = [
  "Bodyweight only",
  "Dumbbells",
  "Barbell",
  "Bench",
  "Resistance bands",
  "Pull-up bar",
  "Kettlebells",
  "Cardio machines",
  "Full gym",
];

const EMPTY_PROFILE: Profile = {
  name: "",
  age: "",
  height: "",
  currentWeight: "",
  targetWeight: "",
  goals: [],
  fitnessLevel: "Starting",
  workoutTime: "",
  wakeTime: "",
  sleepTime: "",
  dailySchedule: "",
  avgSteps: "",
  waterIntake: "",
  equipment: [],
};

function normalizeProfile(data: unknown): Profile {
  const d = (data && typeof data === "object" ? data : {}) as Partial<Profile>;
  return {
    ...EMPTY_PROFILE,
    ...d,
    goals: Array.isArray(d.goals) ? d.goals : EMPTY_PROFILE.goals,
    equipment: Array.isArray(d.equipment) ? d.equipment : EMPTY_PROFILE.equipment,
    fitnessLevel: FITNESS_LEVELS.includes(d.fitnessLevel as string)
      ? (d.fitnessLevel as FitnessLevel)
      : EMPTY_PROFILE.fitnessLevel,
  };
}

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

function saveProfile(data: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable — ignore
  }
}

/* ---------------------------------------------------
   Profile form — used for both first-time setup and
   later edits.
--------------------------------------------------- */
function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

function ChipGroup({ options, selected, onToggle, multi }: ChipGroupProps) {
  return (
    <div className="chip-group">
      {options.map((opt: string) => {
        const active = multi ? (Array.isArray(selected) ? selected.includes(opt) : false) : selected === opt;
        return (
          <button
            type="button"
            key={opt}
            className={`chip ${active ? "chip-active" : ""}`}
            onClick={() => onToggle(opt)}
          >
            {active && <Check size={14} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ProfileForm({ initial, onSave, onCancel, showCancel }: ProfileFormProps) {
  const [form, setForm] = useState<Profile>(initial);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleGoal = (goal: string) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal)
        ? f.goals.filter((g: string) => g !== goal)
        : [...f.goals, goal],
    }));
  };

  const toggleEquipment = (item: string) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter((e: string) => e !== item)
        : [...f.equipment, item],
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <FormField label="Name / nickname">
        <input
          type="text"
          className="input"
          value={form.name}
          placeholder="Optional"
          onChange={(e) => update("name", e.target.value)}
        />
      </FormField>

      <div className="form-row">
        <FormField label="Age">
          <input
            type="number"
            className="input"
            value={form.age}
            min="0"
            onChange={(e) => update("age", e.target.value)}
          />
        </FormField>
        <FormField label="Height (cm)">
          <input
            type="number"
            className="input"
            value={form.height}
            min="0"
            onChange={(e) => update("height", e.target.value)}
          />
        </FormField>
      </div>

      <div className="form-row">
        <FormField label="Current weight (kg)">
          <input
            type="number"
            className="input"
            value={form.currentWeight}
            min="0"
            onChange={(e) => update("currentWeight", e.target.value)}
          />
        </FormField>
        <FormField label="Target weight (kg)">
          <input
            type="number"
            className="input"
            value={form.targetWeight}
            min="0"
            onChange={(e) => update("targetWeight", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Main goal" hint="Select one or more">
        <ChipGroup options={GOAL_OPTIONS} selected={form.goals} onToggle={toggleGoal} multi />
      </FormField>

      <FormField label="Fitness level">
        <ChipGroup
          options={FITNESS_LEVELS}
          selected={form.fitnessLevel}
          onToggle={(v) => update("fitnessLevel", v as FitnessLevel)}
        />
      </FormField>

      <FormField label="Workout time">
        <ChipGroup
          options={WORKOUT_TIME_OPTIONS}
          selected={form.workoutTime}
          onToggle={(v) => update("workoutTime", v)}
        />
      </FormField>

      <div className="form-row">
        <FormField label="Wake-up time">
          <input
            type="time"
            className="input"
            value={form.wakeTime}
            onChange={(e) => update("wakeTime", e.target.value)}
          />
        </FormField>
        <FormField label="Sleep time">
          <input
            type="time"
            className="input"
            value={form.sleepTime}
            onChange={(e) => update("sleepTime", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Daily schedule" hint="Briefly describe a typical day">
        <textarea
          className="input textarea"
          value={form.dailySchedule}
          rows={3}
          onChange={(e) => update("dailySchedule", e.target.value)}
        />
      </FormField>

      <div className="form-row">
        <FormField label="Avg. daily steps">
          <input
            type="number"
            className="input"
            value={form.avgSteps}
            min="0"
            onChange={(e) => update("avgSteps", e.target.value)}
          />
        </FormField>
        <FormField label="Usual water intake (L)">
          <input
            type="number"
            className="input"
            value={form.waterIntake}
            min="0"
            step="0.1"
            onChange={(e) => update("waterIntake", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Equipment available at my gym" hint="Select all that apply">
        <ChipGroup
          options={EQUIPMENT_OPTIONS}
          selected={form.equipment}
          onToggle={toggleEquipment}
          multi
        />
      </FormField>

      <div className="form-actions">
        {showCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------
   Shared placeholder shell for pages without
   functionality yet.
--------------------------------------------------- */
function PageShell({ id, onBack, children }: PageShellProps) {
  const cat = CATEGORIES[id];
  const Icon = cat.icon;
  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to Home">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-title">
          <span className="page-header-icon" style={{ background: cat.tint, color: cat.color }}>
            <Icon size={18} />
          </span>
          <h1>{cat.label}</h1>
        </div>
        <span className="icon-btn-spacer" />
      </header>

      <div className="page-content">{children}</div>
    </div>
  );
}

function EmptyPlaceholder({ id }: { id: CategoryKey }) {
  const cat = CATEGORIES[id];
  const Icon = cat.icon;
  return (
    <div className="empty-state">
      <span className="empty-icon" style={{ background: cat.tint, color: cat.color }}>
        <Icon size={26} />
      </span>
      <p className="empty-title">No {cat.label.toLowerCase()} data yet</p>
      <p className="empty-subtext">This screen is ready — features are coming soon.</p>
    </div>
  );
}

/* ---------------------------------------------------
   My Gym Equipment — free-form add / edit / delete
   list, plus pasting a whole list at once. Feeds the
   same profile.equipment field used elsewhere.
--------------------------------------------------- */
function EquipmentManager({ equipment, onChange }: EquipmentManagerProps) {
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const addItem = () => {
    const value = newItem.trim();
    if (!value) return;
    if (equipment.some((e: string) => e.toLowerCase() === value.toLowerCase())) {
      setNewItem("");
      return;
    }
    onChange([...equipment, value]);
    setNewItem("");
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(equipment[index]);
  };

  const saveEdit = () => {
    const value = editValue.trim();
    if (!value) {
      setEditingIndex(null);
      return;
    }
    onChange(equipment.map((e: string, i: number) => (i === editingIndex ? value : e)));
    setEditingIndex(null);
  };

  const deleteItem = (index: number) => {
    onChange(equipment.filter((_: string, i: number) => i !== index));
  };

  const importPasted = () => {
    const items = pasteText
      .split(/[\n,]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (!items.length) return;
    const merged = [...equipment];
    items.forEach((item: string) => {
      if (!merged.some((e: string) => e.toLowerCase() === item.toLowerCase())) {
        merged.push(item);
      }
    });
    onChange(merged);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <section className="equipment-card">
      <div className="equipment-card-header">
        <p className="summary-title">My Gym Equipment</p>
        <button type="button" className="link-btn" onClick={() => setPasteOpen((v) => !v)}>
          {pasteOpen ? "Cancel paste" : "Paste list"}
        </button>
      </div>

      {pasteOpen && (
        <div className="equipment-paste">
          <textarea
            className="input textarea"
            rows={3}
            placeholder={"Paste equipment, one per line or comma-separated\ne.g. Treadmill, Dumbbells, Barbell"}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-small" onClick={importPasted}>
            Import list
          </button>
        </div>
      )}

      {equipment.length === 0 ? (
        <p className="equipment-empty">No equipment added yet.</p>
      ) : (
        <ul className="equipment-list">
          {equipment.map((item, index) => (
            <li className="equipment-item" key={`${item}-${index}`}>
              {editingIndex === index ? (
                <>
                  <input
                    type="text"
                    className="input equipment-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="icon-btn" onClick={saveEdit} aria-label="Save">
                    <Check size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="equipment-name">{item}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => startEdit(index)}
                    aria-label={`Edit ${item}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => deleteItem(index)}
                    aria-label={`Delete ${item}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="equipment-add-row">
        <input
          type="text"
          className="input"
          placeholder="Add equipment (e.g. Squat rack)"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <button type="button" className="btn btn-primary btn-small" onClick={addItem}>
          <Plus size={16} />
          Add
        </button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------
   Profile page — view mode with an Edit Profile
   option, and the first-time setup screen.
--------------------------------------------------- */
function ProfilePage({ profile, onSave, onBack }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PageShell id="profile" onBack={onBack}>
        <ProfileForm
          initial={profile}
          showCancel
          onCancel={() => setEditing(false)}
          onSave={(data) => {
            onSave(data);
            setEditing(false);
          }}
        />
      </PageShell>
    );
  }

  const rows = [
    ["Name", profile.name || "—"],
    ["Age", profile.age || "—"],
    ["Height", profile.height ? `${profile.height} cm` : "—"],
    ["Current weight", profile.currentWeight ? `${profile.currentWeight} kg` : "—"],
    ["Target weight", profile.targetWeight ? `${profile.targetWeight} kg` : "—"],
    ["Goals", profile.goals?.length ? profile.goals.join(", ") : "—"],
    ["Fitness level", profile.fitnessLevel || "—"],
    ["Workout time", profile.workoutTime || "—"],
    ["Wake-up time", profile.wakeTime || "—"],
    ["Sleep time", profile.sleepTime || "—"],
    ["Daily schedule", profile.dailySchedule || "—"],
    ["Avg. daily steps", profile.avgSteps || "—"],
    ["Usual water intake", profile.waterIntake ? `${profile.waterIntake} L` : "—"],
  ];

  const updateEquipment = (newEquipment: string[]) => {
    onSave({ ...profile, equipment: newEquipment });
  };

  return (
    <PageShell id="profile" onBack={onBack}>
      <button className="btn btn-primary btn-edit" onClick={() => setEditing(true)}>
        <Pencil size={16} />
        Edit Profile
      </button>
      <div className="detail-list">
        {rows.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value}</span>
          </div>
        ))}
      </div>

      <EquipmentManager equipment={profile.equipment || []} onChange={updateEquipment} />
    </PageShell>
  );
}

function SetupScreen({ onSave }: SetupScreenProps) {
  return (
    <div className="page setup-screen">
      <header className="setup-header">
        <span
          className="page-header-icon"
          style={{ background: CATEGORIES.profile.tint, color: CATEGORIES.profile.color }}
        >
          <User size={18} />
        </span>
        <div>
          <h1>Set up your profile</h1>
          <p className="setup-subtext">Tell us a bit about yourself. You can edit this anytime.</p>
        </div>
      </header>
      <div className="page-content">
        <ProfileForm initial={EMPTY_PROFILE} onSave={onSave} showCancel={false} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   Home dashboard helpers — turn the saved profile
   into today's targets and guidance. Derived locally,
   no extra storage needed yet.
--------------------------------------------------- */
const FITNESS_LEVEL_MESSAGES: Record<string, string> = {
  Starting: "Just show up today — building the habit matters more than being perfect.",
  Beginner: "Stay consistent and keep learning your movements. Small steps add up.",
  Medium: "Keep the discipline going and aim to progress a little from last time.",
  High: "Focus on performance today and keep pushing your progression.",
};

const GOAL_WORKOUT_FOCUS: Record<string, string> = {
  "Fat loss": "Cardio + full-body circuit",
  "Weight loss": "Full-body circuit training",
  "General fitness": "Full-body balanced workout",
  Strength: "Strength training",
  "Muscle building": "Hypertrophy training",
  "Better stamina": "Endurance training",
};

const GOAL_FOOD_GUIDANCE: Record<string, string> = {
  "Fat loss": "Moderate calorie deficit, high protein, plenty of vegetables.",
  "Weight loss": "Watch portion sizes and choose whole, unprocessed foods.",
  "General fitness": "Balanced meals with protein, carbs and healthy fats.",
  Strength: "Prioritize protein to support muscle recovery and strength.",
  "Muscle building": "Slight calorie surplus with protein spread through the day.",
  "Better stamina": "Balanced carbs and good hydration to fuel endurance.",
};

function getStepsTarget(profile: Profile) {
  const avg = Number(profile.avgSteps) || 0;
  if (!avg) return 8000;
  return Math.max(5000, Math.round((avg + 1000) / 100) * 100);
}

function getWaterTarget(profile: Profile) {
  const avg = Number(profile.waterIntake) || 0;
  const raw = avg > 0 ? Math.round((avg + 0.5) * 10) / 10 : 2.5;
  // Keep the target within a reasonable range — never recommend excessive intake.
  return Math.min(4, Math.max(1.5, raw));
}

function getSleepTarget(profile: Profile) {
  if (profile.wakeTime && profile.sleepTime) {
    const [sh, sm] = profile.sleepTime.split(":").map(Number);
    const [wh, wm] = profile.wakeTime.split(":").map(Number);
    let diff = wh * 60 + wm - (sh * 60 + sm);
    if (diff <= 0) diff += 24 * 60;
    const hours = Math.round((diff / 60) * 10) / 10;
    if (hours > 0 && hours <= 14) {
      // Keep the target in the generally recommended 7–9h range.
      return Math.min(9, Math.max(7, hours));
    }
  }
  return 8;
}

function PlanRow({ icon: Icon, color, tint, label, value, sub, onClick }: PlanRowProps) {
  return (
    <button type="button" className="plan-row" onClick={onClick}>
      <span className="plan-icon" style={{ background: tint, color }}>
        <Icon size={18} />
      </span>
      <span className="plan-text">
        <span className="plan-label">{label}</span>
        <span className="plan-value">{value}</span>
        {sub && <span className="plan-sub">{sub}</span>}
      </span>
    </button>
  );
}

function ProgressRow({ label, current, target, unit }: ProgressRowProps) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="progress-row">
      <div className="progress-row-top">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          {current}
          {unit}/{target}
          {unit}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   Home dashboard
--------------------------------------------------- */
function Home({ onNavigate, profile }: { onNavigate: (page: CategoryKey) => void; profile: Profile }) {
  const level = profile.fitnessLevel || "Starting";
  const goals = profile.goals && profile.goals.length ? profile.goals : [];
  const primaryGoal = goals[0] || "General fitness";

  const message = FITNESS_LEVEL_MESSAGES[level] || FITNESS_LEVEL_MESSAGES.Starting;
  const workoutFocus = GOAL_WORKOUT_FOCUS[primaryGoal] || GOAL_WORKOUT_FOCUS["General fitness"];
  const messMenu = loadMessMenu();
  const foodLog = loadFoodLog();
  const foodGuidanceData = generateFoodGuidance(messMenu, goals, foodLog);
  const todayMenu = getTodayMenu(messMenu);
  const hasMessMenu = !!(todayMenu.breakfast || todayMenu.lunch || todayMenu.snacks || todayMenu.dinner);
  const foodGuidanceValue = hasMessMenu
    ? `${foodGuidanceData.tips[0] || foodGuidanceData.message}`
    : foodGuidanceData.message;

  const stepsTarget = getActivityStepTarget(level, Number(profile.avgSteps) || 0, loadStepHistory());
  const currentSteps = loadTodaySteps();
  const waterTarget = getWaterTarget(profile);
  const sleepTarget = getSleepTarget(profile);
  const currentWater = mlToLiters(loadTodayWater());
  const lastSleepEntry = loadLastSleep();
  const currentSleep = lastSleepEntry ? lastSleepEntry.hours : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const workoutHistoryData = loadWorkoutHistory();
  const workoutDoneToday = workoutHistoryData.some((w: { date: string }) => w.date.split("T")[0] === todayStr) ? 1 : 0;
  const lastWorkoutTip = workoutHistoryData.length > 0 ? workoutHistoryData[0].nextSuggestion : null;

  return (
    <div className="page">
      <header className="home-header">
        <div>
          <p className="eyebrow">{TODAY}</p>
          <h1>Good day</h1>
        </div>
        <div className="home-header-actions">
          <button className="icon-btn" onClick={() => onNavigate("profile")} aria-label="My Details">
            <User size={20} />
          </button>
          <button className="icon-btn" onClick={() => onNavigate("settings")} aria-label="Settings">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <div className="page-content">
        <section className="motivation-card">
          <p className="motivation-eyebrow">{level} level</p>
          <p className="motivation-text">{message}</p>
        </section>

        <div className="info-row">
          <div className="info-pill">
            <span className="info-pill-label">Fitness level</span>
            <span className="info-pill-value">{level}</span>
          </div>
          <div className="info-pill">
            <span className="info-pill-label">Main goal</span>
            <span className="info-pill-value">{goals.length ? goals.join(", ") : "Not set"}</span>
          </div>
        </div>

        <p className="section-label">Today's plan</p>
        <div className="plan-list">
          <PlanRow
            icon={CATEGORIES.workout.icon}
            color={CATEGORIES.workout.color}
            tint={CATEGORIES.workout.tint}
            label="Workout"
            value={`${profile.workoutTime || "Anytime"} • ${workoutFocus}`}
            sub={lastWorkoutTip}
            onClick={() => onNavigate("workout")}
          />
          <PlanRow
            icon={CATEGORIES.activity.icon}
            color={CATEGORIES.activity.color}
            tint={CATEGORIES.activity.tint}
            label="Walking target"
            value={`${stepsTarget.toLocaleString()} steps`}
            onClick={() => onNavigate("activity")}
          />
          <PlanRow
            icon={CATEGORIES.water.icon}
            color={CATEGORIES.water.color}
            tint={CATEGORIES.water.tint}
            label="Water target"
            value={`${waterTarget}L`}
            onClick={() => onNavigate("water")}
          />
          <PlanRow
            icon={CATEGORIES.sleep.icon}
            color={CATEGORIES.sleep.color}
            tint={CATEGORIES.sleep.tint}
            label="Sleep target"
            value={`${sleepTarget}h`}
            onClick={() => onNavigate("sleep")}
          />
          <PlanRow
            icon={CATEGORIES.food.icon}
            color={CATEGORIES.food.color}
            tint={CATEGORIES.food.tint}
            label="Food guidance"
            value={foodGuidanceValue}
            onClick={() => onNavigate("food")}
          />
        </div>

        <p className="section-label">Today's progress</p>
        <section className="progress-card">
          <ProgressRow label="Workout" current={workoutDoneToday} target={1} unit="" />
          <ProgressRow label="Steps" current={currentSteps} target={stepsTarget} unit="" />
          <ProgressRow label="Water" current={currentWater} target={waterTarget} unit="L" />
          <ProgressRow label="Sleep" current={currentSleep} target={sleepTarget} unit="h" />
        </section>

        <p className="section-label">Categories</p>
        <div className="grid">
          {DASHBOARD_ORDER.map((id) => {
            const cat = CATEGORIES[id];
            const Icon = cat.icon;
            return (
              <button key={id} className="stat-card" onClick={() => onNavigate(id)}>
                <span className="stat-icon" style={{ background: cat.tint, color: cat.color }}>
                  <Icon size={20} />
                </span>
                <span className="stat-label">{cat.label}</span>
                <span className="stat-subtext">No data yet</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   "More" sheet — houses sections that don't fit in
   the bottom tab bar.
--------------------------------------------------- */
function MoreSheet({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: CategoryKey) => void;
}) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>More</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-list">
          {MORE_ITEMS.map((id) => {
            const cat = CATEGORIES[id];
            const Icon = cat.icon;
            return (
              <button key={id} className="sheet-item" onClick={() => onNavigate(id)}>
                <span className="sheet-item-icon" style={{ background: cat.tint, color: cat.color }}>
                  <Icon size={18} />
                </span>
                <span className="sheet-item-label">{cat.label}</span>
                <ChevronRight size={18} className="sheet-item-chevron" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   Bottom navigation
--------------------------------------------------- */
function BottomNav({
  page,
  onNavigate,
  onMoreClick,
  moreActive,
}: {
  page: CategoryKey;
  onNavigate: (page: CategoryKey) => void;
  onMoreClick: () => void;
  moreActive: boolean;
}) {
  return (
    <nav className="bottom-nav">
      {BOTTOM_TABS.map((id) => {
        const cat = CATEGORIES[id];
        const Icon = cat.icon;
        const active = page === id;
        return (
          <button
            key={id}
            className={`nav-btn ${active ? "active" : ""}`}
            style={active ? { color: cat.color } : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={22} />
            <span>{cat.label}</span>
          </button>
        );
      })}
      <button
        className={`nav-btn ${moreActive ? "active" : ""}`}
        style={moreActive ? { color: "#1F7A5C" } : undefined}
        onClick={onMoreClick}
      >
        <Menu size={22} />
        <span>More</span>
      </button>
    </nav>
  );
}

/* ---------------------------------------------------
   App
--------------------------------------------------- */
export default function App() {
  const [page, setPage] = useState<CategoryKey>("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());

  const navigate = (id: CategoryKey) => {
    setPage(id);
    setMoreOpen(false);
  };

  const handleProfileSave = (data: Profile) => {
    saveProfile(data);
    setProfile(data);
  };

  const moreActive = MORE_ITEMS.includes(page as (typeof MORE_ITEMS)[number]);

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }

        .app {
          --bg: #F6F7F9;
          --surface: #FFFFFF;
          --border: #E8EAED;
          --text: #171A1F;
          --text-secondary: #6B7280;
          --primary: #1F7A5C;

          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
          padding-bottom: calc(64px + env(safe-area-inset-bottom));
        }

        .page { display: flex; flex-direction: column; min-height: 100vh; }

        /* Home header */
        .home-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 20px 4px;
        }
        .home-header h1 { margin: 2px 0 0; font-size: 22px; font-weight: 700; }
        .home-header-actions { display: flex; gap: 8px; }
        .eyebrow {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        /* Motivation + quick info */
        .motivation-card {
          background: var(--primary);
          color: #fff;
          border-radius: 16px;
          padding: 16px;
          margin-top: 12px;
        }
        .motivation-eyebrow {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
        }
        .motivation-text { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.4; }

        .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .info-pill {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-pill-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .info-pill-value { font-size: 14px; font-weight: 700; color: var(--text); }

        /* Today's plan */
        .plan-list { display: flex; flex-direction: column; gap: 10px; }
        .plan-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 14px;
          padding: 12px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }
        .plan-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .plan-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .plan-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .plan-value { font-size: 14px; font-weight: 700; color: var(--text); }
        .plan-sub { font-size: 11px; font-weight: 600; color: var(--text-secondary); line-height: 1.3; }

        /* Today's progress */
        .progress-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .progress-row-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .progress-label { font-size: 13px; font-weight: 600; color: var(--text); }
        .progress-value { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .progress-track { height: 8px; border-radius: 999px; background: var(--bg); overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 999px; }

        /* Sub-page header */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 12px;
          border-bottom: 1px solid var(--border);
        }
        .page-header-title { display: flex; align-items: center; gap: 10px; }
        .page-header-title h1 { font-size: 18px; font-weight: 700; margin: 0; }
        .page-header-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .icon-btn-spacer { width: 36px; }

        .icon-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: none;
          background: var(--surface);
          box-shadow: 0 1px 2px rgba(16,24,40,0.06);
          display: flex; align-items: center; justify-content: center;
          color: var(--text);
          cursor: pointer;
        }

        .page-content { padding: 16px 20px 24px; flex: 1; }

        .summary-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-top: 12px;
        }
        .summary-title { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
        .summary-subtext { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4; }

        .section-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          margin: 20px 2px 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          font-family: inherit;
        }
        .stat-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-label { font-size: 14px; font-weight: 700; color: var(--text); }
        .stat-subtext { font-size: 12px; color: var(--text-secondary); }

        .empty-state {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
        }
        .empty-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .empty-title { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
        .empty-subtext { font-size: 13px; color: var(--text-secondary); margin: 0; max-width: 240px; }

        /* Bottom nav */
        .bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          max-width: 480px;
          margin: 0 auto;
          background: var(--surface);
          border-top: 1px solid var(--border);
          display: flex;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .nav-btn {
          flex: 1;
          border: none;
          background: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 0 8px;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
        .nav-btn.active { color: var(--primary); }

        /* More sheet */
        .sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,20,25,0.4);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 10;
        }
        .sheet {
          width: 100%;
          max-width: 480px;
          background: var(--surface);
          border-radius: 20px 20px 0 0;
          padding: 10px 20px calc(20px + env(safe-area-inset-bottom));
        }
        .sheet-handle {
          width: 36px; height: 4px;
          background: var(--border);
          border-radius: 4px;
          margin: 4px auto 12px;
        }
        .sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .sheet-header h2 { font-size: 17px; margin: 0; }
        .sheet-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
        .sheet-item {
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background: none;
          padding: 10px 4px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
        }
        .sheet-item-icon {
          width: 34px; height: 34px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sheet-item-label { flex: 1; text-align: left; }
        .sheet-item-chevron { color: var(--text-secondary); }

        /* Profile form */
        .profile-form { display: flex; flex-direction: column; gap: 16px; padding-top: 4px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 13px; font-weight: 600; color: var(--text); }
        .form-hint { margin: 0; font-size: 12px; color: var(--text-secondary); }
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          font-family: inherit;
          background: var(--surface);
          color: var(--text);
        }
        .input:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
        .textarea { resize: vertical; min-height: 64px; }

        .chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          display: flex; align-items: center; gap: 6px;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .chip-active {
          border-color: var(--primary);
          background: #E4F3EC;
          color: var(--primary);
        }

        .form-actions { display: flex; gap: 10px; margin-top: 4px; }
        .btn {
          flex: 1;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
        .btn-edit { margin-bottom: 16px; }

        /* Profile detail view */
        .detail-list { display: flex; flex-direction: column; }
        .detail-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 13px; color: var(--text-secondary); flex: 0 0 40%; }
        .detail-value { font-size: 13px; font-weight: 600; text-align: right; flex: 1; word-break: break-word; }

        /* My Gym Equipment */
        .equipment-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .equipment-card-header { display: flex; align-items: center; justify-content: space-between; }
        .link-btn {
          border: none;
          background: none;
          color: var(--primary);
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          padding: 0;
        }
        .equipment-paste { display: flex; flex-direction: column; gap: 8px; }
        .equipment-empty { margin: 0; font-size: 13px; color: var(--text-secondary); }
        .equipment-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .equipment-item {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 10px;
        }
        .equipment-name { flex: 1; font-size: 14px; font-weight: 600; color: var(--text); word-break: break-word; }
        .equipment-edit-input { flex: 1; }
        .equipment-add-row { display: flex; gap: 8px; }
        .equipment-add-row .input { flex: 1; }
        .btn-small { flex: none; padding: 10px 14px; font-size: 13px; white-space: nowrap; }

        /* First-time setup */
        .setup-screen { padding-bottom: 24px; }
        .setup-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 24px 20px 8px;
        }
        .setup-header h1 { font-size: 20px; margin: 0 0 4px; }
        .setup-subtext { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4; }

        /* ===================== WORKOUT SYSTEM ===================== */

        .alt-badge {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          background: #FDF1DC;
          color: #F5A524;
          margin-left: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Ready screen */
        .workout-ready { display: flex; flex-direction: column; gap: 16px; }
        .workout-preview-header { display: flex; gap: 8px; flex-wrap: wrap; }
        .workout-level-badge, .workout-time-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .workout-suggestion-card {
          background: #E4F3EC;
          border: 1px solid #C8E6D5;
          border-radius: 14px;
          padding: 14px;
        }
        .workout-suggestion-label {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #1F7A5C;
        }
        .workout-suggestion-text {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--text);
        }

        .workout-pain-warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #FEECEC;
          border: 1px solid #FCC;
          border-radius: 12px;
          padding: 12px;
        }
        .workout-pain-warning p {
          margin: 0;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.4;
          color: #C53030;
        }
        .workout-pain-warning svg { color: #EF4444; flex-shrink: 0; margin-top: 1px; }

        .workout-section-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .workout-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          margin: 4px 0 2px;
        }

        .exercise-preview-row {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .exercise-preview-info { display: flex; flex-direction: column; gap: 2px; }
        .exercise-preview-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .exercise-preview-meta {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .workout-ready-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
        .workout-start-btn { padding: 14px; font-size: 16px; }
        .workout-ready-secondary { display: flex; gap: 10px; }
        .workout-ready-secondary .btn { font-size: 13px; padding: 10px 12px; }

        /* Active workout */
        .workout-active { display: flex; flex-direction: column; gap: 12px; padding: 16px 20px 24px; }
        .workout-active-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: var(--bg);
          padding-bottom: 8px;
          z-index: 5;
        }
        .workout-timer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
        }
        .workout-timer svg { color: #FF6B4A; }
        .workout-progress-count {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .workout-active-progress {
          height: 6px;
          border-radius: 999px;
          background: var(--border);
          overflow: hidden;
        }
        .workout-active-progress-fill {
          height: 100%;
          background: #FF6B4A;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .exercise-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .exercise-card-done {
          border-color: #1F7A5C;
          background: #F4FBF7;
        }

        .exercise-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          gap: 12px;
        }
        .exercise-card-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
        .exercise-section-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #FF6B4A;
        }
        .exercise-card-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .exercise-card-stats {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .exercise-status {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .exercise-status.done {
          background: #1F7A5C;
          color: #fff;
        }

        .exercise-card-collapsed-done {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 14px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #1F7A5C;
        }

        .exercise-card-detail {
          padding: 0 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .exercise-instructions, .exercise-form-tips {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .exercise-detail-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-secondary);
          margin: 0;
        }
        .exercise-detail-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text);
          font-weight: 500;
        }
        .exercise-form-tips .exercise-detail-text { color: var(--text-secondary); }

        .exercise-sets-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .set-btn {
          border: 2px solid var(--border);
          background: var(--surface);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .set-btn:hover { border-color: #1F7A5C; }
        .set-done {
          background: #1F7A5C;
          border-color: #1F7A5C;
          color: #fff;
        }

        .workout-finish-btn {
          margin-top: 8px;
          padding: 14px;
          font-size: 16px;
        }
        .workout-finish-hint {
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 600;
        }

        /* Feedback screen */
        .workout-feedback { display: flex; flex-direction: column; gap: 20px; padding-top: 24px; }
        .feedback-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .feedback-header h2 { font-size: 20px; font-weight: 700; margin: 0; }
        .feedback-header p { font-size: 14px; color: var(--text-secondary); margin: 0; }

        .feedback-options { display: flex; flex-direction: column; gap: 10px; }
        .feedback-option {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid var(--border);
          background: var(--surface);
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .feedback-option.selected { border-width: 2px; }
        .feedback-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .feedback-option span:not(.feedback-dot):not(.alt-badge) { flex: 1; }
        .feedback-skip { text-align: center; margin-top: 4px; }

        /* Summary screen */
        .workout-summary { display: flex; flex-direction: column; gap: 16px; padding-top: 16px; }
        .summary-hero { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 0; }
        .summary-check-circle {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: #1F7A5C;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          margin-bottom: 4px;
        }
        .summary-hero h2 { font-size: 22px; font-weight: 700; margin: 0; }
        .summary-duration { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin: 0; }

        .summary-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .summary-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .summary-stat-value { font-size: 22px; font-weight: 700; color: #FF6B4A; }
        .summary-stat-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }

        .summary-difficulty {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
        }
        .summary-difficulty-tag {
          font-size: 13px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
        }

        .summary-suggestion-card {
          background: #E4F3EC;
          border: 1px solid #C8E6D5;
          border-radius: 14px;
          padding: 14px;
        }
        .summary-suggestion-text {
          margin: 4px 0 0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.5;
          color: var(--text);
        }

        .summary-detail-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-secondary);
          margin: 0;
        }

        .summary-exercise-list { display: flex; flex-direction: column; gap: 6px; }
        .summary-exercise-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .summary-exercise-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .summary-exercise-sets {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .summary-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }

        /* History screen */
        .workout-history { display: flex; flex-direction: column; gap: 12px; }
        .workout-history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 40px 24px;
        }
        .history-empty-title { font-size: 16px; font-weight: 700; margin: 8px 0 0; }
        .history-empty-sub { font-size: 13px; color: var(--text-secondary); margin: 0 0 16px; }

        .history-list { display: flex; flex-direction: column; gap: 10px; }
        .history-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .history-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .history-card-date { font-size: 14px; font-weight: 700; margin: 0; }
        .history-card-meta { font-size: 12px; color: var(--text-secondary); margin: 2px 0 0; font-weight: 600; }
        .history-difficulty-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .history-card-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .history-card-suggestion {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.4;
          margin: 0;
          padding: 8px 10px;
          background: var(--bg);
          border-radius: 8px;
        }
        .history-back-btn { margin-top: 8px; }

        /* ===================== FOOD SYSTEM ===================== */

        .food-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          background: var(--bg);
          border-radius: 12px;
          padding: 4px;
        }
        .food-tab {
          flex: 1;
          border: none;
          background: none;
          border-radius: 8px;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .food-tab.active {
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 1px 3px rgba(16,24,40,0.08);
        }

        /* Today's food */
        .food-today { display: flex; flex-direction: column; gap: 16px; }
        .food-today-header { display: flex; justify-content: space-between; align-items: flex-end; }
        .food-today-day { margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); }
        .food-today-title { margin: 2px 0 0; font-size: 20px; font-weight: 700; }
        .food-today-eyebrow { font-size: 11px; font-weight: 600; color: var(--text-secondary); }

        .food-guidance-message {
          background: #FDF1DC;
          border: 1px solid #F5E5C3;
          border-radius: 14px;
          padding: 14px 16px;
        }
        .food-guidance-message p { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--text); }

        .food-tips-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
        }
        .food-tips-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.03em; color: var(--text-secondary);
          margin: 0 0 8px;
        }
        .food-tips-label svg { color: #F5A524; }
        .food-tips-list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
        .food-tips-list li { font-size: 13px; font-weight: 500; line-height: 1.4; color: var(--text); }

        .food-section-title {
          font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; color: var(--text-secondary);
          margin: 4px 0 8px;
        }

        .food-today-meals { display: flex; flex-direction: column; gap: 4px; }
        .food-meal-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .food-meal-card-header { display: flex; align-items: flex-start; gap: 12px; }
        .food-meal-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .food-meal-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .food-meal-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-secondary); }
        .food-meal-items { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.4; }

        .food-meal-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .food-tag {
          font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
          text-transform: uppercase; letter-spacing: 0.02em;
        }
        .food-tag-protein { background: #E4F3EC; color: #1F7A5C; }
        .food-tag-veg { background: #E6F7F1; color: #10B981; }
        .food-tag-fried { background: #FFEBE5; color: #FF6B4A; }
        .food-tag-sweet { background: #FDF1DC; color: #F5A524; }
        .food-tag-drink { background: #E1F5F7; color: #0EA5B7; }

        .food-empty-menu, .food-log-empty {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 8px; padding: 40px 24px;
        }
        .food-empty-title { font-size: 16px; font-weight: 700; margin: 8px 0 0; }
        .food-empty-sub { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.4; max-width: 260px; }
        .food-empty-menu .btn { margin-top: 8px; }

        /* Mess menu editor */
        .food-menu-editor { display: flex; flex-direction: column; gap: 16px; }
        .menu-view-toggle {
          display: flex; gap: 6px;
          background: var(--bg); border-radius: 12px; padding: 4px;
        }
        .menu-toggle-btn {
          flex: 1; border: none; background: none; border-radius: 8px;
          padding: 10px 8px; font-size: 13px; font-weight: 700;
          font-family: inherit; color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s;
        }
        .menu-toggle-btn.active {
          background: var(--surface); color: var(--text);
          box-shadow: 0 1px 3px rgba(16,24,40,0.08);
        }

        .menu-paste-btn {
          display: flex; align-items: center; gap: 8px;
          border: 1px dashed var(--border); background: var(--surface);
          border-radius: 12px; padding: 12px 16px;
          font-size: 13px; font-weight: 700; color: #F5A524;
          font-family: inherit; cursor: pointer; width: 100%;
        }

        .menu-paste-area { display: flex; flex-direction: column; gap: 8px; }
        .menu-paste-input { font-size: 13px; line-height: 1.5; }

        .menu-hint { margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.4; }

        .menu-general { display: flex; flex-direction: column; gap: 14px; }
        .menu-weekly { display: flex; flex-direction: column; gap: 16px; }
        .menu-day-block {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .menu-day-title { font-size: 14px; font-weight: 700; margin: 0; }
        .menu-save-btn { margin-top: 4px; }

        /* Food log */
        .food-log { display: flex; flex-direction: column; gap: 16px; }
        .food-log-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .food-log-title { font-size: 20px; font-weight: 700; margin: 0; }
        .food-log-sub { font-size: 13px; color: var(--text-secondary); margin: 2px 0 0; font-weight: 600; }

        .food-add-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .food-log-list { display: flex; flex-direction: column; gap: 14px; }
        .food-log-group { display: flex; flex-direction: column; gap: 6px; }
        .food-log-group-header { display: flex; align-items: center; gap: 8px; }
        .food-log-group-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-secondary); }

        .food-log-entry {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px 14px; gap: 8px;
        }
        .food-log-entry-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .food-log-entry-name { font-size: 14px; font-weight: 700; color: var(--text); }
        .food-log-entry-portion { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .food-log-delete { flex-shrink: 0; }

        /* ===================== WALKING TRACKER ===================== */

        .steps-ring-section {
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          padding: 8px 0 4px;
        }
        .ring-container { position: relative; display: flex; align-items: center; justify-content: center; }
        .ring-svg { transform: rotate(0deg); }
        .ring-progress { transition: stroke-dashoffset 0.5s ease; }
        .ring-content {
          position: absolute; display: flex; flex-direction: column;
          align-items: center; gap: 2px;
        }
        .ring-percent { font-size: 28px; font-weight: 700; color: var(--text); }
        .ring-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }

        .steps-encouragement {
          text-align: center; max-width: 280px; display: flex; align-items: center; gap: 6px; justify-content: center;
        }
        .steps-encouragement p { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-secondary); line-height: 1.4; }
        .steps-encouragement-done { color: #FF6B4A !important; }

        .steps-stats-row {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
          margin-top: 8px;
        }
        .step-stat-box {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 14px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .step-stat-value { font-size: 20px; font-weight: 700; }
        .step-stat-label { font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }

        .steps-section-label {
          font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--text-secondary); margin: 20px 0 10px;
        }

        .steps-quick-section { margin-top: 4px; }
        .steps-quick-row { display: flex; gap: 10px; }
        .steps-quick-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          border: 2px solid #E7F0FE; background: var(--surface); border-radius: 14px;
          padding: 14px 8px; font-size: 15px; font-weight: 700; color: #3B82F6;
          font-family: inherit; cursor: pointer; transition: all 0.2s;
        }
        .steps-quick-btn:hover { background: #E7F0FE; }
        .steps-quick-btn:active { transform: scale(0.97); }

        .steps-edit-section { margin-top: 8px; }
        .steps-edit-row { display: flex; align-items: center; gap: 8px; }
        .steps-edit-input { flex: 1; font-size: 18px; font-weight: 700; }
        .steps-current-total { flex: 1; font-size: 18px; font-weight: 700; color: var(--text); }

        .steps-weekly-section { margin-top: 8px; }
        .steps-weekly-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .steps-weekly-stat { display: flex; align-items: center; gap: 12px; }
        .steps-weekly-stat div { display: flex; flex-direction: column; gap: 2px; }
        .steps-weekly-value { font-size: 16px; font-weight: 700; color: var(--text); }
        .steps-weekly-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.03em; }

        .steps-history-section { margin-top: 12px; }
        .steps-history-toggle {
          display: flex; align-items: center; gap: 8px;
          border: 1px solid var(--border); background: var(--surface);
          border-radius: 12px; padding: 12px 16px; width: 100%;
          font-size: 13px; font-weight: 700; color: var(--text-secondary);
          font-family: inherit; cursor: pointer;
        }
        .steps-history-list {
          display: flex; flex-direction: column; gap: 6px; margin-top: 10px;
        }
        .steps-history-row {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 10px 14px; gap: 8px;
        }
        .steps-history-date { font-size: 13px; font-weight: 600; color: var(--text-secondary); flex: 1; }
        .steps-history-steps { font-size: 14px; font-weight: 700; color: var(--text); }
        .steps-history-target { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .steps-history-badge {
          display: flex; align-items: center; justify-content: center;
          min-width: 36px; padding: 4px 8px; border-radius: 8px;
          font-size: 12px; font-weight: 700; background: var(--bg); color: var(--text-secondary);
          flex-shrink: 0;
        }
        .steps-history-badge.done { background: #1F7A5C; color: #fff; }

        /* ===================== PROGRESS ===================== */

        .progress-weight-change {
          display: flex; align-items: center; gap: 8px;
          margin-top: 10px; padding: 10px 14px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px;
        }
        .progress-weight-change span { font-size: 13px; font-weight: 600; color: var(--text-secondary); }

        .weight-chart-svg { width: 100%; height: 110px; display: block; margin-top: 8px; }

        .progress-consistency-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 16px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .progress-consistency-row { display: flex; align-items: center; gap: 12px; }
        .progress-consistency-text { flex: 1; min-width: 0; }
      `}</style>

      {!profile ? (
        <SetupScreen onSave={handleProfileSave} />
      ) : (
        <>
          {page === "home" ? (
            <Home onNavigate={navigate} profile={profile} />
          ) : page === "profile" ? (
            <ProfilePage profile={profile} onSave={handleProfileSave} onBack={() => navigate("home")} />
          ) : page === "workout" ? (
            <WorkoutPage profile={profile} onBack={() => navigate("home")} />
          ) : page === "food" ? (
            <FoodPage profile={profile} onBack={() => navigate("home")} />
          ) : page === "activity" ? (
            <ActivityPage profile={profile} onBack={() => navigate("home")} />
          ) : page === "water" ? (
            <WaterPage profile={profile} onBack={() => navigate("home")} />
          ) : page === "sleep" ? (
            <SleepPage profile={profile} onBack={() => navigate("home")} />
          ) : page === "progress" ? (
            <ProgressPage profile={profile} onSaveProfile={handleProfileSave} onBack={() => navigate("home")} />
          ) : (
            <PageShell id={page} onBack={() => navigate("home")}>
              <EmptyPlaceholder id={page} />
            </PageShell>
          )}

          <BottomNav
            page={page}
            onNavigate={navigate}
            onMoreClick={() => setMoreOpen(true)}
            moreActive={moreActive}
          />
          <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onNavigate={navigate} />
        </>
      )}
    </div>
  );
}
