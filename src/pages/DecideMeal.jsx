import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Banknote,
  CheckCircle2,
  Clock3,
  Cloud,
  Coffee,
  Globe2,
  Heart,
  Leaf,
  Loader2,
  Moon,
  Sandwich,
  Sparkles,
  Sun,
  Timer,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import MealResultCard from "../components/MealResultCard";
import PageHeader from "../components/ui/PageHeader";
import PremiumCard from "../components/ui/PremiumCard";
import { pantryItems } from "../data/demoData";
import { mealSuggestions } from "../data/mealSuggestions";
import {
  calculateMissingIngredientCost,
  estimateMealNutrition,
} from "../data/ingredientPrices";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const PANTRY_STORAGE_KEY = "mealmind_pantry_items";
const SAVED_MEALS_KEY = "mealmind_saved_meals";
const SETTINGS_KEY = "mealmind_settings";
const REQUESTED_MEAL_KEY = "mealmind_requested_meal";

const defaultSettings = {
  currency: "KWD",
  region: "Kuwait",
  dietPreference: "No preference",
  budgetMode: "Balanced",
  expiryStrictness: "Normal",
  smartSuggestions: true,
  groceryAutoGroup: true,
  lowStockAlerts: true,
  demoMode: false,
};

const mealTypes = [
  { label: "Any", icon: Sparkles },
  { label: "Breakfast", icon: Coffee },
  { label: "Lunch", icon: Sandwich },
  { label: "Dinner", icon: Moon },
  { label: "Snack", icon: Sun },
];

const moods = [
  { label: "Lazy", icon: Zap },
  { label: "Cheap", icon: Banknote },
  { label: "Healthy", icon: Leaf },
  { label: "High Protein", icon: Utensils },
  { label: "Comfort", icon: Heart },
];

const times = [
  { label: "10 min", value: 10, icon: Timer },
  { label: "20 min", value: 20, icon: Clock3 },
  { label: "40 min", value: 40, icon: Clock3 },
];

const budgets = [
  { label: "Very cheap", maxCost: 1.0, icon: Banknote },
  { label: "Normal", maxCost: 2.5, icon: Wallet },
  { label: "Any", maxCost: Infinity, icon: Sparkles },
];

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadSettings() {
  return {
    ...defaultSettings,
    ...readStorage(SETTINGS_KEY, {}),
  };
}

function readRequestedMeal() {
  try {
    const saved = localStorage.getItem(REQUESTED_MEAL_KEY);

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);
    localStorage.removeItem(REQUESTED_MEAL_KEY);

    return parsed;
  } catch {
    localStorage.removeItem(REQUESTED_MEAL_KEY);
    return null;
  }
}

function getInitialBudget(settings) {
  if (settings.budgetMode === "Strict saver") {
    return "Very cheap";
  }

  if (settings.budgetMode === "Flexible") {
    return "Any";
  }

  return "Normal";
}

function getInitialTimeForMeal(meal) {
  if (!meal) {
    return "20 min";
  }

  const totalTime = Number(meal.prepTime || 0) + Number(meal.cookTime || 0);

  if (totalTime <= 10) {
    return "10 min";
  }

  if (totalTime <= 20) {
    return "20 min";
  }

  return "40 min";
}

function getInitialMoodForMeal(meal) {
  if (!meal || !Array.isArray(meal.moods) || meal.moods.length === 0) {
    return "High Protein";
  }

  if (meal.moods.includes("High Protein")) {
    return "High Protein";
  }

  return meal.moods[0];
}

function getPriceRegion(settings) {
  const region = normalizeText(settings.region);

  if (region.includes("kuwait")) {
    return "kuwait";
  }

  return "kuwait";
}

function loadPantryItems() {
  const savedItems = localStorage.getItem(PANTRY_STORAGE_KEY);

  if (!savedItems) {
    return pantryItems;
  }

  try {
    const parsed = JSON.parse(savedItems);
    return Array.isArray(parsed) ? parsed : pantryItems;
  } catch {
    localStorage.removeItem(PANTRY_STORAGE_KEY);
    return pantryItems;
  }
}

function getSelectedBudgetLimit(selectedBudget) {
  return (
    budgets.find((budget) => budget.label === selectedBudget)?.maxCost ?? 2.5
  );
}

function getScoreBand(score) {
  if (score >= 90) return "Excellent match";
  if (score >= 80) return "Strong match";
  if (score >= 70) return "Good option";
  if (score >= 60) return "Possible option";
  return "Needs shopping";
}

