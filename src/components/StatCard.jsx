import { Apple, Leaf, Utensils } from "lucide-react";

function getIcon(type) {
  if (type === "money") return Apple;
  if (type === "rescue") return Leaf;
  return Utensils;
}

function StatCard({ label, value, type }) {
  const Icon = getIcon(type);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[#d8f26a]">
        <Icon size={21} />
      </div>

      <p className="text-sm text-[#a8aa9d]">{label}</p>
      <h3 className="mt-1 text-2xl font-bold">{value}</h3>
    </div>
  );
}

export default StatCard;