/* ---------------------------------------------------
   Food system — mess menu, daily log, and food
   guidance for hostel life. All localStorage, no backend.
--------------------------------------------------- */

export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";
export type LogMealType = MealType | "extra" | "drinks";
export type Portion = "Small" | "Medium" | "Large" | "Very large";

export type MessDayMenu = {
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
};

export type MessMenu = {
  days: Record<string, MessDayMenu>; // key: "Monday", "Tuesday", etc.
  generalBreakfast: string;
  generalLunch: string;
  generalSnacks: string;
  generalDinner: string;
  hasWeeklyMenu: boolean;
};

export type FoodLogEntry = {
  id: string;
  date: string; // ISO date (day only)
  timestamp: number;
  mealType: LogMealType;
  foodItem: string;
  portion: Portion;
};

export type DailyFoodLog = {
  date: string;
  entries: FoodLogEntry[];
};

/* ---------------------------------------------------
   Day names
--------------------------------------------------- */
export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const MEAL_LABELS: Record<LogMealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
  extra: "Extra snacks",
  drinks: "Drinks",
};

export const MEAL_ORDER: LogMealType[] = [
  "breakfast",
  "lunch",
  "snacks",
  "dinner",
  "extra",
  "drinks",
];

export const PORTION_OPTIONS: Portion[] = [
  "Small",
  "Medium",
  "Large",
  "Very large",
];

export const PORTION_DESCRIPTIONS: Record<Portion, string> = {
  Small: "Smaller than your usual",
  Medium: "Your usual portion",
  Large: "A generous helping",
  "Very large": "Going for seconds",
};

/* ---------------------------------------------------
   Food categorization — used to classify items
   for guidance (protein, veg, fried, sweet, sugary drink)
--------------------------------------------------- */
const PROTEIN_KEYWORDS = [
  "egg", "chicken", "fish", "paneer", "dal", "lentil",
  "rajma", "chana", "soyabean", "soya", "tofu", "mutton",
  "sprouts", "moong", "curd", "yogurt", "milk", "whey",
];

const VEG_KEYWORDS = [
  "salad", "vegetable", "sabzi", "bhindi", "lauki", "spinach",
  "palak", "cabbage", "carrot", "cucumber", "tomato", "green",
  "beans", "cauliflower", "gobi", "peas", "matar", "leafy",
];

const FRIED_KEYWORDS = [
  "fry", "fried", "pakora", "bhajiya", "samosa", "kachori",
  "puri", "bhatura", "vada", "fritter", "deep", "crispy",
  "chips", "namkeen", "bhujiya",
];

const SWEET_KEYWORDS = [
  "sweet", "halwa", "kheer", "gulab", "jamun", "jalebi",
  "barfi", "laddu", "ladoo", "rasgulla", "cake", "biscuit",
  "cookie", "chocolate", "sugar", "mithai", "peda", "chikki",
  "ice cream", "pudding", "custard",
];

const SUGARY_DRINK_KEYWORDS = [
  "cola", "soda", "juice", "shake", "cold drink",
  "frooti", "maaza", "sprite", "pepsi", "pepsi", "thums up",
  "mountain dew", "7up", "energy drink", "fanta", "limca",
  "soft drink", "aerated", "coke",
];

const RICE_ROTI_KEYWORDS = [
  "rice", "roti", "chapati", "phulka", "naan", "paratha",
  "biryani", "pulao", "chawal", "dosa", "idli", "upma",
  "poha", "bread", "pav",
];

export type FoodCategory = {
  isProtein: boolean;
  isVeg: boolean;
  isFried: boolean;
  isSweet: boolean;
  isSugaryDrink: boolean;
  isCarb: boolean;
};

export function categorizeFood(item: string): FoodCategory {
  const lower = item.toLowerCase();
  return {
    isProtein: PROTEIN_KEYWORDS.some((k) => lower.includes(k)),
    isVeg: VEG_KEYWORDS.some((k) => lower.includes(k)),
    isFried: FRIED_KEYWORDS.some((k) => lower.includes(k)),
    isSweet: SWEET_KEYWORDS.some((k) => lower.includes(k)),
    isSugaryDrink: SUGARY_DRINK_KEYWORDS.some((k) => lower.includes(k)),
    isCarb: RICE_ROTI_KEYWORDS.some((k) => lower.includes(k)),
  };
}

/* ---------------------------------------------------
   localStorage keys
--------------------------------------------------- */
const MENU_KEY = "fitness_app_mess_menu";
const LOG_KEY = "fitness_app_food_log";

/* ---------------------------------------------------
   Mess menu — storage
--------------------------------------------------- */
export const EMPTY_MESS_MENU: MessMenu = {
  days: {},
  generalBreakfast: "",
  generalLunch: "",
  generalSnacks: "",
  generalDinner: "",
  hasWeeklyMenu: false,
};

