import { motion } from "framer-motion";

function PremiumButton({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20 hover:bg-[#e6ff7d]",
    secondary:
      "border border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]",
    danger:
      "bg-red-400/15 text-red-200 border border-red-300/15 hover:bg-red-400/20",
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} weight="bold" />}
      {children}
    </motion.button>
  );
}

export default PremiumButton;