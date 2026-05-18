import { motion } from "framer-motion";
import { ChefHat, Sparkles } from "lucide-react";

function PlannedMealCard({ meal, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.035 }}
      whileHover={{ y: -3, scale: 1.006 }}
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-white/[0.02] p-4 shadow-lg shadow-black/10 transition hover:border-[#d7f75b]/20"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#d7f75b]/10 blur-2xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
              <ChefHat size={18} />
            </div>

            <div className="min-w-0">
              <h4 className="display-font truncate font-extrabold">
                {meal.name}
              </h4>

              <p className="mt-1 text-xs font-bold text-[#b7b89f]">
                Planned meal
              </p>
            </div>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#d7f75b]">
            <Sparkles size={15} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {meal.ingredients.map((ingredient) => (
            <span
              key={ingredient}
              className="rounded-full border border-white/10 bg-[#0f120c]/65 px-3 py-1.5 text-xs font-extrabold text-[#c9cab3]"
            >
              {ingredient}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default PlannedMealCard;