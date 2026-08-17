import React, { useState } from "react";
import {
  Apple,
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  Utensils,
  Droplet,
  Sun,
  Moon,
  Coffee,
  Cookie,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import {
  type MessMenu,
  type MessDayMenu,
  type DailyFoodLog,
  type LogMealType,
  type Portion,
  type MealType,
  type FoodLogEntry,
  MEAL_LABELS,
  MEAL_ORDER,
  PORTION_OPTIONS,
  PORTION_DESCRIPTIONS,
  DAY_NAMES,
  loadMessMenu,
  saveMessMenu,
  parsePastedMenu,
  getTodayMenu,
  loadFoodLog,
  addFoodEntry,
  removeFoodEntry,
  generateFoodGuidance,
  getPortionNote,
  categorizeFood,
} from "@/foodData";

/* ---------------------------------------------------
   Types for props
--------------------------------------------------- */
type Profile = {
  goals: string[];
};

type Props = {
  profile: Profile;
  onBack: () => void;
};

type Tab = "today" | "menu" | "log";

/* ---------------------------------------------------
   Meal icons
--------------------------------------------------- */
const MEAL_ICONS: Record<LogMealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Cookie,
  dinner: Moon,
  extra: Cookie,
  drinks: Droplet,
};

const MEAL_COLORS: Record<LogMealType, { color: string; tint: string }> = {
  breakfast: { color: "#F5A524", tint: "#FDF1DC" },
  lunch: { color: "#3B82F6", tint: "#E7F0FE" },
  snacks: { color: "#F5A524", tint: "#FDF1DC" },
  dinner: { color: "#7C6FF0", tint: "#EEEBFD" },
  extra: { color: "#FF6B4A", tint: "#FFEBE5" },
  drinks: { color: "#0EA5B7", tint: "#E1F5F7" },
};