function mealTypeMatches(meal, selectedMealType) {
  if (selectedMealType === "Any") {
    return true;
  }

  return meal.mealType === selectedMealType;
}

function mealText(meal) {
  return [
    meal.name,
    meal.mealType,
    meal.cuisine,
    meal.proteinType,
    ...(meal.moods || []),
    ...(meal.requiredIngredients || []),
  ]
    .join(" ")
    .toLowerCase();
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function dietAllowsMeal(meal, dietPreference) {
  const diet = normalizeText(dietPreference);

  if (!diet || diet === "no preference") {
    return true;
  }

  const text = mealText(meal);

  const meatWords = [
    "chicken",
    "beef",
    "ground beef",
    "meat",
    "tuna",
    "salmon",
    "shrimp",
    "fish",
  ];

  const animalWords = [
    ...meatWords,
    "egg",
    "eggs",
    "milk",
    "cheese",
    "butter",
    "yogurt",
    "cream",
    "caesar sauce",
  ];

  const carbHeavyWords = [
    "rice",
    "pasta",
    "bread",
    "wrap",
    "wraps",
    "tortilla",
    "tortillas",
    "noodles",
    "oats",
    "cereal",
    "flour",
    "potato",
    "potatoes",
  ];

  if (diet === "vegetarian") {
    return !hasAny(text, meatWords);
  }

  if (diet === "vegan") {
    return !hasAny(text, animalWords);
  }

  if (diet === "pescatarian") {
    const landMeatWords = ["chicken", "beef", "ground beef", "meat"];
    return !hasAny(text, landMeatWords);
  }

  if (diet === "low carb") {
    return !hasAny(text, carbHeavyWords);
  }

  if (diet === "halal focused") {
    const nonHalalWords = ["pork", "bacon", "ham", "wine", "alcohol"];
    return !hasAny(text, nonHalalWords);
  }

  return true;
}

function getDietScoreBoost(meal, dietPreference, nutrition) {
  const diet = normalizeText(dietPreference);
  const text = mealText(meal);

  if (diet === "high protein") {
    if (nutrition.protein >= 35) return 8;
    if (meal.moods?.includes("High Protein")) return 7;
    if (
      hasAny(text, ["chicken", "beef", "tuna", "salmon", "shrimp", "eggs"])
    ) {
      return 5;
    }
  }

  if (diet === "low calorie") {
    if (nutrition.calories <= 450) return 8;
    if (meal.moods?.includes("Healthy")) return 5;
    if (meal.moods?.includes("Comfort")) return -4;
  }

  if (diet === "vegetarian" || diet === "vegan" || diet === "pescatarian") {
    return 4;
  }

  if (diet === "low carb") {
    return 4;
  }

  if (diet === "halal focused") {
    return 2;
  }

  return 0;
}

function getBudgetScoreAdjustment(totalExtraCost, budgetMode) {
  if (budgetMode === "Strict saver") {
    if (totalExtraCost === 0) return 9;
    if (totalExtraCost <= 0.75) return 6;
    if (totalExtraCost <= 1.5) return 1;
    return -8;
  }

  if (budgetMode === "Flexible") {
    if (totalExtraCost <= 2.5) return 3;
    return -1;
  }

  if (totalExtraCost === 0) return 5;
  if (totalExtraCost <= 1) return 3;
  if (totalExtraCost <= 2.5) return 1;
  return -4;
}

function enrichMeal(
  meal,
  availablePantryNames,
  selectedMood,
  selectedTimeValue,
  settings
) {
  const priceRegion = getPriceRegion(settings);

  const haveIngredients = meal.requiredIngredients.filter((ingredient) =>
    availablePantryNames.includes(normalizeText(ingredient))
  );

  const missingIngredients = meal.requiredIngredients.filter(
    (ingredient) => !availablePantryNames.includes(normalizeText(ingredient))
  );

  const missingCost = calculateMissingIngredientCost(
    missingIngredients,
    priceRegion
  );

  const nutrition = estimateMealNutrition(meal.requiredIngredients);
  const totalTime = meal.prepTime + meal.cookTime;
  const pantryRatio = haveIngredients.length / meal.requiredIngredients.length;

  let matchScore = meal.baseScore;

  matchScore += pantryRatio * (settings.smartSuggestions ? 24 : 10);

  if (meal.moods.includes(selectedMood)) {
    matchScore += 8;
  }

  if (totalTime <= selectedTimeValue) {
    matchScore += 7;
  } else if (totalTime <= selectedTimeValue + 10) {
    matchScore += 2;
  } else {
    matchScore -= 8;
  }

  if (missingCost.total === 0) {
    matchScore += 7;
  } else if (missingCost.total <= 1) {
    matchScore += 4;
  } else if (missingCost.total <= 2.5) {
    matchScore += 1;
  } else {
    matchScore -= 6;
  }

  matchScore += getBudgetScoreAdjustment(missingCost.total, settings.budgetMode);
  matchScore += getDietScoreBoost(meal, settings.dietPreference, nutrition);

  if (missingIngredients.length >= 5) {
    matchScore -= 5;
  }

  const roundedScore = Math.max(42, Math.min(96, Math.round(matchScore)));

  return {
    ...meal,
    totalTime,
    haveIngredients,
    missingIngredients,
    missingIngredientDetails: missingCost.items,
    totalExtraCost: missingCost.total,
    totalExtraCostLabel: missingCost.label,
    nutrition,
    matchScore: roundedScore,
    scoreBand: getScoreBand(roundedScore),
  };
}

function buildSavedMeal(meal, selectedMood) {
  return {
    id: meal.id,
    name: meal.name,
    type: meal.mealType,
    mealType: meal.mealType,
    cuisine: meal.cuisine,
    mood: selectedMood,
    time: meal.totalTime,
    totalTime: meal.totalTime,
    difficulty: meal.difficulty || "Easy",
    match: meal.matchScore,
    matchScore: meal.matchScore,
    estimatedCost: Number(meal.totalExtraCost || 0),
    totalExtraCost: Number(meal.totalExtraCost || 0),
    savedAt: new Date().toISOString(),
    requiredItems: meal.requiredIngredients || [],
    requiredIngredients: meal.requiredIngredients || [],
    pantryItems: meal.haveIngredients || [],
    haveIngredients: meal.haveIngredients || [],
    missingItems: (meal.missingIngredientDetails || []).map((item) => ({
      name: item.name || item.ingredient || item.itemName || "Missing item",
      quantity: item.quantity || item.package || item.amount || "1 item",
      price: Number(item.price || item.cost || 0),
    })),
    nutrition: {
      calories: meal.nutrition?.calories || 0,
      protein: meal.nutrition?.protein || 0,
      carbs: meal.nutrition?.carbs || 0,
      fat: meal.nutrition?.fat || 0,
    },
  };
}

function rowToPantryItem(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    name: row.name || data.name || "Pantry item",
    quantity: row.quantity || data.quantity || "1 item",
    category: row.category || data.category || "Other",
    location: row.location || data.location || "Pantry",
    status: row.status || data.status || "Stocked",
    expiryDays: row.expiry_days ?? data.expiryDays ?? data.daysLeft ?? null,
    expiry: row.expiry_days ?? data.expiry ?? null,
    daysUntilExpiry: row.expiry_days ?? data.daysUntilExpiry ?? null,
    daysLeft: row.expiry_days ?? data.daysLeft ?? null,
    expiryDate: row.expiry_date || data.expiryDate || null,
    expireIn: row.expiry_days ?? data.expireIn ?? null,
    createdAt: row.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || data.updatedAt || new Date().toISOString(),
  };
}

