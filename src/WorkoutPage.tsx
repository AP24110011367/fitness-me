import React, { useState, useRef, useEffect } from "react";
import {
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowLeft,
  RotateCcw,
  Flame,
  AlertTriangle,
  History,
  Play,
  X,
} from "lucide-react";
import {
  generateWorkout,
  getNextSuggestion,
  addHistoryEntry,
  loadHistory,
  PAIN_REMINDER,
  type FitnessLevel,
  type Difficulty,
  type GeneratedWorkout,
  type GeneratedExercise,
  type WorkoutHistoryEntry,
} from "@/workoutData";

/* ---------------------------------------------------
   Types
--------------------------------------------------- */
type Profile = {
  fitnessLevel: FitnessLevel;
  goals: string[];
  workoutTime: string;
  equipment: string[];
};

type Props = {
  profile: Profile;
  onBack: () => void;
};

type Phase = "ready" | "active" | "feedback" | "summary" | "history";

/* ---------------------------------------------------
   Duration formatter
--------------------------------------------------- */
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ---------------------------------------------------
   Ready screen — shows workout preview before starting
--------------------------------------------------- */
function ReadyScreen({
  workout,
  level,
  lastSuggestion,
  onStart,
  onRegenerate,
  onShowHistory,
  historyCount,
}: {
  workout: GeneratedWorkout;
  level: FitnessLevel;
  lastSuggestion: string | null;
  onStart: () => void;
  onRegenerate: () => void;
  onShowHistory: () => void;
  historyCount: number;
}) {
  const warmup = workout.exercises.filter((e) => e.section === "warmup");
  const main = workout.exercises.filter((e) => e.section === "main");
  const cooldown = workout.exercises.filter((e) => e.section === "cooldown");

  return (
    <div className="workout-ready">
      <div className="workout-preview-header">
        <div className="workout-level-badge" style={{ background: "#FFEBE5", color: "#FF6B4A" }}>
          <Dumbbell size={16} />
          {level} level
        </div>
        <div className="workout-time-badge" style={{ background: "#EEF0F2", color: "#6B7280" }}>
          <Clock size={16} />
          ~{workout.estimatedMin} min
        </div>
      </div>

      {lastSuggestion && (
        <div className="workout-suggestion-card">
          <p className="workout-suggestion-label">From your last session</p>
          <p className="workout-suggestion-text">{lastSuggestion}</p>
        </div>
      )}

      <div className="workout-pain-warning">
        <AlertTriangle size={16} />
        <p>{PAIN_REMINDER}</p>
      </div>

      <div className="workout-section-block">
        <p className="workout-section-title">Warm-up</p>
        {warmup.map((ex) => (
          <ExercisePreviewRow key={ex.id} ex={ex} />
        ))}
      </div>

      <div className="workout-section-block">
        <p className="workout-section-title">Main workout</p>
        {main.map((ex) => (
          <ExercisePreviewRow key={ex.id} ex={ex} />
        ))}
      </div>

      <div className="workout-section-block">
        <p className="workout-section-title">Cool-down</p>
        {cooldown.map((ex) => (
          <ExercisePreviewRow key={ex.id} ex={ex} />
        ))}
      </div>

      <div className="workout-ready-actions">
        <button className="btn btn-primary workout-start-btn" onClick={onStart}>
          <Play size={18} />
          Start workout
        </button>
        <div className="workout-ready-secondary">
          <button className="btn btn-secondary" onClick={onRegenerate}>
            <RotateCcw size={16} />
            New plan
          </button>
          <button
            className="btn btn-secondary"
            onClick={onShowHistory}
            disabled={historyCount === 0}
          >
            <History size={16} />
            History{historyCount > 0 ? ` (${historyCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExercisePreviewRow({ ex }: { ex: GeneratedExercise }) {
  return (
    <div className="exercise-preview-row">
      <div className="exercise-preview-info">
        <span className="exercise-preview-name">
          {ex.name}
          {ex.isAlternative && <span className="alt-badge">alt</span>}
        </span>
        <span className="exercise-preview-meta">
          {ex.muscle} · {ex.sets} sets · {ex.reps}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   Active workout — set-by-set completion
--------------------------------------------------- */
function ActiveWorkout({
  workout,
  onComplete,
  onCancel,
}: {
  workout: GeneratedWorkout;
  onComplete: (exercises: GeneratedExercise[], completedSets: number[], durationSec: number) => void;
  onCancel: () => void;
}) {
  const [exerciseStates, setExerciseStates] = useState(
    workout.exercises.map((ex) => ({
      completedSets: Array(ex.sets).fill(false),
      expanded: false,
    })),
  );
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSet = (exIdx: number, setIdx: number) => {
    setExerciseStates((prev) =>
      prev.map((state, i) => {
        if (i !== exIdx) return state;
        const newCompleted = [...state.completedSets];
        newCompleted[setIdx] = !newCompleted[setIdx];
        return { ...state, completedSets: newCompleted };
      }),
    );
  };

  const toggleExpand = (exIdx: number) => {
    setExerciseStates((prev) =>
      prev.map((state, i) =>
        i === exIdx ? { ...state, expanded: !state.expanded } : state,
      ),
    );
  };

  const allComplete = exerciseStates.every((s) =>
    s.completedSets.every(Boolean),
  );

  const totalCompleted = exerciseStates.reduce(
    (sum, s) => sum + s.completedSets.filter(Boolean).length,
    0,
  );

  const handleFinish = () => {
    const completedSetsArr = exerciseStates.map((s) =>
      s.completedSets.filter(Boolean).length,
    );
    onComplete(workout.exercises, completedSetsArr, elapsed);
  };

  return (
    <div className="workout-active">
      <div className="workout-active-header">
        <button className="icon-btn" onClick={onCancel} aria-label="Cancel workout">
          <X size={20} />
        </button>
        <div className="workout-timer">
          <Clock size={16} />
          {formatDuration(elapsed)}
        </div>
        <span className="workout-progress-count">
          {totalCompleted} sets done
        </span>
      </div>

      <div className="workout-active-progress">
        <div
          className="workout-active-progress-fill"
          style={{
            width: `${Math.round((totalCompleted / exerciseStates.reduce((s, st) => s + st.completedSets.length, 0)) * 100)}%`,
          }}
        />
      </div>

      {workout.exercises.map((ex, exIdx) => {
        const state = exerciseStates[exIdx];
        const exCompleted = state.completedSets.filter(Boolean).length;
        const exAllDone = exCompleted === ex.sets;

        return (
          <div
            key={ex.id}
            className={`exercise-card ${exAllDone ? "exercise-card-done" : ""}`}
          >
            <button
              className="exercise-card-header"
              onClick={() => toggleExpand(exIdx)}
            >
              <div className="exercise-card-info">
                <span className="exercise-section-tag">
                  {ex.section === "warmup"
                    ? "Warm-up"
                    : ex.section === "cooldown"
                      ? "Cool-down"
                      : ex.muscle}
                </span>
                <span className="exercise-card-name">
                  {ex.name}
                  {ex.isAlternative && <span className="alt-badge">alt</span>}
                </span>
                <span className="exercise-card-stats">
                  {ex.sets} sets · {ex.reps} · rest {ex.rest}
                </span>
              </div>
              <span className={`exercise-status ${exAllDone ? "done" : ""}`}>
                {exAllDone ? <Check size={18} /> : `${exCompleted}/${ex.sets}`}
              </span>
            </button>

            {state.expanded && (
              <div className="exercise-card-detail">
                <div className="exercise-instructions">
                  <p className="exercise-detail-label">How to do it</p>
                  <p className="exercise-detail-text">{ex.instructions}</p>
                </div>
                <div className="exercise-form-tips">
                  <p className="exercise-detail-label">Form tips</p>
                  <p className="exercise-detail-text">{ex.formTips}</p>
                </div>
                <div className="exercise-sets-list">
                  {state.completedSets.map((done, setIdx) => (
                    <button
                      key={setIdx}
                      className={`set-btn ${done ? "set-done" : ""}`}
                      onClick={() => toggleSet(exIdx, setIdx)}
                    >
                      {done ? <Check size={16} /> : `Set ${setIdx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!state.expanded && exAllDone && (
              <div className="exercise-card-collapsed-done">
                <Check size={14} /> All sets complete
              </div>
            )}
          </div>
        );
      })}

      <button
        className="btn btn-primary workout-finish-btn"
        onClick={handleFinish}
        disabled={totalCompleted === 0}
      >
        <Check size={18} />
        {allComplete ? "Finish workout" : "Finish & rate"}
      </button>
      <p className="workout-finish-hint">
        {totalCompleted === 0
          ? "Complete at least one set to finish"
          : allComplete
            ? "All sets complete!"
            : `${totalCompleted} of ${exerciseStates.reduce((s, st) => s + st.completedSets.length, 0)} sets done — you can finish early`}
      </p>
    </div>
  );
}

