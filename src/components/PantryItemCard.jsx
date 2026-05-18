import { motion } from "framer-motion";
import { CheckCircle2, Flame, PackageX, Trash2 } from "lucide-react";
import LocationIcon from "./LocationIcon";

function getStatusStyle(status) {
  if (status === "Use soon") {
    return {
      pill: "bg-orange-400/15 text-orange-300 border-orange-300/15",
      glow: "bg-orange-400/10",
      label: "Use soon",
    };
  }

  if (status === "Out of stock") {
    return {
      pill: "bg-red-400/15 text-red-300 border-red-300/15",
      glow: "bg-red-400/10",
      label: "Out of stock",
    };
  }

  if (status === "Stocked") {
    return {
      pill: "bg-[#d7f75b]/10 text-[#d7f75b] border-[#d7f75b]/15",
      glow: "bg-[#d7f75b]/10",
      label: "Stocked",
    };
  }

  return {
    pill: "bg-[#d7f75b]/10 text-[#d7f75b] border-[#d7f75b]/15",
    glow: "bg-[#d7f75b]/10",
    label: "Fresh",
  };
}

function getExpiryText(item) {
  if (item.status === "Out of stock") {
    return "Needs restock";
  }

  if (item.daysLeft === null) {
    return "No expiry needed";
  }

  if (item.daysLeft <= 0) {
    return "Expired";
  }

  if (item.daysLeft <= 3) {
    return `${item.daysLeft} days left · use first`;
  }

  return `${item.daysLeft} days left`;
}

function PantryItemCard({ item, index = 0, onDelete, onUseItem }) {
  const statusStyle = getStatusStyle(item.status);
  const canUseItem = item.status !== "Out of stock";

  function handleDelete(event) {
    event.stopPropagation();

    if (onDelete) {
      onDelete();
    }
  }

  function handleUseItem(event) {
    event.stopPropagation();

    if (onUseItem) {
      onUseItem();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.035 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-white/[0.02] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:border-white/20"
    >
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full ${statusStyle.glow} blur-3xl opacity-0 transition group-hover:opacity-100`}
      />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <LocationIcon type={item.location} />

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusStyle.pill}`}
            >
              {statusStyle.label}
            </span>

            <button
              type="button"
              onClick={handleDelete}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-300/15 bg-red-400/10 text-red-300 opacity-70 transition hover:bg-red-400/15 hover:opacity-100"
              title="Remove pantry item"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="display-font text-xl font-extrabold">{item.name}</h3>
          <p className="mt-1 text-sm text-[#b7b89f]">{item.category}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-[#0f120c]/65 px-3 py-2 text-xs font-extrabold text-[#fff8e8]">
            {item.quantity}
          </span>

          <span className="rounded-full border border-white/10 bg-[#0f120c]/65 px-3 py-2 text-xs font-extrabold text-[#c9cab3]">
            {item.location}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f120c]/55 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8f927e]">
                Status
              </p>
              <p className="mt-1 font-extrabold">{getExpiryText(item)}</p>
            </div>

            {item.status === "Use soon" && (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
                <Flame size={18} />
              </div>
            )}

            {item.status === "Out of stock" && (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-400/15 text-red-300">
                <PackageX size={18} />
              </div>
            )}
          </div>
        </div>

        {canUseItem && (
          <button
            type="button"
            onClick={handleUseItem}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-4 py-3 text-sm font-extrabold text-[#d7f75b] transition hover:-translate-y-0.5 hover:bg-[#d7f75b]/15"
          >
            <CheckCircle2 size={17} />
            Use Item
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default PantryItemCard;