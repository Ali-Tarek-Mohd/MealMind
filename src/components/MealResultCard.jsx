import { AnimatePresence, motion } from "framer-motion";
import {
  Beef,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coins,
  Flame,
  Globe2,
  Leaf,
  ShoppingBasket,
  Sparkles,
  Timer,
  Utensils,
} from "lucide-react";
import PremiumButton from "./ui/PremiumButton";
import PremiumCard from "./ui/PremiumCard";
import ProgressRing from "./ui/ProgressRing";
import { showToast } from "./ui/toast";

function PantryIngredientGroup({ items }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#0f120c]/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]">
          <CheckCircle2 size={17} />
        </div>

        <h4 className="display-font font-extrabold">Already in your pantry</h4>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((ingredient) => (
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
          No matching pantry ingredients.
        </p>
      )}
    </div>
  );
}

function MissingIngredientGroup({ items }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#0f120c]/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
          <ShoppingBasket size={17} />
        </div>

        <h4 className="display-font font-extrabold">Need to buy</h4>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.ingredient}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2"
            >
              <div>
                <p className="text-sm font-extrabold text-[#fff8e8]">
                  {item.ingredient}
                </p>
                <p className="text-xs font-semibold text-[#8f927e]">
                  {item.package}
                </p>
              </div>

              <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-extrabold text-sky-300">
                {item.price.toFixed(3)} {item.currency}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-[#b7b89f]">
          Nothing missing here.
        </p>
      )}
    </div>
  );
}

function NutritionCard({ nutrition }) {
  const nutrients = [
    { label: "Calories", value: `${nutrition.calories} kcal`, icon: Flame },
    { label: "Protein", value: `${nutrition.protein}g`, icon: Beef },
    { label: "Carbs", value: `${nutrition.carbs}g`, icon: Leaf },
    { label: "Fat", value: `${nutrition.fat}g`, icon: Coins },
  ];

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#0f120c]/60 p-4">
      <h4 className="mb-3 display-font font-extrabold">
        Estimated nutrition
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {nutrients.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <div className="mb-2 flex items-center gap-2 text-[#d7f75b]">
                <Icon size={15} />
                <p className="text-xs font-extrabold uppercase tracking-wide">
                  {item.label}
                </p>
              </div>

              <p className="display-font text-lg font-extrabold">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-5 text-[#8f927e]">
        Nutrition values are approximate demo estimates per serving.
      </p>
    </div>
  );
}

function MealResultCard({ meal, onTryAnother }) {
  function handleCookThis() {
    showToast(`${meal.name} added to today’s cooking plan.`);
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={meal.id}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.985 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <PremiumCard glow hover={false} className="p-5 md:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.62fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
                <Sparkles size={15} />
                {meal.scoreBand}
              </div>

              <h3 className="display-font text-4xl font-extrabold tracking-tight md:text-5xl">
                {meal.name}
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#b7b89f]">
                {meal.mealType} · {meal.cuisine} · {meal.proteinType}
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                  <Timer size={15} />
                  Prep {meal.prepTime} min
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                  <Clock3 size={15} />
                  Cook {meal.cookTime} min
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                  <ChefHat size={15} />
                  {meal.difficulty}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                  <Coins size={15} />
                  {meal.totalExtraCostLabel}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                  <Globe2 size={15} />
                  {meal.cuisine}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <PantryIngredientGroup items={meal.haveIngredients} />

                <MissingIngredientGroup items={meal.missingIngredientDetails} />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <PremiumButton icon={Utensils} onClick={handleCookThis}>
                  Cook This
                </PremiumButton>

                <PremiumButton
                  variant="secondary"
                  icon={Sparkles}
                  onClick={onTryAnother}
                >
                  Try Another
                </PremiumButton>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-center rounded-[2rem] border border-white/10 bg-[#0f120c]/60 p-6">
                <ProgressRing
                  value={meal.matchScore}
                  size={150}
                  stroke={12}
                  label="Match"
                  icon={Sparkles}
                  delay={0.15}
                />
              </div>

              <NutritionCard nutrition={meal.nutrition} />

              <div className="rounded-[1.5rem] border border-white/10 bg-[#0f120c]/60 p-4">
                <h4 className="mb-3 display-font font-extrabold">
                  Estimated shopping cost
                </h4>

                <p className="display-font text-2xl font-extrabold text-[#d7f75b]">
                  {meal.totalExtraCostLabel}
                </p>

                <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                  Based on missing ingredients only. Prices are demo estimates.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-[#0f120c]/60 p-5">
            <h4 className="mb-4 display-font text-lg font-extrabold">
              Why this meal?
            </h4>

            <div className="grid gap-3 md:grid-cols-2">
              {meal.reasons.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 * index }}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <Leaf
                    size={18}
                    className="mt-0.5 shrink-0 text-[#d7f75b]"
                  />
                  <p className="text-sm leading-6 text-[#c9cab3]">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </PremiumCard>
      </motion.div>
    </AnimatePresence>
  );
}

export default MealResultCard;