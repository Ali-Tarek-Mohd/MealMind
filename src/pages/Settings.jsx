import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cloud,
  Database,
  Globe2,
  History,
  Leaf,
  ListChecks,
  Loader2,
  Package,
  RefreshCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const SETTINGS_KEY = "mealmind_settings";
const PANTRY_KEY = "mealmind_pantry_items";
const GROCERY_KEY = "mealmind_grocery_items";
const SAVED_MEALS_KEY = "mealmind_saved_meals";
const COOKED_HISTORY_KEY = "mealmind_cooked_history";
const PLANNED_MEALS_KEY = "mealmind_planned_meals";

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

const currencies = [
  { value: "KWD", label: "Kuwaiti Dinar", symbol: "KD" },
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "AED", label: "UAE Dirham", symbol: "AED" },
  { value: "SAR", label: "Saudi Riyal", symbol: "SAR" },
  { value: "OMR", label: "Omani Rial", symbol: "OMR" },
];

const regions = [
  "Kuwait",
  "Oman",
  "UAE",
  "Saudi Arabia",
  "Qatar",
  "Bahrain",
  "Egypt",
  "Other",
];

const dietOptions = [
  "No preference",
  "High protein",
  "Low calorie",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Halal focused",
  "Low carb",
];

const budgetModes = [
  {
    value: "Strict saver",
    title: "Strict saver",
    description: "Cheaper meals and pantry-first choices.",
  },
  {
    value: "Balanced",
    title: "Balanced",
    description: "Good balance between cost, variety, and convenience.",
  },
  {
    value: "Flexible",
    title: "Flexible",
    description: "More meal variety with less focus on lowest cost.",
  },
];

const expiryModes = [
  {
    value: "Relaxed",
    title: "Relaxed",
    description: "Warn only when items are very close to expiring.",
    days: "1–2 days",
  },
  {
    value: "Normal",
    title: "Normal",
    description: "Warn early without making the app feel stressful.",
    days: "3–5 days",
  },
  {
    value: "Strict",
    title: "Strict",
    description: "Warn earlier to reduce food waste.",
    days: "6–7 days",
  },
];