/* ---------------------------------------------------
   Today's Food — guidance + today's mess items
--------------------------------------------------- */
function TodayFood({
  menu,
  goals,
  log,
  onGoMenu,
}: {
  menu: MessMenu;
  goals: string[];
  log: DailyFoodLog;
  onGoMenu: () => void;
}) {
  const guidance = generateFoodGuidance(menu, goals, log);
  const todayMenu = getTodayMenu(menu);
  const todayName = DAY_NAMES[(new Date().getDay() + 6) % 7];

  const meals: { type: MealType; label: string; items: string }[] = [
    { type: "breakfast", label: "Breakfast", items: todayMenu.breakfast },
    { type: "lunch", label: "Lunch", items: todayMenu.lunch },
    { type: "snacks", label: "Snacks", items: todayMenu.snacks },
    { type: "dinner", label: "Dinner", items: todayMenu.dinner },
  ];

  return (
    <div className="food-today">
      <div className="food-today-header">
        <div>
          <p className="food-today-day">{todayName}</p>
          <h2 className="food-today-title">Today's food</h2>
        </div>
        <span className="food-today-eyebrow">From your mess</span>
      </div>

      <div className="food-guidance-message">
        <p>{guidance.message}</p>
      </div>

      {guidance.tips.length > 0 && (
        <div className="food-tips-card">
          <p className="food-tips-label">
            <Info size={14} />
            Gentle tips
          </p>
          <ul className="food-tips-list">
            {guidance.tips.map((tip: string, i: number) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {meals.filter((m) => m.items).length > 0 ? (
        <div className="food-today-meals">
          <p className="food-section-title">Today in your mess</p>
          {meals
            .filter((m) => m.items)
            .map((meal) => {
              const Icon = MEAL_ICONS[meal.type];
              const colors = MEAL_COLORS[meal.type];
              const cats = categorizeFood(meal.items);
              return (
                <div key={meal.type} className="food-meal-card">
                  <div className="food-meal-card-header">
                    <span
                      className="food-meal-icon"
                      style={{ background: colors.tint, color: colors.color }}
                    >
                      <Icon size={18} />
                    </span>
                    <div className="food-meal-info">
                      <span className="food-meal-label">{meal.label}</span>
                      <span className="food-meal-items">{meal.items}</span>
                    </div>
                  </div>
                  {(cats.isFried || cats.isSweet || cats.isSugaryDrink || cats.isProtein || cats.isVeg) && (
                    <div className="food-meal-tags">
                      {cats.isProtein && <span className="food-tag food-tag-protein">Protein</span>}
                      {cats.isVeg && <span className="food-tag food-tag-veg">Veg</span>}
                      {cats.isFried && <span className="food-tag food-tag-fried">Fried</span>}
                      {cats.isSweet && <span className="food-tag food-tag-sweet">Sweet</span>}
                      {cats.isSugaryDrink && <span className="food-tag food-tag-drink">Sugary drink</span>}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="food-empty-menu">
          <ClipboardList size={32} style={{ color: "#F5A524" }} />
          <p className="food-empty-title">No mess menu set</p>
          <p className="food-empty-sub">
            Add what's available in your mess to get personalized food guidance.
          </p>
          <button className="btn btn-primary" onClick={onGoMenu}>
            <Plus size={16} />
            Set up mess menu
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------
   Mess Menu — enter meals, paste weekly menu
--------------------------------------------------- */
function MessMenuEditor({
  menu,
  onSave,
}: {
  menu: MessMenu;
  onSave: (menu: MessMenu) => void;
}) {
  const [editMenu, setEditMenu] = useState<MessMenu>(menu);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [view, setView] = useState<"general" | "weekly">(
    menu.hasWeeklyMenu ? "weekly" : "general",
  );

  const updateGeneral = (meal: MealType, value: string) => {
    const key = `general${meal.charAt(0).toUpperCase()}${meal.slice(1)}` as keyof MessMenu;
    setEditMenu((m: any) => ({ ...m, [key]: value }));
  };

  const updateDay = (day: string, meal: MealType, value: string) => {
    setEditMenu((m: any) => ({
      ...m,
      days: {
        ...m.days,
        [day]: {
          ...(m.days[day] || { breakfast: "", lunch: "", snacks: "", dinner: "" }),
          [meal]: value,
        },
      },
    }));
  };

  const handlePaste = () => {
    const parsed = parsePastedMenu(pasteText);
    const merged: MessMenu = { ...editMenu };
    if (parsed.days) {
      merged.days = { ...merged.days, ...parsed.days };
      merged.hasWeeklyMenu = true;
    }
    setEditMenu(merged);
    setPasteText("");
    setPasteOpen(false);
    setView("weekly");
  };

  const handleSave = () => {
    const toSave: MessMenu = {
      ...editMenu,
      hasWeeklyMenu: Object.keys(editMenu.days || {}).length > 0,
    };
    saveMessMenu(toSave);
    onSave(toSave);
  };

  const meals: MealType[] = ["breakfast", "lunch", "snacks", "dinner"];

  return (
    <div className="food-menu-editor">
      <div className="menu-view-toggle">
        <button
          className={`menu-toggle-btn ${view === "general" ? "active" : ""}`}
          onClick={() => setView("general")}
        >
          General menu
        </button>
        <button
          className={`menu-toggle-btn ${view === "weekly" ? "active" : ""}`}
          onClick={() => setView("weekly")}
        >
          Weekly menu
        </button>
      </div>

      <button
        className="menu-paste-btn"
        onClick={() => setPasteOpen((v) => !v)}
      >
        <ClipboardList size={16} />
        {pasteOpen ? "Cancel paste" : "Paste weekly menu"}
      </button>

      {pasteOpen && (
        <div className="menu-paste-area">
          <textarea
            className="input textarea menu-paste-input"
            rows={6}
            placeholder={
              "Paste your mess menu like:\n\nMonday:\nBreakfast - Poha, eggs\nLunch - Dal, rice, sabzi\nSnacks - Samosa, tea\nDinner - Roti, paneer\n\nTuesday:\nBreakfast - Upma\nLunch - Rajma, rice\n..."
            }
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button className="btn btn-primary btn-small" onClick={handlePaste}>
            Import menu
          </button>
        </div>
      )}

      {view === "general" ? (
        <div className="menu-general">
          <p className="menu-hint">
            Enter what's usually available in your mess. These are used as defaults
            when no specific day menu is set.
          </p>
          {meals.map((meal) => {
            const key = `general${meal.charAt(0).toUpperCase()}${meal.slice(1)}` as keyof MessMenu;
            return (
              <div className="form-field" key={meal}>
                <label className="form-label">
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </label>
                <textarea
                  className="input textarea"
                  rows={2}
                  placeholder={`e.g. ${meal === "breakfast" ? "Poha, eggs, tea" : meal === "lunch" ? "Dal, rice, sabzi, salad" : meal === "snacks" ? "Samosa, tea, biscuits" : "Roti, paneer, dal, rice"}`}
                  value={(editMenu[key] as string) || ""}
                  onChange={(e) => updateGeneral(meal, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="menu-weekly">
          <p className="menu-hint">
            Set specific meals for each day. Paste a full menu above to fill this quickly.
          </p>
          {DAY_NAMES.map((day: string) => {
            const dayMenu = editMenu.days[day] || { breakfast: "", lunch: "", snacks: "", dinner: "" };
            return (
              <div className="menu-day-block" key={day}>
                <p className="menu-day-title">{day}</p>
                {meals.map((meal) => (
                  <div className="form-field" key={meal}>
                    <label className="form-label">
                      {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="What's available?"
                      value={dayMenu[meal]}
                      onChange={(e) => updateDay(day, meal, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-primary menu-save-btn" onClick={handleSave}>
        <Check size={18} />
        Save mess menu
      </button>
    </div>
  );
}

/* ---------------------------------------------------
   Food Log — record what you ate today
--------------------------------------------------- */
function FoodLog({
  log,
  onAdd,
  onRemove,
}: {
  log: DailyFoodLog;
  onAdd: (entry: { mealType: LogMealType; foodItem: string; portion: Portion }) => void;
  onRemove: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [mealType, setMealType] = useState<LogMealType>("breakfast");
  const [foodItem, setFoodItem] = useState("");
  const [portion, setPortion] = useState<Portion>("Medium");

  const handleSubmit = () => {
    if (!foodItem.trim()) return;
    onAdd({ mealType, foodItem: foodItem.trim(), portion });
    setFoodItem("");
    setPortion("Medium");
    setShowAddForm(false);
  };

  const entriesByMeal: Record<LogMealType, FoodLogEntry[]> = {
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    extra: [],
    drinks: [],
  };
  log.entries.forEach((e: any) => {
    if (entriesByMeal[e.mealType as LogMealType]) {
      entriesByMeal[e.mealType as LogMealType].push(e);
    }
  });

  return (
    <div className="food-log">
      <div className="food-log-header">
        <div>
          <h2 className="food-log-title">Today's food log</h2>
          <p className="food-log-sub">
            {log.entries.length} {log.entries.length === 1 ? "entry" : "entries"} recorded today
          </p>
        </div>
        <button
          className="btn btn-primary btn-small"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus size={16} />
          {showAddForm ? "Cancel" : "Add food"}
        </button>
      </div>

      {showAddForm && (
        <div className="food-add-form">
          <div className="form-field">
            <label className="form-label">Meal</label>
            <div className="chip-group">
              {MEAL_ORDER.map((mt: string) => {
                const mealType_ = mt as LogMealType;
                return (
                <button
                  key={mt}
                  className={`chip ${mealType === mt ? "chip-active" : ""}`}
                  onClick={() => setMealType(mealType_)}
                  type="button"
                >
                  {MEAL_LABELS[mealType_]}
                </button>
                );
              })}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">What did you eat / drink?</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Dal, rice, and sabzi"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">Portion size</label>
            <div className="chip-group">
              {PORTION_OPTIONS.map((p: string) => {
                const portion_ = p as Portion;
                return (
                <button
                  key={p}
                  className={`chip ${portion === p ? "chip-active" : ""}`}
                  onClick={() => setPortion(portion_)}
                  type="button"
                >
                  {p}
                </button>
                );
              })}
            </div>
            <p className="form-hint">{PORTION_DESCRIPTIONS[portion]}</p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!foodItem.trim()}
          >
            <Check size={16} />
            Save entry
          </button>
        </div>
      )}

      {log.entries.length === 0 && !showAddForm ? (
        <div className="food-log-empty">
          <Utensils size={28} style={{ color: "#F5A524" }} />
          <p className="food-empty-title">Nothing logged yet</p>
          <p className="food-empty-sub">Tap "Add food" to record what you eat today.</p>
        </div>
      ) : (
        <div className="food-log-list">
          {MEAL_ORDER.map((mt: string) => {
            const mealType_ = mt as LogMealType;
            const entries = entriesByMeal[mealType_];
            if (entries.length === 0) return null;
            const Icon = MEAL_ICONS[mealType_];
            const colors = MEAL_COLORS[mealType_];
            return (
              <div className="food-log-group" key={mt}>
                <div className="food-log-group-header">
                  <span
                    className="food-meal-icon"
                    style={{ background: colors.tint, color: colors.color }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="food-log-group-label">{MEAL_LABELS[mealType_]}</span>
                </div>
                {entries.map((entry: any) => (
                  <div className="food-log-entry" key={entry.id}>
                    <div className="food-log-entry-info">
                      <span className="food-log-entry-name">{entry.foodItem}</span>
                      <span className="food-log-entry-portion">
                        {entry.portion} · {getPortionNote(entry.portion)}
                      </span>
                    </div>
                    <button
                      className="icon-btn food-log-delete"
                      onClick={() => onRemove(entry.id)}
                      aria-label="Remove entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------
   Main FoodPage
--------------------------------------------------- */
export default function FoodPage({ profile, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("today");
  const [menu, setMenu] = useState<MessMenu>(() => loadMessMenu());
  const [log, setLog] = useState<DailyFoodLog>(() => loadFoodLog());

  const handleMenuSave = (newMenu: MessMenu) => {
    setMenu(newMenu);
    setTab("today");
  };

  const handleAddEntry = (entry: {
    mealType: LogMealType;
    foodItem: string;
    portion: Portion;
  }) => {
    setLog(addFoodEntry(log, entry));
  };

  const handleRemoveEntry = (id: string) => {
    setLog(removeFoodEntry(log, id));
  };

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to Home">
          <ArrowLeft size={20} />
        </button>
        <div className="page-header-title">
          <span className="page-header-icon" style={{ background: "#FDF1DC", color: "#F5A524" }}>
            <Apple size={18} />
          </span>
          <h1>Food</h1>
        </div>
        <span className="icon-btn-spacer" />
      </header>

      <div className="page-content">
        <div className="food-tabs">
          <button
            className={`food-tab ${tab === "today" ? "active" : ""}`}
            onClick={() => setTab("today")}
          >
            Today
          </button>
          <button
            className={`food-tab ${tab === "menu" ? "active" : ""}`}
            onClick={() => setTab("menu")}
          >
            Mess menu
          </button>
          <button
            className={`food-tab ${tab === "log" ? "active" : ""}`}
            onClick={() => setTab("log")}
          >
            Food log
          </button>
        </div>

        {tab === "today" && (
          <TodayFood
            menu={menu}
            goals={profile.goals || []}
            log={log}
            onGoMenu={() => setTab("menu")}
          />
        )}

        {tab === "menu" && <MessMenuEditor menu={menu} onSave={handleMenuSave} />}

        {tab === "log" && (
          <FoodLog
            log={log}
            onAdd={handleAddEntry}
            onRemove={handleRemoveEntry}
          />
        )}
      </div>
    </div>
  );
}
