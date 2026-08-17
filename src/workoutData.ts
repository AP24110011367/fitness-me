/* ---------------------------------------------------
   Exercise library — each exercise lists the equipment
   it needs, plus difficulty tiers for each fitness level.
   Bodyweight alternatives are always available.
--------------------------------------------------- */
export type FitnessLevel = "Starting" | "Beginner" | "Medium" | "High";

export type ExerciseTier = {
  sets: number;
  reps: string;
  rest: string;
  instructions: string;
  formTips: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string[]; // equipment names from profile; empty = bodyweight
  bodyweightAlternative?: string; // id of alt exercise
  tiers: Record<FitnessLevel, ExerciseTier>;
};

export type Difficulty = "Very easy" | "Easy" | "Good" | "Hard" | "Too hard";

export type WorkoutHistoryEntry = {
  id: string;
  date: string; // ISO date
  level: FitnessLevel;
  goals: string[];
  exercises: {
    name: string;
    muscle: string;
    sets: number;
    reps: string;
    rest: string;
    completedSets: number;
  }[];
  totalSets: number;
  completedSets: number;
  durationSec: number;
  difficulty: Difficulty;
  nextSuggestion: string;
};

/* ---------------------------------------------------
   Equipment matching
--------------------------------------------------- */
function hasEquipment(required: string[], available: string[]): boolean {
  if (required.length === 0) return true; // bodyweight
  return required.every((req) =>
    available.some((a) => a.toLowerCase() === req.toLowerCase()),
  );
}

