import { motion } from "framer-motion";
import { CalendarDays, PackagePlus, StickyNote, X } from "lucide-react";
import { useState } from "react";
import LocationIcon from "./LocationIcon";

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

const locations = ["Fridge", "Freezer", "Pantry", "Spices", "Out of Stock"];

function getAutomaticStatus(location, daysLeft) {
  if (location === "Out of Stock") {
    return "Out of stock";
  }

  if (daysLeft === "" || daysLeft === null) {
    if (location === "Pantry" || location === "Spices") {
      return "Stocked";
    }

    return "Fresh";
  }

  const numberOfDays = Number(daysLeft);

  if (numberOfDays <= 4) {
    return "Use soon";
  }

  return "Fresh";
}

function AddPantryItemModal({ onClose, onAddItem }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Protein",
    quantity: "",
    location: "Fridge",
    daysLeft: "",
    note: "",
  });

  const predictedStatus = getAutomaticStatus(
    formData.location,
    formData.daysLeft
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    const isOutOfStock = formData.location === "Out of Stock";

    if (!isOutOfStock && !formData.quantity.trim()) {
      return;
    }

    const newItem = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: isOutOfStock ? "0" : formData.quantity.trim(),
      location: formData.location,
      daysLeft: formData.daysLeft === "" ? null : Number(formData.daysLeft),
      status: predictedStatus,
      note: formData.note.trim(),
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
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1b1f15] via-[#14170f] to-[#0f120c] p-5 shadow-2xl shadow-black/50 md:p-6"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
                <PackagePlus size={15} />
                Pantry item
              </div>

              <h2 className="display-font text-3xl font-extrabold">
                Add something to your kitchen
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#b7b89f]">
                Add only what matters. MealMind will automatically decide if it
                is fresh, stocked, expiring soon, or out of stock.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#c9cab3] transition hover:bg-white/10 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
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
                      placeholder="Example: Chicken, Milk, Rice"
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0f09] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#77796f] focus:border-[#d7f75b]/50"
                    />
                  </label>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-extrabold">
                      Amount
                    </span>

                    <input
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      disabled={formData.location === "Out of Stock"}
                      placeholder={
                        formData.location === "Out of Stock"
                          ? "Not needed for out of stock"
                          : "Example: 500g, 1 bottle, 8 pieces"
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0f09] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#77796f] focus:border-[#d7f75b]/50 disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
                  <span className="mb-3 block text-sm font-extrabold">
                    Storage location
                  </span>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {locations.map((location) => {
                      const isActive = formData.location === location;

                      return (
                        <button
                          key={location}
                          type="button"
                          onClick={() =>
                            setFormData((currentData) => ({
                              ...currentData,
                              location,
                              daysLeft:
                                location === "Out of Stock"
                                  ? ""
                                  : currentData.daysLeft,
                            }))
                          }
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                            isActive
                              ? "border-[#d7f75b]/40 bg-[#d7f75b]/10 text-[#d7f75b]"
                              : "border-white/10 bg-[#0d0f09] text-[#c9cab3] hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <LocationIcon type={location} size="sm" />
                          <span className="text-sm font-extrabold">
                            {location}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
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
                              ? "bg-[#d7f75b] text-[#10120c]"
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
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-extrabold">
                      <CalendarDays size={17} />
                      Days until expiry
                    </span>

                    <input
                      name="daysLeft"
                      type="number"
                      min="0"
                      value={formData.daysLeft}
                      disabled={formData.location === "Out of Stock"}
                      onChange={handleChange}
                      placeholder="Leave empty if not needed"
                      className="w-full rounded-2xl border border-white/10 bg-[#0d0f09] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#77796f] focus:border-[#d7f75b]/50 disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d0f09] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8f927e]">
                      Auto status
                    </p>

                    <p
                      className={`mt-1 display-font text-xl font-extrabold ${
                        predictedStatus === "Use soon"
                          ? "text-orange-300"
                          : predictedStatus === "Out of stock"
                          ? "text-red-300"
                          : "text-[#d7f75b]"
                      }`}
                    >
                      {predictedStatus}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#b7b89f]">
                      This is calculated from location and expiry, so the user
                      does not need to choose it manually.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-extrabold">
                      <StickyNote size={17} />
                      Note optional
                    </span>

                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Example: Use for dinner this week."
                      className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-[#0d0f09] px-4 py-3 text-sm font-semibold leading-6 outline-none placeholder:text-[#77796f] focus:border-[#d7f75b]/50"
                    />
                  </label>
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
                className="rounded-2xl bg-[#d7f75b] px-5 py-3 font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e6ff7d]"
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

export default AddPantryItemModal;