import { motion } from "framer-motion";
import { ChefHat, Clock3, Coins, Flame, Sparkles, Utensils } from "lucide-react";
import PremiumButton from "./ui/PremiumButton";
import PremiumCard from "./ui/PremiumCard";
import ProgressRing from "./ui/ProgressRing";
import { showToast } from "./ui/toast";

function RescueMealCard({ meal, featured = false, index = 0 }) {
  function handleCookRescueMeal() {
    showToast(`${meal.name} added as your rescue meal.`);
  }

  if (featured) {
    return (
      <PremiumCard glow hover={false} className="p-5 md:p-6" delay={0.1}>
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1 text-sm font-extrabold text-orange-300">
              <Flame size={15} />
              Best rescue meal
            </div>

            <h3 className="display-font text-3xl font-extrabold tracking-tight">
              {meal.name}
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b7b89f]">
              {meal.reason}
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                <Clock3 size={14} />
                {meal.time}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                <Coins size={14} />
                Saves {meal.saved}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-bold text-[#fff8e8]">
                <ChefHat size={14} />
                Uses {meal.uses.length}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {meal.uses.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-orange-300/15 bg-orange-400/15 px-3 py-1.5 text-xs font-extrabold text-orange-300"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-5">
              <PremiumButton icon={Utensils} onClick={handleCookRescueMeal}>
                Cook Rescue Meal
              </PremiumButton>
            </div>
          </div>

          <div className="hidden justify-center xl:flex">
            <ProgressRing
              value={meal.score}
              size={128}
              stroke={11}
              label="Rescue"
              icon={Sparkles}
              color="#f4a340"
              delay={0.25}
            />
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.06 * index }}
      whileHover={{ y: -3, scale: 1.004 }}
      className="group relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-white/[0.02] p-4 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:border-orange-300/20"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-[11px] font-extrabold text-[#d7f75b]">
            <Sparkles size={13} />
            Rescue option
          </div>

          <h3 className="display-font text-xl font-extrabold">{meal.name}</h3>

          <p className="mt-1 max-w-xl text-sm leading-6 text-[#b7b89f]">
            {meal.reason}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-[#c9cab3]">
              <Clock3 size={14} />
              {meal.time}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-[#c9cab3]">
              <Coins size={14} />
              {meal.saved}
            </span>

            {meal.uses.map((item) => (
              <span
                key={item}
                className="rounded-full bg-orange-400/15 px-3 py-1.5 text-xs font-extrabold text-orange-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <ProgressRing
          value={meal.score}
          size={78}
          stroke={7}
          label="Score"
          icon={Sparkles}
          color="#f4a340"
          delay={0.2 + index * 0.08}
        />
      </div>
    </motion.div>
  );
}

export default RescueMealCard;