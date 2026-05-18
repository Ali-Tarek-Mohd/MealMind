function getLocationTheme(type) {
  const themes = {
    Fridge: {
      bg: "bg-sky-400/15",
      text: "text-sky-300",
      border: "border-sky-300/15",
    },
    Freezer: {
      bg: "bg-cyan-400/15",
      text: "text-cyan-300",
      border: "border-cyan-300/15",
    },
    Pantry: {
      bg: "bg-amber-400/15",
      text: "text-amber-300",
      border: "border-amber-300/15",
    },
    Spices: {
      bg: "bg-orange-400/15",
      text: "text-orange-300",
      border: "border-orange-300/15",
    },
    "Out of Stock": {
      bg: "bg-red-400/15",
      text: "text-red-300",
      border: "border-red-300/15",
    },
    All: {
      bg: "bg-[#d7f75b]/12",
      text: "text-[#d7f75b]",
      border: "border-[#d7f75b]/15",
    },
  };

  return themes[type] ?? themes.All;
}

function FridgeSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M5 10h14" stroke="currentColor" strokeWidth="2" />
      <path d="M8 6h1.5M8 14h1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FreezerSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M12 3v18M5.6 6.2l12.8 11.6M18.4 6.2 5.6 17.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m9 4 3 3 3-3M9 20l3-3 3 3M4 9l4 1-1-4M20 9l-4 1 1-4M4 15l4-1-1 4M20 15l-4-1 1 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PantrySvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 9.5 12 4l8 5.5V20H4V9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 20v-7h8v7M8 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpicesSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M8 8h8l-.7 11a2 2 0 0 1-2 1.9h-2.6a2 2 0 0 1-2-1.9L8 8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9 4h6v4H9V4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M10 13h4M10 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function OutOfStockSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M6 7h12l-1 13H7L6 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 7a3 3 0 0 1 6 0M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AllSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H9v5H4V6.5ZM15 4h2.5A2.5 2.5 0 0 1 20 6.5V9h-5V4ZM4 15h5v5H6.5A2.5 2.5 0 0 1 4 17.5V15ZM15 15h5v2.5a2.5 2.5 0 0 1-2.5 2.5H15v-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon({ type = "All", size = "md", showLabel = false }) {
  const theme = getLocationTheme(type);

  const icons = {
    Fridge: <FridgeSvg />,
    Freezer: <FreezerSvg />,
    Pantry: <PantrySvg />,
    Spices: <SpicesSvg />,
    "Out of Stock": <OutOfStockSvg />,
    All: <AllSvg />,
  };

  const sizeClass = size === "sm" ? "h-9 w-9 rounded-xl" : "h-12 w-12 rounded-2xl";

  return (
    <div
      className={`inline-flex items-center gap-2 border ${theme.bg} ${theme.text} ${theme.border} ${
        showLabel ? "rounded-2xl px-3 py-2" : sizeClass
      } justify-center`}
    >
      {icons[type] ?? icons.All}
      {showLabel && <span className="text-sm font-extrabold">{type}</span>}
    </div>
  );
}

export default LocationIcon;