/* ---------------------------------------------------
   Exercise library
   Each exercise targets one muscle group and has
   difficulty tiers per fitness level.
--------------------------------------------------- */
const EXERCISES: Exercise[] = [
  // ---- Warm-up / mobility (bodyweight, always available) ----
  {
    id: "warmup-cardio",
    name: "Light cardio warm-up",
    muscle: "Full body",
    equipment: [],
    tiers: {
      Starting: { sets: 1, reps: "3–5 min", rest: "—", instructions: "March in place or walk briskly to raise your heart rate slightly.", formTips: "Keep it easy — you should be able to hold a conversation." },
      Beginner: { sets: 1, reps: "5 min", rest: "—", instructions: "Walk briskly, march in place, or do light jogging on the spot.", formTips: "Stay relaxed, breathe steadily." },
      Medium: { sets: 1, reps: "5–8 min", rest: "—", instructions: "Light jog or dynamic movements to warm up the whole body.", formTips: "Progressively increase intensity, don't go all out." },
      High: { sets: 1, reps: "8–10 min", rest: "—", instructions: "Dynamic warm-up: jog, high knees, arm circles, leg swings.", formTips: "Focus on full range of motion and activation." },
    },
  },
  {
    id: "warmup-mobility",
    name: "Joint mobility",
    muscle: "Full body",
    equipment: [],
    tiers: {
      Starting: { sets: 1, reps: "10 reps each", rest: "—", instructions: "Gentle arm circles, hip circles, ankle rolls, neck turns.", formTips: "Move slowly and smoothly through each joint." },
      Beginner: { sets: 1, reps: "10 reps each", rest: "—", instructions: "Arm circles, hip circles, torso twists, ankle rolls.", formTips: "Control the movement, no bouncing." },
      Medium: { sets: 1, reps: "12 reps each", rest: "—", instructions: "Dynamic stretches: leg swings, arm circles, torso twists, hip openers.", formTips: "Full range of motion, smooth tempo." },
      High: { sets: 1, reps: "15 reps each", rest: "—", instructions: "Full dynamic mobility sequence covering all major joints.", formTips: "Move with purpose and control." },
    },
  },

  // ---- Legs ----
  {
    id: "bodyweight-squat",
    name: "Bodyweight squat",
    muscle: "Legs",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "Stand feet shoulder-width, lower your hips back and down, then stand up.", formTips: "Keep chest up, knees tracking over toes, don't go too deep." },
      Beginner: { sets: 2, reps: "12–15", rest: "60 sec", instructions: "Feet shoulder-width, sit back and down, push through heels to stand.", formTips: "Keep weight in heels, chest tall." },
      Medium: { sets: 3, reps: "15–20", rest: "45 sec", instructions: "Control the descent, pause at the bottom, drive up through heels.", formTips: "Full depth, maintain upright torso." },
      High: { sets: 4, reps: "20–25", rest: "45 sec", instructions: "Slow tempo: 3 sec down, pause, explode up.", formTips: "Full range, brace core throughout." },
    },
  },
  {
    id: "dumbbell-squat",
    name: "Dumbbell squat",
    muscle: "Legs",
    equipment: ["Dumbbells"],
    bodyweightAlternative: "bodyweight-squat",
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "Hold dumbbells at sides, squat down keeping chest up, stand back up.", formTips: "Start light, focus on balance and depth." },
      Beginner: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Dumbbells at sides or at shoulders, squat down, drive up through heels.", formTips: "Keep torso upright, control the descent." },
      Medium: { sets: 3, reps: "10–12", rest: "60 sec", instructions: "Hold dumbbells at shoulders (goblet or front), full-depth squat.", formTips: "Brace core, knees out, full range." },
      High: { sets: 4, reps: "8–12", rest: "90 sec", instructions: "Heavy dumbbell goblet or front squat, controlled tempo.", formTips: "Maintain form under load, brace hard." },
    },
  },
  {
    id: "barbell-squat",
    name: "Barbell back squat",
    muscle: "Legs",
    equipment: ["Barbell"],
    bodyweightAlternative: "bodyweight-squat",
    tiers: {
      Starting: { sets: 2, reps: "8", rest: "90 sec", instructions: "Bar on upper back, feet shoulder-width, squat down, stand up.", formTips: "Start with empty bar, focus on depth and balance." },
      Beginner: { sets: 3, reps: "8–10", rest: "90 sec", instructions: "Set up under bar, brace, squat to parallel, drive up.", formTips: "Chest up, knees out, weight mid-foot." },
      Medium: { sets: 3, reps: "6–8", rest: "120 sec", instructions: "Working weight, controlled descent, explosive drive up.", formTips: "Brace core, hit depth, stay tight." },
      High: { sets: 4, reps: "5–8", rest: "150 sec", instructions: "Heavy working sets, full range, tight bracing.", formTips: "Control the eccentric, drive explosively." },
    },
  },
  {
    id: "lunge",
    name: "Walking lunge",
    muscle: "Legs",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "8 each leg", rest: "60 sec", instructions: "Step forward, lower back knee toward floor, push off front heel to next step.", formTips: "Keep torso tall, short step to start." },
      Beginner: { sets: 2, reps: "10 each leg", rest: "60 sec", instructions: "Step forward into lunge, lower back knee, alternate legs.", formTips: "Front knee over ankle, chest up." },
      Medium: { sets: 3, reps: "12 each leg", rest: "45 sec", instructions: "Continuous walking lunges, full range.", formTips: "Control each step, drive through heel." },
      High: { sets: 3, reps: "16 each leg", rest: "45 sec", instructions: "Long steps, deep range, steady tempo.", formTips: "Keep tension, don't rush reps." },
    },
  },

  // ---- Chest ----
  {
    id: "pushup",
    name: "Push-up",
    muscle: "Chest",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "5–8", rest: "60 sec", instructions: "Hands shoulder-width, lower chest toward floor, push back up. Use knees if needed.", formTips: "Keep body straight, elbows at about 45 degrees." },
      Beginner: { sets: 2, reps: "8–12", rest: "60 sec", instructions: "Full push-up from toes, or knee push-up if needed. Lower with control.", formTips: "Straight line head to heels, don't sag." },
      Medium: { sets: 3, reps: "12–15", rest: "45 sec", instructions: "Full push-ups, controlled tempo, chest to floor.", formTips: "Brace core, full range of motion." },
      High: { sets: 4, reps: "15–20", rest: "45 sec", instructions: "Strict push-ups, slow eccentric, explosive up.", formTips: "Full depth, rigid body line." },
    },
  },
  {
    id: "dumbbell-press",
    name: "Dumbbell chest press",
    muscle: "Chest",
    equipment: ["Dumbbells", "Bench"],
    bodyweightAlternative: "pushup",
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "Lie on bench, press dumbbells up over chest, lower with control.", formTips: "Start light, keep wrists straight." },
      Beginner: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Press dumbbells up, lower to chest level, full range.", formTips: "Feet planted, back flat on bench." },
      Medium: { sets: 3, reps: "10–12", rest: "60 sec", instructions: "Control the negative, pause briefly at bottom, drive up.", formTips: "Full range, stable shoulders." },
      High: { sets: 4, reps: "8–10", rest: "90 sec", instructions: "Heavy working sets, controlled tempo.", formTips: "Keep tension on chest, don't bounce." },
    },
  },
  {
    id: "barbell-bench",
    name: "Barbell bench press",
    muscle: "Chest",
    equipment: ["Barbell", "Bench"],
    bodyweightAlternative: "pushup",
    tiers: {
      Starting: { sets: 2, reps: "8", rest: "90 sec", instructions: "Lie on bench, lower bar to chest, press up. Start with empty bar.", formTips: "Keep elbows tucked, feet planted." },
      Beginner: { sets: 3, reps: "8–10", rest: "90 sec", instructions: "Lower bar to lower chest, press up to full lockout.", formTips: "Control the descent, don't bounce." },
      Medium: { sets: 3, reps: "6–8", rest: "120 sec", instructions: "Working weight, pause at chest, drive up.", formTips: "Brace, stay tight, controlled reps." },
      High: { sets: 4, reps: "5–8", rest: "150 sec", instructions: "Heavy working sets, full range, tight form.", formTips: "Arch back, leg drive, controlled tempo." },
    },
  },

  // ---- Back ----
  {
    id: "pullup",
    name: "Pull-up",
    muscle: "Back",
    equipment: ["Pull-up bar"],
    bodyweightAlternative: "back-row-table",
    tiers: {
      Starting: { sets: 2, reps: "3–5 (or assisted)", rest: "90 sec", instructions: "Hang from bar, pull chin over bar, lower with control. Use assistance band or step.", formTips: "Don't swing, engage lats first." },
      Beginner: { sets: 2, reps: "5–8", rest: "90 sec", instructions: "Pull chin over bar, control the descent.", formTips: "Full hang at bottom, no kipping." },
      Medium: { sets: 3, reps: "8–10", rest: "90 sec", instructions: "Strict pull-ups, full range.", formTips: "Squeeze shoulder blades, control down." },
      High: { sets: 4, reps: "8–12", rest: "120 sec", instructions: "Strict form, pause at top, slow negative.", formTips: "Full range, no swinging." },
    },
  },
  {
    id: "back-row-table",
    name: "Inverted row (table)",
    muscle: "Back",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "Lie under a sturdy table, grab edge, pull chest up to table.", formTips: "Keep body straight, squeeze shoulder blades." },
      Beginner: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Under table or using a low bar, pull chest up, lower with control.", formTips: "Body in a straight line, engage back." },
      Medium: { sets: 3, reps: "12–15", rest: "45 sec", instructions: "Full range rows, controlled tempo.", formTips: "Pause at top, slow descent." },
      High: { sets: 4, reps: "15–20", rest: "45 sec", instructions: "Strict form, high reps, slow negatives.", formTips: "Keep tension, don't swing." },
    },
  },
  {
    id: "dumbbell-row",
    name: "Dumbbell row",
    muscle: "Back",
    equipment: ["Dumbbells"],
    bodyweightAlternative: "back-row-table",
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "One knee on bench, row dumbbell to hip, lower with control.", formTips: "Start light, keep back flat." },
      Beginner: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Support with one hand, row dumbbell up to hip, control down.", formTips: "Pull with back, not arm, squeeze at top." },
      Medium: { sets: 3, reps: "10–12", rest: "60 sec", instructions: "Controlled tempo, pause at top.", formTips: "Keep torso stable, full range." },
      High: { sets: 4, reps: "8–10", rest: "90 sec", instructions: "Heavy working sets, strict form.", formTips: "No rotation, drive with lats." },
    },
  },

  // ---- Shoulders ----
  {
    id: "shoulder-tap",
    name: "Shoulder tap plank",
    muscle: "Shoulders",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "8 taps", rest: "60 sec", instructions: "In plank position, tap one shoulder with opposite hand, alternate. Keep hips still.", formTips: "Brace core, minimize hip rotation." },
      Beginner: { sets: 2, reps: "12 taps", rest: "60 sec", instructions: "Plank position, alternate hand to opposite shoulder, stay stable.", formTips: "Wide stance helps stability." },
      Medium: { sets: 3, reps: "16 taps", rest: "45 sec", instructions: "Strict plank, slow controlled taps.", formTips: "Keep hips level, core tight." },
      High: { sets: 4, reps: "20 taps", rest: "45 sec", instructions: "Feet together for extra challenge, slow tempo.", formTips: "Minimal rotation, full control." },
    },
  },
  {
    id: "dumbbell-press-shoulder",
    name: "Dumbbell shoulder press",
    muscle: "Shoulders",
    equipment: ["Dumbbells"],
    bodyweightAlternative: "shoulder-tap",
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "Seated or standing, press dumbbells overhead, lower to shoulders.", formTips: "Start light, don't arch back." },
      Beginner: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Press dumbbells overhead to full lockout, lower with control.", formTips: "Brace core, don't lean back." },
      Medium: { sets: 3, reps: "10–12", rest: "60 sec", instructions: "Strict press, full range, controlled tempo.", formTips: "Stable core, smooth movement." },
      High: { sets: 4, reps: "8–10", rest: "90 sec", instructions: "Heavy working sets, strict form.", formTips: "No leg drive, shoulders do the work." },
    },
  },

  // ---- Core ----
  {
    id: "plank",
    name: "Plank hold",
    muscle: "Core",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "15–20 sec", rest: "45 sec", instructions: "Forearms on ground, body in straight line, hold.", formTips: "Don't sag hips, engage abs." },
      Beginner: { sets: 2, reps: "20–30 sec", rest: "45 sec", instructions: "Forearm plank, straight body, hold tight.", formTips: "Squeeze glutes and abs." },
      Medium: { sets: 3, reps: "30–45 sec", rest: "45 sec", instructions: "Full plank, stable, breathe steadily.", formTips: "No hip dip, tight throughout." },
      High: { sets: 3, reps: "45–60 sec", rest: "45 sec", instructions: "Rigid plank, maximum tension.", formTips: "Every muscle engaged, perfect line." },
    },
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    muscle: "Core",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "6 each side", rest: "45 sec", instructions: "Lie on back, arms up, knees bent. Lower opposite arm and leg, return.", formTips: "Press lower back into floor throughout." },
      Beginner: { sets: 2, reps: "8 each side", rest: "45 sec", instructions: "Alternate arm and leg extension, keep back flat.", formTips: "Slow and controlled, no arching." },
      Medium: { sets: 3, reps: "10 each side", rest: "30 sec", instructions: "Full extension, slow tempo.", formTips: "Maintain core pressure, no rushing." },
      High: { sets: 3, reps: "12 each side", rest: "30 sec", instructions: "Slow, controlled, full range.", formTips: "Keep lower back glued to floor." },
    },
  },

  // ---- Arms ----
  {
    id: "dumbbell-curl",
    name: "Dumbbell bicep curl",
    muscle: "Arms",
    equipment: ["Dumbbells"],
    bodyweightAlternative: "band-curl",
    tiers: {
      Starting: { sets: 2, reps: "8–10", rest: "60 sec", instructions: "Curl dumbbells up, squeeze, lower with control.", formTips: "Elbows pinned to sides, no swinging." },
      Beginner: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Curl up, control the descent.", formTips: "Don't swing, full range." },
      Medium: { sets: 3, reps: "10–12", rest: "45 sec", instructions: "Strict curls, slow negative.", formTips: "Squeeze at top, control down." },
      High: { sets: 3, reps: "8–10", rest: "60 sec", instructions: "Heavy working sets, strict form.", formTips: "No momentum, full range." },
    },
  },
  {
    id: "band-curl",
    name: "Resistance band curl",
    muscle: "Arms",
    equipment: ["Resistance bands"],
    tiers: {
      Starting: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Step on band, curl handles up, control down.", formTips: "Keep tension throughout, elbows fixed." },
      Beginner: { sets: 2, reps: "12–15", rest: "60 sec", instructions: "Curl band up, slow descent.", formTips: "Control the band, don't let it snap back." },
      Medium: { sets: 3, reps: "15–20", rest: "45 sec", instructions: "Strict curls, squeeze at top.", formTips: "Full range, steady tension." },
      High: { sets: 3, reps: "20–25", rest: "45 sec", instructions: "High reps, slow tempo.", formTips: "Constant tension, control both ways." },
    },
  },

  // ---- Glutes / Hamstrings ----
  {
    id: "glute-bridge",
    name: "Glute bridge",
    muscle: "Glutes",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "10–12", rest: "45 sec", instructions: "Lie on back, knees bent, push hips up squeezing glutes, lower.", formTips: "Drive through heels, pause at top." },
      Beginner: { sets: 2, reps: "12–15", rest: "45 sec", instructions: "Bridge up, squeeze glutes hard at top, control down.", formTips: "Don't overextend lower back." },
      Medium: { sets: 3, reps: "15–20", rest: "45 sec", instructions: "Full range, pause at top.", formTips: "Core engaged, glutes doing the work." },
      High: { sets: 4, reps: "20–25", rest: "45 sec", instructions: "Single-leg progression if ready, slow tempo.", formTips: "Keep hips level, full extension." },
    },
  },

  // ---- Cardio / Stamina ----
  {
    id: "jumping-jacks",
    name: "Jumping jacks",
    muscle: "Full body",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "20 sec", rest: "30 sec", instructions: "Jump feet apart while raising arms overhead, jump back.", formTips: "Stay light on feet, keep pace steady." },
      Beginner: { sets: 2, reps: "30 sec", rest: "30 sec", instructions: "Steady pace, full range with arms.", formTips: "Breathe evenly, keep moving." },
      Medium: { sets: 3, reps: "45 sec", rest: "30 sec", instructions: "Faster pace, maintain form.", formTips: "Don't slow down, stay consistent." },
      High: { sets: 4, reps: "60 sec", rest: "30 sec", instructions: "High intensity, max effort intervals.", formTips: "Keep range of motion full, push pace." },
    },
  },
  {
    id: "mountain-climber",
    name: "Mountain climbers",
    muscle: "Full body",
    equipment: [],
    tiers: {
      Starting: { sets: 2, reps: "15 sec", rest: "45 sec", instructions: "Plank position, drive knees to chest alternately, slow pace.", formTips: "Keep hips low, hands under shoulders." },
      Beginner: { sets: 2, reps: "20 sec", rest: "45 sec", instructions: "Plank, alternate knees in, steady pace.", formTips: "Core tight, don't bounce hips." },
      Medium: { sets: 3, reps: "30 sec", rest: "30 sec", instructions: "Faster pace, drive knees in.", formTips: "Keep plank position, quick feet." },
      High: { sets: 4, reps: "40 sec", rest: "30 sec", instructions: "Max intensity, fast feet.", formTips: "Maintain plank, don't let hips rise." },
    },
  },

  // ---- Kettlebells ----
  {
    id: "kb-swing",
    name: "Kettlebell swing",
    muscle: "Full body",
    equipment: ["Kettlebells"],
    bodyweightAlternative: "glute-bridge",
    tiers: {
      Starting: { sets: 2, reps: "10–12", rest: "60 sec", instructions: "Hinge at hips, swing kettlebell up to chest height, let it swing back.", formTips: "Drive with hips, not arms. Keep back straight." },
      Beginner: { sets: 2, reps: "15", rest: "60 sec", instructions: "Hip hinge drive, swing to chest level, control the backswing.", formTips: "Power from glutes, not lower back." },
      Medium: { sets: 3, reps: "20", rest: "45 sec", instructions: "Explosive hip drive, steady rhythm.", formTips: "Snap hips, tight core at top." },
      High: { sets: 4, reps: "25–30", rest: "45 sec", instructions: "High power output, maintain form.", formTips: "Hip hinge, not squat — drive hard." },
    },
  },

  // ---- Cool-down (bodyweight, always available) ----
  {
    id: "cooldown-stretch",
    name: "Cool-down stretch",
    muscle: "Full body",
    equipment: [],
    tiers: {
      Starting: { sets: 1, reps: "3–5 min", rest: "—", instructions: "Gentle static stretches: quad stretch, hamstring stretch, chest opener, child's pose.", formTips: "Hold each 20–30 sec, breathe deeply, no pain." },
      Beginner: { sets: 1, reps: "5 min", rest: "—", instructions: "Stretch all major muscles: quads, hamstrings, hips, chest, back, shoulders.", formTips: "Hold 30 sec each, relax into the stretch." },
      Medium: { sets: 1, reps: "5–8 min", rest: "—", instructions: "Full-body stretch sequence, hold each 30–45 sec.", formTips: "Breathe into each stretch, don't force." },
      High: { sets: 1, reps: "8–10 min", rest: "—", instructions: "Deep stretching all major muscle groups, foam roll if available.", formTips: "Long holds, focus on tight areas." },
    },
  },
];

