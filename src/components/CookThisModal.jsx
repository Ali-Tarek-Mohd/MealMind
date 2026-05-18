import { motion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  Coins,
  History,
  ShoppingBasket,
  Utensils,
  X,
} from "lucide-react";
import { showToast } from "./ui/toast";

const GROCERY_ITEMS_STORAGE_KEY = "mealmind_grocery_items";
const PLANNED_MEALS_STORAGE_KEY = "mealmind_planned_meals";
const SAVED_MEALS_STORAGE_KEY = "mealmind_saved_meals";
const COOKED_HISTORY_STORAGE_KEY = "mealmind_cooked_history";

function loadStorageArray(key) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function saveStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getMissingIngredientName(item) {
  return item?.ingredient || item?.name || item?.itemName || "Missing item";
}

function getMissingIngredientQuantity(item) {
  return item?.package || item?.quantity || item?.amount || "1 item";
}

function getMissingIngredientPrice(item) {
  return Number(item?.price || item?.cost || 0);
}

function getMissingIngredientCurrency(item) {
  return item?.currency || "KWD";
}

function buildSavedMeal(meal) {
  return {
    id: meal.id,
    name: meal.name,
    type: meal.mealType || meal.type || "Meal",
    cuisine: meal.cuisine || "Simple",
    mood: meal.moods?.[0] || meal.mood || "Smart Pick",
    time: Number(meal.totalTime || meal.time || 20),
    difficulty: meal.difficulty || "Easy",
    match: Number(meal.matchScore || meal.match || 80),
    estimatedCost: Number(meal.totalExtraCost || meal.estimatedCost || 0),
    savedAt: new Date().toISOString(),
    pantryItems: safeArray(meal.haveIngredients || meal.pantryItems),
    missingItems: safeArray(
      meal.missingIngredientDetails || meal.missingItems
    ).map((item) => ({
      name: getMissingIngredientName(item),
      quantity: getMissingIngredientQuantity(item),
      price: getMissingIngredientPrice(item),
    })),
    nutrition: {
      calories: Number(meal.nutrition?.calories || 0),
      protein: Number(meal.nutrition?.protein || 0),
      carbs: Number(meal.nutrition?.carbs || 0),
      fat: Number(meal.nutrition?.fat || 0),
    },
  };
}

function saveMealToHistory(meal) {
  const currentSavedMeals = loadStorageArray(SAVED_MEALS_STORAGE_KEY);
  const savedMeal = buildSavedMeal(meal);

  const updatedSavedMeals = [
    savedMeal,
    ...currentSavedMeals.filter((item) => item.id !== savedMeal.id),
  ];

  saveStorageArray(SAVED_MEALS_STORAGE_KEY, updatedSavedMeals);

  return savedMeal;
}

function markMealAsCooked(meal) {
  const currentCookedHistory = loadStorageArray(COOKED_HISTORY_STORAGE_KEY);

  const cookedEntry = {
    id: crypto.randomUUID(),
    mealId: meal.id,
    name: meal.name,
    cookedAt: new Date().toISOString(),
    estimatedCost: Number(meal.totalExtraCost || meal.estimatedCost || 0),
    type: meal.mealType || meal.type || "Meal",
    source: "Dashboard",
  };

  saveStorageArray(COOKED_HISTORY_STORAGE_KEY, [
    cookedEntry,
    ...currentCookedHistory,
  ]);

  return cookedEntry;
}

