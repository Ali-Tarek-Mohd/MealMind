import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Beef,
  CalendarClock,
  Check,
  ChefHat,
  Clock3,
  Cloud,
  Leaf,
  Loader2,
  MapPin,
  Package,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import PremiumButton from "../components/ui/PremiumButton";
import { showToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const PANTRY_STORAGE_KEY = "mealmind_pantry_items";
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

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
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

function loadStorageArray(key, fallback = []) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function savePantryItems(items) {
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
}

function getDateFromDays(days) {
  if (days === null || days === undefined || days === "") return null;

  const date = new Date();
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

function getDaysFromDate(dateValue) {
  if (!dateValue) return null;

  const today = new Date();
  const expiryDate = new Date(dateValue);

  if (!Number.isFinite(expiryDate.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
}

function getExpiryWarningLimit(settings) {
  if (settings.expiryStrictness === "Relaxed") return 2;
  if (settings.expiryStrictness === "Strict") return 7;
  return 5;
}

function getWatchLimit(settings) {
  if (settings.expiryStrictness === "Relaxed") return 4;
  if (settings.expiryStrictness === "Strict") return 14;
  return 10;
}

function inferCategory(name, fallbackCategory = "Other") {
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

  return match?.category ?? fallbackCategory ?? "Other";
}

function inferLocation(category, name) {
  const categoryText = normalizeText(category);
  const nameText = normalizeText(name);

  if (
    categoryText.includes("protein") ||
    categoryText.includes("dairy") ||
    nameText.includes("milk") ||
    nameText.includes("cheese") ||
    nameText.includes("butter") ||
    nameText.includes("yogurt")
  ) {
    return "Fridge";
  }

  if (
    categoryText.includes("spice") ||
    nameText.includes("paprika") ||
    nameText.includes("cumin") ||
    nameText.includes("pepper") ||
    nameText.includes("cinnamon")
  ) {
    return "Spices";
  }

  if (
    categoryText.includes("pantry") ||
    categoryText.includes("carbs") ||
    nameText.includes("rice") ||
    nameText.includes("pasta") ||
    nameText.includes("oil") ||
    nameText.includes("sauce")
  ) {
    return "Pantry";
  }

  return "Fridge";
}

function getDefaultExpiryDays(category, name) {
  const categoryText = normalizeText(category);
  const nameText = normalizeText(name);

  if (
    categoryText.includes("spice") ||
    categoryText.includes("pantry") ||
    nameText.includes("paprika") ||
    nameText.includes("cumin") ||
    nameText.includes("black pepper") ||
    nameText.includes("cinnamon") ||
    nameText.includes("olive oil") ||
    nameText.includes("oil") ||
    nameText.includes("rice") ||
    nameText.includes("pasta") ||
    nameText.includes("flour") ||
    nameText.includes("oats") ||
    nameText.includes("cereal") ||
    nameText.includes("honey") ||
    nameText.includes("sugar")
  ) {
    return null;
  }

  if (
    nameText.includes("onion") ||
    nameText.includes("garlic") ||
    nameText.includes("potato")
  ) {
    return 21;
  }

  if (
    nameText.includes("lettuce") ||
    nameText.includes("bell pepper") ||
    nameText.includes("tomato") ||
    nameText.includes("cucumber") ||
    nameText.includes("broccoli") ||
    nameText.includes("spinach") ||
    nameText.includes("mushroom")
  ) {
    return 7;
  }

  if (
    categoryText.includes("fruit") ||
    nameText.includes("banana") ||
    nameText.includes("apple") ||
    nameText.includes("orange") ||
    nameText.includes("berries")
  ) {
    return 6;
  }

  if (
    categoryText.includes("dairy") ||
    nameText.includes("milk") ||
    nameText.includes("cheese") ||
    nameText.includes("yogurt") ||
    nameText.includes("butter")
  ) {
    return 10;
  }

  if (
    categoryText.includes("protein") ||
    nameText.includes("chicken") ||
    nameText.includes("beef") ||
    nameText.includes("fish") ||
    nameText.includes("salmon") ||
    nameText.includes("shrimp")
  ) {
    return 3;
  }

  if (nameText.includes("tuna")) {
    return 365;
  }

  return 7;
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
    return getDaysFromDate(item.expiryDate);
  }

  if (
    item.expiry_date &&
    item.expiry_date !== "undefined" &&
    !Number.isNaN(Date.parse(item.expiry_date))
  ) {
    return getDaysFromDate(item.expiry_date);
  }

  return getDefaultExpiryDays(item.category, item.name);
}

function getExpiryInfo(item, settings) {
  const expiryValue = getExpiryValue(item);
  const urgentLimit = getExpiryWarningLimit(settings);

  if (expiryValue === null) {
    return {
      value: null,
      label: "Long shelf life",
      status: "Stocked",
      tone: "neutral",
      priority: 4,
    };
  }

  if (expiryValue <= 0) {
    return {
      value: expiryValue,
      label: "Expired",
      status: "Expired",
      tone: "danger",
      priority: 0,
    };
  }

  if (expiryValue <= Math.min(urgentLimit, 2)) {
    return {
      value: expiryValue,
      label: `${expiryValue} day${expiryValue === 1 ? "" : "s"} left`,
      status: "Urgent",
      tone: "danger",
      priority: 1,
    };
  }

  if (expiryValue <= urgentLimit) {
    return {
      value: expiryValue,
      label: `${expiryValue} days left`,
      status: "Use soon",
      tone: "warning",
      priority: 2,
    };
  }

  return {
    value: expiryValue,
    label: `${expiryValue} days left`,
    status: "Fresh",
    tone: "good",
    priority: 3,
  };
}

function getCleanName(item) {
  const possibleName =
    item.name ||
    item.ingredient ||
    item.itemName ||
    item.label ||
    item.title ||
    item.food ||
    "";

  const cleanName = String(possibleName).trim();

  if (!cleanName || normalizeText(cleanName).startsWith("missing item")) {
    return "Unnamed item";
  }

  return cleanName;
}

function cleanPantryItem(item, index) {
  const name = getCleanName(item);
  const category = inferCategory(name, item.category);
  const location = item.location ?? inferLocation(category, name);
  const expiryValue = getExpiryValue({ ...item, name, category });
  const expiryDate =
    item.expiryDate && !Number.isNaN(Date.parse(item.expiryDate))
      ? item.expiryDate
      : item.expiry_date && !Number.isNaN(Date.parse(item.expiry_date))
      ? item.expiry_date
      : getDateFromDays(expiryValue);

  return {
    id: item.id ?? `pantry-${index}-${Date.now()}`,
    name,
    quantity: item.quantity ?? item.package ?? item.amount ?? "1 item",
    category,
    location,
    status: item.status ?? (expiryValue === null ? "Stocked" : "Fresh"),
    expiryDays: expiryValue,
    expiry: expiryValue,
    daysUntilExpiry: expiryValue,
    daysLeft: expiryValue,
    expiryDate,
    expireIn: expiryValue,
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updated_at ?? new Date().toISOString(),
  };
}

function mergePantryItems(items) {
  const map = new Map();

  items.forEach((item) => {
    const cleaned = cleanPantryItem(item, map.size);
    const key = normalizeText(cleaned.name);

    if (!key || key === "unnamed item") {
      map.set(`${key}-${cleaned.id}`, cleaned);
      return;
    }

    if (!map.has(key)) {
      map.set(key, cleaned);
      return;
    }

    const existing = map.get(key);
    const existingExpiry = getExpiryValue(existing);
    const cleanedExpiry = getExpiryValue(cleaned);

    const earliestExpiry =
      existingExpiry === null
        ? cleanedExpiry
        : cleanedExpiry === null
        ? existingExpiry
        : Math.min(existingExpiry, cleanedExpiry);

    map.set(key, {
      ...existing,
      ...cleaned,
      id: existing.id,
      quantity:
        existing.quantity === cleaned.quantity
          ? existing.quantity
          : `${existing.quantity}, ${cleaned.quantity}`,
      expiryDays: earliestExpiry,
      expiry: earliestExpiry,
      daysUntilExpiry: earliestExpiry,
      daysLeft: earliestExpiry,
      expiryDate: getDateFromDays(earliestExpiry),
      expireIn: earliestExpiry,
      updatedAt: new Date().toISOString(),
    });
  });

  return Array.from(map.values());
}

function rowToPantryItem(row) {
  const data = row.data || {};
  const expiryValue =
    row.expiry_days ?? data.expiryDays ?? data.daysLeft ?? data.expireIn ?? null;

  return cleanPantryItem({
    ...data,
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category,
    location: row.location,
    status: row.status,
    expiryDays: expiryValue,
    expiry: expiryValue,
    daysUntilExpiry: expiryValue,
    daysLeft: expiryValue,
    expiryDate: row.expiry_date || data.expiryDate,
    expireIn: expiryValue,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function pantryItemToRow(item, userId) {
  const cleaned = cleanPantryItem(item, 0);
  const expiryValue = getExpiryValue(cleaned);

  return {
    user_id: userId,
    name: cleaned.name,
    quantity: cleaned.quantity,
    category: cleaned.category,
    location: cleaned.location,
    status: cleaned.status,
    expiry_days: expiryValue,
    expiry_date: cleaned.expiryDate || getDateFromDays(expiryValue),
    data: {
      ...cleaned,
      localId: cleaned.id,
      expiryDays: expiryValue,
      expiry: expiryValue,
      daysUntilExpiry: expiryValue,
      daysLeft: expiryValue,
      expireIn: expiryValue,
      expiryDate: cleaned.expiryDate || getDateFromDays(expiryValue),
    },
  };
}

function getStatusStyles(tone) {
  if (tone === "danger") return "border-red-300/20 bg-red-400/10 text-red-300";
  if (tone === "warning")
    return "border-orange-300/20 bg-orange-400/10 text-orange-300";
  if (tone === "neutral")
    return "border-sky-300/20 bg-sky-400/10 text-sky-300";

  return "border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]";
}

function getCategoryIcon(category) {
  const categoryText = normalizeText(category);

  if (categoryText.includes("protein")) return Beef;
  if (categoryText.includes("vegetable") || categoryText.includes("fruit"))
    return Leaf;
  return Package;
}

function getCategoryIconStyles(category) {
  const categoryText = normalizeText(category);

  if (categoryText.includes("protein"))
    return "border-red-300/10 bg-red-400/[0.08] text-red-300";
  if (categoryText.includes("vegetable") || categoryText.includes("fruit"))
    return "border-[#d7f75b]/10 bg-[#d7f75b]/[0.08] text-[#d7f75b]";
  if (categoryText.includes("spice"))
    return "border-purple-300/10 bg-purple-400/[0.08] text-purple-300";
  if (categoryText.includes("pantry") || categoryText.includes("carbs"))
    return "border-amber-300/10 bg-amber-400/[0.08] text-amber-300";

  return "border-white/10 bg-white/[0.045] text-[#c9cab3]";
}

function getMealSuggestions(item, allItems, settings) {
  if (settings.smartSuggestions === false) {
    return [
      {
        id: "custom-use-this-item-today",
        name: `Use ${item?.name || "this item"} today`,
        time: "10 min",
        reason:
          "Smart suggestions are turned off, so MealMind is only reminding you to use this item before it expires.",
        ingredients: [item?.name || "Pantry item"],
        match: 60,
      },
    ];
  }

  const itemName = normalizeText(item?.name);
  const pantryNames = allItems.map((pantryItem) =>
    normalizeText(pantryItem.name)
  );

  function hasItem(name) {
    return pantryNames.some((pantryItem) => pantryItem.includes(name));
  }

  const fallbackMeals = [
    {
      id: "custom-simple-pantry-bowl",
      name: "Simple Pantry Bowl",
      time: "15 min",
      reason: "Uses what you already have with minimal effort.",
      ingredients: [item?.name, "Black Pepper"],
      match: 72,
    },
    {
      id: "custom-quick-wrap-plate",
      name: "Quick Wrap Plate",
      time: "12 min",
      reason: "A fast option when you want to avoid waste.",
      ingredients: [item?.name, "Wraps"],
      match: 68,
    },
  ];

  if (!itemName) return fallbackMeals;

  if (itemName.includes("chicken")) {
    return [
      {
        id: "lunch-chicken-rice-bowl",
        name: "Chicken Rice Bowl",
        time: "25 min",
        reason: "Best way to use chicken before it expires.",
        ingredients: ["Chicken", "Rice", "Black Pepper"],
        match: hasItem("rice") ? 91 : 78,
      },
      {
        id: "dinner-chicken-fajitas",
        name: "Chicken Fajitas",
        time: "28 min",
        reason: "Uses chicken with wraps and vegetables.",
        ingredients: ["Chicken", "Wraps", "Lettuce"],
        match: hasItem("wrap") && hasItem("lettuce") ? 88 : 74,
      },
    ];
  }

  if (itemName.includes("cheese")) {
    return [
      {
        id: "lunch-grilled-cheese-tomato-soup",
        name: "Grilled Cheese with Tomato Soup",
        time: "23 min",
        reason: "Fast and easy way to use cheese.",
        ingredients: ["Cheese", "Bread", "Butter"],
        match: 84,
      },
      {
        id: "custom-cheese-lettuce-wrap",
        name: "Cheese Lettuce Wrap",
        time: "8 min",
        reason: "Uses cheese with fresh pantry items.",
        ingredients: ["Cheese", "Wraps", "Lettuce"],
        match: hasItem("wrap") && hasItem("lettuce") ? 86 : 70,
      },
    ];
  }

  if (itemName.includes("lettuce")) {
    return [
      {
        id: "dinner-chicken-fajitas",
        name: "Chicken Fajitas",
        time: "28 min",
        reason: "Good use of lettuce with chicken and wraps.",
        ingredients: ["Lettuce", "Chicken", "Wraps"],
        match: hasItem("chicken") && hasItem("wrap") ? 88 : 72,
      },
      {
        id: "custom-quick-side-salad",
        name: "Quick Side Salad",
        time: "7 min",
        reason: "Simple way to use lettuce without cooking.",
        ingredients: ["Lettuce", "Olive Oil", "Black Pepper"],
        match: 78,
      },
    ];
  }

  if (itemName.includes("wrap")) {
    return [
      {
        id: "lunch-chicken-caesar-wrap",
        name: "Chicken Caesar Wrap",
        time: "20 min",
        reason: "Fast meal that uses wraps with fresh ingredients.",
        ingredients: ["Wraps", "Chicken", "Lettuce"],
        match: hasItem("chicken") && hasItem("lettuce") ? 86 : 70,
      },
      {
        id: "dinner-chicken-fajitas",
        name: "Chicken Fajitas",
        time: "28 min",
        reason: "Useful if you want a proper meal without much cleanup.",
        ingredients: ["Wraps", "Chicken", "Lettuce"],
        match: hasItem("chicken") ? 84 : 69,
      },
    ];
  }

  if (itemName.includes("mushroom")) {
    return [
      {
        id: "custom-mushroom-omelette",
        name: "Mushroom Omelette",
        time: "12 min",
        reason: "Quick breakfast-style meal using mushrooms.",
        ingredients: ["Mushroom", "Eggs", "Cheese"],
        match: hasItem("egg") ? 86 : 71,
      },
      {
        id: "custom-garlic-mushrooms",
        name: "Garlic Mushrooms",
        time: "10 min",
        reason: "Simple side dish before mushrooms lose freshness.",
        ingredients: ["Mushroom", "Garlic", "Butter"],
        match: 80,
      },
    ];
  }

  if (itemName.includes("tomato")) {
    return [
      {
        id: "custom-tomato-egg-skillet",
        name: "Tomato Egg Skillet",
        time: "15 min",
        reason: "A quick way to use tomatoes before they soften.",
        ingredients: ["Tomatoes", "Eggs", "Black Pepper"],
        match: hasItem("egg") ? 84 : 70,
      },
      {
        id: "custom-fresh-tomato-toast",
        name: "Fresh Tomato Toast",
        time: "8 min",
        reason: "Simple snack using tomatoes and bread.",
        ingredients: ["Tomatoes", "Bread", "Olive Oil"],
        match: hasItem("bread") ? 82 : 68,
      },
    ];
  }

  if (itemName.includes("milk") || itemName.includes("yogurt")) {
    return [
      {
        id: "breakfast-oatmeal-banana-honey",
        name: "Banana Honey Oatmeal",
        time: "8 min",
        reason: "Uses dairy quickly with pantry-friendly ingredients.",
        ingredients: [item.name, "Oats", "Honey"],
        match: hasItem("oat") ? 84 : 70,
      },
      {
        id: "snack-smoothie",
        name: "Banana Peanut Butter Smoothie",
        time: "5 min",
        reason: "Fast way to use dairy before it expires.",
        ingredients: [item.name, "Banana", "Honey"],
        match: hasItem("banana") ? 82 : 68,
      },
    ];
  }

  return fallbackMeals;
}

function CloudSyncBadge({ syncStatus }) {
  const content = {
    loading: {
      label: "Loading cloud pantry",
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
      icon: Package,
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

function SummaryChip({ icon: Icon, label, value, tone = "lime" }) {
  const tones = {
    lime: "border-[#d7f75b]/15 bg-[#d7f75b]/10 text-[#d7f75b]",
    orange: "border-orange-300/15 bg-orange-400/10 text-orange-300",
    red: "border-red-300/15 bg-red-400/10 text-red-300",
    blue: "border-sky-300/15 bg-sky-400/10 text-sky-300",
  };

  return (
    <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-white/10 bg-[#13170f]/75 px-3 py-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
          tones[tone] || tones.lime
        }`}
      >
        <Icon size={15} />
      </div>

      <div>
        <p className="text-[11px] font-bold text-[#8f927e]">{label}</p>
        <p className="display-font text-lg font-extrabold text-[#fff8e8]">
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl px-3 text-xs font-extrabold transition ${
        active
          ? "bg-[#d7f75b] text-[#10120c] shadow-md shadow-[#d7f75b]/15"
          : "border border-white/10 bg-[#0f120c]/70 text-[#c9cab3] hover:bg-white/[0.07]"
      }`}
    >
      {children}
    </button>
  );
}

function CompactExpiryBar({ settings, stats }) {
  const warningLimit = getExpiryWarningLimit(settings);
  const watchLimit = getWatchLimit(settings);

  return (
    <section className="mb-5 rounded-[1.35rem] border border-[#d7f75b]/15 bg-[#141811]/75 p-4 shadow-xl shadow-black/15">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
            <SlidersHorizontal size={14} />
            Expiry mode: {settings.expiryStrictness}
          </div>

          <h2 className="display-font text-xl font-extrabold">
            Use soon list is based on your expiry reminders
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
            Warnings at {warningLimit} days · watch list at {watchLimit} days ·{" "}
            {settings.region} · {settings.budgetMode}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <SummaryChip
            icon={AlertTriangle}
            label="Urgent"
            value={stats.urgent}
            tone="red"
          />

          <SummaryChip
            icon={Clock3}
            label="Watch list"
            value={stats.attention}
            tone="orange"
          />

          <SummaryChip icon={Leaf} label="Fresh" value={stats.fresh} />

          <SummaryChip
            icon={ShieldCheck}
            label="Shelf stable"
            value={stats.stable}
            tone="blue"
          />
        </div>
      </div>
    </section>
  );
}

function UseItemModal({ item, onClose, onUseAll }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1f14] via-[#13170f] to-[#0d100a] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                <Utensils size={14} />
                Mark as used
              </div>

              <h2 className="display-font text-3xl font-extrabold">
                Use {item.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                This will remove the item from your pantry. For partial usage,
                update it from the Pantry page.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#c9cab3] transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
              Current item
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-4 py-2 text-lg font-extrabold text-[#d7f75b]">
                {item.quantity}
              </span>

              <span className="rounded-2xl border border-white/10 bg-[#0f120c]/70 px-4 py-2 text-sm font-extrabold text-[#fff8e8]">
                {item.location}
              </span>

              <span className="rounded-2xl border border-white/10 bg-[#0f120c]/70 px-4 py-2 text-sm font-extrabold text-[#fff8e8]">
                {item.category}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-extrabold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onUseAll(item.id)}
              className="rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3 font-extrabold text-red-300 transition hover:bg-red-400/15"
            >
              Mark Used / Remove
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MainUrgentCard({
  item,
  allItems,
  settings,
  onMarkUsed,
  onCookSuggestedMeal,
}) {
  const expiryInfo = getExpiryInfo(item, settings);
  const meals = getMealSuggestions(item, allItems, settings);
  const bestMeal = meals[0];

  return (
    <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="rounded-[1.45rem] border border-orange-300/15 bg-gradient-to-br from-[#1b2115]/90 via-[#141811]/90 to-[#0f130c]/95 p-4 shadow-xl shadow-black/15">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-extrabold text-orange-300">
              <AlertTriangle size={14} />
              Highest priority
            </div>

            <h2 className="display-font text-3xl font-extrabold">
              Use {item.name} first
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
              Shortest shelf life in your pantry right now.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusStyles(
                expiryInfo.tone
              )}`}
            >
              {expiryInfo.status}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-extrabold text-[#fff8e8]">
              <Clock3 size={13} />
              {expiryInfo.label}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-extrabold text-[#fff8e8]">
              <Package size={13} />
              {item.quantity}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-extrabold text-[#fff8e8]">
              <MapPin size={13} />
              {item.location}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-[#0f120c]/70 p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
                Suggested meal
              </p>

              <h3 className="display-font mt-1 text-xl font-extrabold">
                {bestMeal.name}
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
                {bestMeal.reason}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <span className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                {bestMeal.match}% match
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-extrabold text-[#fff8e8]">
                {bestMeal.time}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {bestMeal.ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-extrabold text-[#fff8e8]"
              >
                {ingredient}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <PremiumButton
              icon={ChefHat}
              onClick={() => onCookSuggestedMeal(bestMeal)}
            >
              Cook This
            </PremiumButton>

            <button
              type="button"
              onClick={() => onMarkUsed(item)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
            >
              Mark as used
            </button>
          </div>
        </div>
      </div>

      <aside className="rounded-[1.45rem] border border-white/10 bg-[#141811]/70 p-4 shadow-xl shadow-black/15">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
              Other meal ideas
            </p>

            <h3 className="display-font text-xl font-extrabold">
              Backup options
            </h3>
          </div>

          <Sparkles size={19} className="text-[#d7f75b]" />
        </div>

        <div className="space-y-2">
          {meals.slice(1).map((meal) => (
            <div
              key={meal.name}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="display-font font-extrabold">{meal.name}</h4>
                  <p className="mt-1 text-xs text-[#8f927e]">{meal.time}</p>
                </div>

                <span className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#d7f75b]">
                  {meal.match}%
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#b7b89f]">
                {meal.reason}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function UseSoonItemRow({ item, settings, onMarkUsed }) {
  const expiryInfo = getExpiryInfo(item, settings);
  const Icon = getCategoryIcon(item.category);
  const iconStyles = getCategoryIconStyles(item.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="grid gap-3 rounded-[1.15rem] border border-white/10 bg-[#13170f]/75 p-3 transition hover:border-white/20 hover:bg-[#171c12]/85 xl:grid-cols-[minmax(240px,1fr)_130px_140px_140px_110px] xl:items-center"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconStyles}`}
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate display-font text-lg font-extrabold">
            {item.name}
          </h3>

          <p className="text-xs font-bold text-[#8f927e]">{item.category}</p>
        </div>
      </div>

      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0f120c]/70 px-3 py-1.5 text-xs font-extrabold text-[#fff8e8]">
        <Package size={12} />
        {item.quantity}
      </span>

      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0f120c]/70 px-3 py-1.5 text-xs font-extrabold text-[#fff8e8]">
        <MapPin size={12} />
        {item.location}
      </span>

      <span
        className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusStyles(
          expiryInfo.tone
        )}`}
      >
        {expiryInfo.label}
      </span>

      <button
        type="button"
        onClick={() => onMarkUsed(item)}
        className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 text-xs font-extrabold text-[#d7f75b] transition hover:bg-[#d7f75b]/15"
      >
        <Check size={13} />
        Used
      </button>
    </motion.div>
  );
}

function EmptyUseSoonState({ isPantryEmpty }) {
  return (
    <div className="relative overflow-hidden rounded-[1.55rem] border border-[#d7f75b]/15 bg-gradient-to-br from-[#1d2315]/90 via-[#141811]/90 to-[#0d100a]/95 p-8 text-center shadow-2xl shadow-black/20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b] shadow-lg shadow-[#d7f75b]/10">
          {isPantryEmpty ? <Package size={32} /> : <ShieldCheck size={32} />}
        </div>

        <h2 className="display-font text-3xl font-extrabold">
          {isPantryEmpty ? "No pantry items yet" : "Nothing urgent right now"}
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#b7b89f]">
          {isPantryEmpty
            ? "Add food to your pantry first, then MealMind will track what should be used soon."
            : "Your pantry looks stable. MealMind will highlight anything that needs attention later."}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/pantry";
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
          >
            {isPantryEmpty && <Plus size={18} />}
            Open Pantry
          </button>

          {isPantryEmpty && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/settings";
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Sparkles size={18} />
              Try demo kitchen
            </button>
          )}
        </div>

        {isPantryEmpty && (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <Package size={20} className="mx-auto mb-3 text-[#d7f75b]" />
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Add food
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                Start with what you already own.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <Clock3 size={20} className="mx-auto mb-3 text-orange-300" />
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Track expiry
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                See what needs attention first.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <ChefHat size={20} className="mx-auto mb-3 text-sky-300" />
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Get meal ideas
              </p>
              <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                Suggestions become useful after pantry items exist.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPriorityList({ isPantryEmpty, hasActiveSearch }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-8 text-center">
      <CalendarClock size={38} className="mx-auto mb-3 text-[#d7f75b]" />

      <h3 className="display-font text-2xl font-extrabold">
        {isPantryEmpty
          ? "No pantry items to track"
          : hasActiveSearch
          ? "Nothing matches this view"
          : "No priority items yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#b7b89f]">
        {isPantryEmpty
          ? "Once you add pantry items, this list will show foods to plan around."
          : hasActiveSearch
          ? "Try a different filter or search term."
          : "Everything looks okay for now."}
      </p>
    </div>
  );
}

function UseSoon() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(() => loadSettings());
  const [items, setItems] = useState(() =>
    mergePantryItems(loadStorageArray(PANTRY_STORAGE_KEY, []))
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("Needs attention");
  const [itemToUse, setItemToUse] = useState(null);
  const [syncStatus, setSyncStatus] = useState("loading");

  async function fetchCloudData() {
    if (!user?.id) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("loading");

    const [settingsResult, pantryResult] = await Promise.all([
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
    ]);

    if (settingsResult.error) {
      console.error("Use Soon settings fetch error:", settingsResult.error.message);
      setSyncStatus("error");
      showToast("Could not load settings from cloud.");
      return;
    }

    if (pantryResult.error) {
      console.error("Use Soon pantry fetch error:", pantryResult.error.message);
      setSyncStatus("error");
      showToast("Could not load pantry from cloud.");
      return;
    }

    const cloudSettings = settingsResult.data?.settings || settingsResult.data?.data || null;

    if (cloudSettings) {
      const nextSettings = {
        ...defaultSettings,
        ...cloudSettings,
      };

      setSettings(nextSettings);
      saveStorage(SETTINGS_KEY, nextSettings);
    }

    const nextItems = mergePantryItems((pantryResult.data || []).map(rowToPantryItem));

    setItems(nextItems);
    savePantryItems(nextItems);
    setSyncStatus("synced");
  }

  async function saveCloudPantry(nextItems) {
    const cleanedItems = mergePantryItems(nextItems);
    savePantryItems(cleanedItems);

    if (!user?.id) {
      setSyncStatus("local");
      return true;
    }

    setSyncStatus("saving");

    const { error: deleteError } = await supabase
      .from("pantry_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Use Soon pantry delete error:", deleteError.message);
      setSyncStatus("error");
      showToast("Could not update cloud pantry.");
      return false;
    }

    if (cleanedItems.length > 0) {
      const rows = cleanedItems.map((item) => pantryItemToRow(item, user.id));

      const { error: insertError } = await supabase
        .from("pantry_items")
        .insert(rows);

      if (insertError) {
        console.error("Use Soon pantry insert error:", insertError.message);
        setSyncStatus("error");
        showToast("Could not save pantry to cloud.");
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

  const isPantryEmpty = items.length === 0;

  const urgentLimit = getExpiryWarningLimit(settings);
  const watchLimit = getWatchLimit(settings);

  const sortedItems = useMemo(() => {
    return [...items]
      .map((item) => ({
        ...item,
        expiryInfo: getExpiryInfo(item, settings),
      }))
      .sort((a, b) => {
        if (a.expiryInfo.priority !== b.expiryInfo.priority) {
          return a.expiryInfo.priority - b.expiryInfo.priority;
        }

        const aValue = a.expiryInfo.value ?? 9999;
        const bValue = b.expiryInfo.value ?? 9999;

        return aValue - bValue;
      });
  }, [items, settings]);

  const urgentItems = useMemo(() => {
    return sortedItems.filter(
      (item) =>
        item.expiryInfo.value !== null &&
        item.expiryInfo.value <= urgentLimit &&
        item.expiryInfo.tone !== "good"
    );
  }, [sortedItems, urgentLimit]);

  const attentionItems = useMemo(() => {
    return sortedItems.filter(
      (item) =>
        item.expiryInfo.value !== null && item.expiryInfo.value <= watchLimit
    );
  }, [sortedItems, watchLimit]);

  const freshItems = useMemo(() => {
    return sortedItems.filter(
      (item) =>
        item.expiryInfo.value !== null && item.expiryInfo.value > urgentLimit
    );
  }, [sortedItems, urgentLimit]);

  const shelfStableItems = useMemo(() => {
    return sortedItems.filter((item) => item.expiryInfo.value === null);
  }, [sortedItems]);

  const mainItem = urgentItems[0] || attentionItems[0] || null;

  const displayedItems = useMemo(() => {
    let source = attentionItems;

    if (priorityFilter === "Urgent") {
      source = urgentItems;
    }

    if (priorityFilter === "Fresh") {
      source = freshItems;
    }

    if (priorityFilter === "Long shelf life") {
      source = shelfStableItems;
    }

    return source.filter((item) => {
      if (!searchTerm.trim()) return true;

      const search = normalizeText(searchTerm);

      return (
        normalizeText(item.name).includes(search) ||
        normalizeText(item.category).includes(search) ||
        normalizeText(item.location).includes(search)
      );
    });
  }, [
    attentionItems,
    freshItems,
    priorityFilter,
    searchTerm,
    shelfStableItems,
    urgentItems,
  ]);

  const stats = useMemo(() => {
    return {
      urgent: urgentItems.length,
      attention: attentionItems.length,
      fresh: freshItems.length,
      stable: shelfStableItems.length,
    };
  }, [
    attentionItems.length,
    freshItems.length,
    shelfStableItems.length,
    urgentItems.length,
  ]);

  async function updateItems(nextItems) {
    const cleanedItems = mergePantryItems(nextItems);
    setItems(cleanedItems);
    savePantryItems(cleanedItems);
    await saveCloudPantry(cleanedItems);
  }

  async function handleUseAll(id) {
    const targetItem = items.find((item) => item.id === id);
    const nextItems = items.filter((item) => item.id !== id);

    setItems(mergePantryItems(nextItems));
    savePantryItems(nextItems);
    setItemToUse(null);

    const saved = await saveCloudPantry(nextItems);

    if (targetItem && saved) {
      showToast(`${targetItem.name} marked as used.`);
    }
  }

  async function repairExpiryData() {
    const repaired = mergePantryItems(items);
    await updateItems(repaired);
    showToast("Use Soon data cleaned and refreshed.");
  }

  function handleCookSuggestedMeal(meal) {
    localStorage.setItem(
      REQUESTED_MEAL_KEY,
      JSON.stringify({
        id: meal.id,
        name: meal.name,
        source: "use-soon",
        createdAt: new Date().toISOString(),
      })
    );

    window.location.href = "/decide-meal";
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Use Soon"
        title="Use food before it goes bad"
        description="MealMind prioritizes pantry items that need attention and adjusts warnings based on your expiry settings."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <CloudSyncBadge syncStatus={syncStatus} />

            {!isPantryEmpty && (
              <button
                type="button"
                onClick={repairExpiryData}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Refresh dates
              </button>
            )}

            <PremiumButton
              icon={Package}
              onClick={() => {
                window.location.href = "/pantry";
              }}
            >
              Open Pantry
            </PremiumButton>
          </div>
        }
      />

      {!isPantryEmpty && <CompactExpiryBar settings={settings} stats={stats} />}

      {mainItem ? (
        <MainUrgentCard
          item={mainItem}
          allItems={items}
          settings={settings}
          onMarkUsed={setItemToUse}
          onCookSuggestedMeal={handleCookSuggestedMeal}
        />
      ) : (
        <section className="mb-5">
          <EmptyUseSoonState isPantryEmpty={isPantryEmpty} />
        </section>
      )}

      {!isPantryEmpty && (
        <section className="rounded-[1.35rem] border border-white/10 bg-[#141811]/60 p-4 shadow-xl shadow-black/15">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                <CalendarClock size={14} />
                Priority list
              </div>

              <h2 className="display-font text-2xl font-extrabold">
                Items to plan around
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
                Showing {displayedItems.length} item
                {displayedItems.length === 1 ? "" : "s"} based on your filter.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[260px]">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f927e]"
                />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search use soon..."
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#0f120c]/80 pl-10 pr-4 text-sm font-bold outline-none placeholder:text-[#70735f] focus:border-[#d7f75b]/40"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["Needs attention", "Urgent", "Fresh", "Long shelf life"].map(
                  (filter) => (
                    <FilterButton
                      key={filter}
                      active={priorityFilter === filter}
                      onClick={() => setPriorityFilter(filter)}
                    >
                      {filter}
                    </FilterButton>
                  )
                )}
              </div>
            </div>
          </div>

          {displayedItems.length > 0 ? (
            <div className="space-y-2.5">
              {displayedItems.map((item) => (
                <UseSoonItemRow
                  key={item.id}
                  item={item}
                  settings={settings}
                  onMarkUsed={setItemToUse}
                />
              ))}
            </div>
          ) : (
            <EmptyPriorityList
              isPantryEmpty={isPantryEmpty}
              hasActiveSearch={Boolean(searchTerm.trim())}
            />
          )}
        </section>
      )}

      {itemToUse && (
        <UseItemModal
          item={itemToUse}
          onClose={() => setItemToUse(null)}
          onUseAll={handleUseAll}
        />
      )}
    </div>
  );
}

export default UseSoon;