/* ---------------------------------------------------
   Goal → muscle focus mapping
--------------------------------------------------- */
const GOAL_MUSCLE_FOCUS: Record<string, string[]> = {
  "Fat loss": ["Full body", "Legs", "Core"],
  "Weight loss": ["Full body", "Legs", "Core"],
  "General fitness": ["Legs", "Chest", "Back", "Core"],
  "Strength": ["Legs", "Chest", "Back"],
  "Muscle building": ["Legs", "Chest", "Back", "Arms", "Shoulders"],
  "Better stamina": ["Full body", "Legs"],
};

/* ---------------------------------------------------
   Workout generator — selects exercises based on
   fitness level, goals, available equipment, and
   available time. Always includes warm-up and cool-down.
--------------------------------------------------- */
export type GeneratedExercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  instructions: string;
  formTips: string;
  isAlternative: boolean;
  section: "warmup" | "main" | "cooldown";
};

export type GeneratedWorkout = {
  exercises: GeneratedExercise[];
  estimatedMin: number;
  level: FitnessLevel;
};

function pickExercisesByMuscle(
  muscle: string,
  level: FitnessLevel,
  equipment: string[],
  used: Set<string>,
): Exercise | null {
  const candidates = EXERCISES.filter(
    (ex) =>
      ex.muscle === muscle &&
      !used.has(ex.id) &&
      hasEquipment(ex.equipment, equipment),
  );
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  // Try bodyweight alternatives
  const altCandidates = EXERCISES.filter(
    (ex) => ex.muscle === muscle && !used.has(ex.id) && ex.equipment.length === 0,
  );
  if (altCandidates.length > 0) {
    return altCandidates[Math.floor(Math.random() * altCandidates.length)];
  }
  return null;
}