function rowToSavedMeal(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    name: row.name || data.name || "Saved meal",
    type: row.type || data.type || data.mealType || "Meal",
    mealType: row.type || data.mealType || data.type || "Meal",
    cuisine: row.cuisine || data.cuisine || "Simple",
    mood: row.mood || data.mood || "Any",
    time: Number(row.time_minutes || data.time || data.totalTime || 20),
    totalTime: Number(row.time_minutes || data.totalTime || data.time || 20),
    difficulty: row.difficulty || data.difficulty || "Easy",
    match: Number(row.match_score || data.match || data.matchScore || 80),
    matchScore: Number(row.match_score || data.matchScore || data.match || 80),
    estimatedCost: Number(row.estimated_cost || data.estimatedCost || 0),
    totalExtraCost: Number(
      row.estimated_cost || data.totalExtraCost || data.estimatedCost || 0
    ),
    savedAt: row.saved_at || data.savedAt || row.created_at || new Date().toISOString(),
  };
}

function savedMealToRow(meal, userId) {
  return {
    user_id: userId,
    name: meal.name || "Saved meal",
    type: meal.type || meal.mealType || "Meal",
    cuisine: meal.cuisine || "Simple",
    mood: meal.mood || "Any",
    time_minutes: Number(meal.time || meal.totalTime || 20),
    difficulty: meal.difficulty || "Easy",
    match_score: Number(meal.match || meal.matchScore || 80),
    estimated_cost: Number(meal.estimatedCost || meal.totalExtraCost || 0),
    saved_at: meal.savedAt || new Date().toISOString(),
    data: meal,
  };
}