const demoPantryItems = [
  {
    id: "demo-pantry-chicken",
    name: "Chicken",
    quantity: "500g",
    category: "Protein",
    location: "Fridge",
    status: "Urgent",
    expiryDays: 2,
    expiry: 2,
    daysUntilExpiry: 2,
    daysLeft: 2,
    expiryDate: getDateFromDays(2),
    expireIn: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-rice",
    name: "Rice",
    quantity: "1kg",
    category: "Carbs",
    location: "Pantry",
    status: "Stocked",
    expiryDays: null,
    expiry: null,
    daysUntilExpiry: null,
    daysLeft: null,
    expiryDate: null,
    expireIn: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-lettuce",
    name: "Lettuce",
    quantity: "1 head",
    category: "Vegetable",
    location: "Fridge",
    status: "Use soon",
    expiryDays: 4,
    expiry: 4,
    daysUntilExpiry: 4,
    daysLeft: 4,
    expiryDate: getDateFromDays(4),
    expireIn: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-cheese",
    name: "Cheese",
    quantity: "1 pack",
    category: "Dairy",
    location: "Fridge",
    status: "Fresh",
    expiryDays: 8,
    expiry: 8,
    daysUntilExpiry: 8,
    daysLeft: 8,
    expiryDate: getDateFromDays(8),
    expireIn: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-wraps",
    name: "Wraps",
    quantity: "1 pack",
    category: "Carbs",
    location: "Pantry",
    status: "Stocked",
    expiryDays: null,
    expiry: null,
    daysUntilExpiry: null,
    daysLeft: null,
    expiryDate: null,
    expireIn: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-black-pepper",
    name: "Black Pepper",
    quantity: "1 jar",
    category: "Spice",
    location: "Spices",
    status: "Stocked",
    expiryDays: null,
    expiry: null,
    daysUntilExpiry: null,
    daysLeft: null,
    expiryDate: null,
    expireIn: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-caesar-sauce",
    name: "Caesar Sauce",
    quantity: "1 bottle",
    category: "Pantry",
    location: "Pantry",
    status: "Stocked",
    expiryDays: null,
    expiry: null,
    daysUntilExpiry: null,
    daysLeft: null,
    expiryDate: null,
    expireIn: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pantry-tomatoes",
    name: "Tomatoes",
    quantity: "500g",
    category: "Vegetable",
    location: "Fridge",
    status: "Fresh",
    expiryDays: 6,
    expiry: 6,
    daysUntilExpiry: 6,
    daysLeft: 6,
    expiryDate: getDateFromDays(6),
    expireIn: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoSavedMeals = [
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
    mood: "Cheap",
    time: 15,
    difficulty: "Easy",
    match: 82,
    estimatedCost: 0.85,
    savedAt: new Date(Date.now() - 86400000).toISOString(),
    pantryItems: ["Tomatoes", "Black Pepper"],
    missingItems: [
      {
        name: "Eggs",
        quantity: "12 pieces",
        price: 0.85,
      },
    ],
    nutrition: {
      calories: 195,
      protein: 15,
      carbs: 8,
      fat: 11,
    },
  },
];

const demoCookedHistory = [
  {
    id: "demo-cooked-1",
    mealId: "meal-chicken-caesar-wrap",
    name: "Chicken Caesar Wrap",
    cookedAt: new Date().toISOString(),
    estimatedCost: 0,
    type: "Lunch",
    source: "Demo",
  },
  {
    id: "demo-cooked-2",
    mealId: "meal-tomato-egg-skillet",
    name: "Tomato Egg Skillet",
    cookedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedCost: 0.85,
    type: "Breakfast",
    source: "Demo",
  },
];

const demoGroceryItems = [
  {
    id: "demo-grocery-eggs",
    name: "Eggs",
    quantity: "12 pieces",
    category: "Protein",
    neededFor: "Tomato Egg Skillet",
    source: "Tomato Egg Skillet",
    priority: "Needed",
    estimatedPrice: 0.85,
    price: 0.85,
    estimatedPriceKwd: 0.85,
    priceKwd: 0.85,
    currency: "KWD",
    checked: false,
    completed: false,
    bought: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-grocery-milk",
    name: "Milk",
    quantity: "1 litre",
    category: "Dairy",
    neededFor: "Breakfast Oats",
    source: "Breakfast Oats",
    priority: "Optional",
    estimatedPrice: 0.45,
    price: 0.45,
    estimatedPriceKwd: 0.45,
    priceKwd: 0.45,
    currency: "KWD",
    checked: false,
    completed: false,
    bought: false,
    createdAt: new Date().toISOString(),
  },
];

const demoPlannedMeals = [
  {
    id: "demo-planned-1",
    mealId: "meal-tomato-egg-skillet",
    name: "Tomato Egg Skillet",
    mealType: "Breakfast",
    cuisine: "Simple",
    totalTime: 15,
    extraCost: 0.85,
    extraCostLabel: "0.850 KWD extra",
    plannedAt: new Date().toISOString(),
    status: "Planned",
  },
];

function getDateFromDays(days) {
  if (days === null || days === undefined || days === "") return null;

  const date = new Date();
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
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

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getStorageCount(key) {
  const data = readStorage(key, []);
  return Array.isArray(data) ? data.length : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getExpiryValue(item) {
  const value =
    item.expiryDays ??
    item.expiry ??
    item.daysUntilExpiry ??
    item.daysLeft ??
    item.expireIn ??
    null;

  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function pantryItemToRow(item, userId) {
  const expiryDays = getExpiryValue(item);

  return {
    user_id: userId,
    name: item.name || "Pantry item",
    quantity: item.quantity || "1 item",
    category: item.category || "Other",
    location: item.location || "Pantry",
    status: item.status || "Stocked",
    expiry_days: expiryDays,
    expiry_date: item.expiryDate || getDateFromDays(expiryDays),
    data: {
      ...item,
      expiryDays,
      expiry: expiryDays,
      daysUntilExpiry: expiryDays,
      daysLeft: expiryDays,
      expireIn: expiryDays,
      expiryDate: item.expiryDate || getDateFromDays(expiryDays),
    },
  };
}

function groceryItemToRow(item, userId) {
  return {
    user_id: userId,
    name: item.name || "Grocery item",
    quantity: item.quantity || "1 item",
    category: item.category || "Other",
    needed_for: item.neededFor || item.source || "Manual item",
    priority: item.priority || "Needed",
    checked: Boolean(item.checked || item.completed || item.bought),
    estimated_price_kwd: Number(
      item.estimatedPriceKwd || item.priceKwd || item.estimatedPrice || item.price || 0
    ),
    data: {
      ...item,
      estimatedPriceKwd: Number(
        item.estimatedPriceKwd || item.priceKwd || item.estimatedPrice || item.price || 0
      ),
      priceKwd: Number(
        item.estimatedPriceKwd || item.priceKwd || item.estimatedPrice || item.price || 0
      ),
      currency: "KWD",
    },
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

function cookedEntryToRow(entry, userId) {
  return {
    user_id: userId,
    meal_id: entry.mealId || entry.meal_id || null,
    name: entry.name || "Cooked meal",
    cooked_at: entry.cookedAt || entry.cooked_at || new Date().toISOString(),
    estimated_cost: Number(entry.estimatedCost || entry.estimated_cost || 0),
    type: entry.type || "Meal",
    source: entry.source || "Settings",
    data: entry,
  };
}

function SettingsHeader({ syncStatus }) {
  return (
    <section className="rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20">
            <SettingsIcon size={23} strokeWidth={2.5} />
          </div>

          <div>
            <p className="mb-1 text-sm font-black text-[#d7f75b]">Settings</p>

            <h1 className="display-font text-4xl font-black tracking-tight text-[#fff8e8] md:text-5xl">
              App preferences
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#b7b89f] md:text-base">
              Personalize your region, budget, diet, expiry reminders, and smart
              helper behavior.
            </p>
          </div>
        </div>

        <CloudSyncBadge syncStatus={syncStatus} />
      </div>
    </section>
  );
}

function CloudSyncBadge({ syncStatus }) {
  const statusContent = {
    loading: {
      label: "Loading cloud settings",
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
      icon: Database,
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

  const current = statusContent[syncStatus] || statusContent.synced;
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

function Panel({ icon: Icon, title, subtitle, children, tone = "lime" }) {
  const iconClass =
    tone === "red"
      ? "bg-red-500/15 text-red-300"
      : tone === "blue"
      ? "bg-sky-400/15 text-sky-300"
      : tone === "purple"
      ? "bg-violet-400/15 text-violet-300"
      : tone === "orange"
      ? "bg-orange-500/15 text-orange-300"
      : "bg-[#d7f75b]/15 text-[#d7f75b]";

  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/15 backdrop-blur md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            iconClass
          )}
        >
          <Icon size={19} strokeWidth={2.5} />
        </div>

        <div className="min-w-0">
          <h2 className="display-font text-xl font-black tracking-tight text-[#fff8e8]">
            {title}
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-[#b7b89f]">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function SelectBox({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-[#fff8e8] outline-none transition focus:border-[#d7f75b]/70 focus:ring-4 focus:ring-[#d7f75b]/10"
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function ChoicePill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-10 rounded-2xl border px-4 text-left text-xs font-black transition md:text-sm",
        active
          ? "border-[#d7f75b] bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/15"
          : "border-white/10 bg-black/20 text-[#d8d9c6] hover:border-[#d7f75b]/40 hover:bg-[#d7f75b]/10"
      )}
    >
      {children}
    </button>
  );
}

function OptionCard({ active, title, description, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl border p-4 text-left transition",
        active
          ? "border-[#d7f75b]/70 bg-[#d7f75b]/10 shadow-lg shadow-[#d7f75b]/10"
          : "border-white/10 bg-black/20 hover:border-[#d7f75b]/35 hover:bg-white/[0.065]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cx(
              "text-sm font-black",
              active ? "text-[#d7f75b]" : "text-[#fff8e8]"
            )}
          >
            {title}
          </p>

          <p className="mt-1.5 text-xs font-medium leading-5 text-[#b7b89f]">
            {description}
          </p>
        </div>

        {active && (
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-[#d7f75b]"
            strokeWidth={2.5}
          />
        )}
      </div>

      {meta && (
        <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-[#d8d9c6]">
          {meta}
        </span>
      )}
    </button>
  );
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-3.5">
      <div>
        <p className="text-sm font-black text-[#fff8e8]">{title}</p>

        <p className="mt-1 text-xs font-medium leading-5 text-[#b7b89f]">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked ? "bg-[#d7f75b]" : "bg-stone-600"
        )}
        aria-pressed={checked}
      >
        <span
          className={cx(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-xs font-bold text-[#8f927e]">{label}</span>
      <span className="text-xs font-black text-[#fff8e8]">{value}</span>
    </div>
  );
}

function DataButton({ icon: Icon, label, onClick, tone = "default" }) {
  const className =
    tone === "red"
      ? "border-red-300/20 bg-red-500/10 text-red-200 hover:bg-red-500/15"
      : tone === "orange"
      ? "border-orange-300/20 bg-orange-500/10 text-orange-200 hover:bg-orange-500/15"
      : "border-white/10 bg-black/20 text-[#fff8e8] hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition",
        className
      )}
    >
      <Icon size={17} strokeWidth={2.5} />
      {label}
    </button>
  );
}

function ConfirmModal({ action, onCancel, onConfirm }) {
  if (!action) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid min-h-dvh place-items-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="relative w-full max-w-[560px] overflow-hidden rounded-[2.2rem] border border-white/12 bg-[#10140d] shadow-2xl shadow-black/70"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-red-500/18 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[#d7f75b]/14 blur-3xl" />

        <div className="relative border-b border-white/10 bg-white/[0.035] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={cx(
                  "flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.25rem] border shadow-lg",
                  action.tone === "red"
                    ? "border-red-300/25 bg-red-500/15 text-red-300 shadow-red-500/10"
                    : action.tone === "orange"
                    ? "border-orange-300/25 bg-orange-500/15 text-orange-300 shadow-orange-500/10"
                    : "border-[#d7f75b]/25 bg-[#d7f75b]/15 text-[#d7f75b] shadow-[#d7f75b]/10"
                )}
              >
                <action.icon size={24} strokeWidth={2.5} />
              </div>

              <div>
                <p
                  className={cx(
                    "mb-1 text-xs font-black uppercase tracking-wide",
                    action.tone === "red"
                      ? "text-red-300"
                      : action.tone === "orange"
                      ? "text-orange-300"
                      : "text-[#d7f75b]"
                  )}
                >
                  Confirmation needed
                </p>

                <h2 className="display-font text-3xl font-black tracking-tight text-[#fff8e8]">
                  {action.title}
                </h2>

                <p className="mt-2 text-sm font-medium leading-6 text-[#b7b89f]">
                  Please review this action before continuing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#c9cab3] transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="relative p-5 md:p-6">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-medium leading-6 text-[#d8d9c6]">
              {action.description}
            </p>

            {action.details && (
              <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-4">
                <p className="text-sm font-extrabold leading-6 text-[#fff8e8]">
                  {action.details}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-black text-[#fff8e8] transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className={cx(
                "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black shadow-lg transition hover:-translate-y-0.5",
                action.tone === "red"
                  ? "bg-red-400 text-[#170606] shadow-red-500/20 hover:bg-red-300"
                  : action.tone === "orange"
                  ? "bg-orange-300 text-[#171006] shadow-orange-500/20 hover:bg-orange-200"
                  : "bg-[#d7f75b] text-[#10120c] shadow-[#d7f75b]/20 hover:bg-[#e4ff75]"
              )}
            >
              <action.icon size={18} strokeWidth={2.5} />
              {action.confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function SetupSidebar({
  settings,
  counts,
  selectedCurrency,
  saved,
  onSave,
  onReset,
  onLoadDemo,
  syncStatus,
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6">
      <section className="rounded-[1.45rem] border border-[#d7f75b]/25 bg-[#d7f75b]/[0.07] p-4 shadow-xl shadow-black/20 backdrop-blur">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]">
            <Sparkles size={19} strokeWidth={2.5} />
          </div>

          <div>
            <h2 className="display-font text-xl font-black tracking-tight text-[#fff8e8]">
              Current setup
            </h2>

            <p className="mt-1 text-sm font-medium leading-6 text-[#d7f75b]/80">
              Your active preferences.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <SummaryRow label="Region" value={settings.region} />
          <SummaryRow
            label="Currency"
            value={`${settings.currency} · ${selectedCurrency?.symbol || "KD"}`}
          />
          <SummaryRow label="Diet" value={settings.dietPreference} />
          <SummaryRow label="Budget" value={settings.budgetMode} />
          <SummaryRow label="Expiry" value={settings.expiryStrictness} />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#8f927e]">
              <Database size={14} className="text-[#d7f75b]" />
              App records
            </div>

            <p className="text-lg font-black text-[#fff8e8]">{counts.total}</p>
          </div>
        </div>

        <div className="mt-3">
          <CloudSyncBadge syncStatus={syncStatus} />
        </div>
      </section>

      <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/15 backdrop-blur">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
            <ShieldCheck size={19} strokeWidth={2.5} />
          </div>

          <div>
            <h2 className="display-font text-xl font-black tracking-tight text-[#fff8e8]">
              Save changes
            </h2>

            <p className="mt-1 text-sm font-medium leading-6 text-[#b7b89f]">
              Stored locally and synced to your account.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-4 text-sm font-black text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:bg-[#e4ff75]"
          >
            {saved ? (
              <CheckCircle2 size={18} strokeWidth={2.5} />
            ) : (
              <Save size={18} strokeWidth={2.5} />
            )}
            {saved ? "Saved" : "Save settings"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-black text-[#fff8e8] transition hover:bg-white/10"
          >
            <RefreshCcw size={18} strokeWidth={2.5} />
            Reset settings
          </button>

          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 text-sm font-black text-orange-200 transition hover:bg-orange-500/15"
          >
            <Sparkles size={18} strokeWidth={2.5} />
            Reload demo kitchen
          </button>
        </div>
      </section>
    </aside>
  );
}

function DangerZone({
  counts,
  onClearPantry,
  onClearGrocery,
  onClearSavedMeals,
  onClearCookedHistory,
  onClearEverything,
}) {
  return (
    <section className="rounded-[1.45rem] border border-red-400/20 bg-red-500/[0.055] p-4 shadow-xl shadow-black/15 backdrop-blur md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
          <AlertTriangle size={19} strokeWidth={2.5} />
        </div>

        <div>
          <h2 className="display-font text-xl font-black tracking-tight text-[#fff8e8]">
            Data controls
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-red-200/80">
            Clear local and cloud app data. You will be asked before anything is
            removed.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-300">
            Pantry
          </p>
          <p className="mt-1 text-xl font-black text-[#fff8e8]">
            {counts.pantry}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-300">
            Grocery
          </p>
          <p className="mt-1 text-xl font-black text-[#fff8e8]">
            {counts.grocery}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-300">
            Saved
          </p>
          <p className="mt-1 text-xl font-black text-[#fff8e8]">
            {counts.savedMeals}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-300">
            Cooked
          </p>
          <p className="mt-1 text-xl font-black text-[#fff8e8]">
            {counts.cookedHistory}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DataButton icon={Package} label="Clear pantry" onClick={onClearPantry} />

        <DataButton
          icon={ListChecks}
          label="Clear grocery"
          onClick={onClearGrocery}
        />

        <DataButton
          icon={Utensils}
          label="Clear saved meals"
          onClick={onClearSavedMeals}
        />

        <DataButton
          icon={History}
          label="Clear cooked"
          onClick={onClearCookedHistory}
        />

        <DataButton
          icon={Trash2}
          label="Clear everything"
          tone="red"
          onClick={onClearEverything}
        />
      </div>
    </section>
  );
}

export default function Settings() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...readStorage(SETTINGS_KEY, {}),
  }));

  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [counts, setCounts] = useState({
    pantry: 0,
    grocery: 0,
    savedMeals: 0,
    cookedHistory: 0,
    plannedMeals: 0,
    total: 0,
  });

  function refreshCounts() {
    const nextCounts = {
      pantry: getStorageCount(PANTRY_KEY),
      grocery: getStorageCount(GROCERY_KEY),
      savedMeals: getStorageCount(SAVED_MEALS_KEY),
      cookedHistory: getStorageCount(COOKED_HISTORY_KEY),
      plannedMeals: getStorageCount(PLANNED_MEALS_KEY),
      total: 0,
    };

    nextCounts.total =
      nextCounts.pantry +
      nextCounts.grocery +
      nextCounts.savedMeals +
      nextCounts.cookedHistory +
      nextCounts.plannedMeals;

    setCounts(nextCounts);
  }

  useEffect(() => {
    refreshCounts();
  }, []);

  async function loadCloudSettings() {
    if (!user?.id) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("loading");

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Settings cloud fetch error:", error.message);
      setSyncStatus("error");
      showNotice("Could not load cloud settings");
      return;
    }

    const cloudSettings = data?.settings || data?.data || null;

    if (cloudSettings) {
      const payload = {
        ...defaultSettings,
        ...cloudSettings,
      };

      setSettings(payload);
      saveStorage(SETTINGS_KEY, payload);
    }

    setSyncStatus("synced");
  }

  async function saveCloudSettings(payload) {
    if (!user?.id) {
      saveStorage(SETTINGS_KEY, payload);
      setSyncStatus("local");
      return true;
    }

    setSyncStatus("saving");

    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        settings: payload,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("Settings cloud save error:", error.message);
      setSyncStatus("error");
      showNotice("Could not save settings to cloud");
      return false;
    }

    setSyncStatus("synced");
    return true;
  }

  async function clearCloudTable(tableName) {
    if (!user?.id) return true;

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error(`Clear ${tableName} error:`, error.message);
      setSyncStatus("error");
      showNotice(`Could not clear ${tableName}`);
      return false;
    }

    return true;
  }

  async function replaceCloudTable(tableName, rows) {
    if (!user?.id) return true;

    const deleted = await clearCloudTable(tableName);

    if (!deleted) return false;

    if (!rows.length) return true;

    const { error } = await supabase.from(tableName).insert(rows);

    if (error) {
      console.error(`Insert ${tableName} error:`, error.message);
      setSyncStatus("error");
      showNotice(`Could not save ${tableName}`);
      return false;
    }

    return true;
  }

  useEffect(() => {
    loadCloudSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const selectedCurrency = useMemo(() => {
    return currencies.find((item) => item.value === settings.currency);
  }, [settings.currency]);

  function showNotice(message) {
    setNotice(message);
    setSaved(true);

    window.setTimeout(() => {
      setNotice("");
      setSaved(false);
    }, 1800);
  }

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  async function saveSettings() {
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    saveStorage(SETTINGS_KEY, payload);
    setSettings(payload);

    await saveCloudSettings(payload);

    showNotice("Settings saved");
  }

  function openConfirmAction(action) {
    setConfirmAction(action);
  }

  function closeConfirmAction() {
    setConfirmAction(null);
  }

  function runConfirmAction() {
    if (!confirmAction?.onConfirm) {
      return;
    }

    confirmAction.onConfirm();
    setConfirmAction(null);
  }

  async function resetSettingsNow() {
    const payload = {
      ...defaultSettings,
      updatedAt: new Date().toISOString(),
    };

    setSettings(payload);
    saveStorage(SETTINGS_KEY, payload);

    await saveCloudSettings(payload);

    showNotice("Settings reset");
  }

  function resetSettings() {
    openConfirmAction({
      icon: RefreshCcw,
      tone: "orange",
      title: "Reset settings?",
      description:
        "This will restore your app preferences to the default setup. Your pantry, grocery list, saved meals, and cooking history will stay as they are.",
      details:
        "Region: Kuwait · Currency: KWD · Diet: No preference · Budget: Balanced · Expiry: Normal",
      confirmLabel: "Reset settings",
      onConfirm: resetSettingsNow,
    });
  }

  async function loadDemoKitchenNow() {
    const demoSettings = {
      ...settings,
      currency: "KWD",
      region: "Kuwait",
      budgetMode: "Balanced",
      expiryStrictness: "Normal",
      demoMode: true,
      updatedAt: new Date().toISOString(),
    };

    setSyncStatus("saving");

    saveStorage(PANTRY_KEY, demoPantryItems);
    saveStorage(SAVED_MEALS_KEY, demoSavedMeals);
    saveStorage(COOKED_HISTORY_KEY, demoCookedHistory);
    saveStorage(GROCERY_KEY, demoGroceryItems);
    saveStorage(PLANNED_MEALS_KEY, demoPlannedMeals);
    saveStorage(SETTINGS_KEY, demoSettings);

    setSettings(demoSettings);

    const cloudResults = await Promise.all([
      replaceCloudTable(
        "pantry_items",
        demoPantryItems.map((item) => pantryItemToRow(item, user?.id))
      ),
      replaceCloudTable(
        "grocery_items",
        demoGroceryItems.map((item) => groceryItemToRow(item, user?.id))
      ),
      replaceCloudTable(
        "saved_meals",
        demoSavedMeals.map((meal) => savedMealToRow(meal, user?.id))
      ),
      replaceCloudTable(
        "cooked_history",
        demoCookedHistory.map((entry) => cookedEntryToRow(entry, user?.id))
      ),
      saveCloudSettings(demoSettings),
    ]);

    if (cloudResults.every(Boolean)) {
      setSyncStatus(user?.id ? "synced" : "local");
    }

    refreshCounts();
    showNotice("Demo kitchen loaded");
  }

  function loadDemoKitchen() {
    openConfirmAction({
      icon: Sparkles,
      tone: "orange",
      title: "Reload demo kitchen?",
      description:
        "This will replace your current pantry, grocery list, saved meals, cooked history, and planned meals with demo data.",
      details:
        "Use this only when you want to test MealMind with sample food and sample progress.",
      confirmLabel: "Reload demo",
      onConfirm: loadDemoKitchenNow,
    });
  }

  async function clearStorageArrayNow(key, message, tableName = null) {
    saveStorage(key, []);

    if (tableName) {
      setSyncStatus("saving");
      const cleared = await clearCloudTable(tableName);

      if (cleared) {
        setSyncStatus(user?.id ? "synced" : "local");
      }
    }

    refreshCounts();
    showNotice(message);
  }

  function clearPantry() {
    openConfirmAction({
      icon: Package,
      tone: "red",
      title: "Clear pantry?",
      description:
        "This will remove every pantry item from this browser and your cloud account.",
      details:
        "Dashboard, Use Soon, Decide Meal, and Grocery List will no longer use those pantry items.",
      confirmLabel: "Clear pantry",
      onConfirm: () =>
        clearStorageArrayNow(PANTRY_KEY, "Pantry cleared", "pantry_items"),
    });
  }

  function clearGrocery() {
    openConfirmAction({
      icon: ListChecks,
      tone: "red",
      title: "Clear grocery list?",
      description:
        "This will remove every item in your shopping checklist and clear planned meal shopping items.",
      details:
        "Your pantry and saved meals will stay untouched.",
      confirmLabel: "Clear grocery",
      onConfirm: async () => {
        saveStorage(GROCERY_KEY, []);
        saveStorage(PLANNED_MEALS_KEY, []);

        setSyncStatus("saving");
        const cleared = await clearCloudTable("grocery_items");

        if (cleared) {
          setSyncStatus(user?.id ? "synced" : "local");
        }

        refreshCounts();
        showNotice("Grocery list cleared");
      },
    });
  }

  function clearSavedMeals() {
    openConfirmAction({
      icon: Utensils,
      tone: "red",
      title: "Clear saved meals?",
      description:
        "This will remove all meals saved in Meal History from this browser and your cloud account.",
      details:
        "Your pantry, grocery list, and cooked history will stay untouched.",
      confirmLabel: "Clear saved meals",
      onConfirm: () =>
        clearStorageArrayNow(
          SAVED_MEALS_KEY,
          "Saved meals cleared",
          "saved_meals"
        ),
    });
  }

  function clearCookedHistory() {
    openConfirmAction({
      icon: History,
      tone: "red",
      title: "Clear cooked history?",
      description:
        "This will remove your cooked meal records from this browser and your cloud account.",
      details:
        "Your saved meals will still stay saved.",
      confirmLabel: "Clear cooked",
      onConfirm: () =>
        clearStorageArrayNow(
          COOKED_HISTORY_KEY,
          "Cooked history cleared",
          "cooked_history"
        ),
    });
  }

  async function clearEverythingNow() {
    const payload = {
      ...defaultSettings,
      updatedAt: new Date().toISOString(),
    };

    setSyncStatus("saving");

    saveStorage(PANTRY_KEY, []);
    saveStorage(GROCERY_KEY, []);
    saveStorage(SAVED_MEALS_KEY, []);
    saveStorage(COOKED_HISTORY_KEY, []);
    saveStorage(PLANNED_MEALS_KEY, []);
    saveStorage(SETTINGS_KEY, payload);

    setSettings(payload);

    const cloudResults = await Promise.all([
      clearCloudTable("pantry_items"),
      clearCloudTable("grocery_items"),
      clearCloudTable("saved_meals"),
      clearCloudTable("cooked_history"),
      saveCloudSettings(payload),
    ]);

    if (cloudResults.every(Boolean)) {
      setSyncStatus(user?.id ? "synced" : "local");
    }

    refreshCounts();
    showNotice("Everything cleared");
  }

  function clearEverything() {
    openConfirmAction({
      icon: Trash2,
      tone: "red",
      title: "Start fresh?",
      description:
        "This will clear your pantry, grocery list, saved meals, cooked history, planned meals, and reset your preferences.",
      details:
        "MealMind will behave like a brand-new user opened the app. Pantry will stay at 0 items after refreshing.",
      confirmLabel: "Start fresh",
      onConfirm: clearEverythingNow,
    });
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

      <ConfirmModal
        action={confirmAction}
        onCancel={closeConfirmAction}
        onConfirm={runConfirmAction}
      />

      <div className="relative w-full space-y-5">
        <SettingsHeader syncStatus={syncStatus} />

        {notice && (
          <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border border-[#d7f75b]/25 bg-[#10180d] px-5 py-4 text-sm font-black text-[#d7f75b] shadow-2xl shadow-black/40 md:right-8 md:top-8">
            <CheckCircle2 size={18} strokeWidth={2.5} />
            {notice}
          </div>
        )}

        <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Panel
              icon={Globe2}
              title="Region and currency"
              subtitle="Used for prices, grocery habits, and local shopping style."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <SelectBox
                  label="Region"
                  value={settings.region}
                  onChange={(value) => updateSetting("region", value)}
                  options={regions}
                />

                <SelectBox
                  label="Currency"
                  value={settings.currency}
                  onChange={(value) => updateSetting("currency", value)}
                  options={currencies}
                />
              </div>
            </Panel>

            <Panel
              icon={Leaf}
              title="Food preference"
              subtitle="Helps MealMind suggest meals that fit your lifestyle."
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {dietOptions.map((option) => (
                  <ChoicePill
                    key={option}
                    active={settings.dietPreference === option}
                    onClick={() => updateSetting("dietPreference", option)}
                  >
                    {option}
                  </ChoicePill>
                ))}
              </div>
            </Panel>

            <Panel
              icon={Wallet}
              title="Budget behavior"
              subtitle="Choose how strongly MealMind should focus on saving money."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {budgetModes.map((mode) => (
                  <OptionCard
                    key={mode.value}
                    active={settings.budgetMode === mode.value}
                    title={mode.title}
                    description={mode.description}
                    onClick={() => updateSetting("budgetMode", mode.value)}
                  />
                ))}
              </div>
            </Panel>

            <Panel
              icon={Bell}
              title="Expiry reminders"
              subtitle="Control how early MealMind warns you about food expiry."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {expiryModes.map((mode) => (
                  <OptionCard
                    key={mode.value}
                    active={settings.expiryStrictness === mode.value}
                    title={mode.title}
                    description={mode.description}
                    meta={mode.days}
                    onClick={() => updateSetting("expiryStrictness", mode.value)}
                  />
                ))}
              </div>
            </Panel>

            <Panel
              icon={SlidersHorizontal}
              title="Smart controls"
              subtitle="Automatic helper behavior across the app."
              tone="purple"
            >
              <div className="grid gap-3 xl:grid-cols-3">
                <ToggleRow
                  title="Smart suggestions"
                  description="Pantry-based meal recommendations."
                  checked={settings.smartSuggestions}
                  onChange={(value) => updateSetting("smartSuggestions", value)}
                />

                <ToggleRow
                  title="Grocery auto-grouping"
                  description="Group groceries by meal and category."
                  checked={settings.groceryAutoGroup}
                  onChange={(value) => updateSetting("groceryAutoGroup", value)}
                />

                <ToggleRow
                  title="Low stock alerts"
                  description="Remind you when common items run low."
                  checked={settings.lowStockAlerts}
                  onChange={(value) => updateSetting("lowStockAlerts", value)}
                />
              </div>
            </Panel>

            <DangerZone
              counts={counts}
              onClearPantry={clearPantry}
              onClearGrocery={clearGrocery}
              onClearSavedMeals={clearSavedMeals}
              onClearCookedHistory={clearCookedHistory}
              onClearEverything={clearEverything}
            />
          </div>

          <SetupSidebar
            settings={settings}
            counts={counts}
            selectedCurrency={selectedCurrency}
            saved={saved}
            onSave={saveSettings}
            onReset={resetSettings}
            onLoadDemo={loadDemoKitchen}
            syncStatus={syncStatus}
          />
        </div>
      </div>
    </motion.main>
  );
}