import { motion } from "framer-motion";
import { Check, CheckCircle2, ShoppingBasket, Trash2 } from "lucide-react";

function getPriorityStyle(priority, bought) {
  if (bought) {
    return "bg-[#d7f75b]/10 text-[#d7f75b] border-[#d7f75b]/15";
  }

  if (priority === "Needed") {
    return "bg-sky-400/15 text-sky-300 border-sky-300/15";
  }

  return "bg-orange-400/15 text-orange-300 border-orange-300/15";
}

function GroceryItemCard({ item, bought, onToggle, onDelete, index = 0 }) {
  function handleDelete(event) {
    event.stopPropagation();
    onDelete();
  }

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04 }}
      whileHover={{ y: -4, scale: 1.006 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative overflow-hidden rounded-[1.6rem] border p-5 text-left shadow-xl shadow-black/10 backdrop-blur-xl transition ${
        bought
          ? "border-[#d7f75b]/20 bg-[#d7f75b]/[0.055]"
          : "border-white/10 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-white/[0.02] hover:border-sky-300/20"
      }`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              bought
                ? "bg-[#d7f75b] text-[#10120c]"
                : "bg-sky-400/15 text-sky-300"
            }`}
          >
            {bought ? <Check size={22} /> : <ShoppingBasket size={22} />}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-extrabold ${getPriorityStyle(
                item.priority,
                bought
              )}`}
            >
              {bought ? "Bought" : item.priority}
            </span>

            <button
              type="button"
              onClick={handleDelete}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-300/15 bg-red-400/10 text-red-300 opacity-70 transition hover:bg-red-400/15 hover:opacity-100"
              title="Remove item"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <h3
          className={`display-font text-xl font-extrabold ${
            bought ? "text-[#d7f75b]" : "text-[#fff8e8]"
          }`}
        >
          {item.name}
        </h3>

        <p className="mt-1 text-sm text-[#b7b89f]">{item.category}</p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f120c]/60 p-4">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
            Needed for
          </p>

          <div className="space-y-2">
            {item.forMeals.map((meal) => (
              <div key={meal} className="flex items-center gap-2 text-sm">
                <CheckCircle2
                  size={15}
                  className={bought ? "text-[#d7f75b]" : "text-sky-300"}
                />
                <span className="font-bold text-[#c9cab3]">{meal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default GroceryItemCard;