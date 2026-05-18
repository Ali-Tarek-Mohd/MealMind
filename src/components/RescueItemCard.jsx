import { motion } from "framer-motion";
import { AlertTriangle, Clock3, Flame } from "lucide-react";
import LocationIcon from "./LocationIcon";

function getUrgencyStyle(urgency) {
  if (urgency === "Urgent") {
    return {
      pill: "bg-red-400/15 text-red-300 border-red-300/15",
      glow: "bg-red-400/10",
      iconBg: "bg-red-400/15 text-red-300",
    };
  }

  return {
    pill: "bg-orange-400/15 text-orange-300 border-orange-300/15",
    glow: "bg-orange-400/10",
    iconBg: "bg-orange-400/15 text-orange-300",
  };
}

function RescueItemCard({ item, index = 0 }) {
  const style = getUrgencyStyle(item.urgency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -3, scale: 1.006 }}
      className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-white/[0.02] p-4 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:border-orange-300/20"
    >
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full ${style.glow} blur-3xl opacity-0 transition group-hover:opacity-100`}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBg}`}
          >
            {item.urgency === "Urgent" ? (
              <AlertTriangle size={21} />
            ) : (
              <Flame size={21} />
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="display-font truncate text-lg font-extrabold">
                {item.name}
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${style.pill}`}
              >
                {item.urgency}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-[#c9cab3]">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} className="text-[#b7b89f]" />
                {item.daysLeft} days
              </span>

              <span>{item.quantity}</span>

              <span>{item.location}</span>
            </div>
          </div>
        </div>

        <LocationIcon type={item.location} size="sm" />
      </div>
    </motion.div>
  );
}

export default RescueItemCard;