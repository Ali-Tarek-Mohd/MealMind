import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Cloud,
  Coins,
  Globe2,
  Loader2,
  PackageCheck,
  Plus,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumButton from "../components/ui/PremiumButton";
import { showToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const GROCERY_ITEMS_STORAGE_KEY = "mealmind_grocery_items";
const PLANNED_MEALS_STORAGE_KEY = "mealmind_planned_meals";
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

const currencyRatesFromKwd = {
  KWD: 1,
  USD: 3.25,
  EUR: 3.0,
  GBP: 2.55,
  AED: 11.94,
  SAR: 12.19,
  OMR: 1.25,
};

const currencySymbols = {
  KWD: "KWD",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  AED: "AED",
  SAR: "SAR",
  OMR: "OMR",
};

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
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

function saveGroceryItems(items) {
  localStorage.setItem(GROCERY_ITEMS_STORAGE_KEY, JSON.stringify(items));
}

function savePantryItems(items) {
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
}

function loadPantryItems() {
  return loadStorageArray(PANTRY_STORAGE_KEY, []);
}

function convertFromKwd(value, currency = "KWD") {
  const rate = currencyRatesFromKwd[currency] ?? 1;
  return Number(value || 0) * rate;
}

function formatPrice(value, currency = "KWD") {
  const convertedValue = convertFromKwd(value, currency);
  const label = currencySymbols[currency] || currency || "KWD";

  return `${convertedValue.toFixed(3)} ${label}`;
}

function getBaseKwdPrice(item) {
  const rawPrice = Number(
    item.estimatedPriceKwd ??
      item.priceKwd ??
      item.basePriceKwd ??
      item.estimatedPrice ??
      item.price ??
      item.cost ??
      item.value ??
      0
  );

  if (!Number.isFinite(rawPrice)) {
    return 0;
  }

  return rawPrice;
}

function inferCategory(name, fallbackCategory = "Other") {
  const normalized = normalizeText(name);

  const categoryRules = [
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
        "wraps",
        "wrap",
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
        "corn",
        "avocado",
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
        "kabsa",
        "biryani",
        "seasoning",
        "herbs",
        "cardamom",
      ],
    },
    {
      category: "Pantry",
      words: [
        "olive oil",
        "sesame oil",
        "soy sauce",
        "vinegar",
        "honey",
        "sugar",
        "peanut butter",
        "tahini",
        "sauce",
      ],
    },
  ];

  const match = categoryRules.find((rule) =>
    rule.words.some((word) => normalized.includes(word))
  );

  if (match) {
    return match.category;
  }

  if (fallbackCategory === "Meal ingredient") {
    return "Other";
  }

  return fallbackCategory || "Other";
}

function inferLocation(category, name) {
  const normalizedCategory = normalizeText(category);
  const normalizedName = normalizeText(name);

  if (
    normalizedCategory.includes("protein") ||
    normalizedCategory.includes("dairy") ||
    normalizedName.includes("milk") ||
    normalizedName.includes("cheese") ||
    normalizedName.includes("butter") ||
    normalizedName.includes("yogurt")
  ) {
    return "Fridge";
  }

  if (
    normalizedCategory.includes("spice") ||
    normalizedName.includes("paprika") ||
    normalizedName.includes("cumin") ||
    normalizedName.includes("pepper") ||
    normalizedName.includes("cinnamon")
  ) {
    return "Spices";
  }

  if (
    normalizedCategory.includes("pantry") ||
    normalizedCategory.includes("carb") ||
    normalizedName.includes("rice") ||
    normalizedName.includes("pasta") ||
    normalizedName.includes("oil") ||
    normalizedName.includes("sauce") ||
    normalizedName.includes("honey")
  ) {
    return "Pantry";
  }

  return "Fridge";
}

function inferStatus(category, name) {
  const normalizedCategory = normalizeText(category);
  const normalizedName = normalizeText(name);

  if (
    normalizedCategory.includes("spice") ||
    normalizedCategory.includes("pantry") ||
    normalizedName.includes("oil") ||
    normalizedName.includes("paprika") ||
    normalizedName.includes("cumin") ||
    normalizedName.includes("rice") ||
    normalizedName.includes("pasta")
  ) {
    return "Stocked";
  }

  return "Fresh";
}