export function loadMessMenu(): MessMenu {
  try {
    const raw = localStorage.getItem(MENU_KEY);
    if (!raw) return { ...EMPTY_MESS_MENU };
    const parsed = JSON.parse(raw);
    return { ...EMPTY_MESS_MENU, ...parsed };
  } catch {
    return { ...EMPTY_MESS_MENU };
  }
}

export function saveMessMenu(menu: MessMenu) {
  try {
    localStorage.setItem(MENU_KEY, JSON.stringify(menu));
  } catch {
    // ignore
  }
}

/* ---------------------------------------------------
   Paste weekly menu — parse text into days
   Supports formats like:
   Monday: Breakfast - poha, Lunch - dal rice, ...
   or just lines of text mapped to meals
--------------------------------------------------- */
export function parsePastedMenu(text: string): Partial<MessMenu> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return {};

  const days: Record<string, MessDayMenu> = {};
  let currentDay: string | null = null;
  let currentMeal: MealType | null = null;

  const dayPattern = new RegExp(
    `^(${DAY_NAMES.join("|")}):?\\s*$`,
    "i",
  );

  for (const line of lines) {
    const dayMatch = line.match(dayPattern);
    if (dayMatch) {
      currentDay = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
      if (!days[currentDay]) {
        days[currentDay] = { breakfast: "", lunch: "", snacks: "", dinner: "" };
      }
      currentMeal = null;
      continue;
    }

    // Try "Breakfast - poha" or "Breakfast: poha" format
    const mealMatch = line.match(
      /^(breakfast|lunch|snacks|dinner)\s*[-:]\s*(.+)$/i,
    );
    if (mealMatch) {
      const meal = mealMatch[1].toLowerCase() as MealType;
      const food = mealMatch[2].trim();
      if (currentDay && days[currentDay]) {
        days[currentDay][meal] = food;
      } else if (!currentDay) {
        // If no day specified, put in general
        // Handle later
      }
      currentMeal = meal;
      continue;
    }

    // If we're inside a day but no meal label, try to auto-assign
    // by order: breakfast, lunch, snacks, dinner
    if (currentDay && days[currentDay]) {
      const meals: MealType[] = ["breakfast", "lunch", "snacks", "dinner"];
      for (const m of meals) {
        if (!days[currentDay][m]) {
          days[currentDay][m] = line;
          break;
        }
      }
      continue;
    }

    // No day context — ignore for now
  }

  const hasWeeklyMenu = Object.keys(days).length > 0;
  return { days, hasWeeklyMenu };
}

/* ---------------------------------------------------
   Get today's menu from mess data
--------------------------------------------------- */
export function getTodayMenu(menu: MessMenu): MessDayMenu {
  const todayName = DAY_NAMES[(new Date().getDay() + 6) % 7]; // 0=Sunday -> Monday index
  const dayMenu = menu.days[todayName];
  if (dayMenu && menu.hasWeeklyMenu) {
    return {
      breakfast: dayMenu.breakfast || menu.generalBreakfast || "",
      lunch: dayMenu.lunch || menu.generalLunch || "",
      snacks: dayMenu.snacks || menu.generalSnacks || "",
      dinner: dayMenu.dinner || menu.generalDinner || "",
    };
  }
  return {
    breakfast: menu.generalBreakfast || "",
    lunch: menu.generalLunch || "",
    snacks: menu.generalSnacks || "",
    dinner: menu.generalDinner || "",
  };
}

/* ---------------------------------------------------
   Daily food log — storage
--------------------------------------------------- */
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function loadFoodLog(): DailyFoodLog {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return { date: todayISO(), entries: [] };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayISO()) {
      return { date: todayISO(), entries: [] };
    }
    return parsed;
  } catch {
    return { date: todayISO(), entries: [] };
  }
}

export function saveFoodLog(log: DailyFoodLog) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // ignore
  }
}

export function addFoodEntry(
  log: DailyFoodLog,
  entry: { mealType: LogMealType; foodItem: string; portion: Portion },
): DailyFoodLog {
  const newEntry: FoodLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayISO(),
    timestamp: Date.now(),
  };
  const updated: DailyFoodLog = {
    date: todayISO(),
    entries: [...log.entries, newEntry],
  };
  saveFoodLog(updated);
  return updated;
}

export function removeFoodEntry(log: DailyFoodLog, id: string): DailyFoodLog {
  const updated: DailyFoodLog = {
    ...log,
    entries: log.entries.filter((e) => e.id !== id),
  };
  saveFoodLog(updated);
  return updated;
}