function CloudSyncBadge({ syncStatus }) {
  const content = {
    loading: {
      label: "Loading cloud meals",
      icon: Loader2,
      className: "border-sky-300/20 bg-sky-400/10 text-sky-300",
      spin: true,
    },
    saving: {
      label: "Saving to cloud",
      icon: Loader2,
      className: "border-orange-300/20 bg-orange-400/10 text-orange-300",
      spin: true,
    },
    synced: {
      label: "Cloud synced",
      icon: Cloud,
      className: "border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]",
      spin: false,
    },
    local: {
      label: "Local only",
      icon: Archive,
      className: "border-white/10 bg-white/[0.06] text-[#c9cab3]",
      spin: false,
    },
    error: {
      label: "Cloud sync issue",
      icon: AlertTriangle,
      className: "border-red-300/20 bg-red-400/10 text-red-300",
      spin: false,
    },
  };

  const current = content[syncStatus] || content.synced;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-xs font-extrabold ${current.className}`}
    >
      <Icon size={15} className={current.spin ? "animate-spin" : ""} />
      {current.label}
    </div>
  );
}

function FilterChip({ option, active, onClick }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-extrabold transition ${
        active
          ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/25"
          : "border border-white/10 bg-[#0f120c]/70 text-[#c9cab3] hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      <Icon size={15} />
      {option.label}
    </button>
  );
}

function FilterBlock({ title, options, selected, onSelect }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[#0f120c]/55 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
          {title}
        </p>

        <span className="rounded-full border border-[#d7f75b]/15 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
          {selected}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.label}
            option={option}
            active={selected === option.label}
            onClick={() => onSelect(option.label)}
          />
        ))}
      </div>
    </div>
  );
}

function SettingsInsight({ settings }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-[#d7f75b]/15 bg-[#d7f75b]/[0.055] px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#d7f75b]">
          <Leaf size={14} />
          Food preference
        </div>
        <p className="text-sm font-extrabold text-[#fff8e8]">
          {settings.dietPreference}
        </p>
      </div>

      <div className="rounded-2xl border border-orange-300/15 bg-orange-400/[0.055] px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-orange-300">
          <Wallet size={14} />
          Budget behavior
        </div>
        <p className="text-sm font-extrabold text-[#fff8e8]">
          {settings.budgetMode}
        </p>
      </div>

      <div className="rounded-2xl border border-sky-300/15 bg-sky-400/[0.055] px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-sky-300">
          <Globe2 size={14} />
          Region
        </div>
        <p className="text-sm font-extrabold text-[#fff8e8]">
          {settings.region} · {settings.currency}
        </p>
      </div>
    </div>
  );
}

function MealBriefPanel({
  selectedMealType,
  selectedMood,
  selectedTime,
  selectedBudget,
  settings,
  onMealTypeChange,
  onMoodChange,
  onTimeChange,
  onBudgetChange,
}) {
  return (
    <PremiumCard className="mb-5 p-5 md:p-6" hover={false}>
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            <Sparkles size={15} />
            Meal brief
          </div>

          <h3 className="display-font text-2xl font-extrabold md:text-3xl">
            I want a{" "}
            <span className="text-[#d7f75b]">{selectedMealType}</span> meal
            that feels <span className="text-[#d7f75b]">{selectedMood}</span>.
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
            It should take around{" "}
            <span className="font-extrabold text-white">{selectedTime}</span>{" "}
            and fit a{" "}
            <span className="font-extrabold text-white">
              {selectedBudget}
            </span>{" "}
            budget.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-bold text-[#c9cab3]">
          Settings now influence ranking and filtering.
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        <FilterBlock
          title="Meal type"
          options={mealTypes}
          selected={selectedMealType}
          onSelect={onMealTypeChange}
        />

        <FilterBlock
          title="Mood"
          options={moods}
          selected={selectedMood}
          onSelect={onMoodChange}
        />

        <FilterBlock
          title="Time"
          options={times}
          selected={selectedTime}
          onSelect={onTimeChange}
        />

        <FilterBlock
          title="Budget"
          options={budgets}
          selected={selectedBudget}
          onSelect={onBudgetChange}
        />
      </div>

      <SettingsInsight settings={settings} />
    </PremiumCard>
  );
}

function CompactMealCard({
  meal,
  active,
  onClick,
  selectedTimeValue,
  selectedBudgetLimit,
  relaxed = false,
}) {
  const overTime = meal.totalTime > selectedTimeValue;
  const overBudget = meal.totalExtraCost > selectedBudgetLimit;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.35rem] border p-4 text-left transition hover:-translate-y-1 ${
        active
          ? "border-[#d7f75b]/35 bg-[#d7f75b]/10 shadow-lg shadow-[#d7f75b]/5"
          : "border-white/10 bg-white/[0.035] hover:border-white/20"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="display-font text-lg font-extrabold">{meal.name}</h4>
          <p className="mt-1 text-xs font-bold text-[#8f927e]">
            {meal.mealType} · {meal.cuisine} · {meal.proteinType}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
          {meal.matchScore}%
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            overTime && relaxed
              ? "bg-orange-400/10 text-orange-300"
              : "bg-white/[0.06] text-[#c9cab3]"
          }`}
        >
          {meal.totalTime} min
        </span>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            overBudget && relaxed
              ? "bg-red-400/10 text-red-300"
              : "bg-sky-400/10 text-sky-300"
          }`}
        >
          {meal.totalExtraCostLabel}
        </span>

        <span className="rounded-full bg-orange-400/10 px-3 py-1.5 text-xs font-bold text-orange-300">
          {meal.missingIngredients.length} missing
        </span>

        {relaxed && overTime && (
          <span className="rounded-full bg-orange-400/10 px-3 py-1.5 text-xs font-bold text-orange-300">
            Over time
          </span>
        )}

        {relaxed && overBudget && (
          <span className="rounded-full bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-300">
            Over budget
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyExactMatchCard({
  selectedMealType,
  selectedMood,
  selectedTime,
  selectedBudget,
  settings,
  onRelaxTime,
  onRelaxBudget,
}) {
  return (
    <div className="rounded-[1.4rem] border border-orange-300/15 bg-orange-400/[0.055] p-4">
      <div className="mb-2 flex items-center gap-2 text-orange-300">
        <AlertTriangle size={18} />
        <h4 className="display-font font-extrabold">No exact matches</h4>
      </div>

      <p className="text-sm leading-6 text-[#c9cab3]">
        No meal fully matches{" "}
        <span className="font-extrabold text-white">{selectedMealType}</span>,{" "}
        <span className="font-extrabold text-white">{selectedMood}</span>,{" "}
        <span className="font-extrabold text-white">{selectedTime}</span>,{" "}
        <span className="font-extrabold text-white">{selectedBudget}</span>, and
        your{" "}
        <span className="font-extrabold text-white">
          {settings.dietPreference}
        </span>{" "}
        preference.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRelaxTime}
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/10"
        >
          Increase time
        </button>

        <button
          type="button"
          onClick={onRelaxBudget}
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/10"
        >
          Relax budget
        </button>
      </div>
    </div>
  );
}

function SaveMealBar({ selectedMeal, selectedMood, saveStatus, onSaveMeal }) {
  return (
    <PremiumCard className="mb-4 p-4" hover={false}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]">
            <Archive size={20} />
          </div>

          <div>
            <h3 className="display-font text-xl font-extrabold">
              Save this meal
            </h3>

            <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
              Add{" "}
              <span className="font-extrabold text-white">
                {selectedMeal.name}
              </span>{" "}
              to Meal History so you can cook it again later.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSaveMeal(selectedMeal, selectedMood)}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold transition ${
            saveStatus === "saved"
              ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20"
              : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
          }`}
        >
          {saveStatus === "saved" ? (
            <>
              <CheckCircle2 size={18} />
              Saved to history
            </>
          ) : saveStatus === "saving" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Archive size={18} />
              Save Meal
            </>
          )}
        </button>
      </div>
    </PremiumCard>
  );
}

