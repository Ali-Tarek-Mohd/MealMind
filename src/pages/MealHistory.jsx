import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Clock3,
  Cloud,
  Flame,
  History,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBasket,
  Sparkles,
  Star,
  Trash2,
  Utensils,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const SAVED_MEALS_KEY = "mealmind_saved_meals";
const COOKED_HISTORY_KEY = "mealmind_cooked_history";
const GROCERY_KEY = "mealmind_grocery_items";
const SETTINGS_KEY = "mealmind_settings";
const PANTRY_STORAGE_KEY = "mealmind_pantry_items";
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

const sampleMeals = [
  {
    id: "meal-chicken-caesar-wrap",
    name: "Chicken Caesar Wrap",
    type: "Lunch",
    cuisine: "Western",
    mood: "High Protein",
    time: 20,
    difficulty: "Easy",
    match: 94,
    estimatedCost: 0,
    savedAt: new Date().toISOString(),
    pantryItems: ["Chicken", "Wraps", "Lettuce", "Cheese", "Caesar Sauce"],
    missingItems: [],
    nutrition: {
      calories: 785,
      protein: 80,
      carbs: 39,
      fat: 34,
    },
  },
  {
    id: "meal-tomato-egg-skillet",
    name: "Tomato Egg Skillet",
    type: "Breakfast",
    cuisine: "Simple",
    mood: "Use Soon",
    time: 15,
    difficulty: "Easy",
    match: 82,
    estimatedCost: 0.85,
    savedAt: new Date(Date.now() - 86400000).toISOString(),
    pantryItems: ["Tomatoes", "Black Pepper"],
    missingItems: [{ name: "Eggs", quantity: "12 pieces", price: 0.85 }],
    nutrition: {
      calories: 410,
      protein: 28,
      carbs: 8,
      fat: 29,
    },
  },
];

const ingredientPriceKwd = {
  chicken: 1.2,
  "chicken breast": 1.45,
  "chicken thighs": 1.15,
  beef: 1.75,
  "ground beef": 1.55,
  meat: 1.5,
  tuna: 0.45,
  salmon: 2.4,
  fish: 1.65,
  shrimp: 2.1,
  eggs: 0.85,
  egg: 0.85,

  rice: 0.55,
  bread: 0.35,
  wraps: 0.55,
  wrap: 0.55,
  pasta: 0.55,
  noodles: 0.45,
  oats: 0.5,
  cereal: 0.75,
  flour: 0.45,
  tortilla: 0.55,
  tortillas: 0.55,
  potato: 0.4,
  potatoes: 0.4,

  lettuce: 0.35,
  tomato: 0.45,
  tomatoes: 0.45,
  onion: 0.25,
  onions: 0.25,
  garlic: 0.2,
  cucumber: 0.3,
  carrot: 0.3,
  carrots: 0.3,
  broccoli: 0.65,
  spinach: 0.55,
  mushroom: 0.6,
  mushrooms: 0.6,
  corn: 0.45,
  avocado: 0.75,
  "bell pepper": 0.4,
  peppers: 0.4,

  banana: 0.35,
  bananas: 0.35,
  apple: 0.4,
  apples: 0.4,
  orange: 0.4,
  oranges: 0.4,
  lemon: 0.25,
  lemons: 0.25,
  lime: 0.25,
  berries: 0.95,
  strawberry: 0.95,
  strawberries: 0.95,

  milk: 0.5,
  cheese: 0.7,
  butter: 0.75,
  yogurt: 0.45,
  cream: 0.55,
  "cream cheese": 0.65,

  "black pepper": 0.55,
  paprika: 0.45,
  cinnamon: 0.4,
  cumin: 0.45,
  curry: 0.5,
  "curry powder": 0.5,
  "garam masala": 0.55,
  seasoning: 0.45,
  herbs: 0.45,
  cardamom: 0.65,
  salt: 0.2,
  chili: 0.35,
  "chili flakes": 0.4,

  "olive oil": 1.25,
  oil: 0.75,
  "sesame oil": 1.1,
  "soy sauce": 0.65,
  vinegar: 0.45,
  honey: 0.9,
  sugar: 0.35,
  tahini: 0.8,
  sauce: 0.65,
  "caesar sauce": 0.85,
  mayonnaise: 0.65,
  ketchup: 0.45,
  mustard: 0.45,
  "peanut butter": 0.8,

  lentils: 0.45,
  beans: 0.45,
  chickpeas: 0.45,
  "green peas": 0.4,
  soup: 0.55,

  "caesar dressing": 0.85,
  "tomato sauce": 0.5,
  "pasta sauce": 0.65,
};

function getDefaultIngredientPrice(name) {
  const normalized = normalizeText(name);

  if (!normalized) return 0.5;

  if (ingredientPriceKwd[normalized] !== undefined) {
    return ingredientPriceKwd[normalized];
  }

  const partialMatch = Object.entries(ingredientPriceKwd).find(([key]) =>
    normalized.includes(key)
  );

  if (partialMatch) {
    return partialMatch[1];
  }

  return 0.5;
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return null;
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function loadSettings() {
  return {
    ...defaultSettings,
    ...readStorage(SETTINGS_KEY, {}),
  };
}

function loadCurrentPantryNames() {
  return safeArray(readStorage(PANTRY_STORAGE_KEY, []))
    .filter((item) => item?.status !== "Out of stock")
    .map((item) => normalizeText(item?.name))
    .filter(Boolean);
}

function formatMoney(value, currency = "KWD") {
  return `${Number(value || 0).toFixed(3)} ${currency}`;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently";
  }
}

function formatFullDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently";
  }
}

function inferCategory(name, fallbackCategory = "Meal ingredient") {
  const normalized = normalizeText(name);

  const rules = [
    {
      category: "Protein",
      words: [
        "chicken",
        "beef",
        "tuna",
        "salmon",
        "shrimp",
        "fish",
        "egg",
        "eggs",
        "meat",
      ],
    },
    {
      category: "Carbs",
      words: [
        "rice",
        "bread",
        "wrap",
        "wraps",
        "pasta",
        "noodles",
        "oats",
        "cereal",
        "flour",
        "potato",
        "potatoes",
        "tortilla",
      ],
    },
    {
      category: "Dairy",
      words: ["milk", "cheese", "butter", "yogurt", "cream"],
    },
    {
      category: "Vegetable",
      words: [
        "tomato",
        "tomatoes",
        "onion",
        "garlic",
        "lettuce",
        "cucumber",
        "pepper",
        "bell pepper",
        "carrot",
        "broccoli",
        "spinach",
        "mushroom",
      ],
    },
    {
      category: "Fruit",
      words: [
        "banana",
        "apple",
        "orange",
        "berries",
        "strawberry",
        "lemon",
        "lime",
      ],
    },
    {
      category: "Spice",
      words: [
        "black pepper",
        "paprika",
        "cinnamon",
        "cumin",
        "curry",
        "garam",
        "seasoning",
        "herbs",
        "cardamom",
      ],
    },
    {
      category: "Pantry",
      words: [
        "olive oil",
        "oil",
        "soy sauce",
        "vinegar",
        "honey",
        "sugar",
        "tahini",
        "sauce",
      ],
    },
  ];

  const match = rules.find((rule) =>
    rule.words.some((word) => normalized.includes(word))
  );

  return match?.category ?? fallbackCategory;
}

function normalizeMissingItem(item, index) {
  if (typeof item === "string") {
    return {
      name: item,
      quantity: "1 item",
      price: getDefaultIngredientPrice(item),
    };
  }

  if (!item || typeof item !== "object") {
    const fallbackName = `Missing item ${index + 1}`;

    return {
      name: fallbackName,
      quantity: "1 item",
      price: getDefaultIngredientPrice(fallbackName),
    };
  }

  const possibleName =
    item.name ||
    item.ingredient ||
    item.itemName ||
    item.label ||
    item.title ||
    item.food ||
    "";

  const cleanName = String(possibleName).trim() || `Missing item ${index + 1}`;
  const directPrice = Number(item.price || item.cost || item.value || 0);
  const fallbackPrice = getDefaultIngredientPrice(cleanName);

  return {
    name: cleanName,
    quantity:
      item.quantity || item.package || item.amount || item.qty || "1 item",
    price: directPrice > 0 ? directPrice : fallbackPrice,
  };
}

function normalizeMeal(meal) {
  const safeMeal = meal || {};
  const pantryItems = safeArray(safeMeal.pantryItems || safeMeal.haveIngredients);
  const missingItems = safeArray(
    safeMeal.missingItems || safeMeal.missingIngredientDetails
  ).map(normalizeMissingItem);

  const requiredItems = safeArray(
    safeMeal.requiredItems || safeMeal.requiredIngredients
  );

  const fallbackRequiredItems = [
    ...pantryItems,
    ...missingItems.map((item) => item.name),
  ].filter(Boolean);

  return {
    id: safeMeal.id || `meal-${crypto.randomUUID()}`,
    name: safeMeal.name || "Saved meal",
    type: safeMeal.type || safeMeal.mealType || "Meal",
    cuisine: safeMeal.cuisine || "Simple",
    mood: safeMeal.mood || "Any",
    time: Number(safeMeal.time || safeMeal.totalTime || 20),
    difficulty: safeMeal.difficulty || "Easy",
    match: Number(safeMeal.match || safeMeal.matchScore || 80),
    estimatedCost: Number(
      safeMeal.estimatedCost || safeMeal.totalExtraCost || 0
    ),
    savedAt: safeMeal.savedAt || safeMeal.saved_at || new Date().toISOString(),
    pantryItems,
    missingItems,
    requiredItems:
      requiredItems.length > 0 ? requiredItems : fallbackRequiredItems,
    nutrition: {
      calories: Number(safeMeal.nutrition?.calories || 0),
      protein: Number(safeMeal.nutrition?.protein || 0),
      carbs: Number(safeMeal.nutrition?.carbs || 0),
      fat: Number(safeMeal.nutrition?.fat || 0),
    },
  };
}

function normalizeCookedEntry(entry) {
  const safeEntry = entry || {};

  return {
    id: safeEntry.id || `cooked-${crypto.randomUUID()}`,
    mealId: safeEntry.mealId || safeEntry.meal_id || null,
    name: safeEntry.name || safeEntry.mealName || "Cooked meal",
    cookedAt:
      safeEntry.cookedAt || safeEntry.cooked_at || new Date().toISOString(),
    estimatedCost: Number(
      safeEntry.estimatedCost || safeEntry.estimated_cost || 0
    ),
    type: safeEntry.type || "Meal",
    source: safeEntry.source || "Meal History",
  };
}

