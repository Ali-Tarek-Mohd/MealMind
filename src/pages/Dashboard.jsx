import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ChefHat,
  Clock3,
  Cloud,
  Coins,
  Leaf,
  Loader2,
  Package,
  Plus,
  ShoppingBasket,
  Sparkles,
  Timer,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import CookThisModal from "../components/CookThisModal";
import PremiumButton from "../components/ui/PremiumButton";
import ProgressRing from "../components/ui/ProgressRing";
import { mealSuggestions } from "../data/mealSuggestions";
import { calculateMissingIngredientCost } from "../data/ingredientPrices";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const PANTRY_STORAGE_KEY = "mealmind_pantry_items";
const SAVED_MEALS_KEY = "mealmind_saved_meals";
const COOKED_HISTORY_KEY = "mealmind_cooked_history";
const GROCERY_KEY = "mealmind_grocery_items";
const SETTINGS_KEY = "mealmind_settings";
const TAKEAWAY_ESTIMATE_KWD = 2.5;

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

function formatMoney(value, currency = "KWD") {
  return `${Number(value || 0).toFixed(3)} ${currency}`;
}

function getStartOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isThisWeek(dateValue) {
  const date = new Date(dateValue);

  if (!Number.isFinite(date.getTime())) {
    return false;
  }

  const today = getStartOfDay(new Date());
  const sevenDaysAgo = getStartOfDay(new Date());
  sevenDaysAgo.setDate(today.getDate() - 6);

  return date >= sevenDaysAgo && date <= new Date();
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.email?.split("@")?.[0] ||
    "Ali"
  );
}

function getMealCost(item, savedMeals) {
  const directCost = Number(item.estimatedCost || item.totalExtraCost || 0);

  if (directCost > 0) {
    return directCost;
  }

  const matchingMeal = savedMeals.find((meal) => meal.id === item.mealId);

  return Number(
    matchingMeal?.estimatedCost ||
      matchingMeal?.totalExtraCost ||
      matchingMeal?.cost ||
      0
  );
}

function getDateDaysLeft(dateValue) {
  if (!dateValue) return null;

  const today = new Date();
  const expiry = new Date(dateValue);

  if (!Number.isFinite(expiry.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getExpiryValue(item) {
  const possibleValues = [
    item.daysLeft,
    item.expiryDays,
    item.daysUntilExpiry,
    item.expiry,
    item.expireIn,
    item.expiry_days,
  ];

  const validValue = possibleValues.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "undefined" &&
      !Number.isNaN(Number(value))
  );

  if (validValue !== undefined) {
    return Number(validValue);
  }

  if (
    item.expiryDate &&
    item.expiryDate !== "undefined" &&
    !Number.isNaN(Date.parse(item.expiryDate))
  ) {
    return Math.max(0, getDateDaysLeft(item.expiryDate));
  }

  if (
    item.expiry_date &&
    item.expiry_date !== "undefined" &&
    !Number.isNaN(Date.parse(item.expiry_date))
  ) {
    return Math.max(0, getDateDaysLeft(item.expiry_date));
  }

  return null;
}

function rowToPantryItem(row) {
  const data = row.data || {};
  const expiryDays = row.expiry_days ?? data.expiryDays ?? data.daysLeft ?? null;

  return {
    ...data,
    id: row.id,
    name: row.name || data.name || "Pantry item",
    quantity: row.quantity || data.quantity || "1 item",
    category: row.category || data.category || "Other",
    location: row.location || data.location || "Pantry",
    status: row.status || data.status || "Stocked",
    expiryDays,
    expiry: expiryDays,
    daysUntilExpiry: expiryDays,
    daysLeft: expiryDays,
    expiryDate: row.expiry_date || data.expiryDate || null,
    expireIn: expiryDays,
    createdAt: row.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || data.updatedAt || new Date().toISOString(),
  };
}

function rowToGroceryItem(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    name: row.name || data.name || "Grocery item",
    quantity: row.quantity || data.quantity || "1 item",
    category: row.category || data.category || "Other",
    neededFor: row.needed_for || data.neededFor || data.source || "Manual item",
    source: row.needed_for || data.source || data.neededFor || "Manual item",
    priority: row.priority || data.priority || "Needed",
    checked: Boolean(row.checked ?? data.checked ?? data.completed ?? data.bought),
    completed: Boolean(row.checked ?? data.checked ?? data.completed ?? data.bought),
    bought: Boolean(row.checked ?? data.checked ?? data.completed ?? data.bought),
    estimatedPrice: Number(row.estimated_price_kwd || data.estimatedPrice || 0),
    price: Number(row.estimated_price_kwd || data.price || 0),
    estimatedPriceKwd: Number(row.estimated_price_kwd || data.estimatedPriceKwd || 0),
    priceKwd: Number(row.estimated_price_kwd || data.priceKwd || 0),
    currency: "KWD",
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
    totalExtraCost: Number(row.estimated_cost || data.totalExtraCost || data.estimatedCost || 0),
    savedAt: row.saved_at || data.savedAt || row.created_at || new Date().toISOString(),
  };
}

function rowToCookedEntry(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    mealId: row.meal_id || data.mealId || null,
    name: row.name || data.name || "Cooked meal",
    cookedAt: row.cooked_at || data.cookedAt || row.created_at || new Date().toISOString(),
    estimatedCost: Number(row.estimated_cost || data.estimatedCost || 0),
    type: row.type || data.type || "Meal",
    source: row.source || data.source || "Dashboard",
  };
}