/* ---------------------------------------------------
   Feedback screen — difficulty rating
--------------------------------------------------- */
const DIFFICULTY_OPTIONS: { label: Difficulty; color: string; bg: string }[] = [
  { label: "Very easy", color: "#3B82F6", bg: "#E7F0FE" },
  { label: "Easy", color: "#10B981", bg: "#E6F7F1" },
  { label: "Good", color: "#1F7A5C", bg: "#E4F3EC" },
  { label: "Hard", color: "#F5A524", bg: "#FDF1DC" },
  { label: "Too hard", color: "#EF4444", bg: "#FEECEC" },
];

function FeedbackScreen({
  onSubmit,
  onSkip,
}: {
  onSubmit: (difficulty: Difficulty) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<Difficulty | null>(null);

  return (
    <div className="workout-feedback">
      <div className="feedback-header">
        <Flame size={32} style={{ color: "#FF6B4A" }} />
        <h2>How was that workout?</h2>
        <p>Your feedback helps adjust your next session.</p>
      </div>

      <div className="feedback-options">
        {DIFFICULTY_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className={`feedback-option ${selected === opt.label ? "selected" : ""}`}
            style={{
              background: selected === opt.label ? opt.bg : undefined,
              borderColor: selected === opt.label ? opt.color : undefined,
            }}
            onClick={() => setSelected(opt.label)}
          >
            <span
              className="feedback-dot"
              style={{ background: opt.color }}
            />
            {opt.label}
            {selected === opt.label && <Check size={18} style={{ color: opt.color }} />}
          </button>
        ))}
      </div>

      <button
        className="btn btn-primary"
        disabled={!selected}
        onClick={() => selected && onSubmit(selected)}
      >
        Submit feedback
      </button>
      <button className="link-btn feedback-skip" onClick={onSkip}>
        Skip and see summary
      </button>
    </div>
  );
}