function getDefaultExpiryDays(category, name) {
  const normalizedCategory = normalizeText(category);
  const normalizedName = normalizeText(name);

  if (
    normalizedCategory.includes("spice") ||
    normalizedName.includes("paprika") ||
    normalizedName.includes("cumin") ||
    normalizedName.includes("black pepper") ||
    normalizedName.includes("cinnamon") ||
    normalizedName.includes("seasoning")
  ) {
    return null;
  }

  if (
    normalizedCategory.includes("pantry") ||
    normalizedName.includes("olive oil") ||
    normalizedName.includes("oil") ||
    normalizedName.includes("soy sauce") ||
    normalizedName.includes("vinegar") ||
    normalizedName.includes("honey") ||
    normalizedName.includes("sugar") ||
    normalizedName.includes("rice") ||
    normalizedName.includes("pasta") ||
    normalizedName.includes("flour") ||
    normalizedName.includes("oats") ||
    normalizedName.includes("cereal")
  ) {
    return null;
  }

  if (
    normalizedName.includes("onion") ||
    normalizedName.includes("garlic") ||
    normalizedName.includes("potato")
  ) {
    return 21;
  }

  if (
    normalizedName.includes("lettuce") ||
    normalizedName.includes("bell pepper") ||
    normalizedName.includes("tomato") ||
    normalizedName.includes("cucumber") ||
    normalizedName.includes("broccoli") ||
    normalizedName.includes("spinach")
  ) {
    return 7;
  }

  if (
    normalizedCategory.includes("fruit") ||
    normalizedName.includes("banana") ||
    normalizedName.includes("apple") ||
    normalizedName.includes("orange") ||
    normalizedName.includes("berries")
  ) {
    return 6;
  }

  if (
    normalizedCategory.includes("dairy") ||
    normalizedName.includes("milk") ||
    normalizedName.includes("cheese") ||
    normalizedName.includes("yogurt") ||
    normalizedName.includes("butter")
  ) {
    return 10;
  }

  if (
    normalizedCategory.includes("protein") ||
    normalizedName.includes("chicken") ||
    normalizedName.includes("beef") ||
    normalizedName.includes("fish") ||
    normalizedName.includes("salmon") ||
    normalizedName.includes("shrimp")
  ) {
    return 3;
  }

  if (normalizedName.includes("tuna")) {
    return 365;
  }

  return 7;
}

