import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  PackageX,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const CONTAINER_UNITS = [
  "jar",
  "bottle",
  "pack",
  "bag",
  "box",
  "carton",
  "container",
];

function parseQuantity(quantity) {
  const text = String(quantity || "").trim();
  const match = text.match(/^([\d.]+)\s*(.*)$/);

  if (!match) {
    return {
      value: null,
      unit: text || "unit",
      canCalculate: false,
    };
  }

  const value = Number(match[1]);
  const unit = match[2].trim() || "unit";

  return {
    value,
    unit,
    canCalculate: !Number.isNaN(value),
  };
}

function normalizeUnit(unit) {
  return String(unit || "")
    .trim()
    .toLowerCase()
    .replace(/s$/, "");
}

function isSingleContainer(parsedQuantity) {
  const normalizedUnit = normalizeUnit(parsedQuantity.unit);

  return (
    parsedQuantity.canCalculate &&
    parsedQuantity.value === 1 &&
    CONTAINER_UNITS.includes(normalizedUnit)
  );
}

function getExampleAmount(unit) {
  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === "kg") return "0.25";
  if (normalizedUnit === "g") return "100";
  if (normalizedUnit === "gram") return "100";
  if (normalizedUnit === "ml") return "200";
  if (normalizedUnit === "l") return "0.5";
  if (normalizedUnit === "litre") return "0.5";
  if (normalizedUnit === "liter") return "0.5";
  if (normalizedUnit === "piece") return "3";
  if (normalizedUnit === "can") return "1";
  if (normalizedUnit === "egg") return "3";
  if (normalizedUnit === "tbsp") return "1";
  if (normalizedUnit === "tsp") return "1";

  return "1";
}

function formatQuantity(value, unit) {
  const cleanValue = Number(value.toFixed(2));

  if (!unit || unit === "unit") {
    return `${cleanValue}`;
  }

  return `${cleanValue} ${unit}`;
}