/* ---------------------------------------------------
   Summary screen — post-workout results
--------------------------------------------------- */
function SummaryScreen({
  exercises,
  completedSets,
  durationSec,
  difficulty,
  nextSuggestion,
  onDone,
  onHistory,
}: {
  exercises: GeneratedExercise[];
  completedSets: number[];
  durationSec: number;
  difficulty: Difficulty | null;
  nextSuggestion: string;
  onDone: () => void;
  onHistory: () => void;
}) {
  const totalSets = exercises.reduce((s, ex) => s + ex.sets, 0);
  const totalCompleted = completedSets.reduce((s, c) => s + c, 0);
  const completedExercises = completedSets.filter((c, i) => {
    const ex = exercises[i];
    return c > 0;
  }).length;

  return (
    <div className="workout-summary">
      <div className="summary-hero">
        <div className="summary-check-circle">
          <Check size={32} />
        </div>
        <h2>Workout complete!</h2>
        <p className="summary-duration">{formatDuration(durationSec)}</p>
      </div>

      <div className="summary-stats-grid">
        <div className="summary-stat">
          <span className="summary-stat-value">{completedExercises}</span>
          <span className="summary-stat-label">Exercises</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{totalCompleted}</span>
          <span className="summary-stat-label">Sets done</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-value">{totalSets}</span>
          <span className="summary-stat-label">Total sets</span>
        </div>
      </div>

      {difficulty && (
        <div className="summary-difficulty">
          <span className="summary-detail-label">Difficulty felt like</span>
          <span
            className="summary-difficulty-tag"
            style={{
              background:
                DIFFICULTY_OPTIONS.find((d) => d.label === difficulty)?.bg,
              color:
                DIFFICULTY_OPTIONS.find((d) => d.label === difficulty)?.color,
            }}
          >
            {difficulty}
          </span>
        </div>
      )}

      <div className="summary-suggestion-card">
        <p className="summary-detail-label">Next session suggestion</p>
        <p className="summary-suggestion-text">{nextSuggestion}</p>
      </div>

      <div className="summary-exercise-list">
        <p className="summary-detail-label">Completed exercises</p>
        {exercises.map((ex, i) => (
          <div key={ex.id} className="summary-exercise-row">
            <span className="summary-exercise-name">
              {ex.name}
              {ex.isAlternative && <span className="alt-badge">alt</span>}
            </span>
            <span className="summary-exercise-sets">
              {completedSets[i]}/{ex.sets} sets
            </span>
          </div>
        ))}
      </div>

      <div className="summary-actions">
        <button className="btn btn-primary" onClick={onDone}>
          Back to workout
        </button>
        <button className="btn btn-secondary" onClick={onHistory}>
          <History size={16} />
          View history
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   History screen
--------------------------------------------------- */
function HistoryScreen({
  history,
  onBack,
}: {
  history: WorkoutHistoryEntry[];
  onBack: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="workout-history-empty">
        <History size={32} style={{ color: "#FF6B4A" }} />
        <p className="history-empty-title">No workouts yet</p>
        <p className="history-empty-sub">Your completed workouts will appear here.</p>
        <button className="btn btn-primary" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="workout-history">
      <div className="history-list">
        {history.map((entry) => (
          <div key={entry.id} className="history-card">
            <div className="history-card-header">
              <div>
                <p className="history-card-date">{formatDate(entry.date)}</p>
                <p className="history-card-meta">
                  {entry.level} · {formatDuration(entry.durationSec)}
                </p>
              </div>
              <span
                className="history-difficulty-tag"
                style={{
                  background:
                    DIFFICULTY_OPTIONS.find((d) => d.label === entry.difficulty)
                      ?.bg,
                  color:
                    DIFFICULTY_OPTIONS.find((d) => d.label === entry.difficulty)
                      ?.color,
                }}
              >
                {entry.difficulty}
              </span>
            </div>
            <div className="history-card-stats">
              <span>{entry.exercises.length} exercises</span>
              <span>{entry.completedSets}/{entry.totalSets} sets</span>
            </div>
            {entry.nextSuggestion && (
              <p className="history-card-suggestion">{entry.nextSuggestion}</p>
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-secondary history-back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );
}

/* ---------------------------------------------------
   Main WorkoutPage — orchestrates phases
--------------------------------------------------- */
export default function WorkoutPage({ profile, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [activeExercises, setActiveExercises] = useState<GeneratedExercise[]>([]);
  const [activeCompletedSets, setActiveCompletedSets] = useState<number[]>([]);
  const [activeDuration, setActiveDuration] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>(() =>
    loadHistory(),
  );

  // Generate workout on mount and when phase returns to ready
  useEffect(() => {
    if (phase === "ready" && !workout) {
      const w = generateWorkout(
        profile.fitnessLevel || "Starting",
        profile.goals || [],
        profile.equipment || [],
        profile.workoutTime || "Morning",
        history,
      );
      setWorkout(w);
    }
  }, [phase, workout, profile, history]);

  const lastSuggestion = history.length > 0 ? history[0].nextSuggestion : null;

  const handleStart = () => {
    setPhase("active");
  };

  const handleRegenerate = () => {
    const w = generateWorkout(
      profile.fitnessLevel || "Starting",
      profile.goals || [],
      profile.equipment || [],
      profile.workoutTime || "Morning",
      history,
    );
    setWorkout(w);
  };

  const handleComplete = (
    exercises: GeneratedExercise[],
    completedSets: number[],
    durationSec: number,
  ) => {
    setActiveExercises(exercises);
    setActiveCompletedSets(completedSets);
    setActiveDuration(durationSec);
    setPhase("feedback");
  };

  const handleCancelWorkout = () => {
    if (confirm("Cancel this workout? Your progress won't be saved.")) {
      setPhase("ready");
    }
  };

  const handleSubmitFeedback = (diff: Difficulty) => {
    setDifficulty(diff);
    saveWorkout(diff);
    setPhase("summary");
  };

  const handleSkipFeedback = () => {
    setDifficulty(null);
    saveWorkout("Good");
    setPhase("summary");
  };

  const saveWorkout = (diff: Difficulty) => {
    const level = profile.fitnessLevel || "Starting";
    const entry: WorkoutHistoryEntry = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      level,
      goals: profile.goals || [],
      exercises: activeExercises.map((ex, i) => ({
        name: ex.name,
        muscle: ex.muscle,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        completedSets: activeCompletedSets[i] || 0,
      })),
      totalSets: activeExercises.reduce((s, ex) => s + ex.sets, 0),
      completedSets: activeCompletedSets.reduce((s, c) => s + c, 0),
      durationSec: activeDuration,
      difficulty: diff,
      nextSuggestion: getNextSuggestion(level, diff, history),
    };
    const updated = addHistoryEntry(entry);
    setHistory(updated);
  };

  const handleDone = () => {
    setWorkout(null);
    setDifficulty(null);
    setActiveExercises([]);
    setActiveCompletedSets([]);
    setActiveDuration(0);
    setPhase("ready");
  };

  // ---- Render ----
  if (phase === "history") {
    return (
      <div className="page">
        <header className="page-header">
          <button className="icon-btn" onClick={() => setPhase("ready")} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="page-header-title">
            <span className="page-header-icon" style={{ background: "#FFEBE5", color: "#FF6B4A" }}>
              <History size={18} />
            </span>
            <h1>Workout History</h1>
          </div>
          <span className="icon-btn-spacer" />
        </header>
        <div className="page-content">
          <HistoryScreen history={history} onBack={() => setPhase("ready")} />
        </div>
      </div>
    );
  }

  if (phase === "active" && workout) {
    return (
      <ActiveWorkout
        workout={workout}
        onComplete={handleComplete}
        onCancel={handleCancelWorkout}
      />
    );
  }

  if (phase === "feedback") {
    return (
      <div className="page">
        <div className="page-content">
          <FeedbackScreen
            onSubmit={handleSubmitFeedback}
            onSkip={handleSkipFeedback}
          />
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    const nextSuggestion = history.length > 0 ? history[0].nextSuggestion : "";
    return (
      <div className="page">
        <div className="page-content">
          <SummaryScreen
            exercises={activeExercises}
            completedSets={activeCompletedSets}
            durationSec={activeDuration}
            difficulty={difficulty}
            nextSuggestion={nextSuggestion}
            onDone={handleDone}
            onHistory={() => setPhase("history")}
          />
        </div>
      </div>
    );
  }

  // Ready phase
  if (!workout) {
    return (
      <div className="page">
        <header className="page-header">
          <button className="icon-btn" onClick={onBack} aria-label="Back to Home">
            <ArrowLeft size={20} />
          </button>
          <div className="page-header-title">
            <span className="page-header-icon" style={{ background: "#FFEBE5", color: "#FF6B4A" }}>
              <Dumbbell size={18} />
            </span>
            <h1>Workout</h1>
          </div>
          <span className="icon-btn-spacer" />
        </header>
        <div className="page-content">
          <p style={{ textAlign: "center", color: "#6B7280", marginTop: 40 }}>
            Preparing your workout…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to Home">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-title">
          <span className="page-header-icon" style={{ background: "#FFEBE5", color: "#FF6B4A" }}>
            <Dumbbell size={18} />
          </span>
          <h1>Workout</h1>
        </div>
        <span className="icon-btn-spacer" />
      </header>
      <div className="page-content">
        <ReadyScreen
          workout={workout}
          level={profile.fitnessLevel || "Starting"}
          lastSuggestion={lastSuggestion}
          onStart={handleStart}
          onRegenerate={handleRegenerate}
          onShowHistory={() => setPhase("history")}
          historyCount={history.length}
        />
      </div>
    </div>
  );
}
