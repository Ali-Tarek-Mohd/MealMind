import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Search, Sparkles, Utensils, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  mealRecommendations,
  rescueMeals,
  smartPicks,
} from "../data/demoData";
import { showToast } from "./ui/toast";

function getAllSearchMeals() {
  const recommendationMeals = mealRecommendations.map((meal) => ({
    name: meal.name,
    score: meal.score,
    time: meal.time,
    type: "Recommended",
    note: meal.reason?.[0] ?? "Smart meal recommendation",
  }));

  const rescueMealResults = rescueMeals.map((meal) => ({
    name: meal.name,
    score: meal.score,
    time: meal.time,
    type: "Rescue meal",
    note: meal.reason,
  }));

  const smartPickResults = smartPicks.map((meal) => ({
    name: meal.name,
    score: meal.score,
    time: meal.time,
    type: "Smart pick",
    note: meal.note,
  }));

  const combined = [
    ...recommendationMeals,
    ...rescueMealResults,
    ...smartPickResults,
  ];

  return combined.filter(
    (meal, index, array) =>
      array.findIndex((item) => item.name === meal.name) === index
  );
}

function MealSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const meals = useMemo(() => getAllSearchMeals(), []);

  const filteredMeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return meals.slice(0, 4);
    }

    return meals
      .filter((meal) => {
        return (
          meal.name.toLowerCase().includes(normalizedQuery) ||
          meal.type.toLowerCase().includes(normalizedQuery) ||
          meal.note.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 5);
  }, [query, meals]);

  function handleFocus() {
    setIsFocused(true);
    setIsResultsOpen(true);
  }

  function handleSelectMeal(meal) {
    showToast(`${meal.name} selected from search.`, "info");
    setQuery(meal.name);
    setIsFocused(false);
    setIsResultsOpen(false);
  }

  function handleClear() {
    setQuery("");
    setIsResultsOpen(true);
  }

  return (
    <div className="relative w-full md:w-[360px]">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-black/10 backdrop-blur-xl transition ${
          isResultsOpen
            ? "border-[#d7f75b]/30 bg-white/[0.08]"
            : "border-white/10 bg-white/[0.06]"
        }`}
      >
        <Search size={18} className="shrink-0 text-[#b7b89f]" />

        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsResultsOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setIsResultsOpen(false);
            }, 120);
          }}
          className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#b7b89f]"
          placeholder="Search meals..."
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[#b7b89f] transition hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isResultsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onMouseDown={(event) => event.preventDefault()}
            className="absolute right-0 top-full z-50 w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#12150f]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-[#d7f75b]">
                <Sparkles size={15} />
                <p className="text-xs font-extrabold uppercase tracking-wide">
                  Meal results
                </p>
              </div>

              <span className="text-xs font-bold text-[#8f927e]">
                {filteredMeals.length} found
              </span>
            </div>

            {filteredMeals.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="display-font font-extrabold">No meal found</p>
                <p className="mt-1 text-sm text-[#b7b89f]">
                  Try searching chicken, toast, rice, or rescue.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMeals.map((meal, index) => (
                  <motion.button
                    key={meal.name}
                    type="button"
                    onClick={() => handleSelectMeal(meal)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.035 }}
                    className="group w-full rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-[#d7f75b]/25 hover:bg-[#d7f75b]/[0.055]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
                            <Utensils size={17} />
                          </div>

                          <div className="min-w-0">
                            <h4 className="display-font truncate font-extrabold">
                              {meal.name}
                            </h4>

                            <p className="text-xs font-bold text-[#8f927e]">
                              {meal.type}
                            </p>
                          </div>
                        </div>

                        <p className="line-clamp-2 text-sm leading-5 text-[#b7b89f]">
                          {meal.note}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                          {meal.score}%
                        </span>

                        <div className="mt-2 flex items-center justify-end gap-1.5 text-xs font-bold text-[#b7b89f]">
                          <Clock3 size={13} />
                          {meal.time}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MealSearch;