function UsePantryItemModal({ item, onClose, onConfirm }) {
  const parsedQuantity = useMemo(
    () => parseQuantity(item.quantity),
    [item.quantity]
  );

  const containerMode = isSingleContainer(parsedQuantity);

  const [usedAmount, setUsedAmount] = useState("");
  const [containerUsage, setContainerUsage] = useState("");

  const result = useMemo(() => {
    if (containerMode) {
      if (!containerUsage) {
        return {
          isValid: false,
          mode: "update",
          remaining: parsedQuantity.value,
          remainingText: item.quantity,
          usedAmount: "",
          message: "Choose how much of this container you used.",
        };
      }

      if (containerUsage === "little") {
        return {
          isValid: true,
          mode: "update",
          remaining: parsedQuantity.value,
          remainingText: item.quantity,
          usedAmount: "a little",
          message: `${item.name} will stay as ${item.quantity}, but MealMind will know it was partly used.`,
        };
      }

      if (containerUsage === "half") {
        return {
          isValid: true,
          mode: "update",
          remaining: parsedQuantity.value,
          remainingText: item.quantity,
          usedAmount: "about half",
          message: `${item.name} will stay as ${item.quantity}. This keeps the pantry simple instead of tracking tiny amounts.`,
        };
      }

      return {
        isValid: true,
        mode: "remove",
        remaining: 0,
        remainingText: "Removed",
        usedAmount: item.quantity,
        message: `${item.name} will be removed from your pantry.`,
      };
    }

    if (!parsedQuantity.canCalculate) {
      return {
        isValid: false,
        mode: "update",
        remaining: null,
        remainingText: "",
        usedAmount: "",
        message:
          "This item has a custom quantity, so MealMind cannot calculate partial use automatically.",
      };
    }

    if (usedAmount === "") {
      return {
        isValid: false,
        mode: "update",
        remaining: null,
        remainingText: "",
        usedAmount: "",
        message: "Enter the used amount to preview the remaining amount.",
      };
    }

    const used = Number(usedAmount);

    if (Number.isNaN(used) || used <= 0) {
      return {
        isValid: false,
        mode: "update",
        remaining: null,
        remainingText: "",
        usedAmount: "",
        message: "Enter an amount greater than 0.",
      };
    }

    const remaining = parsedQuantity.value - used;

    if (remaining <= 0) {
      return {
        isValid: true,
        mode: "remove",
        remaining: 0,
        remainingText: "Removed",
        usedAmount: `${usedAmount} ${parsedQuantity.unit}`,
        message: `${item.name} will be removed because no quantity remains.`,
      };
    }

    return {
      isValid: true,
      mode: "update",
      remaining,
      remainingText: formatQuantity(remaining, parsedQuantity.unit),
      usedAmount: `${usedAmount} ${parsedQuantity.unit}`,
      message: `${item.name} will stay in your pantry with an updated quantity.`,
    };
  }, [
    containerMode,
    containerUsage,
    usedAmount,
    parsedQuantity,
    item.name,
    item.quantity,
  ]);

  function handleUseAll() {
    onConfirm({
      item,
      mode: "remove",
      remainingQuantity: null,
      usedAmount: item.quantity,
    });

    onClose();
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!result.isValid) {
      return;
    }

    if (result.mode === "remove") {
      onConfirm({
        item,
        mode: "remove",
        remainingQuantity: null,
        usedAmount: result.usedAmount,
      });

      onClose();
      return;
    }

    onConfirm({
      item,
      mode: "update",
      remainingQuantity: result.remainingText,
      usedAmount: result.usedAmount,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1f14] via-[#13170f] to-[#0d100a] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#d7f75b]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b]">
                <PackageCheck size={14} />
                Pantry update
              </div>

              <h2 className="display-font text-3xl font-extrabold">
                Use {item.name}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#b7b89f]">
                {containerMode
                  ? "Choose how much of this container you used. MealMind keeps the pantry simple."
                  : "Enter the used amount. MealMind will calculate what remains."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#c9cab3] transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mb-5 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
              Current item
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8f927e]">
                  Amount
                </p>
                <p className="display-font mt-1 text-xl font-extrabold text-[#d7f75b]">
                  {item.quantity}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d0f09] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8f927e]">
                  Unit
                </p>
                <p className="display-font mt-1 text-xl font-extrabold">
                  {parsedQuantity.unit}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d0f09] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8f927e]">
                  Location
                </p>
                <p className="display-font mt-1 text-xl font-extrabold">
                  {item.location}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {containerMode ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-3 text-sm font-extrabold">How was it used?</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setContainerUsage("little")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      containerUsage === "little"
                        ? "border-[#d7f75b]/30 bg-[#d7f75b]/10 text-[#d7f75b]"
                        : "border-white/10 bg-[#0d0f09] text-[#c9cab3] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="display-font font-extrabold">A little</p>
                    <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                      Keep {item.quantity}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContainerUsage("half")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      containerUsage === "half"
                        ? "border-[#d7f75b]/30 bg-[#d7f75b]/10 text-[#d7f75b]"
                        : "border-white/10 bg-[#0d0f09] text-[#c9cab3] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="display-font font-extrabold">About half</p>
                    <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                      Keep {item.quantity}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContainerUsage("all")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      containerUsage === "all"
                        ? "border-red-300/30 bg-red-400/10 text-red-300"
                        : "border-white/10 bg-[#0d0f09] text-[#c9cab3] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="display-font font-extrabold">Used all</p>
                    <p className="mt-1 text-xs leading-5 text-[#8f927e]">
                      Remove item
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold">
                    Amount used
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0f09] px-4 py-3 focus-within:border-[#d7f75b]/50">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={usedAmount}
                      onChange={(event) => setUsedAmount(event.target.value)}
                      placeholder={`Example: ${getExampleAmount(
                        parsedQuantity.unit
                      )}`}
                      disabled={!parsedQuantity.canCalculate}
                      className="w-full bg-transparent text-lg font-extrabold outline-none placeholder:text-[#77796f] disabled:cursor-not-allowed disabled:opacity-45"
                    />

                    <span className="shrink-0 rounded-xl bg-white/[0.06] px-3 py-1.5 text-sm font-extrabold text-[#c9cab3]">
                      {parsedQuantity.unit}
                    </span>
                  </div>
                </label>

                {!parsedQuantity.canCalculate && (
                  <div className="mt-3 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-4 text-sm leading-6 text-orange-200">
                    This item uses a custom quantity format. Use the remove
                    button if you want to remove it completely.
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-[#0d0f09] p-4">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#8f927e]">
                Result preview
              </p>

              {result.isValid ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 display-font text-lg font-extrabold">
                    {item.quantity}
                  </span>

                  <ArrowRight size={18} className="text-[#8f927e]" />

                  <span
                    className={`rounded-2xl border px-4 py-3 display-font text-lg font-extrabold ${
                      result.mode === "remove"
                        ? "border-red-300/20 bg-red-400/10 text-red-300"
                        : "border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]"
                    }`}
                  >
                    {result.remainingText}
                  </span>
                </div>
              ) : (
                <p className="text-sm leading-6 text-[#c9cab3]">
                  {result.message}
                </p>
              )}

              {result.isValid && (
                <p className="mt-3 text-sm leading-6 text-[#b7b89f]">
                  {result.message}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleUseAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/15 bg-red-400/10 px-5 py-3 font-extrabold text-red-300 transition hover:bg-red-400/15"
              >
                <PackageX size={18} />
                Remove All
              </button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-extrabold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!result.isValid}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 py-3 font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                >
                  <CheckCircle2 size={18} />
                  Update Pantry
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default UsePantryItemModal;