import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function QuickActionCard({
  icon: Icon,
  title,
  description,
  color = "green",
  to,
  onClick,
}) {
  const navigate = useNavigate();

  const colorClasses = {
    green: "bg-[#d7f75b]/12 text-[#d7f75b]",
    orange: "bg-orange-400/15 text-orange-300",
    blue: "bg-sky-400/15 text-sky-300",
  };

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-5 text-left shadow-xl shadow-black/10 transition hover:border-white/20"
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${colorClasses[color]} transition group-hover:scale-110`}
      >
        <Icon size={22} />
      </div>

      <h3 className="display-font font-extrabold">{title}</h3>

      <p className="mt-1 text-sm leading-6 text-[#b7b89f]">{description}</p>
    </motion.button>
  );
}

export default QuickActionCard;