function pickExerciseWithAlt(
  muscle: string,
  level: FitnessLevel,
  equipment: string[],
  used: Set<string>,
): { exercise: Exercise; isAlternative: boolean } | null {
  const direct = EXERCISES.filter(
    (ex) =>
      ex.muscle === muscle &&
      !used.has(ex.id) &&
      hasEquipment(ex.equipment, equipment),
  );
  if (direct.length > 0) {
    return {
      exercise: direct[Math.floor(Math.random() * direct.length)],
      isAlternative: false,
    };
  }
  // Find exercises with bodyweight alternatives we can use
  const withAlt = EXERCISES.filter(
    (ex) =>
      ex.muscle === muscle &&
      !used.has(ex.id) &&
      ex.bodyweightAlternative &&
      !used.has(ex.bodyweightAlternative!),
  );
  for (const ex of withAlt) {
    const alt = EXERCISES.find((e) => e.id === ex.bodyweightAlternative);
    if (alt) {
      used.add(alt.id);
      return { exercise: alt, isAlternative: true };
    }
  }
  // Any bodyweight exercise for this muscle
  const bw = EXERCISES.filter(
    (ex) => ex.muscle === muscle && !used.has(ex.id) && ex.equipment.length === 0,
  );
  if (bw.length > 0) {
    return {
      exercise: bw[Math.floor(Math.random() * bw.length)],
      isAlternative: true,
    };
  }
  return null;
}

