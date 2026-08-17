import React, { useState } from "react";
import { ArrowLeft, Droplet, Plus, Pencil, Check } from "lucide-react";
import {
  addWater,
  getWaterTargetMl,
  loadTodayWaterEntry,
  setTodayWater,
  mlToLiters,
} from "@/waterData";

type Props = {
  profile: any;
  onBack: () => void;
};

export default function WaterPage({ profile, onBack }: Props) {
  const targetMl = getWaterTargetMl(profile);
  const [entry, setEntry] = useState(() => loadTodayWaterEntry());
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(entry.ml));

  const refresh = () => setEntry(loadTodayWaterEntry());

  const add = (amount: number) => {
    addWater(amount, targetMl);
    refresh();
  };

  const saveManual = () => {
    const value = Math.max(0, Number(input) || 0);
    setTodayWater(value, targetMl);
    refresh();
    setEditing(false);
  };

  const progress = Math.min(
    100,
    Math.round((entry.ml / Math.max(targetMl, 1)) * 100)
  );

  const remaining = Math.max(0, targetMl - entry.ml);

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>

        <div className="page-header-title">
          <span
            className="page-header-icon"
            style={{ background: "#E1F5F7", color: "#0EA5B7" }}
          >
            <Droplet size={18} />
          </span>
          <h1>Water</h1>
        </div>

        <span className="icon-btn-spacer" />
      </header>

      <div className="page-content">
        <p className="steps-section-label">Today's water</p>

        <div className="steps-stats-row">
          <div className="step-stat-box">
            <span className="step-stat-value">
              {mlToLiters(entry.ml).toFixed(1)}L
            </span>
            <span className="step-stat-label">Consumed</span>
          </div>

          <div className="step-stat-box">
            <span className="step-stat-value">
              {mlToLiters(targetMl).toFixed(1)}L
            </span>
            <span className="step-stat-label">Target</span>
          </div>

          <div className="step-stat-box">
            <span className="step-stat-value">
              {mlToLiters(remaining).toFixed(1)}L
            </span>
            <span className="step-stat-label">Remaining</span>
          </div>
        </div>

        <div className="progress-track" style={{ marginTop: 20 }}>
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: "#0EA5B7",
            }}
          />
        </div>

        <p style={{ marginTop: 10 }}>{progress}% complete</p>

        <p className="steps-section-label">Add water</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[250, 300, 500].map((amount) => (
            <button
              key={amount}
              className="secondary-btn"
              onClick={() => add(amount)}
            >
              <Plus size={16} />
              {amount} ml
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          {!editing ? (
            <button
              className="secondary-btn"
              onClick={() => {
                setInput(String(entry.ml));
                setEditing(true);
              }}
            >
              <Pencil size={16} />
              Edit total
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                type="number"
                min="0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ml"
              />
              <button className="secondary-btn" onClick={saveManual}>
                <Check size={16} />
                Save
              </button>
            </div>
          )}
        </div>

        <p style={{ marginTop: 20 }}>Drinks today: {entry.drinks}</p>

        <div className="card" style={{ marginTop: 20 }}>
          <strong>Simple goal</strong>
          <p style={{ marginTop: 8 }}>
            Spread your water intake through the day instead of drinking a
            large amount at once.
          </p>
        </div>
      </div>
    </div>
  );
}