function getDateFromDays(days) {
  if (days === null || days === undefined || days === "") return "";

  const date = new Date();
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

function calculateDaysFromDate(dateValue) {
  if (!dateValue) return null;

  const today = new Date();
  const expiryDate = new Date(dateValue);

  if (!Number.isFinite(expiryDate.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
}

function getExpiryValue(item) {
  const possibleValues = [
    item.expiryDays,
    item.daysLeft,
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
    !Number.isNaN(Date.parse(item.expiryDate))
  ) {
    return calculateDaysFromDate(item.expiryDate);
  }

  return getDefaultExpiryDays(item.category, item.name);
}

function getItemName(item) {
  return (
    item.name ||
    item.ingredient ||
    item.itemName ||
    item.label ||
    item.title ||
    "Unnamed item"
  );
}

function getItemQuantity(item) {
  return item.quantity || item.package || item.amount || item.qty || "1 item";
}

function getItemSource(item) {
  return (
    item.neededFor ||
    item.mealName ||
    item.source ||
    item.meal ||
    item.recipe ||
    "Manual item"
  );
}

function cleanGroceryItem(item, index = 0) {
  const name = getItemName(item);
  const neededFor = getItemSource(item);
  const priceKwd = getBaseKwdPrice(item);
  const category = inferCategory(name, item.category);

  return {
    id: item.id ?? `grocery-${index}-${Date.now()}`,
    name,
    quantity: getItemQuantity(item),
    category,
    neededFor,
    source: neededFor,
    priority:
      item.priority === "Medium" || item.priority === "High"
        ? "Needed"
        : item.priority || "Needed",
    estimatedPrice: priceKwd,
    price: priceKwd,
    estimatedPriceKwd: priceKwd,
    priceKwd,
    currency: "KWD",
    checked: Boolean(item.checked ?? item.completed ?? item.bought),
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
  };
}

function mergeDuplicateItems(items) {
  const map = new Map();

  items.forEach((rawItem, index) => {
    const item = cleanGroceryItem(rawItem, index);
    const key = `${normalizeText(item.name)}-${normalizeText(item.neededFor)}`;

    if (!map.has(key)) {
      map.set(key, item);
      return;
    }

    const existing = map.get(key);
    const existingPrice = Number(
      existing.estimatedPriceKwd || existing.priceKwd || 0
    );
    const itemPrice = Number(item.estimatedPriceKwd || item.priceKwd || 0);
    const selectedPrice = Math.max(existingPrice, itemPrice);

    map.set(key, {
      ...existing,
      estimatedPrice: selectedPrice,
      price: selectedPrice,
      estimatedPriceKwd: selectedPrice,
      priceKwd: selectedPrice,
      currency: "KWD",
      checked: existing.checked || item.checked,
      quantity:
        existing.quantity === item.quantity
          ? existing.quantity
          : `${existing.quantity}, ${item.quantity}`,
      updatedAt: new Date().toISOString(),
    });
  });

  return Array.from(map.values());
}

function getCleanPantryItem(item, index = 0) {
  const name = getItemName(item);
  const category = inferCategory(name, item.category);
  const location = item.location || inferLocation(category, name);
  const status = item.status || inferStatus(category, name);
  const expiryDays = getExpiryValue({
    ...item,
    name,
    category,
  });
  const expiryDate =
    item.expiryDate && !Number.isNaN(Date.parse(item.expiryDate))
      ? item.expiryDate
      : getDateFromDays(expiryDays);

  return {
    id: item.id ?? `pantry-${index}-${Date.now()}`,
    name,
    quantity: getItemQuantity(item),
    category,
    location,
    status,
    expiryDays,
    expiry: expiryDays,
    daysUntilExpiry: expiryDays,
    daysLeft: expiryDays,
    expiryDate,
    expireIn: expiryDays,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
  };
}

function mergePantryItems(items) {
  const map = new Map();

  items.forEach((item, index) => {
    const cleaned = getCleanPantryItem(item, index);
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

    map.set(key, {
      ...existing,
      ...cleaned,
      id: existing.id,
      quantity:
        existing.quantity === cleaned.quantity
          ? existing.quantity
          : `${existing.quantity}, ${cleaned.quantity}`,
      updatedAt: new Date().toISOString(),
    });
  });

  return Array.from(map.values());
}

function rowToGroceryItem(row) {
  const data = row.data || {};

  return cleanGroceryItem({
    ...data,
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category,
    neededFor: row.needed_for,
    source: row.needed_for,
    priority: row.priority,
    checked: row.checked,
    estimatedPriceKwd: Number(row.estimated_price_kwd || 0),
    priceKwd: Number(row.estimated_price_kwd || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function groceryItemToRow(item, userId) {
  const cleaned = cleanGroceryItem(item);

  return {
    user_id: userId,
    name: cleaned.name,
    quantity: cleaned.quantity,
    category: cleaned.category,
    needed_for: cleaned.neededFor,
    priority: cleaned.priority,
    checked: cleaned.checked,
    estimated_price_kwd: Number(cleaned.estimatedPriceKwd || 0),
    data: {
      ...cleaned,
      localId: cleaned.id,
    },
  };
}

function rowToPantryItem(row) {
  const data = row.data || {};

  return getCleanPantryItem({
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
  });
}

function pantryItemToRow(item, userId) {
  const cleaned = getCleanPantryItem(item);

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

function getCategoryColor(category) {
  const normalized = normalizeText(category);

  if (normalized.includes("protein")) {
    return "bg-red-400/12 text-red-300 border-red-300/20";
  }

  if (normalized.includes("vegetable")) {
    return "bg-[#d7f75b]/12 text-[#d7f75b] border-[#d7f75b]/20";
  }

  if (normalized.includes("fruit")) {
    return "bg-orange-400/12 text-orange-300 border-orange-300/20";
  }

  if (normalized.includes("dairy")) {
    return "bg-sky-400/12 text-sky-300 border-sky-300/20";
  }

  if (normalized.includes("carb")) {
    return "bg-yellow-400/12 text-yellow-300 border-yellow-300/20";
  }

  if (normalized.includes("spice")) {
    return "bg-purple-400/12 text-purple-300 border-purple-300/20";
  }

  if (normalized.includes("pantry")) {
    return "bg-amber-400/12 text-amber-300 border-amber-300/20";
  }

  return "bg-white/[0.06] text-[#c9cab3] border-white/10";
}

function isPantryItemAvailable(pantryItem) {
  const status = normalizeText(pantryItem.status);
  const quantityText = normalizeText(pantryItem.quantity);
  const numericQuantity = Number.parseFloat(quantityText);

  if (status === "out of stock") {
    return false;
  }

  if (!Number.isNaN(numericQuantity) && numericQuantity <= 0) {
    return false;
  }

  return true;
}

function groupItemsByMeal(items) {
  const groups = items.reduce((grouped, item) => {
    const key = item.neededFor || item.source || "Manual item";

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(item);
    return grouped;
  }, {});

  return Object.entries(groups).map(([mealName, mealItems]) => ({
    mealName,
    items: mealItems,
    total: mealItems.reduce(
      (sum, item) =>
        sum + (Number(item.estimatedPriceKwd || item.priceKwd) || 0),
      0
    ),
    bought: mealItems.filter((item) => item.checked).length,
  }));
}

function CloudSyncBadge({ syncStatus }) {
  const statusContent = {
    loading: {
      label: "Loading cloud list",
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

function SettingsStrip({ settings, isEmpty, syncStatus }) {
  if (isEmpty) {
    return (
      <div className="mb-5 flex justify-end">
        <CloudSyncBadge syncStatus={syncStatus} />
      </div>
    );
  }

  return (
    <PremiumCard className="mb-5 p-5" hover={false}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            <SlidersHorizontal size={15} />
            Settings-aware shopping
          </div>

          <h2 className="display-font text-2xl font-extrabold">
            Grocery prices are stored in KWD and converted for display
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#b7b89f]">
            This prevents wrong prices like showing 0.850 KWD as 0.850 USD.
            Your selected currency changes the displayed value using a simple
            local conversion.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4 xl:w-[620px]">
          <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-sky-300">
              <Globe2 size={14} />
              Region
            </div>
            <p className="text-sm font-extrabold text-[#fff8e8]">
              {settings.region}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#d7f75b]">
              <Wallet size={14} />
              Currency
            </div>
            <p className="text-sm font-extrabold text-[#fff8e8]">
              {settings.currency}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-orange-300">
              <Coins size={14} />
              Budget
            </div>
            <p className="text-sm font-extrabold text-[#fff8e8]">
              {settings.budgetMode}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#d7f75b]">
              <Cloud size={14} />
              Cloud
            </div>
            <p className="text-sm font-extrabold text-[#fff8e8]">
              {syncStatus === "synced"
                ? "Synced"
                : syncStatus === "saving"
                ? "Saving"
                : syncStatus === "loading"
                ? "Loading"
                : "Issue"}
            </p>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}

function AddGroceryModal({ onClose, onAdd, existingPantryItems }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1 item");
  const [neededFor, setNeededFor] = useState("");
  const [category, setCategory] = useState("Protein");
  const [priority, setPriority] = useState("Needed");

  const existingPantryItem = existingPantryItems.find(
    (item) =>
      normalizeText(item.name) === normalizeText(name) &&
      isPantryItemAvailable(item)
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      showToast("Enter an item name first.");
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      quantity: quantity.trim() || "1 item",
      category,
      neededFor: neededFor.trim() || "Manual item",
      source: neededFor.trim() || "Manual item",
      priority,
      estimatedPrice: 0,
      price: 0,
      estimatedPriceKwd: 0,
      priceKwd: 0,
      currency: "KWD",
      checked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1f14] via-[#13170f] to-[#0d100a] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-sky-400/12 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-extrabold text-sky-300">
                <ShoppingBasket size={14} />
                Grocery item
              </div>

              <h2 className="display-font text-3xl font-extrabold">
                Add item to shopping list
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                Add only what you need. MealMind will include it in your
                checklist.
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

          <div className="space-y-4">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
              <label className="mb-2 block text-sm font-extrabold">
                Item name
              </label>

              <input
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);

                  if (nextName.trim()) {
                    setCategory(inferCategory(nextName, category));
                  }
                }}
                placeholder="Example: Rice"
                className="w-full rounded-2xl border border-white/10 bg-[#0b0e09] px-4 py-3 font-bold outline-none placeholder:text-[#70735f] focus:border-sky-300/40"
              />

              {existingPantryItem && (
                <div className="mt-3 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-3 text-sm leading-6 text-orange-200">
                  <span className="font-extrabold">Notice:</span> You already
                  have {existingPantryItem.quantity} of {existingPantryItem.name}{" "}
                  in your pantry.
                </div>
              )}
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
              <label className="mb-2 block text-sm font-extrabold">
                Quantity
              </label>

              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Example: 500g, 1 pack, 6 eggs"
                className="w-full rounded-2xl border border-white/10 bg-[#0b0e09] px-4 py-3 font-bold outline-none placeholder:text-[#70735f] focus:border-sky-300/40"
              />
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
              <label className="mb-2 block text-sm font-extrabold">
                Needed for
              </label>

              <input
                value={neededFor}
                onChange={(event) => setNeededFor(event.target.value)}
                placeholder="Example: Chicken Wrap"
                className="w-full rounded-2xl border border-white/10 bg-[#0b0e09] px-4 py-3 font-bold outline-none placeholder:text-[#70735f] focus:border-sky-300/40"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
                <p className="mb-3 text-sm font-extrabold">Category</p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Protein",
                    "Vegetable",
                    "Fruit",
                    "Carbs",
                    "Dairy",
                    "Spice",
                    "Pantry",
                    "Drink",
                    "Other",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`rounded-2xl px-3 py-2 text-xs font-extrabold transition ${
                        category === item
                          ? "bg-[#d7f75b] text-[#10120c]"
                          : "bg-[#0b0e09] text-[#c9cab3] hover:bg-white/[0.07]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
                <p className="mb-3 text-sm font-extrabold">Priority</p>

                <div className="flex flex-wrap gap-2">
                  {["Needed", "Optional"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPriority(item)}
                      className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
                        priority === item
                          ? "bg-[#d7f75b] text-[#10120c]"
                          : "bg-[#0b0e09] text-[#c9cab3] hover:bg-white/[0.07]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-sm leading-6 text-[#8f927e]">
                  Needed items should be bought first. Optional items are nice to
                  have but not urgent.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              Add Item
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}

function GroceryRow({ item, currency, onToggle, onDelete }) {
  const categoryColor = getCategoryColor(item.category);

  function handleDeleteClick(event) {
    event.stopPropagation();
    onDelete(item.id);
  }

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.992 }}
      onClick={() => onToggle(item.id)}
      className={`group grid w-full grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border px-3 py-3 text-left transition sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-4 ${
        item.checked
          ? "border-[#d7f75b]/25 bg-[#d7f75b]/10"
          : "border-white/10 bg-[#10140e]/75 hover:border-white/20 hover:bg-white/[0.055]"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${
          item.checked
            ? "border-[#d7f75b]/30 bg-[#d7f75b] text-[#10120c]"
            : "border-white/10 bg-white/[0.05] text-[#c9cab3] group-hover:bg-white/[0.08]"
        }`}
      >
        {item.checked ? <Check size={19} /> : <ShoppingBasket size={18} />}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4
            className={`display-font text-lg font-extrabold ${
              item.checked
                ? "text-[#d7f75b] line-through decoration-2"
                : "text-[#fff8e8]"
            }`}
          >
            {item.name}
          </h4>

          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${categoryColor}`}
          >
            {item.category}
          </span>

          {item.checked && (
            <span className="rounded-full bg-[#d7f75b]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#d7f75b]">
              Bought
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-[#8f927e]">
          <span>{item.quantity}</span>
          <span className="text-white/20">•</span>
          <span>For {item.neededFor}</span>
          <span className="text-white/20">•</span>
          <span>{item.priority}</span>
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
        {item.estimatedPriceKwd > 0 && (
          <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-extrabold text-[#c9cab3]">
            {formatPrice(item.estimatedPriceKwd, currency)}
          </span>
        )}

        <button
          type="button"
          onClick={handleDeleteClick}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-300/10 bg-red-400/10 text-red-300 opacity-80 transition hover:bg-red-400/15 hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.button>
  );
}

function MealSection({ group, currency, onToggle, onDelete }) {
  const progress =
    group.items.length > 0
      ? Math.round((group.bought / group.items.length) * 100)
      : 0;

  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
            <Sparkles size={13} />
            Needed for
          </div>

          <h3 className="display-font text-2xl font-extrabold">
            {group.mealName}
          </h3>

          <p className="mt-1 text-sm text-[#8f927e]">
            {group.bought}/{group.items.length} bought ·{" "}
            {formatPrice(group.total, currency)} estimated
          </p>
        </div>

        <div className="min-w-[160px]">
          <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-[#8f927e]">
            <span>Progress</span>
            <span className="text-[#d7f75b]">{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#0f120c]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full rounded-full bg-[#d7f75b]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {group.items.map((item) => (
          <GroceryRow
            key={item.id}
            item={item}
            currency={currency}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function DoNotBuyStrip({ items }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 rounded-[1.5rem] border border-orange-300/15 bg-orange-400/[0.08] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-orange-300">
            <AlertTriangle size={17} />
            <h3 className="display-font font-extrabold">
              Check your pantry first
            </h3>
          </div>

          <p className="text-sm leading-6 text-[#c9cab3]">
            You already have{" "}
            <span className="font-extrabold text-white">
              {items.map((item) => item.name).join(", ")}
            </span>{" "}
            available, so you may not need to buy them again.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-extrabold text-orange-300">
          {items.length} warning{items.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function MissionHeader({
  boughtCount,
  totalCount,
  estimatedLeft,
  currency,
  onReset,
  onAddItem,
  onMoveBought,
}) {
  const progress =
    totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  return (
    <PremiumCard className="mb-5 overflow-hidden p-0" hover={false}>
      <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#d7f75b]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            <ShoppingBasket size={15} />
            Today’s shopping mission
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="display-font text-3xl font-extrabold md:text-4xl">
                {boughtCount}/{totalCount} items bought
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                Tap any item row to mark it as bought. Then move bought items
                into your pantry.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Estimated left
              </p>

              <p className="display-font text-2xl font-extrabold text-[#d7f75b]">
                {formatPrice(estimatedLeft, currency)}
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#0f120c]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="h-full rounded-full bg-[#d7f75b] shadow-lg shadow-[#d7f75b]/30"
            />
          </div>
        </div>

        <div className="relative flex flex-wrap gap-3 lg:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
          >
            Reset list
          </button>

          <button
            type="button"
            onClick={onMoveBought}
            disabled={boughtCount === 0}
            className="rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-5 py-3 text-sm font-extrabold text-[#d7f75b] transition hover:bg-[#d7f75b]/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Move bought to pantry
          </button>

          <PremiumButton icon={Plus} onClick={onAddItem}>
            Add Item
          </PremiumButton>
        </div>
      </div>
    </PremiumCard>
  );
}

function EmptyGroceryState({ onAddItem, onOpenDecideMeal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[1.8rem] border border-[#d7f75b]/15 bg-gradient-to-br from-[#1d2315]/90 via-[#141811]/90 to-[#0d100a]/95 p-8 text-center shadow-2xl shadow-black/20"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b] shadow-lg shadow-[#d7f75b]/10">
          <PackageCheck size={34} />
        </div>

        <h3 className="display-font text-3xl font-extrabold">
          Your shopping list is empty
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#b7b89f]">
          Add an item manually, or choose a meal and send its missing
          ingredients here.
        </p>

        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
          >
            <Plus size={18} />
            Add item
          </button>

          <button
            type="button"
            onClick={onOpenDecideMeal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <Sparkles size={18} />
            Open Decide Meal
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ShoppingBasket size={20} className="mx-auto mb-3 text-[#d7f75b]" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Add missing food
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Keep shopping simple.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <CheckCircle2 size={20} className="mx-auto mb-3 text-sky-300" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Mark bought
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Track what is done.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <PackageCheck size={20} className="mx-auto mb-3 text-orange-300" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Move to pantry
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Bought items become stock.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickSummaryPanel({
  activeItems,
  completedItems,
  estimatedLeft,
  currency,
}) {
  return (
    <PremiumCard className="p-5" hover={false}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
          <CheckCircle2 size={21} />
        </div>

        <div>
          <h3 className="display-font text-xl font-extrabold">Quick summary</h3>
          <p className="text-sm text-[#8f927e]">Your shopping state.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <span className="text-sm font-bold text-[#8f927e]">Left</span>
          <span className="display-font text-xl font-extrabold">
            {activeItems.length}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <span className="text-sm font-bold text-[#8f927e]">Bought</span>
          <span className="display-font text-xl font-extrabold text-[#d7f75b]">
            {completedItems.length}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <span className="text-sm font-bold text-[#8f927e]">Cost left</span>
          <span className="display-font text-xl font-extrabold text-[#d7f75b]">
            {formatPrice(estimatedLeft, currency)}
          </span>
        </div>
      </div>
    </PremiumCard>
  );
}

function MealBreakdownPanel({ mealGroups, currency }) {
  return (
    <PremiumCard className="p-5" hover={false}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/12 text-sky-300">
          <Coins size={21} />
        </div>

        <div>
          <h3 className="display-font text-xl font-extrabold">By meal</h3>
          <p className="text-sm text-[#8f927e]">Cost breakdown.</p>
        </div>
      </div>

      <div className="space-y-2">
        {mealGroups.length > 0 ? (
          mealGroups.map((group) => (
            <div
              key={group.mealName}
              className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-[#fff8e8]">
                  {group.mealName}
                </p>

                <span className="text-sm font-extrabold text-[#d7f75b]">
                  {formatPrice(group.total, currency)}
                </span>
              </div>

              <p className="mt-1 text-xs font-bold text-[#8f927e]">
                {group.bought}/{group.items.length} bought
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#b7b89f]">
            No meal groups yet.
          </p>
        )}
      </div>
    </PremiumCard>
  );
}

function EmptySidePanel() {
  return (
    <PremiumCard className="p-5" hover={false}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
          <Sparkles size={21} />
        </div>

        <div>
          <h3 className="display-font text-xl font-extrabold">
            What happens next?
          </h3>
          <p className="text-sm text-[#8f927e]">How this page helps.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-extrabold text-[#fff8e8]">
            1. Add or receive missing items
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8f927e]">
            Items can be added manually or from meal recommendations.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-extrabold text-[#fff8e8]">
            2. Mark them bought
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8f927e]">
            Tap an item once you buy it.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-extrabold text-[#fff8e8]">
            3. Move bought items to pantry
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8f927e]">
            Your shopping becomes pantry stock.
          </p>
        </div>
      </div>
    </PremiumCard>
  );
}

function GroceryList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useMemo(() => loadSettings(), []);
  const currency = settings.currency || "KWD";

  const [items, setItems] = useState(() =>
    mergeDuplicateItems(loadStorageArray(GROCERY_ITEMS_STORAGE_KEY, []))
  );
  const [pantry, setPantry] = useState(() =>
    mergePantryItems(loadPantryItems())
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState("loading");

  async function fetchCloudPantry() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Grocery pantry fetch error:", error.message);
      return;
    }

    const cloudPantry = mergePantryItems((data || []).map(rowToPantryItem));
    setPantry(cloudPantry);
    savePantryItems(cloudPantry);
  }

  async function fetchCloudGrocery() {
    if (!user?.id) return;

    setSyncStatus("loading");

    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Grocery cloud fetch error:", error.message);
      setSyncStatus("error");
      showToast("Could not load grocery list from cloud.");
      return;
    }

    const cloudItems = mergeDuplicateItems((data || []).map(rowToGroceryItem));
    setItems(cloudItems);
    saveGroceryItems(cloudItems);
    setSyncStatus("synced");
  }

  async function saveCloudGrocery(nextItems) {
    if (!user?.id) {
      saveGroceryItems(nextItems);
      return true;
    }

    setSyncStatus("saving");

    const cleanedItems = mergeDuplicateItems(nextItems);

    const { error: deleteError } = await supabase
      .from("grocery_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Grocery cloud delete error:", deleteError.message);
      setSyncStatus("error");
      showToast("Could not update cloud grocery list.");
      return false;
    }

    if (cleanedItems.length > 0) {
      const rows = cleanedItems.map((item) => groceryItemToRow(item, user.id));

      const { error: insertError } = await supabase
        .from("grocery_items")
        .insert(rows);

      if (insertError) {
        console.error("Grocery cloud insert error:", insertError.message);
        setSyncStatus("error");
        showToast("Could not save grocery list to cloud.");
        return false;
      }
    }

    setSyncStatus("synced");
    return true;
  }

  async function saveCloudPantry(nextPantry) {
    if (!user?.id) {
      savePantryItems(nextPantry);
      return true;
    }

    const cleanedPantry = mergePantryItems(nextPantry);

    const { error: deleteError } = await supabase
      .from("pantry_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Pantry cloud delete from grocery error:", deleteError.message);
      showToast("Could not update cloud pantry.");
      return false;
    }

    if (cleanedPantry.length > 0) {
      const rows = cleanedPantry.map((item) => pantryItemToRow(item, user.id));

      const { error: insertError } = await supabase
        .from("pantry_items")
        .insert(rows);

      if (insertError) {
        console.error(
          "Pantry cloud insert from grocery error:",
          insertError.message
        );
        showToast("Could not move bought items to cloud pantry.");
        return false;
      }
    }

    return true;
  }

  useEffect(() => {
    fetchCloudGrocery();
    fetchCloudPantry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const activeItems = items.filter((item) => !item.checked);
  const completedItems = items.filter((item) => item.checked);
  const isEmpty = items.length === 0;

  const estimatedLeft = activeItems.reduce(
    (sum, item) => sum + (Number(item.estimatedPriceKwd || item.priceKwd) || 0),
    0
  );

  const doNotBuyItems = pantry.filter(
    (pantryItem) =>
      isPantryItemAvailable(pantryItem) &&
      activeItems.some(
        (groceryItem) =>
          normalizeText(groceryItem.name) === normalizeText(pantryItem.name)
      )
  );

  const mealGroups = useMemo(() => {
    const grouped = groupItemsByMeal(items);

    if (settings.groceryAutoGroup === false) {
      return [
        {
          mealName: "Shopping list",
          items,
          total: items.reduce(
            (sum, item) =>
              sum + (Number(item.estimatedPriceKwd || item.priceKwd) || 0),
            0
          ),
          bought: items.filter((item) => item.checked).length,
        },
      ].filter((group) => group.items.length > 0);
    }

    return grouped;
  }, [items, settings.groceryAutoGroup]);

  async function updateItems(nextItems) {
    const cleanedItems = mergeDuplicateItems(nextItems);

    setItems(cleanedItems);
    saveGroceryItems(cleanedItems);
    await saveCloudGrocery(cleanedItems);
  }

  async function resetGroceryData() {
    localStorage.setItem(PLANNED_MEALS_STORAGE_KEY, JSON.stringify([]));
    await updateItems([]);
    showToast("Grocery list reset.");
  }

  async function handleAddItem(item) {
    const cleanedItem = cleanGroceryItem(item, items.length);

    const alreadyExists = items.some(
      (existing) =>
        normalizeText(existing.name) === normalizeText(cleanedItem.name) &&
        normalizeText(existing.neededFor) === normalizeText(cleanedItem.neededFor)
    );

    if (alreadyExists) {
      showToast(`${cleanedItem.name} is already in your shopping list.`);
      return;
    }

    await updateItems([cleanedItem, ...items]);
    showToast(`${cleanedItem.name} added to your shopping list.`);
  }

  async function handleToggleItem(id) {
    const nextItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            checked: !item.checked,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    await updateItems(nextItems);
  }

  async function handleDeleteItem(id) {
    const targetItem = items.find((item) => item.id === id);
    const nextItems = items.filter((item) => item.id !== id);

    await updateItems(nextItems);

    if (targetItem) {
      showToast(`${targetItem.name} removed from shopping list.`);
    }
  }

  async function moveBoughtItemsToPantry() {
    if (completedItems.length === 0) {
      showToast("Mark items as bought first.");
      return;
    }

    const currentPantry = mergePantryItems(loadPantryItems());
    const nextPantry = [...currentPantry];

    completedItems.forEach((groceryItem) => {
      const existingIndex = nextPantry.findIndex(
        (pantryItem) =>
          normalizeText(pantryItem.name) === normalizeText(groceryItem.name)
      );

      const category = inferCategory(groceryItem.name, groceryItem.category);
      const location = inferLocation(category, groceryItem.name);
      const status = inferStatus(category, groceryItem.name);
      const expiryDays = getDefaultExpiryDays(category, groceryItem.name);
      const expiryDate = getDateFromDays(expiryDays);

      const pantryPayload = {
        name: groceryItem.name,
        quantity: groceryItem.quantity,
        category,
        location,
        status,
        expiryDays,
        expiry: expiryDays,
        daysUntilExpiry: expiryDays,
        daysLeft: expiryDays,
        expiryDate,
        expireIn: expiryDays,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        nextPantry[existingIndex] = {
          ...nextPantry[existingIndex],
          ...pantryPayload,
        };
      } else {
        nextPantry.unshift({
          id: `pantry-${crypto.randomUUID()}`,
          ...pantryPayload,
          createdAt: new Date().toISOString(),
        });
      }
    });

    const cleanedPantry = mergePantryItems(nextPantry);
    savePantryItems(cleanedPantry);
    setPantry(cleanedPantry);

    const pantrySaved = await saveCloudPantry(cleanedPantry);

    if (!pantrySaved) {
      return;
    }

    const remainingItems = items.filter((item) => !item.checked);
    await updateItems(remainingItems);

    showToast(`${completedItems.length} bought item(s) moved to pantry.`);
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Grocery List"
        title="Shopping checklist"
        description="Buy only what you need. MealMind checks your pantry first so you avoid duplicate purchases."
      />

      <SettingsStrip
        settings={settings}
        isEmpty={isEmpty}
        syncStatus={syncStatus}
      />

      {!isEmpty && (
        <MissionHeader
          boughtCount={completedItems.length}
          totalCount={items.length}
          estimatedLeft={estimatedLeft}
          currency={currency}
          onReset={resetGroceryData}
          onAddItem={() => setShowAddModal(true)}
          onMoveBought={moveBoughtItemsToPantry}
        />
      )}

      <DoNotBuyStrip items={doNotBuyItems} />

      <section className="grid gap-5 xl:grid-cols-[1fr_0.32fr]">
        <PremiumCard className="p-5" hover={false}>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-sm font-extrabold text-sky-300">
                <ShoppingBasket size={15} />
                Shopping checklist
              </div>

              <h2 className="display-font text-2xl font-extrabold">
                {isEmpty
                  ? "Start your shopping list"
                  : settings.groceryAutoGroup === false
                  ? "Shopping list"
                  : "Items grouped by meal"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
                {isEmpty
                  ? "Add items manually or send missing ingredients here from Decide Meal."
                  : settings.groceryAutoGroup === false
                  ? "Auto-grouping is turned off in Settings, so all items appear in one checklist."
                  : "Ingredients from Meal History and Dashboard are cleaned, grouped, and checked for duplicates."}
              </p>
            </div>

            {!isEmpty && (
              <div className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-4 py-2 text-xs font-extrabold text-[#d7f75b]">
                {completedItems.length}/{items.length} bought
              </div>
            )}
          </div>

          <div className="space-y-4">
            {mealGroups.length > 0 ? (
              mealGroups.map((group) => (
                <MealSection
                  key={group.mealName}
                  group={group}
                  currency={currency}
                  onToggle={handleToggleItem}
                  onDelete={handleDeleteItem}
                />
              ))
            ) : (
              <EmptyGroceryState
                onAddItem={() => setShowAddModal(true)}
                onOpenDecideMeal={() => navigate("/decide-meal")}
              />
            )}
          </div>
        </PremiumCard>

        <div className="space-y-5">
          {isEmpty ? (
            <EmptySidePanel />
          ) : (
            <>
              <QuickSummaryPanel
                activeItems={activeItems}
                completedItems={completedItems}
                estimatedLeft={estimatedLeft}
                currency={currency}
              />

              <MealBreakdownPanel mealGroups={mealGroups} currency={currency} />
            </>
          )}
        </div>
      </section>

      {showAddModal && (
        <AddGroceryModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
          existingPantryItems={pantry}
        />
      )}
    </div>
  );
}

export default GroceryList;