function getPantryStats(items, settings) {
  const activeItems = safeArray(items).filter((item) => item.status !== "Out of stock");
  const lowStockItems = activeItems.filter((item) => item.status === "Low stock");

  const expiryLimit =
    settings.expiryStrictness === "Relaxed"
      ? 2
      : settings.expiryStrictness === "Strict"
      ? 7
      : 5;

  const useSoonItems = activeItems
    .map((item) => ({
      ...item,
      daysLeft: getExpiryValue(item),
    }))
    .filter(
      (item) =>
        item.daysLeft !== null &&
        item.daysLeft >= 0 &&
        item.daysLeft <= expiryLimit
    )
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  return {
    items,
    activeItems,
    lowStockItems,
    useSoonItems,
  };
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

function getBudgetScoreAdjustment(totalExtraCost, budgetMode) {
  if (budgetMode === "Strict saver") {
    if (totalExtraCost === 0) return 10;
    if (totalExtraCost <= 0.75) return 6;
    if (totalExtraCost <= 1.5) return 1;
    return -9;
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

function getDietScoreBoost(meal, dietPreference) {
  const diet = normalizeText(dietPreference);
  const text = mealText(meal);

  if (diet === "high protein") {
    if (meal.moods?.includes("High Protein")) return 8;

    if (
      hasAny(text, ["chicken", "beef", "tuna", "salmon", "shrimp", "eggs"])
    ) {
      return 5;
    }
  }

  if (diet === "low calorie") {
    if (meal.moods?.includes("Healthy")) return 7;
    if (meal.moods?.includes("Comfort")) return -5;
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

function getSmartPicks(settings, pantryItems) {
  const availablePantryNames = safeArray(pantryItems)
    .filter((item) => item.status !== "Out of stock")
    .map((item) => normalizeText(item.name));

  if (availablePantryNames.length === 0) {
    return [];
  }

  return mealSuggestions
    .filter((meal) => dietAllowsMeal(meal, settings.dietPreference))
    .map((meal) => {
      const haveIngredients = meal.requiredIngredients.filter((ingredient) =>
        availablePantryNames.includes(normalizeText(ingredient))
      );

      const missingIngredients = meal.requiredIngredients.filter(
        (ingredient) => !availablePantryNames.includes(normalizeText(ingredient))
      );

      const missingCost = calculateMissingIngredientCost(
        missingIngredients,
        "kuwait"
      );

      const pantryRatio =
        haveIngredients.length / meal.requiredIngredients.length;

      const totalTime = meal.prepTime + meal.cookTime;

      let matchScore = meal.baseScore;

      matchScore += pantryRatio * (settings.smartSuggestions ? 26 : 10);

      if (missingCost.total === 0) {
        matchScore += 7;
      } else if (missingCost.total <= 1) {
        matchScore += 4;
      } else if (missingCost.total <= 2.5) {
        matchScore += 1;
      } else {
        matchScore -= 5;
      }

      matchScore += getBudgetScoreAdjustment(
        missingCost.total,
        settings.budgetMode
      );

      matchScore += getDietScoreBoost(meal, settings.dietPreference);

      if (settings.budgetMode === "Strict saver" && missingCost.total > 2.5) {
        matchScore -= 6;
      }

      if (settings.budgetMode === "Flexible") {
        matchScore += meal.moods?.includes("Comfort") ? 2 : 0;
      }

      if (totalTime <= 20) {
        matchScore += 5;
      }

      if (missingIngredients.length >= 5) {
        matchScore -= 5;
      }

      return {
        ...meal,
        totalTime,
        haveIngredients,
        missingIngredients,
        missingIngredientDetails: missingCost.items,
        totalExtraCost: missingCost.total,
        totalExtraCostLabel: missingCost.label,
        matchScore: Math.max(55, Math.min(96, Math.round(matchScore))),
      };
    })
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
    })
    .slice(0, 8);
}

function getArtworkType(meal) {
  const name =
    `${meal.name} ${meal.mealType} ${meal.cuisine} ${meal.proteinType}`.toLowerCase();

  if (
    name.includes("toast") ||
    name.includes("sandwich") ||
    name.includes("melt")
  ) {
    return "toast";
  }

  if (
    name.includes("wrap") ||
    name.includes("taco") ||
    name.includes("fajita")
  ) {
    return "wrap";
  }

  if (
    name.includes("pasta") ||
    name.includes("spaghetti") ||
    name.includes("noodles")
  ) {
    return "pasta";
  }

  if (
    name.includes("curry") ||
    name.includes("soup") ||
    name.includes("butter chicken") ||
    name.includes("shakshuka")
  ) {
    return "sauce";
  }

  if (
    name.includes("salmon") ||
    name.includes("fish") ||
    name.includes("shrimp")
  ) {
    return "fish";
  }

  if (
    name.includes("bowl") ||
    name.includes("rice") ||
    name.includes("kabsa") ||
    name.includes("biryani") ||
    name.includes("koshari")
  ) {
    return "bowl";
  }

  return "plate";
}

function IngredientDot({ className, color }) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0], rotate: [0, 3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute rounded-full ${className}`}
      style={{ background: color }}
    />
  );
}

function FoodArtwork({ meal }) {
  const type = getArtworkType(meal);

  const config = {
    toast: {
      base: "from-[#f8d391] via-[#b96b2d] to-[#5f2c12]",
      bowl: "from-[#fff1c6] to-[#d39142]",
      main: "#b45318",
      accent: "#f97316",
      second: "#ffd166",
      green: "#d7f75b",
    },
    wrap: {
      base: "from-[#ffe0a3] via-[#c58a3b] to-[#74400f]",
      bowl: "from-[#fff1c6] to-[#d59d52]",
      main: "#e8c67a",
      accent: "#f97316",
      second: "#bb5b2e",
      green: "#d7f75b",
    },
    pasta: {
      base: "from-[#fff1c6] via-[#d89a42] to-[#7d3f16]",
      bowl: "from-[#fff8e8] to-[#efd08a]",
      main: "#f4c542",
      accent: "#c94724",
      second: "#fff1c6",
      green: "#d7f75b",
    },
    sauce: {
      base: "from-[#f6c177] via-[#9f3f1d] to-[#401c0d]",
      bowl: "from-[#d9772f] via-[#b9441e] to-[#70210f]",
      main: "#fff1c6",
      accent: "#bf4b22",
      second: "#ffcf4d",
      green: "#d7f75b",
    },
    fish: {
      base: "from-[#dff6ff] via-[#69a4bd] to-[#18465a]",
      bowl: "from-[#fff8e8] to-[#dff6ff]",
      main: "#f97316",
      accent: "#ffb45f",
      second: "#fff1c6",
      green: "#d7f75b",
    },
    bowl: {
      base: "from-[#fff1c6] via-[#b87434] to-[#663411]",
      bowl: "from-[#fff8e8] to-[#f0d59a]",
      main: "#f4e1a1",
      accent: "#c76732",
      second: "#ffcf4d",
      green: "#d7f75b",
    },
    plate: {
      base: "from-[#fff1c6] via-[#b87434] to-[#663411]",
      bowl: "from-[#fff8e8] to-[#f0d59a]",
      main: "#f4e1a1",
      accent: "#c76732",
      second: "#ffcf4d",
      green: "#d7f75b",
    },
  };

  const c = config[type] ?? config.plate;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden h-52 w-52 shrink-0 lg:block xl:h-56 xl:w-56"
    >
      <motion.div
        animate={{ rotate: [0, 1.5, 0, -1.5, 0], y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-[2.6rem] bg-gradient-to-br ${c.base} p-5 shadow-2xl shadow-orange-500/15`}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-br ${c.bowl} shadow-inner shadow-black/20`}
        >
          <div className="absolute inset-7 rounded-full bg-[#fff8e8]/90 shadow-inner shadow-black/10" />

          {type === "wrap" ? (
            <>
              <div className="absolute left-16 top-7 h-32 w-16 -rotate-[25deg] rounded-full bg-[#fff1c6] shadow-inner shadow-black/10" />
              <div
                className="absolute left-[4.6rem] top-12 h-24 w-10 -rotate-[25deg] rounded-full"
                style={{ background: c.accent }}
              />
              <IngredientDot
                className="right-10 top-10 h-9 w-9"
                color={c.green}
              />
              <IngredientDot
                className="bottom-10 left-10 h-9 w-9"
                color={c.second}
              />
            </>
          ) : type === "fish" ? (
            <>
              <div
                className="absolute left-12 top-20 h-14 w-24 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${c.main}, ${c.accent})`,
                }}
              />
              <div className="absolute right-9 top-[5.9rem] h-0 w-0 border-y-[16px] border-l-[26px] border-y-transparent border-l-orange-400" />
              <IngredientDot
                className="bottom-10 left-12 h-9 w-16"
                color={c.green}
              />
            </>
          ) : (
            <>
              <IngredientDot
                className="left-12 top-12 h-20 w-20"
                color={c.main}
              />
              <div
                className="absolute right-12 top-16 h-14 w-14 rounded-[1.2rem]"
                style={{ background: c.accent }}
              />
              <IngredientDot
                className="bottom-12 left-14 h-9 w-9"
                color={c.green}
              />
              <IngredientDot
                className="bottom-14 right-14 h-9 w-9"
                color={c.second}
              />
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -inset-7 -z-10 rounded-full bg-[#d7f75b]/10 blur-3xl"
      />
    </motion.div>
  );
}

