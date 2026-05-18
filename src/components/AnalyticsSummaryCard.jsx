import { motion } from "framer-motion";
import { Apple, Leaf, ShoppingBag, TrendingUp, Utensils } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";

function getIcon(type) {
  if (type === "money") return Apple;
  if (type === "rescue") return Leaf;
  if (type === "takeaway") return ShoppingBag;
  return Utensils;
}

function getTheme(type) {
  if (type === "money") {
    return {
      icon: "bg-sky-400/15 text-sky-300",
      glow: "bg-sky-400/10",
      border: "hover:border-sky-300/20",
    };
  }

  if (type === "rescue") {
    return {
      icon: "bg-[#d7f75b]/12 text-[#d7f75b]",
      glow: "bg-[#d7f75b]/10",
      border: "hover:border-[#d7f75b]/20",
    };
  }

  if (type === "takeaway") {
    return {
      icon: "bg-orange-400/15 text-orange-300",
      glow: "bg-orange-400/10",
      border: "hover:border-orange-300/20",
    };
  }

  return {
    icon: "bg-white/[0.07] text-[#d7f75b]",
    glow: "bg-[#d7f75b]/10",
    border: "hover:border-[#d7f75b]/20",
  };
}

function parseNumericValue(value) {
  const number = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isNaN(number) ? null : number;
}

function AnalyticsSummaryCard({ item, index = 0 }) {
  const Icon = getIcon(item.type);
  const theme = getTheme(item.type);
  const numericValue = parseNumericValue(item.value);

  const suffix =
    item.value.includes("KWD")
      ? " KWD"
      : item.value.includes("items")
      ? " items"
      : "";

  const decimals = item.value.includes(".") ? 3 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className={`group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-white/[0.02] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition ${theme.border}`}
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full ${theme.glow} blur-3xl opacity-0 transition group-hover:opacity-100`}
      />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.icon}`}
          >
            <Icon size={22} />
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[#d7f75b]/15 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
            <TrendingUp size={13} />
            Live
          </div>
        </div>

        <p className="text-sm font-semibold text-[#b7b89f]">{item.label}</p>

        <h3 className="display-font mt-1 text-3xl font-extrabold">
          {numericValue === null ? (
            item.value
          ) : (
            <AnimatedNumber
              value={numericValue}
              suffix={suffix}
              decimals={decimals}
              delay={0.15 + index * 0.05}
            />
          )}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#8f927e]">{item.detail}</p>
      </div>
    </motion.div>
  );
}

export default AnalyticsSummaryCard;