export function generateWorkout(
  level: FitnessLevel,
  goals: string[],
  equipment: string[],
  workoutTime: string,
  history: WorkoutHistoryEntry[],
): GeneratedWorkout {
  const primaryGoal = goals[0] || "General fitness";
  const muscleFocus = GOAL_MUSCLE_FOCUS[primaryGoal] || GOAL_MUSCLE_FOCUS["General fitness"];
  const used = new Set<string>();

  // Max main exercises by level & time availability
  const timeBudget = workoutTime === "Morning" ? 30 : 45;
  let maxMain: number;
  if (level === "Starting") maxMain = 3;
  else if (level === "Beginner") maxMain = 4;
  else if (level === "Medium") maxMain = 5;
  else maxMain = 6;

  // Reduce for short time budget
  if (timeBudget <= 30 && level === "Starting") maxMain = 2;
  else if (timeBudget <= 30) maxMain = Math.min(maxMain, 4);

  // Warm-up: always 2 exercises
  const warmupExercises = EXERCISES.filter(
    (ex) => ex.id === "warmup-cardio" || ex.id === "warmup-mobility",
  );
  const warmup: GeneratedExercise[] = warmupExercises.map((ex) => {
    used.add(ex.id);
    const tier = ex.tiers[level];
    return {
      id: ex.id,
      name: ex.name,
      muscle: ex.muscle,
      sets: tier.sets,
      reps: tier.reps,
      rest: tier.rest,
      instructions: tier.instructions,
      formTips: tier.formTips,
      isAlternative: false,
      section: "warmup" as const,
    };
  });

  // Main exercises
  const main: GeneratedExercise[] = [];
  for (const muscle of muscleFocus) {
    if (main.length >= maxMain) break;
    const result = pickExerciseWithAlt(muscle, level, equipment, used);
    if (result) {
      used.add(result.exercise.id);
      const tier = result.exercise.tiers[level];
      main.push({
        id: result.exercise.id,
        name: result.exercise.name,
        muscle: result.exercise.muscle,
        sets: tier.sets,
        reps: tier.reps,
        rest: tier.rest,
        instructions: tier.instructions,
        formTips: tier.formTips,
        isAlternative: result.isAlternative,
        section: "main" as const,
      });
    }
  }

  // Cool-down: always 1
  const cooldownEx = EXERCISES.find((ex) => ex.id === "cooldown-stretch")!;
  const cooldown: GeneratedExercise[] = [
    {
      id: cooldownEx.id,
      name: cooldownEx.name,
      muscle: cooldownEx.muscle,
      sets: cooldownEx.tiers[level].sets,
      reps: cooldownEx.tiers[level].reps,
      rest: cooldownEx.tiers[level].rest,
      instructions: cooldownEx.tiers[level].instructions,
      formTips: cooldownEx.tiers[level].formTips,
      isAlternative: false,
      section: "cooldown" as const,
    },
  ];

  const all = [...warmup, ...main, ...cooldown];

  // Estimate duration (sum of sets * ~45 sec per set + rest between)
  let estimatedMin = 0;
  for (const ex of all) {
    const setCount = ex.sets;
    const restSec = parseInt(ex.rest) || 0;
    estimatedMin += (setCount * 45 + (setCount - 1) * restSec) / 60;
  }
  estimatedMin = Math.round(estimatedMin);

  return { exercises: all, estimatedMin, level };
}