function CookThisModal({ meal, onClose }) {
  const missingIngredientDetails = safeArray(meal.missingIngredientDetails);
  const haveIngredients = safeArray(meal.haveIngredients);
  const hasMissingItems = missingIngredientDetails.length > 0;

  function addMissingItemsToGroceryList() {
    const currentItems = loadStorageArray(GROCERY_ITEMS_STORAGE_KEY);
    const existingNames = currentItems.map((item) => normalizeText(item.name));

    const newItems = missingIngredientDetails
      .filter((item) => {
        const itemName = getMissingIngredientName(item);
        return !existingNames.includes(normalizeText(itemName));
      })
      .map((item) => {
        const itemName = getMissingIngredientName(item);

        return {
          id: crypto.randomUUID(),
          name: itemName,
          quantity: getMissingIngredientQuantity(item),
          category: "Meal ingredient",
          source: meal.name,
          estimatedPrice: getMissingIngredientPrice(item),
          price: getMissingIngredientPrice(item),
          currency: getMissingIngredientCurrency(item),
          checked: false,
          completed: false,
          bought: false,
          priority: "Medium",
          createdAt: new Date().toISOString(),
        };
      });

    if (newItems.length === 0) {
      showToast(
        "Those missing ingredients are already in your grocery list.",
        "info"
      );
      return 0;
    }

    saveStorageArray(GROCERY_ITEMS_STORAGE_KEY, [...newItems, ...currentItems]);

    showToast(`${newItems.length} missing ingredients added to Grocery List.`);
    return newItems.length;
  }

  function markMealAsPlanned() {
    const currentMeals = loadStorageArray(PLANNED_MEALS_STORAGE_KEY);

    const plannedMeal = {
      id: crypto.randomUUID(),
      mealId: meal.id,
      name: meal.name,
      mealType: meal.mealType,
      cuisine: meal.cuisine,
      totalTime: meal.totalTime,
      extraCost: meal.totalExtraCost,
      extraCostLabel: meal.totalExtraCostLabel,
      plannedAt: new Date().toISOString(),
      status: "Planned",
    };

    saveStorageArray(PLANNED_MEALS_STORAGE_KEY, [plannedMeal, ...currentMeals]);

    saveMealToHistory(meal);

    showToast(`${meal.name} added to your planned meals and Meal History.`);
    onClose();
  }

  function handleAddAndPlan() {
    if (hasMissingItems) {
      addMissingItemsToGroceryList();
    }

    markMealAsPlanned();
  }

  function handleCookNow() {
    saveMealToHistory(meal);
    markMealAsCooked(meal);

    showToast(`${meal.name} marked as cooked. Analytics updated.`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1f14] via-[#13170f] to-[#0d100a] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#d7f75b]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                <Utensils size={14} />
                Cook this meal
              </div>

              <h2 className="display-font text-3xl font-extrabold md:text-4xl">
                Cook {meal.name}?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#b7b89f]">
                Review what you already have, add missing ingredients if needed,
                then plan it or mark it cooked so Meal History and Analytics
                update.
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

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Total time
              </p>
              <p className="display-font mt-1 text-xl font-extrabold">
                {meal.totalTime} min
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Missing cost
              </p>
              <p className="display-font mt-1 text-xl font-extrabold text-[#d7f75b]">
                {meal.totalExtraCostLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Match
              </p>
              <p className="display-font mt-1 text-xl font-extrabold">
                {meal.matchScore}%
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]">
                  <CheckCircle2 size={17} />
                </div>

                <h3 className="display-font font-extrabold">
                  Already in pantry
                </h3>
              </div>

              {haveIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {haveIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-extrabold text-[#fff8e8]"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[#b7b89f]">
                  No matching pantry ingredients found.
                </p>
              )}
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
                  <ShoppingBasket size={17} />
                </div>

                <h3 className="display-font font-extrabold">Need to buy</h3>
              </div>

              {hasMissingItems ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {missingIngredientDetails.map((item) => {
                    const itemName = getMissingIngredientName(item);
                    const itemQuantity = getMissingIngredientQuantity(item);
                    const itemPrice = getMissingIngredientPrice(item);
                    const itemCurrency = getMissingIngredientCurrency(item);

                    return (
                      <div
                        key={`${itemName}-${itemQuantity}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/65 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-extrabold text-[#fff8e8]">
                            {itemName}
                          </p>
                          <p className="text-xs font-semibold text-[#8f927e]">
                            {itemQuantity}
                          </p>
                        </div>

                        <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-extrabold text-sky-300">
                          {itemPrice.toFixed(3)} {itemCurrency}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[#b7b89f]">
                  You already have everything needed for this meal.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-[#0f120c]/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-[#d7f75b]">
              <Coins size={17} />
              <h3 className="display-font font-extrabold">
                Estimated extra cost
              </h3>
            </div>

            <p className="text-sm leading-6 text-[#b7b89f]">
              MealMind estimates this meal needs{" "}
              <span className="font-extrabold text-white">
                {meal.totalExtraCostLabel}
              </span>{" "}
              based only on missing ingredients. Pantry items are treated as
              already available.
            </p>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-[#d7f75b]/15 bg-[#d7f75b]/[0.055] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#d7f75b]">
              <History size={17} />
              <h3 className="display-font font-extrabold">
                Connected tracking
              </h3>
            </div>

            <p className="text-sm leading-6 text-[#b7b89f]">
              Marking this as cooked will save it to Meal History and update
              Analytics automatically.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-extrabold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={addMissingItemsToGroceryList}
                disabled={!hasMissingItems}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-extrabold text-sky-300 transition hover:-translate-y-0.5 hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <ShoppingBasket size={18} />
                Add Missing Items
              </button>

              <button
                type="button"
                onClick={handleAddAndPlan}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-5 py-3 font-extrabold text-[#d7f75b] transition hover:-translate-y-0.5 hover:bg-[#d7f75b]/15"
              >
                <CalendarCheck size={18} />
                Plan Meal
              </button>

              <button
                type="button"
                onClick={handleCookNow}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 py-3 font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
              >
                <Utensils size={18} />
                Mark Cooked
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CookThisModal;