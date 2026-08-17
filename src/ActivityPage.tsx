import React, { useState } from "react";
import {
  Footprints,
  ArrowLeft,
  Plus,
  Pencil,
  Check,
  TrendingUp,
  History,
  Flame,
  X,
} from "lucide-react";
import {
  type FitnessLevel,
  type StepDay,
  getStepTarget,
  loadTodaySteps,
  addSteps,
  setSteps,
  loadStepHistory,
  getEncouragement,
  getWeekSummary,
  formatDate,
} from "@/activityData";

/* ---------------------------------------------------
   Props
--------------------------------------------------- */
type Profile = {
  fitnessLevel: FitnessLevel;
  avgSteps: string;
};

type Props = {
  profile: Profile;
  onBack: () => void;
};

/* ---------------------------------------------------
   Circular progress ring
--------------------------------------------------- */
function ProgressRing({ percent, size = 160 }: { percent: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, percent) / 100) * circumference;

  return (
    <div className="ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8EAED"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-progress"
        />
      </svg>
      <div className="ring-content">
        <span className="ring-percent">{Math.min(100, Math.round(percent))}%</span>
        <span className="ring-label">completed</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------
   Stat box
--------------------------------------------------- */
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="step-stat-box">
      <span className="step-stat-value" style={{ color }}>
        {value}
      </span>
      <span className="step-stat-label">{label}</span>
    </div>
  );
}

/* ---------------------------------------------------
   Main ActivityPage
--------------------------------------------------- */
export default function ActivityPage({ profile, onBack }: Props) {
  const [history] = useState<StepDay[]>(() => loadStepHistory());
  const [steps, setStepsState] = useState<number>(() => loadTodaySteps());
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const level: FitnessLevel = profile.fitnessLevel || "Starting";
  const avgSteps = Number(profile.avgSteps) || 0;
  const target = getStepTarget(level, avgSteps, history);

  const remaining = Math.max(0, target - steps);
  const percent = target > 0 ? (steps / target) * 100 : 0;
  const isComplete = steps >= target && target > 0;

  const encouragement = getEncouragement(steps, target, level);
  const weekSummary = getWeekSummary(history);

  const handleQuickAdd = (amount: number) => {
    const updated = addSteps(amount, target);
    setStepsState(updated);
  };

  const handleSaveEdit = () => {
    const val = Number(editValue);
    if (!isNaN(val) && val >= 0) {
      const updated = setSteps(val, target);
      setStepsState(updated);
    }
    setEditing(false);
    setEditValue("");
  };

  const startEdit = () => {
    setEditValue(String(steps));
    setEditing(true);
  };

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to Home">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-title">
          <span className="page-header-icon" style={{ background: "#E7F0FE", color: "#3B82F6" }}>
            <Footprints size={18} />
          </span>
          <h1>Activity</h1>
        </div>
        <span className="icon-btn-spacer" />
      </header>

      <div className="page-content">
        {/* Progress ring */}
        <div className="steps-ring-section">
          <ProgressRing percent={percent} />
          <div className="steps-encouragement">
            {isComplete && <Flame size={16} style={{ color: "#FF6B4A" }} />}
            <p className={isComplete ? "steps-encouragement-done" : ""}>{encouragement}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="steps-stats-row">
          <StatBox
            label="Today's target"
            value={target.toLocaleString()}
            color="#3B82F6"
          />
          <StatBox
            label="Current steps"
            value={steps.toLocaleString()}
            color="#171A1F"
          />
          <StatBox
            label="Remaining"
            value={remaining.toLocaleString()}
            color="#FF6B4A"
          />
        </div>

        {/* Quick add buttons */}
        <div className="steps-quick-section">
          <p className="steps-section-label">Quick add</p>
          <div className="steps-quick-row">
            <button
              className="steps-quick-btn"
              onClick={() => handleQuickAdd(500)}
            >
              <Plus size={16} />
              500
            </button>
            <button
              className="steps-quick-btn"
              onClick={() => handleQuickAdd(1000)}
            >
              <Plus size={16} />
              1,000
            </button>
            <button
              className="steps-quick-btn"
              onClick={() => handleQuickAdd(2000)}
            >
              <Plus size={16} />
              2,000
            </button>
          </div>
        </div>

        {/* Edit total */}
        <div className="steps-edit-section">
          <p className="steps-section-label">Today's total</p>
          {editing ? (
            <div className="steps-edit-row">
              <input
                type="number"
                className="input steps-edit-input"
                value={editValue}
                min="0"
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
                autoFocus
              />
              <button className="icon-btn" onClick={handleSaveEdit} aria-label="Save">
                <Check size={18} />
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setEditing(false);
                  setEditValue("");
                }}
                aria-label="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="steps-edit-row">
              <span className="steps-current-total">
                {steps.toLocaleString()} steps
              </span>
              <button className="icon-btn" onClick={startEdit} aria-label="Edit total">
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Weekly summary */}
        {history.length > 0 && (
          <div className="steps-weekly-section">
            <p className="steps-section-label">This week</p>
            <div className="steps-weekly-card">
              <div className="steps-weekly-stat">
                <TrendingUp size={18} style={{ color: "#3B82F6" }} />
                <div>
                  <span className="steps-weekly-value">
                    {weekSummary.totalSteps.toLocaleString()}
                  </span>
                  <span className="steps-weekly-label">total steps</span>
                </div>
              </div>
              <div className="steps-weekly-stat">
                <Footprints size={18} style={{ color: "#1F7A5C" }} />
                <div>
                  <span className="steps-weekly-value">
                    {weekSummary.avgSteps.toLocaleString()}
                  </span>
                  <span className="steps-weekly-label">avg / day</span>
                </div>
              </div>
              <div className="steps-weekly-stat">
                <Flame size={18} style={{ color: "#FF6B4A" }} />
                <div>
                  <span className="steps-weekly-value">
                    {weekSummary.daysCompleted}/{weekSummary.daysTracked}
                  </span>
                  <span className="steps-weekly-label">targets hit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History toggle */}
        {history.length > 0 && (
          <div className="steps-history-section">
            <button
              className="steps-history-toggle"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History size={16} />
              {showHistory ? "Hide history" : `Show history (${history.length})`}
            </button>

            {showHistory && (
              <div className="steps-history-list">
                {history.slice(0, 30).map((day) => {
                  const dayComplete = day.target > 0 && day.steps >= day.target;
                  return (
                    <div className="steps-history-row" key={day.date}>
                      <span className="steps-history-date">{formatDate(day.date)}</span>
                      <span className="steps-history-steps">
                        {day.steps.toLocaleString()}
                        <span className="steps-history-target">
                          {" / "}{day.target.toLocaleString()}
                        </span>
                      </span>
                      <span
                        className={`steps-history-badge ${dayComplete ? "done" : ""}`}
                      >
                        {dayComplete ? <Check size={14} /> : `${Math.round((day.steps / day.target) * 100)}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