/* ---------------------------------------------------
   Progression logic — adjusts difficulty for next
   workout based on feedback. Never increases
   everything at once. Starting users progress slowly.
--------------------------------------------------- */
export function getNextSuggestion(
  level: FitnessLevel,
  difficulty: Difficulty,
  history: WorkoutHistoryEntry[],
): string {
  const recentWorkouts = history.slice(0, 3);
  const lastWorkout = history[0];

  if (difficulty === "Too hard") {
    if (level === "Starting") {
      return "Next time: fewer sets and easier exercises. Take longer rest. It's okay to take a step back — consistency over intensity.";
    }
    return "Next time: reduce to fewer sets or lighter intensity. Take extra rest between sets.";
  }

  if (difficulty === "Hard") {
    return "Good effort. Keep the same difficulty next time — your body is adapting. Stay consistent before progressing.";
  }

  if (difficulty === "Good") {
    if (level === "Starting") {
      const count = recentWorkouts.filter((w) => w.difficulty === "Good" || w.difficulty === "Easy").length;
      if (count >= 3) {
        return "You've been consistent. Next time, consider adding one set to one exercise only. Keep everything else the same.";
      }
      return "Great session. Keep the same plan next time — at Starting level, consistency builds the foundation.";
    }
    if (level === "Beginner") {
      const count = recentWorkouts.filter((w) => w.difficulty === "Good" || w.difficulty === "Easy").length;
      if (count >= 2) {
        return "Next time: add a few reps to one exercise, or one set to your strongest movement. Only change one thing.";
      }
      return "Solid workout. Repeat this plan next time before progressing.";
    }
    return "Next time: add a small progression — a few reps, one set, or slightly more intensity on one exercise.";
  }

  if (difficulty === "Easy") {
    if (level === "Starting") {
      const count = recentWorkouts.filter((w) => w.difficulty === "Easy").length;
      if (count >= 2) {
        return "Ready for a small step up. Next time, add 2 reps to one exercise only. Keep everything else the same.";
      }
      return "Good — but let's stay at this level a bit longer. Consistency first at Starting level.";
    }
    if (level === "Beginner") {
      return "Next time: increase reps on one exercise or add a set to your main movement. Small step only.";
    }
    return "Next time: increase intensity — more reps, an extra set, or pick a harder variation. Change one thing.";
  }

  if (difficulty === "Very easy") {
    if (level === "Starting") {
      return "This may be too light. Next time, add a few reps to each exercise, but stay at Starting level for now.";
    }
    if (level === "Beginner") {
      return "Time to progress. Next time, add reps and one set to your main exercise.";
    }
    return "Push harder next time — increase volume and intensity. Consider moving up a level soon.";
  }

  return "Listen to your body and adjust accordingly.";
}

/* ---------------------------------------------------
   Workout history — localStorage persistence
--------------------------------------------------- */
const HISTORY_KEY = "fitness_app_workout_history";

export function loadHistory(): WorkoutHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: WorkoutHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function addHistoryEntry(entry: WorkoutHistoryEntry): WorkoutHistoryEntry[] {
  const history = loadHistory();
  const updated = [entry, ...history].slice(0, 50); // keep last 50
  saveHistory(updated);
  return updated;
}

/* ---------------------------------------------------
   Pain warning — always remind users not to push
   through pain.
--------------------------------------------------- */
export const PAIN_REMINDER =
  "Stop if you feel sharp pain. Muscle soreness is normal; joint or sharp pain is not. Never push through pain.";
