import { motion } from "framer-motion";

function PremiumCard({
  children,
  className = "",
  delay = 0,
  glow = false,
  hover = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4, scale: 1.005 } : undefined}
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-white/[0.02] shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
    >
      {glow && (
        <>
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#d7f75b]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />
        </>
      )}

      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default PremiumCard;