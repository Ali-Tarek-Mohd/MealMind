import { motion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import LocationIcon from "./LocationIcon";

function AlreadyHaveCard({ item, index = 0 }) {
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
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h4 className="display-font font-extrabold">{item.name}</h4>
            <p className="mt-1 text-sm font-bold text-[#fff8e8]">
              {item.amount}
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
            <Check size={17} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/60 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#b7b89f]">
            <MapPin size={14} />
            <span>{item.location}</span>
          </div>

          <LocationIcon type={item.location} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}

export default AlreadyHaveCard;