function getUniqueNames(items) {
  const seen = new Set();

  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeText(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function refreshMealWithCurrentPantry(meal, pantryNames) {
  const normalizedMeal = normalizeMeal(meal);
  const originalMissingItems = safeArray(normalizedMeal.missingItems).map(
    normalizeMissingItem
  );

  const originalMissingMap = new Map(
    originalMissingItems.map((item) => [normalizeText(item.name), item])
  );

  const requiredItems = getUniqueNames(
    normalizedMeal.requiredItems.length > 0
      ? normalizedMeal.requiredItems
      : [
          ...safeArray(normalizedMeal.pantryItems),
          ...originalMissingItems.map((item) => item.name),
        ]
  );

  const livePantryItems = [];
  const liveMissingItems = [];

  requiredItems.forEach((ingredientName) => {
    const ingredientKey = normalizeText(ingredientName);
    const matchingOldMissing = originalMissingMap.get(ingredientKey);

    if (pantryNames.includes(ingredientKey)) {
      livePantryItems.push(ingredientName);
      return;
    }

    liveMissingItems.push({
      name: ingredientName,
      quantity: matchingOldMissing?.quantity || "1 item",
      price:
        Number(matchingOldMissing?.price || 0) > 0
          ? Number(matchingOldMissing.price)
          : getDefaultIngredientPrice(ingredientName),
    });
  });

  const liveEstimatedCost = liveMissingItems.reduce((total, item) => {
    return total + Number(item.price || 0);
  }, 0);

  return {
    ...normalizedMeal,
    pantryItems: livePantryItems,
    missingItems: liveMissingItems,
    estimatedCost: liveEstimatedCost,
  };
}

function getCookedCost(item, savedMeals) {
  const directCost = Number(item.estimatedCost || item.totalExtraCost || 0);

  if (directCost > 0) {
    return directCost;
  }

  const matchingMeal = savedMeals.find((meal) => meal.id === item.mealId);
  return Number(matchingMeal?.estimatedCost || 0);
}

function mealToRow(meal, userId) {
  const normalizedMeal = normalizeMeal(meal);

  return {
    user_id: userId,
    name: normalizedMeal.name,
    type: normalizedMeal.type,
    cuisine: normalizedMeal.cuisine,
    mood: normalizedMeal.mood,
    time_minutes: normalizedMeal.time,
    difficulty: normalizedMeal.difficulty,
    match_score: normalizedMeal.match,
    estimated_cost: normalizedMeal.estimatedCost,
    saved_at: normalizedMeal.savedAt,
    data: normalizedMeal,
  };
}

function rowToMeal(row) {
  return normalizeMeal({
    ...(row.data || {}),
    id: row.id,
    name: row.name,
    type: row.type,
    cuisine: row.cuisine,
    mood: row.mood,
    time: row.time_minutes,
    difficulty: row.difficulty,
    match: row.match_score,
    estimatedCost: row.estimated_cost,
    savedAt: row.saved_at || row.created_at,
  });
}

function cookedToRow(entry, userId) {
  const normalizedEntry = normalizeCookedEntry(entry);

  return {
    user_id: userId,
    meal_id: normalizedEntry.mealId,
    name: normalizedEntry.name,
    cooked_at: normalizedEntry.cookedAt,
    estimated_cost: normalizedEntry.estimatedCost,
    type: normalizedEntry.type,
    source: normalizedEntry.source,
    data: normalizedEntry,
  };
}

function rowToCooked(row) {
  return normalizeCookedEntry({
    ...(row.data || {}),
    id: row.id,
    mealId: row.meal_id,
    name: row.name,
    cookedAt: row.cooked_at || row.created_at,
    estimatedCost: row.estimated_cost,
    type: row.type,
    source: row.source,
  });
}

function groceryItemToRow(item, userId) {
  return {
    user_id: userId,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    needed_for: item.neededFor,
    priority: item.priority || "Needed",
    checked: Boolean(item.checked),
    estimated_price_kwd: Number(item.estimatedPrice || item.price || 0),
    data: item,
  };
}

function rowToGroceryItem(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category,
    neededFor: row.needed_for,
    source: row.needed_for,
    priority: row.priority,
    estimatedPrice: Number(row.estimated_price_kwd || 0),
    price: Number(row.estimated_price_kwd || 0),
    currency: "KWD",
    checked: Boolean(row.checked),
    completed: Boolean(row.checked),
    bought: Boolean(row.checked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mergeGroceryItems(items) {
  const map = new Map();

  items.forEach((item) => {
    const key = `${normalizeText(item.name)}-${normalizeText(
      item.neededFor || item.mealName || item.source
    )}`;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function CloudSyncBadge({ syncStatus }) {
  const statusContent = {
    loading: {
      label: "Loading cloud history",
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
    error: {
      label: "Cloud sync issue",
      icon: AlertTriangle,
      className: "border-red-300/20 bg-red-400/10 text-red-300",
      spin: false,
    },
  };

  const current = statusContent[syncStatus] || statusContent.synced;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 text-xs font-extrabold ${current.className}`}
    >
      <Icon size={15} className={current.spin ? "animate-spin" : ""} />
      {current.label}
    </div>
  );
}

function Pill({ children, tone = "default" }) {
  const toneClass =
    tone === "lime"
      ? "border-[#d7f75b]/25 bg-[#d7f75b]/10 text-[#d7f75b]"
      : tone === "blue"
      ? "border-sky-300/25 bg-sky-300/10 text-sky-300"
      : tone === "orange"
      ? "border-orange-300/25 bg-orange-300/10 text-orange-300"
      : "border-white/10 bg-white/[0.055] text-[#c9cab3]";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
        toneClass
      )}
    >
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone = "lime" }) {
  const toneClass =
    tone === "blue"
      ? "bg-sky-400/15 text-sky-300"
      : tone === "orange"
      ? "bg-orange-400/15 text-orange-300"
      : tone === "purple"
      ? "bg-violet-400/15 text-violet-300"
      : "bg-[#d7f75b]/15 text-[#d7f75b]";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div
          className={cx(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            toneClass
          )}
        >
          <Icon size={21} strokeWidth={2.5} />
        </div>

        <span className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
          Live
        </span>
      </div>

      <p className="text-sm font-bold text-[#b7b89f]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#fff8e8]">
        {value}
      </p>
      <p className="mt-3 text-sm font-medium text-[#8f927e]">{hint}</p>
    </motion.div>
  );
}

function EmptyState({ onLoadSamples, onOpenDecideMeal, onOpenSettings }) {
  return (
    <div className="relative overflow-hidden rounded-[1.9rem] border border-[#d7f75b]/15 bg-gradient-to-br from-[#1d2315]/90 via-[#141811]/90 to-[#0d100a]/95 p-8 text-center shadow-2xl shadow-black/20 backdrop-blur md:p-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b] shadow-lg shadow-[#d7f75b]/10"
        >
          <Archive size={34} strokeWidth={2.5} />
        </motion.div>

        <h2 className="display-font text-3xl font-extrabold text-[#fff8e8]">
          No saved meals yet
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-[#b7b89f] md:text-base">
          Save a meal from Decide Meal, then it will appear here so you can cook
          it again, add missing ingredients, and track what you cooked.
        </p>

        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onOpenDecideMeal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]"
          >
            <ChefHat size={18} strokeWidth={2.5} />
            Open Decide Meal
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <Sparkles size={18} strokeWidth={2.5} />
            Try demo kitchen
          </button>

          <button
            type="button"
            onClick={onLoadSamples}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-5 text-sm font-extrabold text-[#fff8e8] transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <Plus size={18} strokeWidth={2.5} />
            Load samples
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ChefHat size={20} className="mx-auto mb-3 text-[#d7f75b]" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Save meals
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Keep meals you want to cook again.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ShoppingBasket size={20} className="mx-auto mb-3 text-orange-300" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Add missing items
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Send missing ingredients to Grocery List.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <History size={20} className="mx-auto mb-3 text-sky-300" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Track cooking
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Mark meals cooked and update Analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IngredientRow({ item, currency }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.055] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#fff8e8]">
          {item.name}
        </p>
        <p className="text-xs font-bold text-[#8f927e]">{item.quantity}</p>
      </div>

      <span className="shrink-0 text-xs font-extrabold text-sky-300">
        {formatMoney(item.price, currency)}
      </span>
    </div>
  );
}

function MealCard({
  meal,
  cookedCount,
  selected,
  currency,
  onSelect,
  onCook,
  onAddMissing,
  onDelete,
}) {
  const pantryItems = safeArray(meal.pantryItems);
  const missingItems = safeArray(meal.missingItems).map(normalizeMissingItem);

  return (
    <motion.article
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cx(
        "rounded-[1.7rem] border p-5 transition",
        selected
          ? "border-[#d7f75b]/60 bg-[#d7f75b]/10 shadow-lg shadow-[#d7f75b]/5"
          : "border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.065]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="display-font text-xl font-extrabold text-[#fff8e8]">
              {meal.name}
            </h3>

            <p className="mt-1 text-sm font-medium text-[#b7b89f]">
              {meal.type} · {meal.cuisine} · saved {formatDate(meal.savedAt)}
            </p>
          </div>

          <div className="rounded-full border border-[#d7f75b]/25 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            {meal.match || 80}%
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Pill>
            <Clock3 size={13} className="mr-1" />
            {meal.time || 20} min
          </Pill>
          <Pill>{meal.difficulty || "Easy"}</Pill>
          <Pill tone={missingItems.length > 0 ? "orange" : "lime"}>
            {missingItems.length} missing
          </Pill>
          <Pill tone="blue">{cookedCount} cooked</Pill>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
              Already in pantry
            </p>

            {pantryItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pantryItems.slice(0, 6).map((item) => (
                  <Pill key={item}>{item}</Pill>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-[#8f927e]">
                No matching pantry ingredients.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
              Need to buy
            </p>

            {missingItems.length > 0 ? (
              <div className="space-y-2">
                {missingItems.slice(0, 3).map((item, index) => (
                  <IngredientRow
                    key={`${item.name}-${item.price}-${index}`}
                    item={item}
                    currency={currency}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm font-extrabold text-[#d7f75b]">
                You already have everything.
              </p>
            )}
          </div>
        </div>
      </button>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCook}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-4 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]"
        >
          <ChefHat size={17} strokeWidth={2.5} />
          Mark cooked
        </button>

        <button
          type="button"
          onClick={onAddMissing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-extrabold text-[#fff8e8] transition hover:bg-white/10"
        >
          <ShoppingBasket size={17} strokeWidth={2.5} />
          Add missing
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 text-sm font-extrabold text-red-200 transition hover:bg-red-500/20"
        >
          <Trash2 size={17} strokeWidth={2.5} />
          Remove
        </button>
      </div>
    </motion.article>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-extrabold uppercase tracking-wide text-[#d7f75b]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-[#fff8e8]">{value}</p>
    </div>
  );
}

function SavedCollectionPanel({
  query,
  setQuery,
  filter,
  setFilter,
  filteredCount,
  totalCount,
}) {
  return (
    <section className="rounded-[1.9rem] border border-[#d7f75b]/20 bg-[#d7f75b]/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/25 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            <Archive size={15} strokeWidth={2.5} />
            Saved collection
          </div>

          <h2 className="display-font text-2xl font-extrabold">
            Meals to cook again
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-[#b7b89f]">
            Showing {filteredCount} of {totalCount} saved meals.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d7f75b]/20 bg-black/20 px-4 py-3 text-sm font-extrabold text-[#d7f75b]">
          {totalCount} saved
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4">
          <Search size={18} className="text-[#8f927e]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved meals..."
            className="h-full w-full bg-transparent text-sm font-bold text-[#fff8e8] outline-none placeholder:text-[#8f927e]"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-extrabold text-[#fff8e8] outline-none"
        >
          <option>All</option>
          <option>Cooked</option>
          <option>Not cooked</option>
          <option>Missing items</option>
        </select>
      </div>
    </section>
  );
}

function MealSnapshotPanel({
  selectedMeal,
  settings,
  onCookAgain,
  onAddMissing,
}) {
  return (
    <section className="rounded-[1.9rem] border border-[#d7f75b]/25 bg-[#d7f75b]/[0.075] p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]">
          <Sparkles size={20} strokeWidth={2.5} />
        </div>

        <div>
          <h2 className="display-font text-xl font-extrabold">Meal snapshot</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-[#d7f75b]/80">
            Quick details for the selected saved meal.
          </p>
        </div>
      </div>

      {selectedMeal ? (
        <div>
          <h3 className="display-font text-3xl font-extrabold tracking-tight">
            {selectedMeal.name}
          </h3>

          <p className="mt-2 text-sm font-medium text-[#c9cab3]">
            {selectedMeal.type} · {selectedMeal.cuisine} · {selectedMeal.time}{" "}
            min
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Match
              </p>
              <p className="mt-2 text-3xl font-black text-[#d7f75b]">
                {selectedMeal.match || 80}%
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Need to buy
              </p>
              <p className="mt-2 text-2xl font-black">
                {formatMoney(selectedMeal.estimatedCost || 0, settings.currency)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <SummaryItem
              label="Calories"
              value={`${selectedMeal.nutrition?.calories || 0} kcal`}
            />
            <SummaryItem
              label="Protein"
              value={`${selectedMeal.nutrition?.protein || 0}g`}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onCookAgain(selectedMeal)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-4 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]"
            >
              <ChefHat size={18} strokeWidth={2.5} />
              Cook again
            </button>

            <button
              type="button"
              onClick={() => onAddMissing(selectedMeal)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-extrabold text-[#fff8e8] transition hover:bg-white/10"
            >
              <ShoppingBasket size={18} strokeWidth={2.5} />
              Add missing
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-[#b7b89f]">
          Select a saved meal to view details.
        </p>
      )}
    </section>
  );
}

function RecentCookingPanel({ cookedHistory }) {
  return (
    <aside className="rounded-[1.9rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/25 backdrop-blur">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
          <History size={20} strokeWidth={2.5} />
        </div>

        <div>
          <h2 className="display-font text-xl font-extrabold">
            Recent cooking
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-[#b7b89f]">
            Your latest cooked saved meals.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {cookedHistory.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 p-4"
          >
            <div>
              <p className="text-sm font-extrabold">{item.name}</p>
              <p className="mt-1 flex items-center gap-2 text-xs font-bold text-[#8f927e]">
                <CalendarDays size={13} />
                {formatFullDate(item.cookedAt)}
              </p>
            </div>

            <Pill tone="lime">Cooked</Pill>
          </div>
        ))}

        {cookedHistory.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm font-extrabold">Nothing cooked yet</p>
            <p className="mt-1 text-xs font-medium text-[#8f927e]">
              Mark a saved meal as cooked to start tracking.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function MealHistory() {
  const { user } = useAuth();
  const settings = useMemo(() => loadSettings(), []);

  const [savedMeals, setSavedMeals] = useState(() =>
    safeArray(readStorage(SAVED_MEALS_KEY, [])).map(normalizeMeal)
  );

  const [cookedHistory, setCookedHistory] = useState(() =>
    safeArray(readStorage(COOKED_HISTORY_KEY, [])).map(normalizeCookedEntry)
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [notice, setNotice] = useState("");
  const [syncStatus, setSyncStatus] = useState("loading");

  useEffect(() => {
    saveStorage(SAVED_MEALS_KEY, savedMeals);
  }, [savedMeals]);

  useEffect(() => {
    saveStorage(COOKED_HISTORY_KEY, cookedHistory);
  }, [cookedHistory]);

  async function fetchCloudMealHistory() {
    if (!user?.id) return;

    setSyncStatus("loading");

    const [savedMealsResult, cookedHistoryResult] = await Promise.all([
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

    if (savedMealsResult.error) {
      console.error(
        "Saved meals cloud fetch error:",
        savedMealsResult.error.message
      );
      setSyncStatus("error");
      showNotice("Could not load saved meals from cloud");
      return;
    }

    if (cookedHistoryResult.error) {
      console.error(
        "Cooked history cloud fetch error:",
        cookedHistoryResult.error.message
      );
      setSyncStatus("error");
      showNotice("Could not load cooking history from cloud");
      return;
    }

    const cloudSavedMeals = safeArray(savedMealsResult.data).map(rowToMeal);
    const cloudCookedHistory = safeArray(cookedHistoryResult.data).map(
      rowToCooked
    );

    setSavedMeals(cloudSavedMeals);
    setCookedHistory(cloudCookedHistory);

    saveStorage(SAVED_MEALS_KEY, cloudSavedMeals);
    saveStorage(COOKED_HISTORY_KEY, cloudCookedHistory);

    setSyncStatus("synced");
  }

  async function saveCloudSavedMeals(nextMeals) {
    if (!user?.id) {
      saveStorage(SAVED_MEALS_KEY, nextMeals);
      return true;
    }

    setSyncStatus("saving");

    const normalizedMeals = nextMeals.map(normalizeMeal);

    const { error: deleteError } = await supabase
      .from("saved_meals")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Saved meals cloud delete error:", deleteError.message);
      setSyncStatus("error");
      showNotice("Could not update saved meals in cloud");
      return false;
    }

    if (normalizedMeals.length > 0) {
      const rows = normalizedMeals.map((meal) => mealToRow(meal, user.id));

      const { error: insertError } = await supabase
        .from("saved_meals")
        .insert(rows);

      if (insertError) {
        console.error("Saved meals cloud insert error:", insertError.message);
        setSyncStatus("error");
        showNotice("Could not save meals to cloud");
        return false;
      }
    }

    setSyncStatus("synced");
    return true;
  }

  async function saveCloudCookedHistory(nextHistory) {
    if (!user?.id) {
      saveStorage(COOKED_HISTORY_KEY, nextHistory);
      return true;
    }

    setSyncStatus("saving");

    const normalizedHistory = nextHistory.map(normalizeCookedEntry);

    const { error: deleteError } = await supabase
      .from("cooked_history")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Cooked history cloud delete error:", deleteError.message);
      setSyncStatus("error");
      showNotice("Could not update cooking history in cloud");
      return false;
    }

    if (normalizedHistory.length > 0) {
      const rows = normalizedHistory.map((entry) => cookedToRow(entry, user.id));

      const { error: insertError } = await supabase
        .from("cooked_history")
        .insert(rows);

      if (insertError) {
        console.error("Cooked history cloud insert error:", insertError.message);
        setSyncStatus("error");
        showNotice("Could not save cooking history to cloud");
        return false;
      }
    }

    setSyncStatus("synced");
    return true;
  }

  async function saveCloudGrocery(nextGrocery) {
    if (!user?.id) {
      saveStorage(GROCERY_KEY, nextGrocery);
      return true;
    }

    const { data, error: fetchError } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("Meal History grocery fetch error:", fetchError.message);
      showNotice("Could not update cloud Grocery List");
      return false;
    }

    const existingCloud = safeArray(data).map(rowToGroceryItem);
    const merged = mergeGroceryItems([...nextGrocery, ...existingCloud]);

    const { error: deleteError } = await supabase
      .from("grocery_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Meal History grocery delete error:", deleteError.message);
      showNotice("Could not update cloud Grocery List");
      return false;
    }

    if (merged.length > 0) {
      const rows = merged.map((item) => groceryItemToRow(item, user.id));

      const { error: insertError } = await supabase
        .from("grocery_items")
        .insert(rows);

      if (insertError) {
        console.error("Meal History grocery insert error:", insertError.message);
        showNotice("Could not add missing items to cloud Grocery List");
        return false;
      }
    }

    saveStorage(GROCERY_KEY, merged);
    return true;
  }

  useEffect(() => {
    fetchCloudMealHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const pantryNames = useMemo(() => loadCurrentPantryNames(), [savedMeals]);

  const liveSavedMeals = useMemo(() => {
    return savedMeals.map((meal) =>
      refreshMealWithCurrentPantry(meal, pantryNames)
    );
  }, [savedMeals, pantryNames]);

  const cookedCountByMeal = useMemo(() => {
    return cookedHistory.reduce((acc, item) => {
      acc[item.mealId] = (acc[item.mealId] || 0) + 1;
      return acc;
    }, {});
  }, [cookedHistory]);

  const mealsCookedThisWeek = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return cookedHistory.filter((item) => {
      const cookedAt = new Date(item.cookedAt).getTime();
      return Number.isFinite(cookedAt) && cookedAt >= sevenDaysAgo;
    }).length;
  }, [cookedHistory]);

  const totalSavedCost = useMemo(() => {
    return cookedHistory.reduce((total, item) => {
      return total + getCookedCost(item, liveSavedMeals);
    }, 0);
  }, [cookedHistory, liveSavedMeals]);

  const mostCookedMeal = useMemo(() => {
    if (!liveSavedMeals.length) return null;

    return [...liveSavedMeals].sort((a, b) => {
      return (cookedCountByMeal[b.id] || 0) - (cookedCountByMeal[a.id] || 0);
    })[0];
  }, [liveSavedMeals, cookedCountByMeal]);

  const filteredMeals = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return liveSavedMeals.filter((meal) => {
      const mealName = String(meal.name || "").toLowerCase();
      const mealType = String(meal.type || "").toLowerCase();
      const mealMood = String(meal.mood || "").toLowerCase();
      const mealCuisine = String(meal.cuisine || "").toLowerCase();

      const matchesSearch =
        !lowerQuery ||
        mealName.includes(lowerQuery) ||
        mealType.includes(lowerQuery) ||
        mealMood.includes(lowerQuery) ||
        mealCuisine.includes(lowerQuery);

      const cookedCount = cookedCountByMeal[meal.id] || 0;
      const missingItems = safeArray(meal.missingItems);

      const matchesFilter =
        filter === "All" ||
        (filter === "Cooked" && cookedCount > 0) ||
        (filter === "Not cooked" && cookedCount === 0) ||
        (filter === "Missing items" && missingItems.length > 0);

      return matchesSearch && matchesFilter;
    });
  }, [liveSavedMeals, query, filter, cookedCountByMeal]);

  const selectedMeal = useMemo(() => {
    return (
      liveSavedMeals.find((meal) => meal.id === selectedMealId) ||
      filteredMeals[0] ||
      null
    );
  }, [liveSavedMeals, selectedMealId, filteredMeals]);

  function showNotice(message) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 1800);
  }

  async function loadSamples() {
    const normalizedSamples = sampleMeals.map(normalizeMeal);

    setSavedMeals(normalizedSamples);
    setSelectedMealId(normalizedSamples[0]?.id || null);
    saveStorage(SAVED_MEALS_KEY, normalizedSamples);

    await saveCloudSavedMeals(normalizedSamples);

    showNotice("Sample meals loaded");
  }

  async function markCooked(meal) {
    const cookedEntry = {
      id: `cooked-${crypto.randomUUID()}`,
      mealId: meal.id,
      name: meal.name,
      cookedAt: new Date().toISOString(),
      estimatedCost: Number(meal.estimatedCost || 0),
      type: meal.type || "Meal",
      source: "Meal History",
    };

    const nextHistory = [cookedEntry, ...cookedHistory];

    setCookedHistory(nextHistory);
    saveStorage(COOKED_HISTORY_KEY, nextHistory);

    await saveCloudCookedHistory(nextHistory);

    showNotice(`${meal.name} marked as cooked`);
  }

  function cookAgain(meal) {
    localStorage.setItem(
      REQUESTED_MEAL_KEY,
      JSON.stringify({
        id: meal.id,
        name: meal.name,
        source: "meal-history",
        createdAt: new Date().toISOString(),
      })
    );

    window.location.href = "/decide-meal";
  }

  async function addMissingToGrocery(meal) {
    const missingItems = safeArray(meal.missingItems).map(normalizeMissingItem);

    if (!missingItems.length) {
      showNotice("You already have everything for this meal");
      return;
    }

    const currentGrocery = safeArray(readStorage(GROCERY_KEY, []));
    const existingNames = currentGrocery.map((item) =>
      `${normalizeText(item.name)}-${normalizeText(
        item.neededFor || item.mealName || item.source
      )}`
    );

    const newItems = missingItems
      .filter((item) => {
        const key = `${normalizeText(item.name)}-${normalizeText(meal.name)}`;
        return !existingNames.includes(key);
      })
      .map((item) => ({
        id: `grocery-${crypto.randomUUID()}`,
        name: item.name,
        quantity: item.quantity || "1 item",
        category: inferCategory(item.name),
        neededFor: meal.name,
        source: meal.name,
        priority: "Needed",
        estimatedPrice: Number(item.price || 0),
        price: Number(item.price || 0),
        estimatedPriceKwd: Number(item.price || 0),
        priceKwd: Number(item.price || 0),
        currency: "KWD",
        checked: false,
        completed: false,
        bought: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    if (newItems.length === 0) {
      showNotice("Missing ingredients are already in Grocery List");
      return;
    }

    const nextGrocery = mergeGroceryItems([...newItems, ...currentGrocery]);

    saveStorage(GROCERY_KEY, nextGrocery);
    await saveCloudGrocery(nextGrocery);

    showNotice(`${newItems.length} ingredient(s) added to Grocery List`);
  }

  async function deleteMeal(mealId) {
    const nextMeals = savedMeals.filter((meal) => meal.id !== mealId);

    setSavedMeals(nextMeals);
    saveStorage(SAVED_MEALS_KEY, nextMeals);

    if (selectedMealId === mealId) {
      setSelectedMealId(null);
    }

    await saveCloudSavedMeals(nextMeals);

    showNotice("Meal removed");
  }

  async function clearHistory() {
    setCookedHistory([]);
    saveStorage(COOKED_HISTORY_KEY, []);

    await saveCloudCookedHistory([]);

    showNotice("Cooking history cleared");
  }

  async function clearSavedMeals() {
    setSavedMeals([]);
    setSelectedMealId(null);
    saveStorage(SAVED_MEALS_KEY, []);

    await saveCloudSavedMeals([]);

    showNotice("Saved meals cleared");
  }

  function openDecideMeal() {
    window.location.href = "/decide-meal";
  }

  function openSettings() {
    window.location.href = "/settings";
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative -m-8 min-h-[calc(100vh+4rem)] overflow-hidden bg-[#070b07] p-4 text-[#fff8e8] md:p-8"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[2%] top-[-18%] h-[560px] w-[560px] rounded-full bg-[#d7f75b]/12 blur-[125px]" />
        <div className="absolute right-[-12%] top-[6%] h-[580px] w-[580px] rounded-full bg-orange-500/13 blur-[135px]" />
        <div className="absolute bottom-[-18%] left-[38%] h-[560px] w-[560px] rounded-full bg-sky-400/10 blur-[130px]" />
      </div>

      <div className="relative w-full space-y-6">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-sm font-extrabold text-[#d7f75b]">
              Meal History
            </p>

            <h1 className="display-font text-4xl font-extrabold tracking-tight md:text-5xl">
              Saved meals
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[#b7b89f] md:text-base">
              Keep track of meals you saved, cooked, repeated, and ingredients
              you still need to buy.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <CloudSyncBadge syncStatus={syncStatus} />

            <button
              type="button"
              onClick={openDecideMeal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/15 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]"
            >
              <ChefHat size={18} strokeWidth={2.5} />
              Open Decide Meal
            </button>

            <button
              type="button"
              onClick={loadSamples}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 text-sm font-extrabold text-[#fff8e8] transition hover:bg-white/10"
            >
              <RefreshCcw size={18} strokeWidth={2.5} />
              Load samples
            </button>

            <button
              type="button"
              onClick={clearSavedMeals}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-extrabold text-[#fff8e8] transition hover:bg-white/10"
            >
              <Archive size={18} strokeWidth={2.5} />
              Clear saved
            </button>

            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 text-sm font-extrabold text-red-200 transition hover:bg-red-500/20"
            >
              <Trash2 size={18} strokeWidth={2.5} />
              Clear history
            </button>
          </div>
        </header>

        {notice && (
          <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border border-[#d7f75b]/25 bg-[#10180d] px-5 py-4 text-sm font-extrabold text-[#d7f75b] shadow-2xl shadow-black/40 md:right-8 md:top-8">
            <CheckCircle2 size={18} strokeWidth={2.5} />
            {notice}
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-4">
          <StatCard
            icon={Utensils}
            label="Saved meals"
            value={liveSavedMeals.length}
            hint="Ready to cook again"
          />

          <StatCard
            icon={Flame}
            label="Cooked this week"
            value={mealsCookedThisWeek}
            hint="Weekly home-cooking progress"
            tone="orange"
          />

          <StatCard
            icon={Wallet}
            label="Estimated value"
            value={formatMoney(totalSavedCost, settings.currency)}
            hint="Based on cooked saved meals"
            tone="blue"
          />

          <StatCard
            icon={Star}
            label="Top repeat"
            value={mostCookedMeal ? mostCookedMeal.name : "None"}
            hint="Most cooked saved meal"
            tone="purple"
          />
        </section>

        {liveSavedMeals.length === 0 ? (
          <EmptyState
            onLoadSamples={loadSamples}
            onOpenDecideMeal={openDecideMeal}
            onOpenSettings={openSettings}
          />
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
            <div className="space-y-5">
              <SavedCollectionPanel
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                filteredCount={filteredMeals.length}
                totalCount={liveSavedMeals.length}
              />

              <section className="rounded-[1.9rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/25 backdrop-blur">
                <div className="grid gap-4 2xl:grid-cols-2">
                  {filteredMeals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      cookedCount={cookedCountByMeal[meal.id] || 0}
                      selected={selectedMeal?.id === meal.id}
                      currency={settings.currency}
                      onSelect={() => setSelectedMealId(meal.id)}
                      onCook={() => markCooked(meal)}
                      onAddMissing={() => addMissingToGrocery(meal)}
                      onDelete={() => deleteMeal(meal.id)}
                    />
                  ))}
                </div>

                {filteredMeals.length === 0 && (
                  <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-10 text-center">
                    <p className="display-font text-xl font-extrabold">
                      No meals match your filter
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#b7b89f]">
                      Try changing the search or filter option.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setFilter("All");
                      }}
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-extrabold text-white transition hover:bg-white/10"
                    >
                      Clear filters
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-5">
              <MealSnapshotPanel
                selectedMeal={selectedMeal}
                settings={settings}
                onCookAgain={cookAgain}
                onAddMissing={addMissingToGrocery}
              />

              <RecentCookingPanel cookedHistory={cookedHistory} />
            </div>
          </section>
        )}
      </div>
    </motion.main>
  );
}