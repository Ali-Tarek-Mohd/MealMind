import { motion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";

function ReminderSettingCard({ item, enabled, onToggle, index = 0 }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -3, scale: 1.006 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-[1.4rem] border p-4 text-left shadow-lg shadow-black/10 transition ${
        enabled
          ? "border-[#d7f75b]/20 bg-[#d7f75b]/[0.055]"
          : "border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-[#d7f75b]/10 blur-2xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative flex min-w-0 items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            enabled
              ? "bg-[#d7f75b] text-[#10120c]"
              : "bg-orange-400/15 text-orange-300"
          }`}
        >
          {enabled ? <CheckCircle2 size={20} /> : <Bell size={20} />}
        </div>

        <div className="min-w-0">
          <h4 className="display-font font-extrabold">{item.title}</h4>
          <p className="mt-1 text-sm leading-5 text-[#b7b89f]">
            {item.description}
          </p>
        </div>
      </div>

      <div
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled ? "bg-[#d7f75b]" : "bg-white/10"
        }`}
      >
        <motion.span
          layout
          className="absolute top-1 h-6 w-6 rounded-full bg-[#10120c]"
          animate={{ left: enabled ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        />
      </div>
    </motion.button>
  );
}

export default ReminderSettingCard;