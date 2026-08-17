import React, { useState } from "react";
import { ArrowLeft, Moon, Check } from "lucide-react";
import {
  calculateSleepHours,
  loadLastSleep,
  saveSleep,
} from "@/sleepData";

type Props = {
  profile: any;
  onBack: () => void;
};

export default function SleepPage({ onBack }: Props) {
  const last = loadLastSleep();

  const [bedtime, setBedtime] = useState(last?.bedtime ?? "23:00");
  const [wakeTime, setWakeTime] = useState(last?.wakeTime ?? "07:00");
  const [targetHours] = useState(8);
  const [saved, setSaved] = useState(!!last);

  const hours = calculateSleepHours(bedtime, wakeTime);
  const difference = Math.round((hours - targetHours) * 10) / 10;

  const save = () => {
    saveSleep(bedtime, wakeTime, targetHours);
    setSaved(true);
  };

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>

        <div className="page-header-title">
          <span
            className="page-header-icon"
            style={{ background: "#EEEBFD", color: "#7C6FF0" }}
          >
            <Moon size={18} />
          </span>
          <h1>Sleep</h1>
        </div>

        <span className="icon-btn-spacer" />
      </header>

      <div className="page-content">
        <p className="steps-section-label">Last night's sleep</p>

        <div className="steps-stats-row">
          <div className="step-stat-box">
            <span className="step-stat-value">{hours.toFixed(1)}h</span>
            <span className="step-stat-label">Slept</span>
          </div>

          <div className="step-stat-box">
            <span className="step-stat-value">{targetHours}h</span>
            <span className="step-stat-label">Target</span>
          </div>

          <div className="step-stat-box">
            <span className="step-stat-value">
              {difference > 0 ? "+" : ""}
              {difference.toFixed(1)}h
            </span>
            <span className="step-stat-label">Difference</span>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <p className="steps-section-label">Bedtime</p>
          <input
            className="input"
            type="time"
            value={bedtime}
            onChange={(e) => {
              setBedtime(e.target.value);
              setSaved(false);
            }}
          />

          <p className="steps-section-label" style={{ marginTop: 18 }}>
            Wake-up time
          </p>
          <input
            className="input"
            type="time"
            value={wakeTime}
            onChange={(e) => {
              setWakeTime(e.target.value);
              setSaved(false);
            }}
          />

          <p style={{ marginTop: 16 }}>
            Calculated sleep: <strong>{hours.toFixed(1)} hours</strong>
          </p>

          <button
            className="secondary-btn"
            style={{ marginTop: 14 }}
            onClick={save}
          >
            <Check size={16} />
            {saved ? "Saved" : "Save sleep"}
          </button>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <strong>Sleep target</strong>
          <p style={{ marginTop: 8 }}>
            A general target for adults is around 7–9 hours of sleep. Aim for
            a consistent schedule.
          </p>
        </div>
      </div>
    </div>
  );
}