function AnimatedMatchCard({ score }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, x: 22 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative hidden w-[178px] shrink-0 overflow-hidden rounded-[1.8rem] border border-[#d7f75b]/20 bg-[#0f140d]/85 p-4 shadow-2xl shadow-[#d7f75b]/10 backdrop-blur-xl sm:block"
    >
      <motion.div
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.12, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#d7f75b]/20 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#d7f75b]/25 bg-[#d7f75b]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#d7f75b]">
            <Zap size={12} />
            Live match
          </div>

          <p className="text-xs font-bold leading-5 text-[#8f927e]">
            Pantry fit score
          </p>
        </div>

        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]"
        >
          <Sparkles size={18} />
        </motion.div>
      </div>

      <div className="relative mt-4 flex items-center justify-center">
        <ProgressRing
          value={score}
          size={112}
          stroke={9}
          label="Match"
          icon={TrendingUp}
          delay={0.16}
        />
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              opacity: [0.35, 1, 0.35],
              scaleY: [0.55, 1, 0.55],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.18,
            }}
            className="h-1.5 rounded-full bg-[#d7f75b]"
          />
        ))}
      </div>

      <p className="relative mt-3 text-center text-xs font-extrabold text-[#d7f75b]">
        {score >= 85
          ? "Excellent pick"
          : score >= 70
          ? "Good pick"
          : "Backup pick"}
      </p>
    </motion.div>
  );
}

