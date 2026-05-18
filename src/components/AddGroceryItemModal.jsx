import { motion } from "framer-motion";
import { AlertCircle, PackagePlus, X } from "lucide-react";
import { useMemo, useState } from "react";

const categories = [
  "Protein",
  "Vegetable",
  "Fruit",
  "Carbs",
  "Dairy",
  "Spice",
  "Drink",
  "Other",
];

const priorities = ["Needed", "Optional"];

function AddGroceryItemModal({ onClose, onAddItem, onValidateItem }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Vegetable",
    priority: "Needed",
    mealName: "",
  });

  const validationMessage = useMemo(() => {
    if (!formData.name.trim() || !onValidateItem) {
      return "";
    }

    return onValidateItem(formData.name.trim());
  }, [formData.name, onValidateItem]);

  const canSubmit = formData.name.trim() && !validationMessage;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const newItem = {
      name: formData.name.trim(),
      category: formData.category,
      priority: formData.priority,
      forMeals: [formData.mealName.trim() || "Custom meal"],
    };

    onAddItem(newItem);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1b1f15] via-[#14170f] to-[#0f120c] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[#d7f75b]/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-sm font-extrabold text-sky-300">
                <PackagePlus size={15} />
                Grocery item
              </div>

              <h2 className="display-font text-3xl font-extrabold">
                Add item to shopping list
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#b7b89f]">
                Add only what you need. MealMind will warn you if the item is
                already in your kitchen.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#c9cab3] transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-extrabold">
                    Item name
                  </span>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Example: Lettuce, Tuna, Wraps"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#77796f] ${
                      validationMessage
                        ? "border-orange-300/40 bg-orange-400/[0.06] focus:border-orange-300/60"
                        : "border-white/10 bg-[#0d0f09] focus:border-sky-300/50"
                    }`}
                  />
                </label>

                {validationMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-start gap-3 rounded-2xl border border-orange-300/20 bg-orange-400/10 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
                      <AlertCircle size={18} />
                    </div>

                    <div>
                      <p className="display-font font-extrabold text-orange-200">
                        Smart grocery notice
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#c9cab3]">
                        {validationMessage}
                      </p>
                    </div>
                  </motion.div>
                )}

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-extrabold">
                    Needed for
                  </span>

                  <input
                    name="mealName"
                    value={formData.mealName}
                    onChange={handleChange}
                    placeholder="Example: Chicken Wrap"
                    className="w-full rounded-2xl border border-white/10 bg-[#0d0f09] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#77796f] focus:border-sky-300/50"
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
                  <span className="mb-3 block text-sm font-extrabold">
                    Category
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const isActive = formData.category === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            setFormData((currentData) => ({
                              ...currentData,
                              category,
                            }))
                          }
                          className={`rounded-2xl px-3 py-2 text-xs font-extrabold transition ${
                            isActive
                              ? "bg-sky-300 text-[#10120c]"
                              : "border border-white/10 bg-[#0d0f09] text-[#c9cab3] hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
                  <span className="mb-3 block text-sm font-extrabold">
                    Priority
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {priorities.map((priority) => {
                      const isActive = formData.priority === priority;

                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() =>
                            setFormData((currentData) => ({
                              ...currentData,
                              priority,
                            }))
                          }
                          className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                            isActive
                              ? "bg-[#d7f75b] text-[#10120c]"
                              : "border border-white/10 bg-[#0d0f09] text-[#c9cab3] hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {priority}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#b7b89f]">
                    Needed items should be bought first. Optional items are nice
                    to have but not urgent.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 font-extrabold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-[#d7f75b] px-5 py-3 font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default AddGroceryItemModal;