import { motion } from "framer-motion";

function PreferencePill({ label, active, onClick, icon: Icon }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
        active
          ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20"
          : "border border-white/10 bg-[#0f120c]/65 text-[#c9cab3] hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      {Icon && <Icon size={16} />}
      {label}
    </motion.button>
  );
}

export default PreferencePill;