function MiniMetric({ icon: Icon, value, color = "lime" }) {
  const iconColor = {
    lime: "text-[#d7f75b]",
    blue: "text-sky-300",
    orange: "text-orange-300",
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-extrabold text-[#fff8e8]">
      <Icon size={15} className={iconColor[color]} />
      <span>{value}</span>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, color = "lime", delay = 0 }) {
  const styles = {
    lime: {
      box: "border-[#d7f75b]/15 bg-[#d7f75b]/[0.075]",
      icon: "bg-[#d7f75b]/15 text-[#d7f75b]",
      glow: "bg-[#d7f75b]/20",
    },
    orange: {
      box: "border-orange-300/15 bg-orange-400/[0.075]",
      icon: "bg-orange-400/15 text-orange-300",
      glow: "bg-orange-400/20",
    },
    blue: {
      box: "border-sky-300/15 bg-sky-400/[0.075]",
      icon: "bg-sky-400/15 text-sky-300",
      glow: "bg-sky-400/20",
    },
  };

  const current = styles[color] || styles.lime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-[1.25rem] border ${current.box} p-4`}
    >
      <motion.div
        animate={{ opacity: [0.14, 0.34, 0.14], scale: [1, 1.15, 1] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className={`absolute -right-10 -top-10 h-24 w-24 rounded-full ${current.glow} blur-2xl`}
      />

      <div className="relative">
        <div
          className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${current.icon}`}
        >
          <Icon size={17} />
        </div>

        <p className="text-xs font-bold text-[#8f927e]">{label}</p>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: delay + 0.12 }}
          className="display-font mt-1 text-xl font-extrabold text-[#fff8e8]"
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

