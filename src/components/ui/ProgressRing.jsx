import { motion } from "framer-motion";

function ProgressRing({
  value = 0,
  size = 120,
  stroke = 10,
  label = "Score",
  icon: Icon,
  color = "#d7f75b",
  trackColor = "rgba(255,255,255,0.08)",
  delay = 0,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.max(0, Math.min(value, 100));
  const offset = circumference - (safeValue / 100) * circumference;

  const isSmall = size < 90;
  const isMedium = size >= 90 && size < 115;

  const valueTextSize = isSmall
    ? "text-lg"
    : isMedium
    ? "text-xl"
    : "text-2xl";

  const labelTextSize = isSmall ? "text-[9px]" : "text-[11px]";
  const iconSize = isSmall ? 0 : isMedium ? 15 : 18;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={stroke}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1.15,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            filter: `drop-shadow(0 0 10px ${color}55)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {Icon && !isSmall && (
          <Icon
            size={iconSize}
            weight="duotone"
            className="mb-1"
            style={{ color }}
          />
        )}

        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.35 }}
          className={`display-font font-extrabold ${valueTextSize}`}
          style={{ color }}
        >
          {safeValue}%
        </motion.span>

        <span
          className={`mt-1 font-extrabold uppercase tracking-tight text-[#b7b89f] ${labelTextSize}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default ProgressRing;