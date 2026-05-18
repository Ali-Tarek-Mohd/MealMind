import { motion } from "framer-motion";
import { Clock, Sparkle, Star } from "@phosphor-icons/react";
import { smartPicks } from "../data/demoData";
import PremiumCard from "./ui/PremiumCard";
import ProgressRing from "./ui/ProgressRing";

function SmartPicks() {
  return (
    <PremiumCard className="p-5 md:p-6" delay={0.18}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
            <Sparkle size={15} weight="fill" />
            Backup choices
          </div>

          <h3 className="display-font text-2xl font-extrabold">
            Other smart picks
          </h3>

          <p className="mt-1 text-sm text-[#b7b89f]">
            Simple options if you want something else.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {smartPicks.map((meal, index) => (
          <motion.div
            key={meal.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
            whileHover={{ y: -3, scale: 1.006 }}
            className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#11130d]/70 p-4 transition hover:border-[#d7f75b]/20 hover:bg-white/[0.055]"
          >
            <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-[#d7f75b]/8 blur-2xl opacity-0 transition group-hover:opacity-100" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d7f75b]/10 text-[#d7f75b]">
                    <Star size={17} weight="duotone" />
                  </div>

                  <h4 className="truncate font-extrabold">{meal.name}</h4>
                </div>

                <p className="text-sm text-[#b7b89f]">{meal.note}</p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/[0.055] px-3 py-1.5 text-xs font-bold text-[#c9cab3]">
                  <Clock size={14} weight="duotone" />
                  {meal.time}
                </div>
              </div>

              <ProgressRing
                value={meal.score}
                size={76}
                stroke={7}
                label="Match"
                icon={Sparkle}
                delay={0.2 + index * 0.08}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </PremiumCard>
  );
}

export default SmartPicks;