/* ---------------------------------------------------
   Food guidance — gentle, practical, hostel-focused.
   Based on today's mess menu + goals. Never crash diet,
   never shame, gradual improvement only.
--------------------------------------------------- */
export type FoodGuidance = {
  message: string;
  tips: string[];
  todayItems: { meal: string; items: string; mealType: MealType }[];
};

export function generateFoodGuidance(
  menu: MessMenu,
  goals: string[],
  log: DailyFoodLog,
): FoodGuidance {
  const todayMenu = getTodayMenu(menu);
  const todayItems = [
    { meal: "Breakfast", items: todayMenu.breakfast, mealType: "breakfast" as MealType },
    { meal: "Lunch", items: todayMenu.lunch, mealType: "lunch" as MealType },
    { meal: "Snacks", items: todayMenu.snacks, mealType: "snacks" as MealType },
    { meal: "Dinner", items: todayMenu.dinner, mealType: "dinner" as MealType },
  ].filter((item) => item.items);

  const hasMenu = todayItems.length > 0;
  const primaryGoal = goals[0] || "General fitness";

  const tips: string[] = [];

  // Goal-based guidance — gentle, not extreme
  if (primaryGoal === "Fat loss" || primaryGoal === "Weight loss") {
    tips.push("Aim for a slightly smaller portion at one meal today — not all meals at once.");
    tips.push("Try to add more protein (dal, eggs, paneer, curd) to feel full longer.");
    tips.push("Fill half your plate with vegetables or salad when available.");
  } else if (primaryGoal === "Muscle building") {
    tips.push("Try to get protein in every meal — eggs, dal, paneer, chicken, or curd.");
    tips.push("Don't skip meals — consistent eating supports muscle growth.");
    tips.push("Adequate rice or roti helps fuel your workouts.");
  } else if (primaryGoal === "Strength") {
    tips.push("Prioritize protein at each meal to support recovery.");
    tips.push("Eat enough carbs (rice, roti) to fuel your training.");
  } else if (primaryGoal === "Better stamina") {
    tips.push("Balanced meals with rice, roti, and protein will fuel your endurance.");
    tips.push("Stay hydrated — drink water throughout the day.");
  } else if (primaryGoal === "General fitness") {
    tips.push("Balanced meals with protein, carbs, and vegetables keep you going.");
    tips.push("Enjoy your food — just be mindful of portions.");
  }

  // Analyze today's menu for specific advice
  if (hasMenu) {
    const allItems = todayItems.map((t) => t.items).join(" ");
    const cats = categorizeFood(allItems);

    if (cats.isFried) {
      tips.push("There's some fried food today — enjoy a smaller portion and balance it with other items.");
    }
    if (cats.isSweet) {
      tips.push("A sweet is on the menu — have a small portion and savour it slowly.");
    }
    if (cats.isSugaryDrink) {
      tips.push("Consider swapping one sugary drink for water or chaas today.");
    }
    if (!cats.isProtein) {
      tips.push("Try to add a protein source today — an extra egg, dal, or curd if available.");
    }
    if (!cats.isVeg) {
      tips.push("Look for vegetables or salad on the side — even a few bites help.");
    }
  } else {
    tips.push("Add your mess menu to get specific food guidance based on what's available.");
  }

  // Check what's been logged
  const loggedMeals = new Set(log.entries.map((e) => e.mealType));
  if (loggedMeals.has("drinks")) {
    const drinks = log.entries.filter((e) => e.mealType === "drinks");
    const sugaryDrinks = drinks.filter((d) =>
      categorizeFood(d.foodItem).isSugaryDrink,
    );
    if (sugaryDrinks.length >= 2) {
      tips.push("You've had a few sugary drinks today — try water for the next one.");
    }
  }
  if (loggedMeals.has("extra")) {
    const extras = log.entries.filter((e) => e.mealType === "extra");
    if (extras.length >= 2) {
      tips.push("A few extra snacks today — no worries, just be mindful at dinner.");
    }
  }

  // Limit tips to keep it readable
  const finalTips = tips.slice(0, 5);

  let message: string;
  if (!hasMenu) {
    message = "Set up your mess menu to get personalized food guidance for today.";
  } else {
    const mealCount = todayItems.length;
    if (mealCount === 4) {
      message = "Here's what's in your mess today, with gentle tips to eat well.";
    } else {
      message = `Your mess has ${mealCount} meals listed today. Make the most of what's available.`;
    }
  }

  return { message, tips: finalTips, todayItems };
}

/* ---------------------------------------------------
   Portion guidance — gentle nudge per portion
--------------------------------------------------- */
export function getPortionNote(portion: Portion): string {
  switch (portion) {
    case "Small":
      return "Good — a mindful portion.";
    case "Medium":
      return "Nice — your usual portion.";
    case "Large":
      return "Enjoy — just be a little mindful.";
    case "Very large":
      return "No guilt — maybe slow down and enjoy it.";
  }
}
