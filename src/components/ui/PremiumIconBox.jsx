function PremiumIconBox({ icon: Icon, color = "lime", size = "md" }) {
  const colors = {
    lime: "bg-[#d7f75b]/12 text-[#d7f75b]",
    orange: "bg-orange-400/15 text-orange-300",
    blue: "bg-sky-400/15 text-sky-300",
    red: "bg-red-400/15 text-red-300",
    white: "bg-white/8 text-white",
  };

  const sizes = {
    sm: "h-9 w-9 rounded-xl",
    md: "h-11 w-11 rounded-2xl",
    lg: "h-13 w-13 rounded-2xl",
  };

  return (
    <div className={`flex items-center justify-center ${sizes[size]} ${colors[color]}`}>
      <Icon size={size === "sm" ? 17 : 21} weight="duotone" />
    </div>
  );
}

export default PremiumIconBox;