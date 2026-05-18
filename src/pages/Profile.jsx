import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  Database,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Utensils,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const STORAGE_KEYS = [
  "mealmind_pantry_items",
  "mealmind_grocery_items",
  "mealmind_saved_meals",
  "mealmind_cooked_history",
  "mealmind_settings",
];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.email?.split("@")?.[0] ||
    "MealMind user"
  );
}

function formatDate(value) {
  if (!value) return "Recently";

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently";
  }
}

function StatCard({ icon: Icon, label, value, hint, tone = "lime" }) {
  const toneClass =
    tone === "blue"
      ? "bg-sky-400/15 text-sky-300"
      : tone === "orange"
      ? "bg-orange-400/15 text-orange-300"
      : tone === "purple"
      ? "bg-violet-400/15 text-violet-300"
      : "bg-[#d7f75b]/15 text-[#d7f75b]";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur"
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={21} strokeWidth={2.5} />
      </div>

      <p className="text-sm font-bold text-[#b7b89f]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[#fff8e8]">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#8f927e]">
        {hint}
      </p>
    </motion.div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-sm font-bold text-[#8f927e]">{label}</p>
      <p className="break-all text-right text-sm font-extrabold text-[#fff8e8]">
        {value}
      </p>
    </div>
  );
}

export default function Profile() {
  const { user, loadingAuth } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const localStats = useMemo(() => {
    const pantry = safeArray(readStorage("mealmind_pantry_items", []));
    const grocery = safeArray(readStorage("mealmind_grocery_items", []));
    const savedMeals = safeArray(readStorage("mealmind_saved_meals", []));
    const cooked = safeArray(readStorage("mealmind_cooked_history", []));

    const totalRecords = STORAGE_KEYS.reduce((total, key) => {
      const value = readStorage(key, null);

      if (Array.isArray(value)) {
        return total + value.length;
      }

      if (value && typeof value === "object") {
        return total + Object.keys(value).length;
      }

      return total;
    }, 0);

    return {
      pantry: pantry.length,
      grocery: grocery.length,
      savedMeals: savedMeals.length,
      cooked: cooked.length,
      totalRecords,
    };
  }, []);

  if (!loadingAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(error.message);
      setLoggingOut(false);
      return;
    }

    window.location.href = "/auth";
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative min-h-full text-[#fff8e8]"
    >
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1f2917]/90 via-[#11170e]/95 to-[#090d08]/95 p-6 shadow-2xl shadow-black/25 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d7f75b]/14 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[#d7f75b] text-[#10120c] shadow-2xl shadow-[#d7f75b]/20">
              <UserRound size={32} strokeWidth={2.5} />
            </div>

            <div>
              <p className="mb-2 text-sm font-extrabold text-[#d7f75b]">
                Profile
              </p>

              <h1 className="display-font text-4xl font-extrabold tracking-tight md:text-5xl">
                {getDisplayName(user)}
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[#b7b89f] md:text-base">
                Manage your MealMind account, cloud connection, and sign out
                safely when you are done.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-4 text-sm font-extrabold text-[#d7f75b]">
              <Cloud size={18} />
              Account connected
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 text-sm font-extrabold text-red-200 transition hover:-translate-y-0.5 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={18} />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      </section>

      {logoutError && (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {logoutError}
        </div>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Utensils}
          label="Pantry items"
          value={localStats.pantry}
          hint="Items currently stored in your pantry."
        />

        <StatCard
          icon={Database}
          label="Grocery items"
          value={localStats.grocery}
          hint="Shopping list items saved in this workspace."
          tone="blue"
        />

        <StatCard
          icon={Sparkles}
          label="Saved meals"
          value={localStats.savedMeals}
          hint="Meals ready to cook again."
          tone="orange"
        />

        <StatCard
          icon={ShieldCheck}
          label="Local records"
          value={localStats.totalRecords}
          hint="Records currently stored in this browser."
          tone="purple"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]">
              <Mail size={20} strokeWidth={2.5} />
            </div>

            <div>
              <h2 className="display-font text-2xl font-extrabold">
                Account details
              </h2>
              <p className="mt-1 text-sm font-medium text-[#b7b89f]">
                Your current logged-in MealMind account.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <DetailRow label="Name" value={getDisplayName(user)} />
            <DetailRow label="Email" value={user?.email || "No email"} />
            <DetailRow
              label="Created"
              value={formatDate(user?.created_at)}
            />
            <DetailRow
              label="Provider"
              value={user?.app_metadata?.provider || "email"}
            />
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-[#d7f75b]/20 bg-[#d7f75b]/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7f75b]/15 text-[#d7f75b]">
              <Cloud size={20} strokeWidth={2.5} />
            </div>

            <div>
              <h2 className="display-font text-2xl font-extrabold">
                Cloud sync status
              </h2>
              <p className="mt-1 text-sm font-medium text-[#d7f75b]/80">
                Supabase is connected and ready.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#d7f75b]/20 bg-black/20 p-4">
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Authentication is active
              </p>
              <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                Your login and account session are handled by Supabase.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-extrabold text-[#fff8e8]">
                Data sync comes next
              </p>
              <p className="mt-2 text-sm leading-6 text-[#b7b89f]">
                Pantry, grocery, saved meals, cooked history, and settings are
                still local until we connect each page to your database tables.
              </p>
            </div>

            <button
              type="button"
              onClick={() => (window.location.href = "/settings")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]"
            >
              Open settings
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </motion.main>
  );
}