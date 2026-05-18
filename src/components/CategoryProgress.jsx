import { motion } from "framer-motion";

function CategoryProgress({ item, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      whileHover={{ y: -3, scale: 1.006 }}
      className="group rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-white/[0.02] p-4 shadow-lg shadow-black/10 transition hover:border-[#d7f75b]/20"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="display-font font-extrabold">{item.name}</h4>
          <p className="mt-1 text-sm font-semibold text-[#b7b89f]">
            {item.meals} meals cooked
          </p>
        </div>

        <span className="rounded-full border border-[#d7f75b]/15 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
          {item.percentage}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.percentage}%` }}
          transition={{ duration: 0.9, delay: 0.2 + index * 0.08 }}
          className="h-full rounded-full bg-gradient-to-r from-[#d7f75b] to-[#f4a340] shadow-[0_0_18px_rgba(215,247,91,0.35)]"
        />
      </div>
    </motion.div>
  );
}

export default CategoryProgress;