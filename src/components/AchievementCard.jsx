import { motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";

function AchievementCard({ item, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-white/[0.02] p-4 shadow-xl shadow-black/10 transition hover:border-orange-300/20"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
            <Trophy size={20} />
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d7f75b]/10 text-[#d7f75b]">
            <Sparkles size={15} />
          </div>
        </div>

        <h4 className="display-font font-extrabold">{item.title}</h4>

        <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

export default AchievementCard;