function DecideMeal() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(() => loadSettings());
  const [pantry, setPantry] = useState(() => safeArray(loadPantryItems()));
  const [savedMeals, setSavedMeals] = useState(() =>
    safeArray(readStorage(SAVED_MEALS_KEY, []))
  );
  const [requestedMeal] = useState(() => readRequestedMeal());
  const [syncStatus, setSyncStatus] = useState("loading");

  const requestedSuggestion = useMemo(() => {
    if (!requestedMeal) {
      return null;
    }

    return (
      mealSuggestions.find((meal) => meal.id === requestedMeal.id) ||
      mealSuggestions.find(
        (meal) => normalizeText(meal.name) === normalizeText(requestedMeal.name)
      ) ||
      null
    );
  }, [requestedMeal]);

  const [selectedMealType, setSelectedMealType] = useState(() =>
    requestedSuggestion ? requestedSuggestion.mealType : "Any"
  );

  const [selectedMood, setSelectedMood] = useState(() =>
    getInitialMoodForMeal(requestedSuggestion)
  );

  const [selectedTime, setSelectedTime] = useState(() =>
    getInitialTimeForMeal(requestedSuggestion)
  );

  const [selectedBudget, setSelectedBudget] = useState(() =>
    requestedSuggestion ? "Any" : getInitialBudget(settings)
  );

  const [selectedMealId, setSelectedMealId] = useState(
    requestedSuggestion?.id || ""
  );

  const [saveStatus, setSaveStatus] = useState("");

  async function fetchCloudData() {
    if (!user?.id) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("loading");

    const [settingsResult, pantryResult, savedMealsResult] = await Promise.all([
      supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("pantry_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("saved_meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (settingsResult.error) {
      console.error("Decide Meal settings fetch error:", settingsResult.error.message);
      setSyncStatus("error");
      return;
    }

    if (pantryResult.error) {
      console.error("Decide Meal pantry fetch error:", pantryResult.error.message);
      setSyncStatus("error");
      return;
    }

    if (savedMealsResult.error) {
      console.error(
        "Decide Meal saved meals fetch error:",
        savedMealsResult.error.message
      );
      setSyncStatus("error");
      return;
    }

    const cloudSettings =
      settingsResult.data?.settings || settingsResult.data?.data || null;

    const nextSettings = {
      ...defaultSettings,
      ...readStorage(SETTINGS_KEY, {}),
      ...(cloudSettings || {}),
    };

    const nextPantry = safeArray(pantryResult.data).map(rowToPantryItem);
    const nextSavedMeals = safeArray(savedMealsResult.data).map(rowToSavedMeal);

    setSettings(nextSettings);
    setPantry(nextPantry);
    setSavedMeals(nextSavedMeals);

    saveStorage(SETTINGS_KEY, nextSettings);
    saveStorage(PANTRY_STORAGE_KEY, nextPantry);
    saveStorage(SAVED_MEALS_KEY, nextSavedMeals);

    setSelectedBudget((currentBudget) => {
      if (requestedSuggestion) {
        return currentBudget;
      }

      return currentBudget || getInitialBudget(nextSettings);
    });

    setSyncStatus("synced");
  }

  async function saveCloudSavedMeals(nextMeals) {
    saveStorage(SAVED_MEALS_KEY, nextMeals);
    setSavedMeals(nextMeals);

    if (!user?.id) {
      setSyncStatus("local");
      return true;
    }

    setSyncStatus("saving");

    const { error: deleteError } = await supabase
      .from("saved_meals")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Decide Meal saved meals delete error:", deleteError.message);
      setSyncStatus("error");
      return false;
    }

    if (nextMeals.length > 0) {
      const rows = nextMeals.map((meal) => savedMealToRow(meal, user.id));

      const { error: insertError } = await supabase
        .from("saved_meals")
        .insert(rows);

      if (insertError) {
        console.error("Decide Meal saved meals insert error:", insertError.message);
        setSyncStatus("error");
        return false;
      }
    }

    setSyncStatus("synced");
    return true;
  }

  useEffect(() => {
    fetchCloudData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const selectedTimeValue =
    times.find((time) => time.label === selectedTime)?.value ?? 20;

  const selectedBudgetLimit = getSelectedBudgetLimit(selectedBudget);

  const availablePantryNames = useMemo(() => {
    return safeArray(pantry)
      .filter((item) => item.status !== "Out of stock")
      .map((item) => normalizeText(item.name));
  }, [pantry]);

  const enrichedMeals = useMemo(() => {
    return mealSuggestions
      .filter((meal) => mealTypeMatches(meal, selectedMealType))
      .filter((meal) => meal.moods.includes(selectedMood))
      .filter((meal) => dietAllowsMeal(meal, settings.dietPreference))
      .map((meal) =>
        enrichMeal(
          meal,
          availablePantryNames,
          selectedMood,
          selectedTimeValue,
          settings
        )
      );
  }, [
    selectedMealType,
    selectedMood,
    selectedTimeValue,
    settings,
    availablePantryNames,
  ]);

  const exactMatches = useMemo(() => {
    return enrichedMeals
      .filter((meal) => meal.totalTime <= selectedTimeValue)
      .filter((meal) => meal.totalExtraCost <= selectedBudgetLimit)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }

        if (settings.budgetMode === "Strict saver") {
          if (a.totalExtraCost !== b.totalExtraCost) {
            return a.totalExtraCost - b.totalExtraCost;
          }
        }

        if (a.totalExtraCost !== b.totalExtraCost) {
          return a.totalExtraCost - b.totalExtraCost;
        }

        return a.totalTime - b.totalTime;
      });
  }, [
    enrichedMeals,
    selectedTimeValue,
    selectedBudgetLimit,
    settings.budgetMode,
  ]);

  const closestAlternatives = useMemo(() => {
    return enrichedMeals
      .filter((meal) => !exactMatches.some((exact) => exact.id === meal.id))
      .sort((a, b) => {
        const aTimePenalty = Math.max(0, a.totalTime - selectedTimeValue);
        const bTimePenalty = Math.max(0, b.totalTime - selectedTimeValue);

        const aBudgetPenalty = Math.max(
          0,
          a.totalExtraCost - selectedBudgetLimit
        );
        const bBudgetPenalty = Math.max(
          0,
          b.totalExtraCost - selectedBudgetLimit
        );

        const budgetWeight =
          settings.budgetMode === "Strict saver"
            ? 1.45
            : settings.budgetMode === "Flexible"
            ? 0.55
            : 1;

        const aPenalty = aTimePenalty * 0.08 + aBudgetPenalty * budgetWeight;
        const bPenalty = bTimePenalty * 0.08 + bBudgetPenalty * budgetWeight;

        if (aPenalty !== bPenalty) {
          return aPenalty - bPenalty;
        }

        return b.matchScore - a.matchScore;
      })
      .slice(0, 6);
  }, [
    enrichedMeals,
    exactMatches,
    selectedTimeValue,
    selectedBudgetLimit,
    settings.budgetMode,
  ]);

  const requestedVisibleMeal = useMemo(() => {
    if (!requestedSuggestion) {
      return null;
    }

    return enrichMeal(
      requestedSuggestion,
      availablePantryNames,
      getInitialMoodForMeal(requestedSuggestion),
      selectedTimeValue,
      settings
    );
  }, [requestedSuggestion, selectedTimeValue, settings, availablePantryNames]);

  const showingExactMatches = exactMatches.length > 0;
  const baseVisibleMeals = showingExactMatches
    ? exactMatches
    : closestAlternatives;

  const visibleMeals = useMemo(() => {
    if (!requestedVisibleMeal) {
      return baseVisibleMeals;
    }

    const alreadyVisible = baseVisibleMeals.some(
      (meal) => meal.id === requestedVisibleMeal.id
    );

    if (alreadyVisible) {
      return baseVisibleMeals;
    }

    return [requestedVisibleMeal, ...baseVisibleMeals];
  }, [baseVisibleMeals, requestedVisibleMeal]);

  const selectedMeal =
    visibleMeals.find((meal) => meal.id === selectedMealId) ??
    visibleMeals.find((meal) => meal.id === requestedSuggestion?.id) ??
    visibleMeals[0];

  function resetSelectedMeal() {
    setSelectedMealId("");
    setSaveStatus("");
  }

  function handleMealTypeChange(value) {
    setSelectedMealType(value);
    resetSelectedMeal();
  }

  function handleMoodChange(value) {
    setSelectedMood(value);
    resetSelectedMeal();
  }

  function handleTimeChange(value) {
    setSelectedTime(value);
    resetSelectedMeal();
  }

  function handleBudgetChange(value) {
    setSelectedBudget(value);
    resetSelectedMeal();
  }

  function handleMealSelect(mealId) {
    setSelectedMealId(mealId);
    setSaveStatus("");
  }

  function handleTryAnother() {
    if (!selectedMeal || visibleMeals.length === 0) {
      return;
    }

    const currentIndex = visibleMeals.findIndex(
      (meal) => meal.id === selectedMeal.id
    );

    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextMeal = visibleMeals[(safeCurrentIndex + 1) % visibleMeals.length];

    setSelectedMealId(nextMeal.id);
    setSaveStatus("");
  }

  function increaseTime() {
    if (selectedTime === "10 min") {
      setSelectedTime("20 min");
      resetSelectedMeal();
      return;
    }

    if (selectedTime === "20 min") {
      setSelectedTime("40 min");
      resetSelectedMeal();
    }
  }

  function relaxBudget() {
    if (selectedBudget === "Very cheap") {
      setSelectedBudget("Normal");
      resetSelectedMeal();
      return;
    }

    if (selectedBudget === "Normal") {
      setSelectedBudget("Any");
      resetSelectedMeal();
    }
  }

  async function handleSaveMeal(meal, mood) {
    if (!meal) {
      return;
    }

    setSaveStatus("saving");

    const savedMeal = buildSavedMeal(meal, mood);

    const updatedSavedMeals = [
      savedMeal,
      ...safeArray(savedMeals).filter((saved) => saved.id !== savedMeal.id),
    ];

    const saved = await saveCloudSavedMeals(updatedSavedMeals);

    if (saved) {
      setSaveStatus("saved");

      window.setTimeout(() => {
        setSaveStatus("");
      }, 1800);
    } else {
      setSaveStatus("");
    }
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Decide Meal"
        title="What should you eat?"
        description="Choose meal type, mood, time, and budget. MealMind uses your pantry and settings when ranking meals."
        action={<CloudSyncBadge syncStatus={syncStatus} />}
      />

      <MealBriefPanel
        selectedMealType={selectedMealType}
        selectedMood={selectedMood}
        selectedTime={selectedTime}
        selectedBudget={selectedBudget}
        settings={settings}
        onMealTypeChange={handleMealTypeChange}
        onMoodChange={handleMoodChange}
        onTimeChange={handleTimeChange}
        onBudgetChange={handleBudgetChange}
      />

      <section className="grid gap-5 xl:grid-cols-[0.45fr_1.55fr]">
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[#d7f75b]">
                <Sparkles size={18} />
                <h3 className="display-font text-xl font-extrabold">
                  {showingExactMatches
                    ? "Matching meals"
                    : "Closest alternatives"}
                </h3>
              </div>

              <p className="text-sm leading-6 text-[#b7b89f]">
                {requestedSuggestion
                  ? `${requestedSuggestion.name} was opened from your saved meal.`
                  : showingExactMatches
                  ? `${exactMatches.length} exact matches found with your saved preferences.`
                  : "No exact matches. These options are outside your selected time, budget, or settings preference."}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
              {selectedBudget === "Any"
                ? "Any budget"
                : `≤ ${selectedBudgetLimit.toFixed(3)} KWD`}
            </span>
          </div>

          {!showingExactMatches && !requestedSuggestion && (
            <div className="mb-3">
              <EmptyExactMatchCard
                selectedMealType={selectedMealType}
                selectedMood={selectedMood}
                selectedTime={selectedTime}
                selectedBudget={selectedBudget}
                settings={settings}
                onRelaxTime={increaseTime}
                onRelaxBudget={relaxBudget}
              />
            </div>
          )}

          <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {visibleMeals.length > 0 ? (
              visibleMeals.map((meal) => (
                <CompactMealCard
                  key={meal.id}
                  meal={meal}
                  active={selectedMeal && meal.id === selectedMeal.id}
                  onClick={() => handleMealSelect(meal.id)}
                  selectedTimeValue={selectedTimeValue}
                  selectedBudgetLimit={selectedBudgetLimit}
                  relaxed={!showingExactMatches}
                />
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm leading-6 text-[#b7b89f]">
                  No meals found for this combination yet. Try changing the meal
                  type, mood, or food preference in Settings.
                </p>
              </div>
            )}
          </div>
        </PremiumCard>

        {selectedMeal && (
          <div>
            <SaveMealBar
              selectedMeal={selectedMeal}
              selectedMood={selectedMood}
              saveStatus={saveStatus}
              onSaveMeal={handleSaveMeal}
            />

            <MealResultCard
              meal={selectedMeal}
              onTryAnother={handleTryAnother}
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default DecideMeal;