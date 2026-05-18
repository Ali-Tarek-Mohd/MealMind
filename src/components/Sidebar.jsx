import {
  BarChart3,
  ChefHat,
  History,
  Home,
  ListChecks,
  Menu,
  Settings,
  ShoppingBasket,
  Sparkles,
  Timer,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  { name: "Dashboard", short: "Home", icon: Home, path: "/dashboard" },
  { name: "Pantry", short: "Pantry", icon: ShoppingBasket, path: "/pantry" },
  { name: "Decide Meal", short: "Decide", icon: ChefHat, path: "/decide-meal" },
  { name: "Meal History", short: "History", icon: History, path: "/meal-history" },
  { name: "Use Soon", short: "Soon", icon: Timer, path: "/use-soon" },
  { name: "Grocery List", short: "Grocery", icon: ListChecks, path: "/grocery-list" },
  { name: "Analytics", short: "Stats", icon: BarChart3, path: "/analytics" },
  { name: "Settings", short: "Settings", icon: Settings, path: "/settings" },
  { name: "Profile", short: "Profile", icon: UserRound, path: "/profile" },
];

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.email?.split("@")?.[0] ||
    "User"
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20">
        <Utensils size={24} />
      </div>

      <div>
        <h1 className="text-xl font-extrabold tracking-tight">MealMind</h1>
        <p className="text-sm text-[#b7b89f]">Smart kitchen assistant</p>
      </div>
    </div>
  );
}

function DemoCard() {
  function loadDemoNotice() {
    window.location.href = "/settings";
  }

  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-4 shadow-2xl shadow-black/20">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
        <Sparkles size={20} />
      </div>

      <h2 className="font-extrabold">Try demo kitchen</h2>

      <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
        Load sample food, meals, and progress from Settings.
      </p>

      <button
        type="button"
        onClick={loadDemoNotice}
        className="mt-4 w-full rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#10120c] transition hover:-translate-y-0.5 hover:bg-[#fff8e8]"
      >
        Open Settings
      </button>
    </div>
  );
}

function AccountShortcut({ onClick }) {
  const { user } = useAuth();

  return (
    <NavLink
      to="/profile"
      onClick={onClick}
      className={({ isActive }) =>
        `group flex w-full items-center gap-3 rounded-[1.5rem] border px-4 py-3 text-left transition ${
          isActive
            ? "border-[#d7f75b]/35 bg-[#d7f75b]/12 text-[#d7f75b]"
            : "border-white/10 bg-white/[0.04] text-[#d8d9c6] hover:border-[#d7f75b]/25 hover:bg-white/[0.07] hover:text-white"
        }`
      }
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#d7f75b]/12 text-[#d7f75b]">
        <UserRound size={19} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">
          {getDisplayName(user)}
        </p>
        <p className="text-xs font-bold text-[#d7f75b]">Account connected</p>
      </div>
    </NavLink>
  );
}

function NavItems({ onClick }) {
  return (
    <nav className="space-y-2">
      {links.map((link) => {
        const Icon = link.icon;

        return (
          <NavLink
            key={link.name}
            to={link.path}
            onClick={onClick}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                isActive
                  ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/15"
                  : "text-[#d8d9c6] hover:bg-white/[0.06] hover:text-white"
              }`
            }
          >
            <Icon size={19} />
            <span className="font-bold">{link.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function DesktopSidebar() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#0d0f0a]/90 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="mb-8">
        <Brand />
      </div>

      <NavItems />

      <div className="mt-auto space-y-4">
        <AccountShortcut />
        <DemoCard />
      </div>
    </aside>
  );
}

function MobileHeader({ onOpen }) {
  const { user } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-[#0d0f0a]/88 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Brand />

        <div className="flex items-center gap-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                isActive
                  ? "border-[#d7f75b]/35 bg-[#d7f75b] text-[#10120c]"
                  : "border-white/10 bg-white/[0.06] text-[#d7f75b] hover:bg-white/10"
              }`
            }
            aria-label={`Open ${getDisplayName(user)} profile`}
          >
            <UserRound size={20} />
          </NavLink>

          <button
            type="button"
            onClick={onOpen}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#fff8e8] transition hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileDrawer({ open, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close menu"
      />

      <aside
        className={`absolute bottom-0 right-0 top-0 flex w-[88%] max-w-sm flex-col border-l border-white/10 bg-[#0d0f0a] p-5 shadow-2xl shadow-black/50 transition duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <Brand />

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#fff8e8] transition hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <AccountShortcut onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <NavItems onClick={onClose} />
        </div>

        <div className="mt-5">
          <DemoCard />
        </div>
      </aside>
    </div>
  );
}

function MobileBottomNav() {
  const bottomLinks = [
    links[0],
    links[1],
    links[2],
    links[5],
    links[7],
    links[8],
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0d0f0a]/92 px-2 pb-3 pt-2 shadow-2xl shadow-black/35 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-6 gap-1">
        {bottomLinks.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-extrabold transition ${
                  isActive
                    ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/15"
                    : "text-[#c9cab3] hover:bg-white/[0.06] hover:text-white"
                }`
              }
            >
              <Icon size={17} />
              <span className="truncate">{link.short}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <DesktopSidebar />
      <MobileHeader onOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <MobileBottomNav />
    </>
  );
}

export default Sidebar;