function CloudSyncBadge({ syncStatus }) {
  const content = {
    loading: {
      label: "Loading cloud dashboard",
      icon: Loader2,
      className: "border-sky-300/20 bg-sky-400/10 text-sky-300",
      spin: true,
    },
    synced: {
      label: "Cloud synced",
      icon: Cloud,
      className: "border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]",
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

function DashboardStarter({ onOpenPantry, onOpenSettings }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[1.8rem] border border-[#d7f75b]/20 bg-gradient-to-br from-[#1d2315]/95 via-[#13180f]/95 to-[#10130d]/95 p-6 shadow-2xl shadow-black/25"
    >
      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/20 blur-3xl"
      />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            <Sparkles size={15} />
            Fresh start
          </div>

          <h2 className="display-font max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Add your first pantry item
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7b89f] md:text-base">
            MealMind needs a few ingredients before it can suggest useful meals,
            expiry reminders, and shopping shortcuts.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <Package size={20} className="mb-3 text-[#d7f75b]" />
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Add pantry
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                Start with what you already have.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <Clock3 size={20} className="mb-3 text-orange-300" />
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Track expiry
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                See what should be used first.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <Utensils size={20} className="mb-3 text-sky-300" />
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Get meals
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                Suggestions become more accurate.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <PremiumButton icon={Plus} onClick={onOpenPantry}>
              Add pantry item
            </PremiumButton>

            <PremiumButton
              variant="secondary"
              icon={Sparkles}
              onClick={onOpenSettings}
            >
              Try demo kitchen
            </PremiumButton>
          </div>
        </div>

        <div className="hidden rounded-[2rem] border border-[#d7f75b]/20 bg-[#d7f75b]/[0.07] p-5 lg:block">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#d7f75b]/15 text-[#d7f75b]">
            <Package size={32} />
          </div>

          <h3 className="display-font mt-5 text-2xl font-extrabold">
            Pantry is empty
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
            No fake recommendations yet. Add food first so the dashboard becomes
            personal.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function UseSoonCompact({ items, pantryCount, onOpenUseSoon, onOpenPantry }) {
  const topItem = items[0];
  const otherItems = items.slice(1, 3);
  const hasItems = items.length > 0;
  const hasPantry = pantryCount > 0;

  return (
    <section className="relative overflow-hidden rounded-[1.8rem] border border-orange-300/15 bg-gradient-to-br from-[#211909]/90 via-[#15180f]/90 to-[#0f130c]/95 p-5 shadow-2xl shadow-black/25">
      <motion.div
        animate={{ opacity: [0.18, 0.38, 0.18], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl"
      />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-extrabold text-orange-300">
              <AlertTriangle size={14} />
              Expiry watch
            </div>

            <h3 className="display-font text-2xl font-extrabold">Use soon</h3>

            <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
              Prioritized items before they go bad.
            </p>
          </div>

          <motion.div
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-400/12 text-orange-300 shadow-lg shadow-orange-400/10"
          >
            <Clock3 size={22} />
          </motion.div>
        </div>

        {hasItems ? (
          <>
            <div className="rounded-[1.45rem] border border-orange-300/20 bg-orange-400/[0.075] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-orange-300">
                    Highest priority
                  </p>

                  <h4 className="display-font mt-1 text-2xl font-extrabold text-[#fff8e8]">
                    {topItem.name}
                  </h4>
                </div>

                <motion.span
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-full border border-orange-300/25 bg-orange-400/15 px-3 py-1.5 text-xs font-black text-orange-300"
                >
                  {topItem.daysLeft === 0
                    ? "Today"
                    : `${topItem.daysLeft} day${
                        topItem.daysLeft === 1 ? "" : "s"
                      }`}
                </motion.span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-300">
                  <CalendarClock size={18} />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-[#fff8e8]">
                    Use this first
                  </p>

                  <p className="text-xs leading-5 text-[#8f927e]">
                    Ranked highest based on expiry date.
                  </p>
                </div>
              </div>
            </div>

            {otherItems.length > 0 && (
              <div className="mt-3 space-y-2">
                {otherItems.map((item) => (
                  <motion.div
                    key={`${item.name}-${item.daysLeft}`}
                    whileHover={{ x: 3 }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-extrabold text-[#fff8e8]">
                        {item.name}
                      </h4>

                      <p className="text-xs font-bold text-[#8f927e]">
                        Watch list
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                      {item.daysLeft === 0
                        ? "Today"
                        : `${item.daysLeft} day${
                            item.daysLeft === 1 ? "" : "s"
                          }`}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[1.45rem] border border-[#d7f75b]/15 bg-[#d7f75b]/[0.055] p-4">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
              <Package size={22} />
            </div>

            <h4 className="display-font text-xl font-extrabold">
              {hasPantry ? "Nothing urgent" : "No pantry items yet"}
            </h4>

            <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
              {hasPantry
                ? "Your pantry looks stable right now."
                : "Add food to your pantry first, then MealMind will track what should be used soon."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={hasPantry ? onOpenUseSoon : onOpenPantry}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm font-extrabold text-[#fff8e8] transition hover:-translate-y-0.5 hover:bg-white/[0.11]"
        >
          {hasPantry ? "Open Use Soon" : "Open Pantry"}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function BackupPicksCompact({ meals, onSelect, onOpenDecide }) {
  return (
    <section className="rounded-[1.65rem] border border-white/10 bg-[#141811]/80 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
            <Sparkles size={13} />
            Other picks
          </div>

          <h3 className="display-font text-xl font-extrabold">
            Backup choices
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenDecide}
          className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-extrabold text-[#fff8e8] transition hover:bg-white/10"
        >
          Decide
        </button>
      </div>

      <div className="space-y-2">
        {meals.map((meal) => (
          <button
            key={meal.id}
            type="button"
            onClick={() => onSelect(meal.id)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/65 px-4 py-3 text-left transition hover:bg-white/[0.06]"
          >
            <div className="min-w-0">
              <h4 className="truncate text-sm font-extrabold text-[#fff8e8]">
                {meal.name}
              </h4>

              <p className="mt-1 truncate text-xs font-bold text-[#8f927e]">
                {meal.mealType} · {meal.totalTime} min ·{" "}
                {meal.totalExtraCostLabel}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-2.5 py-1 text-xs font-extrabold text-[#d7f75b]">
              {meal.matchScore}%
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...readStorage(SETTINGS_KEY, {}),
  }));
  const [pantryItems, setPantryItems] = useState(() =>
    safeArray(readStorage(PANTRY_STORAGE_KEY, []))
  );
  const [savedMeals, setSavedMeals] = useState(() =>
    safeArray(readStorage(SAVED_MEALS_KEY, []))
  );
  const [cookedHistory, setCookedHistory] = useState(() =>
    safeArray(readStorage(COOKED_HISTORY_KEY, []))
  );
  const [groceryItems, setGroceryItems] = useState(() =>
    safeArray(readStorage(GROCERY_KEY, []))
  );
  const [syncStatus, setSyncStatus] = useState("loading");
  const [selectedSmartPickId, setSelectedSmartPickId] = useState("");
  const [mealToCook, setMealToCook] = useState(null);

  async function fetchDashboardCloudData() {
    if (!user?.id) {
      setSyncStatus("synced");
      return;
    }

    setSyncStatus("loading");

    const [
      settingsResult,
      pantryResult,
      groceryResult,
      savedMealsResult,
      cookedHistoryResult,
    ] = await Promise.all([
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
        .from("grocery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("saved_meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("cooked_history")
        .select("*")
        .eq("user_id", user.id)
        .order("cooked_at", { ascending: false }),
    ]);

    const results = [
      settingsResult,
      pantryResult,
      groceryResult,
      savedMealsResult,
      cookedHistoryResult,
    ];

    const failed = results.find((result) => result.error);

    if (failed) {
      console.error("Dashboard cloud fetch error:", failed.error.message);
      setSyncStatus("error");
      return;
    }

    const cloudSettings = settingsResult.data?.settings || settingsResult.data?.data || null;
    const nextSettings = {
      ...defaultSettings,
      ...readStorage(SETTINGS_KEY, {}),
      ...(cloudSettings || {}),
    };

    const nextPantryItems = safeArray(pantryResult.data).map(rowToPantryItem);
    const nextGroceryItems = safeArray(groceryResult.data).map(rowToGroceryItem);
    const nextSavedMeals = safeArray(savedMealsResult.data).map(rowToSavedMeal);
    const nextCookedHistory = safeArray(cookedHistoryResult.data).map(rowToCookedEntry);

    setSettings(nextSettings);
    setPantryItems(nextPantryItems);
    setGroceryItems(nextGroceryItems);
    setSavedMeals(nextSavedMeals);
    setCookedHistory(nextCookedHistory);

    saveStorage(SETTINGS_KEY, nextSettings);
    saveStorage(PANTRY_STORAGE_KEY, nextPantryItems);
    saveStorage(GROCERY_KEY, nextGroceryItems);
    saveStorage(SAVED_MEALS_KEY, nextSavedMeals);
    saveStorage(COOKED_HISTORY_KEY, nextCookedHistory);

    setSyncStatus("synced");
  }

  useEffect(() => {
    fetchDashboardCloudData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const pantryStats = useMemo(
    () => getPantryStats(pantryItems, settings),
    [pantryItems, settings]
  );

  const hasPantryItems = pantryStats.activeItems.length > 0;

  const smartPicks = useMemo(() => {
    if (!hasPantryItems) {
      return [];
    }

    return getSmartPicks(settings, pantryItems);
  }, [settings, pantryItems, hasPantryItems]);

  const cookedThisWeek = useMemo(() => {
    return cookedHistory.filter((item) => isThisWeek(item.cookedAt)).length;
  }, [cookedHistory]);

  const estimatedSaved = useMemo(() => {
    const totalMealCost = cookedHistory.reduce((total, item) => {
      return total + getMealCost(item, savedMeals);
    }, 0);

    const takeawayCost = cookedHistory.length * TAKEAWAY_ESTIMATE_KWD;

    return Math.max(0, takeawayCost - totalMealCost);
  }, [cookedHistory, savedMeals]);

  const smartPick =
    smartPicks.find((meal) => meal.id === selectedSmartPickId) ??
    smartPicks[0];

  const backupPicks = smartPick
    ? smartPicks.filter((meal) => meal.id !== smartPick.id).slice(0, 3)
    : smartPicks.slice(0, 3);

  function handleCookThis() {
    if (!smartPick) return;
    setMealToCook(smartPick);
  }

  function handleChangeMood() {
    if (!smartPick || smartPicks.length === 0) return;

    const currentIndex = smartPicks.findIndex(
      (meal) => meal.id === smartPick.id
    );

    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextMeal = smartPicks[(safeCurrentIndex + 1) % smartPicks.length];

    setSelectedSmartPickId(nextMeal.id);
  }

  return (
    <div className="pb-6">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold text-[#d7f75b]">
            Today’s kitchen overview
          </p>

          <h1 className="display-font text-4xl font-black tracking-tight md:text-5xl">
            Good evening, {getDisplayName(user)}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7b89f] md:text-base">
            One clear smart pick, what needs using soon, and your key kitchen
            numbers.
          </p>
        </div>

        <CloudSyncBadge syncStatus={syncStatus} />
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-[#1d2315]/90 via-[#13180f]/90 to-[#10130d]/90 p-5 shadow-2xl shadow-black/20 md:p-6">
          {hasPantryItems && smartPick ? (
            <motion.div
              key={smartPick.id}
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-5 lg:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
                  <Sparkles size={15} />
                  Tonight’s smart pick
                </div>

                <h2 className="display-font max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-5xl">
                  {smartPick.name}
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c9cab3]">
                  {smartPick.mealType} · {smartPick.cuisine} · using{" "}
                  {settings.dietPreference}, {settings.budgetMode}, and{" "}
                  {settings.currency}.
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <MiniMetric
                    icon={Timer}
                    value={`${smartPick.totalTime} min`}
                    color="lime"
                  />

                  <MiniMetric
                    icon={ChefHat}
                    value={smartPick.difficulty}
                    color="orange"
                  />

                  <MiniMetric
                    icon={Leaf}
                    value={smartPick.proteinType}
                    color="lime"
                  />

                  <MiniMetric
                    icon={Coins}
                    value={smartPick.totalExtraCostLabel}
                    color="blue"
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f120c]/65 px-4 py-3 text-sm font-bold leading-6 text-[#b7b89f]">
                  Using:{" "}
                  <span className="text-[#fff8e8]">
                    {settings.dietPreference}
                  </span>{" "}
                  ·{" "}
                  <span className="text-[#fff8e8]">
                    {settings.budgetMode}
                  </span>{" "}
                  ·{" "}
                  <span className="text-[#fff8e8]">
                    {settings.region} / {settings.currency}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <PremiumButton icon={Utensils} onClick={handleCookThis}>
                    Cook This
                  </PremiumButton>

                  <PremiumButton
                    variant="secondary"
                    icon={Sparkles}
                    onClick={handleChangeMood}
                  >
                    Change Mood
                  </PremiumButton>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5">
                <FoodArtwork meal={smartPick} />
                <AnimatedMatchCard score={smartPick.matchScore} />
              </div>
            </motion.div>
          ) : (
            <DashboardStarter
              onOpenPantry={() => navigate("/pantry")}
              onOpenSettings={() => navigate("/settings")}
            />
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroStat
              icon={Utensils}
              label="Meals cooked"
              value={`${cookedThisWeek} this week`}
              color="lime"
              delay={0.05}
            />

            <HeroStat
              icon={Coins}
              label="Money saved"
              value={formatMoney(estimatedSaved, settings.currency)}
              color="blue"
              delay={0.1}
            />

            <HeroStat
              icon={ShoppingBasket}
              label="Grocery list"
              value={`${groceryItems.length} items`}
              color="orange"
              delay={0.15}
            />

            <HeroStat
              icon={Package}
              label="Pantry stock"
              value={`${pantryStats.activeItems.length} items`}
              color="lime"
              delay={0.2}
            />
          </div>
        </div>

        <UseSoonCompact
          items={pantryStats.useSoonItems}
          pantryCount={pantryStats.activeItems.length}
          onOpenUseSoon={() => navigate("/use-soon")}
          onOpenPantry={() => navigate("/pantry")}
        />
      </section>

      {hasPantryItems && backupPicks.length > 0 && (
        <section className="mt-5">
          <BackupPicksCompact
            meals={backupPicks}
            onSelect={setSelectedSmartPickId}
            onOpenDecide={() => navigate("/decide-meal")}
          />
        </section>
      )}

      {mealToCook && (
        <CookThisModal meal={mealToCook} onClose={() => setMealToCook(null)} />
      )}
    </div>
  );
}

export default Dashboard;