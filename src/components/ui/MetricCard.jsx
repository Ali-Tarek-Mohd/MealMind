import AnimatedNumber from "./AnimatedNumber";
import PremiumCard from "./PremiumCard";
import PremiumIconBox from "./PremiumIconBox";

function MetricCard({
  label,
  value,
  suffix = "",
  textValue,
  detail,
  icon,
  color = "lime",
  delay = 0,
}) {
  return (
    <PremiumCard delay={delay} className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        {icon && <PremiumIconBox icon={icon} color={color} />}

        {detail && (
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-bold text-[#b7b89f]">
            {detail}
          </span>
        )}
      </div>

      <p className="text-sm text-[#b7b89f]">{label}</p>

      <h3 className="display-font mt-1 text-2xl font-extrabold">
        {textValue ? (
          textValue
        ) : (
          <AnimatedNumber value={value} suffix={suffix} delay={delay + 0.15} />
        )}
      </h3>
    </PremiumCard>
  );
}

export default MetricCard;