import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Beef,
  CalendarClock,
  Check,
  Clock3,
  Cloud,
  CupSoda,
  Fish,
  Leaf,
  Loader2,
  MapPin,
  Milk,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Utensils,
  Wheat,
  X,
} from "lucide-react";
import PremiumButton from "../components/ui/PremiumButton";
import { showToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const PANTRY_STORAGE_KEY = "mealmind_pantry_items";
const SETTINGS_KEY = "mealmind_settings";

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

function getExpiryWarningLimit(settings) {
  if (settings.expiryStrictness === "Relaxed") return 2;
  if (settings.expiryStrictness === "Strict") return 7;
  return 5;
}

function getUrgentLimit(settings) {
  if (settings.expiryStrictness === "Relaxed") return 1;
  if (settings.expiryStrictness === "Strict") return 3;
  return 2;
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
        "tortilla",
        "tortillas",
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

function calculateDaysFromDate(dateValue) {
  if (!dateValue) return null;

  const today = new Date();
  const expiryDate = new Date(dateValue);

  if (!Number.isFinite(expiryDate.getTime())) {
    return null;
  }

  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
}

function getDateFromDays(days) {
  if (days === null || days === undefined || days === "") return "";

  const date = new Date();
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

function getExpiryValue(item) {
  const possibleValues = [
    item.daysLeft,
    item.expiryDays,
    item.daysUntilExpiry,
    item.expiry,
    item.expireIn,
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
    !Number.isNaN(Number(item.expiryDate))
  ) {
    return Number(item.expiryDate);
  }

  if (
    item.expiryDate &&
    item.expiryDate !== "undefined" &&
    !Number.isNaN(Date.parse(item.expiryDate))
  ) {
    return calculateDaysFromDate(item.expiryDate);
  }

  return getDefaultExpiryDays(item.category, item.name);
}

function getExpiryInfo(item, settings) {
  const expiryValue = getExpiryValue(item);
  const warningLimit = getExpiryWarningLimit(settings);
  const urgentLimit = getUrgentLimit(settings);

  if (expiryValue === null) {
    return {
      value: null,
      label: "Long shelf life",
      status: "Shelf stable",
      tone: "neutral",
    };
  }

  if (expiryValue <= 0) {
    return {
      value: expiryValue,
      label: "Expired",
      status: "Expired",
      tone: "danger",
    };
  }

  if (expiryValue <= urgentLimit) {
    return {
      value: expiryValue,
      label: `${expiryValue} day${expiryValue === 1 ? "" : "s"} left`,
      status: "Critical",
      tone: "danger",
    };
  }

  if (expiryValue <= warningLimit) {
    return {
      value: expiryValue,
      label: `${expiryValue} days left`,
      status: "Use soon",
      tone: "warning",
    };
  }

  return {
    value: expiryValue,
    label: `${expiryValue} days left`,
    status: "Fresh",
    tone: "good",
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

  return cleanPantryItem(
    {
      ...data,
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      category: row.category,
      location: row.location,
      status: row.status,
      expiryDays: row.expiry_days,
      expiry: row.expiry_days,
      daysUntilExpiry: row.expiry_days,
      daysLeft: row.expiry_days,
      expireIn: row.expiry_days,
      expiryDate: row.expiry_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    0
  );
}

function pantryItemToRow(item, userId) {
  const cleaned = cleanPantryItem(item, 0);

  return {
    user_id: userId,
    name: cleaned.name,
    quantity: cleaned.quantity,
    category: cleaned.category,
    location: cleaned.location,
    status: cleaned.status,
    expiry_days: cleaned.expiryDays,
    expiry_date: cleaned.expiryDate || null,
    data: {
      ...cleaned,
      localId: cleaned.id,
    },
  };
}

function parseQuantity(quantity) {
  const text = String(quantity ?? "").trim();
  const match = text.match(/^([\d.]+)\s*(.*)$/);

  if (!match) {
    return {
      amount: null,
      unit: text || "item",
    };
  }

  return {
    amount: Number(match[1]),
    unit: match[2]?.trim() || "item",
  };
}

function formatQuantity(amount, unit) {
  const rounded = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");

  return `${rounded}${unit ? ` ${unit}` : ""}`;
}

function isWholeContainerUnit(unit) {
  const normalized = normalizeText(unit);

  return [
    "jar",
    "jars",
    "bottle",
    "bottles",
    "pack",
    "packs",
    "packet",
    "packets",
    "can",
    "cans",
    "box",
    "boxes",
  ].includes(normalized);
}

function getSuggestedUsePlaceholder(item) {
  const { amount, unit } = parseQuantity(item.quantity);
  const normalizedUnit = normalizeText(unit);
  const normalizedName = normalizeText(item.name);

  if (isWholeContainerUnit(unit)) return "Example: 0.25";
  if (normalizedUnit === "kg")
    return amount && amount <= 1 ? "Example: 0.1" : "Example: 0.25";
  if (normalizedUnit === "g") return "Example: 100";
  if (normalizedUnit === "l") return "Example: 0.25";
  if (normalizedUnit === "ml") return "Example: 250";

  if (
    normalizedUnit.includes("piece") ||
    normalizedUnit.includes("head") ||
    normalizedUnit.includes("bulb")
  ) {
    return "Example: 1";
  }

  if (normalizedName.includes("egg")) return "Example: 2";

  return "Amount used";
}

function getResultPreview(item, usedAmount) {
  const parsed = parseQuantity(item.quantity);

  if (!usedAmount || Number(usedAmount) <= 0) {
    return {
      valid: false,
      text: "Enter the amount used to preview the remaining amount.",
      removeItem: false,
      nextQuantity: item.quantity,
    };
  }

  if (parsed.amount === null) {
    return {
      valid: true,
      text: "This item uses a custom quantity. Use Remove All if it is finished.",
      removeItem: false,
      nextQuantity: item.quantity,
    };
  }

  const used = Number(usedAmount);
  const remaining = parsed.amount - used;

  if (remaining <= 0) {
    return {
      valid: true,
      text: `${item.quantity} → item will be removed from pantry`,
      removeItem: true,
      nextQuantity: "0",
    };
  }

  return {
    valid: true,
    text: `${item.quantity} → ${formatQuantity(remaining, parsed.unit)}`,
    removeItem: false,
    nextQuantity: formatQuantity(remaining, parsed.unit),
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

function getCategoryIcon(category, name) {
  const categoryText = normalizeText(category);
  const nameText = normalizeText(name);

  if (
    nameText.includes("fish") ||
    nameText.includes("salmon") ||
    nameText.includes("tuna")
  ) {
    return Fish;
  }

  if (categoryText.includes("protein")) return Beef;
  if (categoryText.includes("vegetable") || categoryText.includes("fruit"))
    return Leaf;
  if (categoryText.includes("dairy")) return Milk;
  if (categoryText.includes("carb")) return Wheat;
  if (categoryText.includes("spice")) return Sparkles;
  if (categoryText.includes("pantry")) return Package;

  return CupSoda;
}

function getCategoryIconStyles(category) {
  const categoryText = normalizeText(category);

  if (categoryText.includes("protein"))
    return "border-red-300/10 bg-red-400/[0.07] text-red-300";
  if (categoryText.includes("vegetable") || categoryText.includes("fruit"))
    return "border-[#d7f75b]/10 bg-[#d7f75b]/[0.07] text-[#d7f75b]";
  if (categoryText.includes("dairy"))
    return "border-sky-300/10 bg-sky-400/[0.07] text-sky-300";
  if (categoryText.includes("spice"))
    return "border-purple-300/10 bg-purple-400/[0.07] text-purple-300";
  if (categoryText.includes("pantry") || categoryText.includes("carbs"))
    return "border-amber-300/10 bg-amber-400/[0.07] text-amber-300";

  return "border-white/10 bg-white/[0.045] text-[#c9cab3]";
}

function AddPantryModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("Protein");
  const [location, setLocation] = useState("Fridge");
  const [expiryMode, setExpiryMode] = useState("auto");
  const [expiryDate, setExpiryDate] = useState("");
  const [customDays, setCustomDays] = useState("");

  const inferredCategory = inferCategory(name, category);
  const inferredLocation = inferLocation(inferredCategory, name);
  const autoExpiryDays = getDefaultExpiryDays(inferredCategory, name);
  const autoExpiryDate = getDateFromDays(autoExpiryDays);

  const previewExpiryDays =
    expiryMode === "auto"
      ? autoExpiryDays
      : expiryMode === "shelf"
      ? null
      : expiryMode === "days"
      ? Number(customDays || 0)
      : calculateDaysFromDate(expiryDate);

  const previewExpiryLabel =
    previewExpiryDays === null
      ? "Long shelf life"
      : previewExpiryDays <= 0
      ? "Expired / today"
      : `${previewExpiryDays} day${previewExpiryDays === 1 ? "" : "s"} left`;

  function quickDate(days) {
    setExpiryMode("date");
    setExpiryDate(getDateFromDays(days));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      showToast("Enter an item name first.");
      return;
    }

    const finalCategory = inferCategory(name, category);
    const finalLocation = location || inferredLocation;

    let expiryDays = autoExpiryDays;
    let finalExpiryDate = autoExpiryDate;

    if (expiryMode === "shelf") {
      expiryDays = null;
      finalExpiryDate = "";
    }

    if (expiryMode === "days") {
      const days = Number(customDays);

      if (!Number.isFinite(days) || days < 0) {
        showToast("Enter valid expiry days.");
        return;
      }

      expiryDays = days;
      finalExpiryDate = getDateFromDays(days);
    }

    if (expiryMode === "date") {
      const days = calculateDaysFromDate(expiryDate);

      if (days === null) {
        showToast("Choose a valid expiry date.");
        return;
      }

      expiryDays = days;
      finalExpiryDate = expiryDate;
    }

    onAdd({
      id: `pantry-${crypto.randomUUID()}`,
      name: name.trim(),
      quantity: quantity.trim() || "1 item",
      category: finalCategory,
      location: finalLocation,
      status: expiryDays === null ? "Stocked" : "Fresh",
      expiryDays,
      expiry: expiryDays,
      daysUntilExpiry: expiryDays,
      daysLeft: expiryDays,
      expiryDate: finalExpiryDate,
      expireIn: expiryDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#11160e] p-5 shadow-2xl shadow-black/60 md:p-6"
      >
        <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#d7f75b]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20 sm:flex">
                <Package size={25} />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                  <Package size={14} />
                  Pantry item
                </div>

                <h2 className="display-font text-3xl font-extrabold md:text-4xl">
                  Add pantry item
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b7b89f]">
                  Add item details, storage location, and expiry date so MealMind
                  can warn you at the right time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#c9cab3] transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <section className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <label className="mb-2 block text-sm font-extrabold">
                  Item name
                </label>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Chicken"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#080b07] px-4 text-sm font-extrabold text-[#fff8e8] outline-none placeholder:text-[#6f725f] focus:border-[#d7f75b]/50"
                />
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <label className="mb-2 block text-sm font-extrabold">
                  Quantity
                </label>

                <input
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Example: 500g, 1 pack, 6 eggs"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#080b07] px-4 text-sm font-extrabold text-[#fff8e8] outline-none placeholder:text-[#6f725f] focus:border-[#d7f75b]/50"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-extrabold">Category</p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Protein",
                      "Vegetable",
                      "Fruit",
                      "Carbs",
                      "Dairy",
                      "Spice",
                      "Pantry",
                      "Other",
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={`h-10 rounded-xl px-3 text-xs font-extrabold transition ${
                          category === item
                            ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/15"
                            : "border border-white/10 bg-[#080b07] text-[#c9cab3] hover:bg-white/[0.07]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-extrabold">Location</p>

                  <div className="grid grid-cols-2 gap-2">
                    {["Fridge", "Pantry", "Spices", "Freezer"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLocation(item)}
                        className={`h-10 rounded-xl px-3 text-xs font-extrabold transition ${
                          location === item
                            ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/15"
                            : "border border-white/10 bg-[#080b07] text-[#c9cab3] hover:bg-white/[0.07]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[#d7f75b]/15 bg-[#d7f75b]/[0.045] p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]">
                  <CalendarClock size={19} />
                </div>

                <div>
                  <h3 className="display-font text-xl font-extrabold">
                    Expiry details
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
                    Choose auto, a real expiry date, custom days, or shelf-stable.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  ["auto", "Auto"],
                  ["date", "Pick date"],
                  ["days", "Days left"],
                  ["shelf", "No expiry"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExpiryMode(value)}
                    className={`h-10 rounded-xl px-3 text-xs font-extrabold transition ${
                      expiryMode === value
                        ? "bg-[#d7f75b] text-[#10120c]"
                        : "border border-white/10 bg-[#080b07] text-[#c9cab3] hover:bg-white/[0.07]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {expiryMode === "date" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                    Expiry date
                  </label>

                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#080b07] px-3 text-sm font-extrabold text-[#fff8e8] outline-none focus:border-[#d7f75b]/50"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[2, 3, 5, 7, 10, 14].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => quickDate(days)}
                        className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-extrabold text-[#c9cab3] transition hover:bg-white/10"
                      >
                        +{days}d
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expiryMode === "days" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                    Days until expiry
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={customDays}
                    onChange={(event) => setCustomDays(event.target.value)}
                    placeholder="Example: 5"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#080b07] px-3 text-sm font-extrabold text-[#fff8e8] outline-none placeholder:text-[#6f725f] focus:border-[#d7f75b]/50"
                  />
                </div>
              )}

              {expiryMode === "auto" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                    Auto estimate
                  </p>

                  <p className="mt-2 text-sm font-bold leading-6 text-[#c9cab3]">
                    Based on the item type, MealMind estimates:
                  </p>

                  <p className="display-font mt-2 text-2xl font-extrabold text-[#d7f75b]">
                    {autoExpiryDays === null
                      ? "Long shelf life"
                      : `${autoExpiryDays} days`}
                  </p>
                </div>
              )}

              {expiryMode === "shelf" && (
                <div className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-400/[0.08] p-3">
                  <p className="text-sm font-bold leading-6 text-sky-200">
                    This item will be treated as shelf-stable and will not appear
                    in expiry warnings.
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#080b07] p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                  Preview
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-[#8f927e]">
                      Category
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#fff8e8]">
                      {inferredCategory}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-[#8f927e]">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#fff8e8]">
                      {location || inferredLocation}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-[#8f927e]">
                      Expiry
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#d7f75b]">
                      {previewExpiryLabel}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-extrabold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-2xl bg-[#d7f75b] px-6 py-3 font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
            >
              Add Item
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

function UseItemModal({ item, onClose, onUsePartial, onUseAll }) {
  const parsed = parseQuantity(item.quantity);
  const [usedAmount, setUsedAmount] = useState("");
  const preview = getResultPreview(item, usedAmount);
  const containerBased = isWholeContainerUnit(parsed.unit);

  function handleSubmit(event) {
    event.preventDefault();

    if (!preview.valid) {
      showToast("Enter how much you used first.");
      return;
    }

    onUsePartial(item.id, preview);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1f14] via-[#13170f] to-[#0d100a] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                <Utensils size={14} />
                Use pantry item
              </div>

              <h2 className="display-font text-3xl font-extrabold">
                Use {item.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                Enter only the amount used. MealMind will calculate what remains.
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

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                  Amount
                </p>

                <p className="display-font mt-1 text-xl font-extrabold text-[#d7f75b]">
                  {item.quantity}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f120c]/70 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                  Unit
                </p>

                <p className="display-font mt-1 text-xl font-extrabold">
                  {parsed.unit}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0f120c]/70 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                  Location
                </p>

                <p className="display-font mt-1 text-xl font-extrabold">
                  {item.location}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
            <label className="mb-2 block text-sm font-extrabold">
              Amount used
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e09] px-4 py-3 focus-within:border-[#d7f75b]/40">
              <input
                type="number"
                min="0"
                step="any"
                value={usedAmount}
                onChange={(event) => setUsedAmount(event.target.value)}
                placeholder={getSuggestedUsePlaceholder(item)}
                className="w-full bg-transparent font-extrabold outline-none placeholder:text-[#70735f]"
              />

              <span className="rounded-xl bg-white/[0.07] px-3 py-1.5 text-xs font-extrabold text-[#c9cab3]">
                {parsed.unit}
              </span>
            </div>

            {containerBased && (
              <p className="mt-3 text-sm leading-6 text-[#b7b89f]">
                This item is stored as a container. Use decimals if only part of
                it was used, for example 0.25 jar.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-[#0f120c]/65 p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
              Result preview
            </p>

            {!preview.valid ? (
              <motion.p
                key="empty-preview"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="text-sm leading-6 text-[#b7b89f]"
              >
                {preview.text}
              </motion.p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <motion.span
                    key={`from-${item.quantity}`}
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-lg font-extrabold text-[#fff8e8]"
                  >
                    {item.quantity}
                  </motion.span>

                  <motion.div
                    key={`arrow-${preview.nextQuantity}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#c9cab3]"
                  >
                    <ArrowRight size={18} />
                  </motion.div>

                  <motion.span
                    key={`to-${preview.nextQuantity}-${preview.removeItem}`}
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`rounded-2xl px-4 py-2 text-lg font-extrabold ${
                      preview.removeItem
                        ? "border border-red-300/20 bg-red-400/10 text-red-300"
                        : "border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b] shadow-lg shadow-[#d7f75b]/10"
                    }`}
                  >
                    {preview.removeItem ? "Removed" : preview.nextQuantity}
                  </motion.span>
                </div>

                <motion.p
                  key={`preview-note-${preview.nextQuantity}-${preview.removeItem}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut", delay: 0.04 }}
                  className={`mt-3 text-sm leading-6 ${
                    preview.removeItem ? "text-red-300" : "text-[#b7b89f]"
                  }`}
                >
                  {preview.removeItem
                    ? "The used amount finishes this item, so it will be removed from your pantry."
                    : "This item will stay in your pantry with an updated quantity."}
                </motion.p>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onUseAll(item.id)}
              className="rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3 font-extrabold text-red-300 transition hover:bg-red-400/15"
            >
              Remove All
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-extrabold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-2xl bg-[#d7f75b] px-5 py-3 font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
              >
                Update Pantry
              </button>
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone = "lime" }) {
  const styles = {
    lime: "border-[#d7f75b]/15 bg-[#d7f75b]/[0.07] text-[#d7f75b]",
    red: "border-red-300/15 bg-red-400/[0.08] text-red-300",
    orange: "border-orange-300/15 bg-orange-400/[0.08] text-orange-300",
    blue: "border-sky-300/15 bg-sky-400/[0.08] text-sky-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/75 px-3 py-2.5"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
          styles[tone] || styles.lime
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
    </motion.div>
  );
}

function CloudSyncBadge({ syncStatus }) {
  const statusContent = {
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

function PantryControlPanel({
  stats,
  settings,
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  categoryFilter,
  setCategoryFilter,
  expiryStatusFilter,
  setExpiryStatusFilter,
  onClear,
  hasActiveFilters,
}) {
  const locations = ["All", "Fridge", "Pantry", "Spices", "Freezer"];
  const categories = [
    "All",
    "Protein",
    "Vegetable",
    "Fruit",
    "Carbs",
    "Dairy",
    "Spice",
    "Pantry",
  ];
  const expiryStatuses = [
    "All",
    "Critical",
    "Use soon",
    "Fresh",
    "Shelf stable",
    "Expired",
  ];

  return (
    <section className="mb-5 rounded-[1.55rem] border border-white/10 bg-[#141811]/75 p-4 shadow-2xl shadow-black/15">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto">
          <MiniStat icon={Package} label="Total" value={stats.total} />

          <MiniStat
            icon={AlertTriangle}
            label="Critical"
            value={stats.critical}
            tone="red"
          />

          <MiniStat
            icon={Clock3}
            label="Use soon"
            value={stats.urgent}
            tone="orange"
          />

          <MiniStat
            icon={Sparkles}
            label="Shelf stable"
            value={stats.stocked}
            tone="blue"
          />
        </div>

        <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d7f75b]/15 bg-[#d7f75b]/[0.06] px-3 py-2 text-xs font-extrabold text-[#d7f75b] sm:w-auto">
          <SlidersHorizontal size={14} />
          Expiry: {settings.expiryStrictness} ·{" "}
          {getExpiryWarningLimit(settings)}d warning
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(260px,430px)_160px_160px_170px_auto] xl:items-end">
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
            Search
          </label>

          <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-[#0a0e08] px-4 transition focus-within:border-[#d7f75b]/45">
            <Search size={17} className="shrink-0 text-[#8f927e]" />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search pantry..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-[#fff8e8] outline-none placeholder:text-[#70735f]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
            Storage
          </label>

          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#0a0e08] px-4 text-sm font-extrabold text-[#fff8e8] outline-none focus:border-[#d7f75b]/45"
          >
            {locations.map((item) => (
              <option key={item} value={item} className="bg-[#0a0e08]">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
            Type
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#0a0e08] px-4 text-sm font-extrabold text-[#fff8e8] outline-none focus:border-[#d7f75b]/45"
          >
            {categories.map((item) => (
              <option key={item} value={item} className="bg-[#0a0e08]">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
            Expiry
          </label>

          <select
            value={expiryStatusFilter}
            onChange={(event) => setExpiryStatusFilter(event.target.value)}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#0a0e08] px-4 text-sm font-extrabold text-[#fff8e8] outline-none focus:border-[#d7f75b]/45"
          >
            {expiryStatuses.map((item) => (
              <option key={item} value={item} className="bg-[#0a0e08]">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-transparent">
            Clear
          </label>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={`h-12 w-full rounded-2xl px-5 text-sm font-extrabold transition xl:w-auto ${
              hasActiveFilters
                ? "border border-white/10 bg-white/[0.06] text-white hover:bg-white/10"
                : "cursor-not-allowed border border-white/5 bg-white/[0.025] text-[#6f725f]"
            }`}
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}

function UseFirstPanel({ items, settings, onAddItem }) {
  const urgentItems = items
    .map((item) => ({
      ...item,
      expiryValue: getExpiryValue(item),
    }))
    .filter((item) => item.expiryValue !== null)
    .sort((a, b) => a.expiryValue - b.expiryValue);

  const first = urgentItems[0];
  const second = urgentItems.slice(1, 4);

  const pantryNames = items.map((item) => normalizeText(item.name));

  function hasItem(name) {
    return pantryNames.some((item) => item.includes(name));
  }

  const meal =
    hasItem("chicken") && hasItem("rice")
      ? "Chicken Rice Bowl"
      : hasItem("wrap") && hasItem("cheese")
      ? "Cheese Lettuce Wrap"
      : hasItem("egg")
      ? "Quick Omelette"
      : "Simple Pantry Bowl";

  return (
    <aside className="rounded-[1.55rem] border border-[#d7f75b]/15 bg-gradient-to-br from-[#1d2315]/90 via-[#141811]/90 to-[#0e120c]/95 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
            <Sparkles size={14} />
            Smart pantry insight
          </div>

          <h3 className="display-font text-2xl font-extrabold">
            {items.length === 0 ? "Start here" : "Use first"}
          </h3>

          <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
            {items.length === 0
              ? "Add food first so MealMind can give useful suggestions."
              : "One focused suggestion without clutter."}
          </p>
        </div>

        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]"
        >
          <Clock3 size={20} />
        </motion.div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.25rem] border border-[#d7f75b]/15 bg-[#d7f75b]/[0.06] p-4">
          <h4 className="display-font text-xl font-extrabold">
            No pantry items yet
          </h4>

          <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
            Add your first item, then MealMind will track expiry dates and
            suggest meals based on what you own.
          </p>

          <button
            type="button"
            onClick={onAddItem}
            className="mt-4 h-11 w-full rounded-2xl bg-[#d7f75b] px-4 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/15 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
          >
            Add first item
          </button>
        </div>
      ) : first ? (
        <div className="rounded-[1.25rem] border border-orange-300/20 bg-orange-400/[0.075] p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-orange-300">
            Highest priority
          </p>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h4 className="display-font text-2xl font-extrabold">
                {first.name}
              </h4>

              <p className="mt-1 text-sm font-extrabold text-orange-300">
                {getExpiryInfo(first, settings).label}
              </p>
            </div>

            <span className="rounded-full border border-orange-300/25 bg-orange-400/15 px-3 py-1 text-xs font-black text-orange-300">
              Use first
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-bold text-[#8f927e]">Possible meal</p>
            <p className="mt-1 text-sm font-extrabold text-[#fff8e8]">{meal}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/decide-meal";
            }}
            className="mt-4 h-11 w-full rounded-2xl bg-[#d7f75b] px-4 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/15 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
          >
            Find meal ideas
          </button>
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-[#d7f75b]/15 bg-[#d7f75b]/[0.06] p-4">
          <h4 className="display-font text-xl font-extrabold">
            Nothing urgent
          </h4>

          <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
            Your pantry looks stable right now.
          </p>
        </div>
      )}

      {second.length > 0 && (
        <div className="mt-3 space-y-2">
          {second.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/70 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#fff8e8]">
                  {item.name}
                </p>

                <p className="text-xs font-bold text-[#8f927e]">Watch list</p>
              </div>

              <span className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-2.5 py-1 text-xs font-extrabold text-[#d7f75b]">
                {getExpiryInfo(item, settings).label}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function EmptyInventory({
  isPantryEmpty,
  hasActiveFilters,
  onAddItem,
  onClearFilters,
}) {
  if (isPantryEmpty) {
    return (
      <div className="w-full p-8 text-center md:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b] shadow-lg shadow-[#d7f75b]/10"
        >
          <Package size={34} />
        </motion.div>

        <h3 className="display-font text-3xl font-extrabold">
          Your pantry is empty
        </h3>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#b7b89f]">
          Add your first item so MealMind can suggest meals, track expiry dates,
          and help you avoid buying duplicates.
        </p>

        <button
          type="button"
          onClick={onAddItem}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
        >
          <Plus size={18} />
          Add first item
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-8 text-center md:p-12">
      <Package size={38} className="mx-auto mb-3 text-[#d7f75b]" />

      <h3 className="display-font text-2xl font-extrabold">
        No items match your filters
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#b7b89f]">
        Try changing the storage filter, category filter, expiry filter, or
        search term.
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-extrabold text-white transition hover:bg-white/10"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function InventoryTable({
  items,
  totalItems,
  hasActiveFilters,
  settings,
  onDelete,
  onUse,
  onAddItem,
  onClearFilters,
}) {
  const isPantryEmpty = totalItems === 0;

  return (
    <div className="hidden overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-[#171c12]/90 via-[#11160e]/90 to-[#0b0f09]/95 shadow-2xl shadow-black/20 lg:block">
      <div className="flex items-end justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
            <CalendarClock size={14} />
            Pantry stock
          </div>

          <h2 className="display-font text-2xl font-extrabold">
            Available ingredients
          </h2>

          <p className="mt-1 text-sm text-[#b7b89f]">
            Showing {items.length} pantry item{items.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-[#b7b89f] xl:block">
          Compact inventory view
        </div>
      </div>

      {items.length > 0 ? (
        <div className="max-h-[560px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[#10150d]/95 shadow-lg shadow-black/20 backdrop-blur-xl">
              <tr className="border-b border-white/10 text-left text-[11px] font-black uppercase tracking-wide text-[#8f927e]">
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Stored in</th>
                <th className="px-5 py-4">Expiry status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => {
                const expiryInfo = getExpiryInfo(item, settings);
                const statusStyles = getStatusStyles(expiryInfo.tone);
                const Icon = getCategoryIcon(item.category, item.name);
                const iconStyles = getCategoryIconStyles(item.category);

                const priorityStripe =
                  expiryInfo.tone === "danger"
                    ? "bg-red-300"
                    : expiryInfo.tone === "warning"
                    ? "bg-orange-300"
                    : expiryInfo.tone === "neutral"
                    ? "bg-sky-300"
                    : "bg-[#d7f75b]";

                const StatusIcon =
                  expiryInfo.tone === "danger"
                    ? AlertTriangle
                    : expiryInfo.tone === "warning"
                    ? Clock3
                    : expiryInfo.tone === "neutral"
                    ? Package
                    : Check;

                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.24,
                      ease: "easeOut",
                      delay: Math.min(index * 0.025, 0.18),
                    }}
                    className="group border-b border-white/[0.055] transition hover:bg-white/[0.035]"
                  >
                    <td className="relative px-5 py-4">
                      <div
                        className={`absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-r-full opacity-70 ${priorityStripe}`}
                      />

                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: -4, scale: 1.04 }}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${iconStyles}`}
                        >
                          <Icon size={18} />
                        </motion.div>

                        <div className="min-w-0">
                          <p className="truncate text-base font-extrabold text-[#fff8e8]">
                            {item.name}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-bold text-[#8f927e]">
                              {item.category}
                            </span>

                            <span className="h-1 w-1 rounded-full bg-[#6f725f]" />

                            <span className="text-xs font-bold text-[#6f725f]">
                              Inventory item
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-extrabold text-[#fff8e8] shadow-inner shadow-black/10">
                        <Package size={13} className="text-[#8f927e]" />
                        {item.quantity}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-extrabold text-[#c9cab3] shadow-inner shadow-black/10">
                        <MapPin size={13} className="text-[#8f927e]" />
                        {item.location}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-extrabold ${statusStyles}`}
                      >
                        <StatusIcon size={13} />
                        {expiryInfo.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onUse(item)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#d7f75b]/25 bg-[#d7f75b]/10 px-4 text-xs font-extrabold text-[#d7f75b] transition hover:-translate-y-0.5 hover:bg-[#d7f75b]/16 hover:shadow-lg hover:shadow-[#d7f75b]/10"
                        >
                          <Check size={13} />
                          Use
                        </motion.button>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onDelete(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-300/15 bg-red-400/10 text-red-300 transition hover:-translate-y-0.5 hover:bg-red-400/15 hover:shadow-lg hover:shadow-red-400/10"
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyInventory
          isPantryEmpty={isPantryEmpty}
          hasActiveFilters={hasActiveFilters}
          onAddItem={onAddItem}
          onClearFilters={onClearFilters}
        />
      )}
    </div>
  );
}

function MobileInventoryList({
  items,
  totalItems,
  hasActiveFilters,
  settings,
  onDelete,
  onUse,
  onAddItem,
  onClearFilters,
}) {
  const isPantryEmpty = totalItems === 0;

  return (
    <section className="rounded-[1.55rem] border border-white/10 bg-[#141811]/70 p-4 shadow-2xl shadow-black/15 lg:hidden">
      <div className="mb-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
          <CalendarClock size={14} />
          Pantry stock
        </div>

        <h2 className="display-font text-2xl font-extrabold">
          Available ingredients
        </h2>

        <p className="mt-1 text-sm text-[#b7b89f]">
          Showing {items.length} pantry item{items.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="space-y-2.5">
        {items.length > 0 ? (
          items.map((item) => {
            const expiryInfo = getExpiryInfo(item, settings);
            const statusStyles = getStatusStyles(expiryInfo.tone);
            const Icon = getCategoryIcon(item.category, item.name);
            const iconStyles = getCategoryIconStyles(item.category);

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.25rem] border border-white/10 bg-[#0f120c]/75 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconStyles}`}
                    >
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate display-font text-lg font-extrabold">
                        {item.name}
                      </h3>

                      <p className="text-xs font-bold text-[#8f927e]">
                        {item.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusStyles}`}
                    >
                      {expiryInfo.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-300/15 bg-red-400/10 text-red-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-extrabold">
                    <Package size={12} />
                    {item.quantity}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-extrabold">
                    <MapPin size={12} />
                    {item.location}
                  </span>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-extrabold">
                    {expiryInfo.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onUse(item)}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 text-xs font-extrabold text-[#d7f75b]"
                >
                  <Check size={13} />
                  Use item
                </button>
              </motion.article>
            );
          })
        ) : (
          <EmptyInventory
            isPantryEmpty={isPantryEmpty}
            hasActiveFilters={hasActiveFilters}
            onAddItem={onAddItem}
            onClearFilters={onClearFilters}
          />
        )}
      </div>
    </section>
  );
}

function Pantry() {
  const { user } = useAuth();
  const settings = useMemo(() => loadSettings(), []);

  const [items, setItems] = useState(() =>
    mergePantryItems(loadStorageArray(PANTRY_STORAGE_KEY, []))
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToUse, setItemToUse] = useState(null);
  const [locationFilter, setLocationFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [syncStatus, setSyncStatus] = useState("loading");

  async function fetchCloudPantry() {
    if (!user?.id) return;

    setSyncStatus("loading");

    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Pantry cloud fetch error:", error.message);
      setSyncStatus("error");
      showToast("Could not load pantry from cloud.");
      return;
    }

    const cloudItems = mergePantryItems((data || []).map(rowToPantryItem));
    setItems(cloudItems);
    savePantryItems(cloudItems);
    setSyncStatus("synced");
  }

  async function saveCloudPantry(nextItems) {
    if (!user?.id) {
      savePantryItems(nextItems);
      return;
    }

    setSyncStatus("saving");

    const cleanedItems = mergePantryItems(nextItems);

    const { error: deleteError } = await supabase
      .from("pantry_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Pantry cloud delete error:", deleteError.message);
      setSyncStatus("error");
      showToast("Could not update cloud pantry.");
      return;
    }

    if (cleanedItems.length > 0) {
      const rows = cleanedItems.map((item) => pantryItemToRow(item, user.id));

      const { error: insertError } = await supabase
        .from("pantry_items")
        .insert(rows);

      if (insertError) {
        console.error("Pantry cloud insert error:", insertError.message);
        setSyncStatus("error");
        showToast("Could not save pantry to cloud.");
        return;
      }
    }

    await fetchCloudPantry();
  }

  useEffect(() => {
    fetchCloudPantry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = items.length;

    const urgent = items.filter((item) => {
      const expiryInfo = getExpiryInfo(item, settings);
      return expiryInfo.tone === "danger" || expiryInfo.tone === "warning";
    }).length;

    const critical = items.filter((item) => {
      const expiryInfo = getExpiryInfo(item, settings);
      return expiryInfo.tone === "danger";
    }).length;

    const stocked = items.filter((item) => getExpiryValue(item) === null).length;

    return { total, urgent, critical, stocked };
  }, [items, settings]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const expiryInfo = getExpiryInfo(item, settings);

      const matchesLocation =
        locationFilter === "All" ||
        normalizeText(item.location) === normalizeText(locationFilter);

      const matchesCategory =
        categoryFilter === "All" ||
        normalizeText(item.category) === normalizeText(categoryFilter);

      const matchesExpiry =
        expiryStatusFilter === "All" ||
        (expiryStatusFilter === "Critical" &&
          expiryInfo.tone === "danger" &&
          expiryInfo.status !== "Expired") ||
        (expiryStatusFilter === "Use soon" && expiryInfo.tone === "warning") ||
        (expiryStatusFilter === "Fresh" && expiryInfo.tone === "good") ||
        (expiryStatusFilter === "Shelf stable" &&
          expiryInfo.tone === "neutral") ||
        (expiryStatusFilter === "Expired" && expiryInfo.status === "Expired");

      const matchesSearch =
        !searchTerm.trim() ||
        normalizeText(item.name).includes(normalizeText(searchTerm)) ||
        normalizeText(item.category).includes(normalizeText(searchTerm)) ||
        normalizeText(item.location).includes(normalizeText(searchTerm)) ||
        normalizeText(expiryInfo.label).includes(normalizeText(searchTerm)) ||
        normalizeText(expiryInfo.status).includes(normalizeText(searchTerm));

      return (
        matchesLocation && matchesCategory && matchesExpiry && matchesSearch
      );
    });
  }, [
    items,
    locationFilter,
    categoryFilter,
    expiryStatusFilter,
    searchTerm,
    settings,
  ]);

  const hasActiveFilters =
    locationFilter !== "All" ||
    categoryFilter !== "All" ||
    expiryStatusFilter !== "All" ||
    Boolean(searchTerm);

  async function updateItems(nextItems) {
    const cleanedItems = mergePantryItems(nextItems);
    setItems(cleanedItems);
    savePantryItems(cleanedItems);
    await saveCloudPantry(cleanedItems);
  }

  async function handleAddItem(item) {
    const cleanedItem = cleanPantryItem(item, items.length);

    const alreadyExists = items.some(
      (existing) =>
        normalizeText(existing.name) === normalizeText(cleanedItem.name)
    );

    if (alreadyExists) {
      const nextItems = items.map((existing) =>
        normalizeText(existing.name) === normalizeText(cleanedItem.name)
          ? {
              ...existing,
              quantity:
                existing.quantity === cleanedItem.quantity
                  ? existing.quantity
                  : `${existing.quantity}, ${cleanedItem.quantity}`,
              category: cleanedItem.category,
              location: cleanedItem.location,
              status: cleanedItem.status,
              expiryDays: cleanedItem.expiryDays,
              expiry: cleanedItem.expiry,
              daysUntilExpiry: cleanedItem.daysUntilExpiry,
              daysLeft: cleanedItem.daysLeft,
              expiryDate: cleanedItem.expiryDate,
              expireIn: cleanedItem.expireIn,
              updatedAt: new Date().toISOString(),
            }
          : existing
      );

      await updateItems(nextItems);
      showToast(`${cleanedItem.name} updated in pantry.`);
      return;
    }

    await updateItems([cleanedItem, ...items]);
    showToast(`${cleanedItem.name} added to pantry.`);
  }

  async function handleDeleteItem(id) {
    const targetItem = items.find((item) => item.id === id);
    await updateItems(items.filter((item) => item.id !== id));

    if (targetItem) {
      showToast(`${targetItem.name} removed from pantry.`);
    }
  }

  async function handleUseAll(id) {
    const targetItem = items.find((item) => item.id === id);
    await updateItems(items.filter((item) => item.id !== id));
    setItemToUse(null);

    if (targetItem) {
      showToast(`${targetItem.name} removed from pantry.`);
    }
  }

  async function handleUsePartial(id, preview) {
    const targetItem = items.find((item) => item.id === id);

    if (!targetItem) return;

    if (preview.removeItem) {
      await handleUseAll(id);
      return;
    }

    const nextItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: preview.nextQuantity,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    await updateItems(nextItems);
    setItemToUse(null);
    showToast(`${targetItem.name} quantity updated.`);
  }

  async function repairExpiryData() {
    const repaired = mergePantryItems(items);
    await updateItems(repaired);
    showToast("Pantry data cleaned and expiry dates repaired.");
  }

  function clearFilters() {
    setLocationFilter("All");
    setCategoryFilter("All");
    setExpiryStatusFilter("All");
    setSearchTerm("");
  }

  function openAddModal() {
    setShowAddModal(true);
  }

  return (
    <div className="pb-6">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold text-[#d7f75b]">Pantry</p>

          <h1 className="display-font text-4xl font-black tracking-tight md:text-5xl">
            Your kitchen inventory
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7b89f] md:text-base">
            Track what you already have without turning the pantry into a long,
            messy feed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CloudSyncBadge syncStatus={syncStatus} />

          <button
            type="button"
            onClick={repairExpiryData}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
          >
            Repair dates
          </button>

          <PremiumButton icon={Plus} onClick={openAddModal}>
            Add Item
          </PremiumButton>
        </div>
      </header>

      <PantryControlPanel
        stats={stats}
        settings={settings}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        expiryStatusFilter={expiryStatusFilter}
        setExpiryStatusFilter={setExpiryStatusFilter}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div>
          <InventoryTable
            items={filteredItems}
            totalItems={items.length}
            hasActiveFilters={hasActiveFilters}
            settings={settings}
            onDelete={handleDeleteItem}
            onUse={setItemToUse}
            onAddItem={openAddModal}
            onClearFilters={clearFilters}
          />

          <MobileInventoryList
            items={filteredItems}
            totalItems={items.length}
            hasActiveFilters={hasActiveFilters}
            settings={settings}
            onDelete={handleDeleteItem}
            onUse={setItemToUse}
            onAddItem={openAddModal}
            onClearFilters={clearFilters}
          />
        </div>

        <UseFirstPanel
          items={items}
          settings={settings}
          onAddItem={openAddModal}
        />
      </section>

      {showAddModal && (
        <AddPantryModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}

      {itemToUse && (
        <UseItemModal
          item={itemToUse}
          onClose={() => setItemToUse(null)}
          onUsePartial={handleUsePartial}
          onUseAll={handleUseAll}
        />
      )}
    </div>
  );
}
export default Pantry;