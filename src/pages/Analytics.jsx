import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarDays,
  ChefHat,
  Cloud,
  Flame,
  Leaf,
  Loader2,
  PieChart,
  Sparkles,
  Trophy,
  Utensils,
  Wallet,
  TrendingUp,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import PremiumCard from "../components/ui/PremiumCard";
import ProgressRing from "../components/ui/ProgressRing";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const SAVED_MEALS_KEY = "mealmind_saved_meals";
const COOKED_HISTORY_KEY = "mealmind_cooked_history";
const SETTINGS_KEY = "mealmind_settings";
const WEEKLY_GOAL = 5;
const DEFAULT_TAKEAWAY_ESTIMATE = 2.5;

const defaultSettings = {
  currency: "KWD",
  region: "Kuwait",
  dietPreference: "No preference",
  budgetMode: "Balanced",
  expiryStrictness: "Normal",
  smartSuggestions: true,
  groceryAutoGroup: true,
  lowStockAlerts: true,
  demoMode: false,
};

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function loadSettings() {
  return {
    ...defaultSettings,
    ...readStorage(SETTINGS_KEY, {}),
  };
}

function getTakeawayEstimate(settings) {
  if (settings.budgetMode === "Strict saver") return 2;
  if (settings.budgetMode === "Flexible") return 3;
  return DEFAULT_TAKEAWAY_ESTIMATE;
}

function formatMoney(value, currency = "KWD") {
  return `${Number(value || 0).toFixed(3)} ${currency}`;
}

function getStartOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getDaysAgo(days) {
  const date = getStartOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function getWeekLabel(startDate, endDate) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function getCookedMealDate(item) {
  const date = new Date(
    item.cookedAt || item.cooked_at || item.date || item.createdAt
  );

  return Number.isFinite(date.getTime()) ? date : null;
}

function getSavedMealCost(meal) {
  return Number(meal?.estimatedCost || meal?.totalExtraCost || meal?.cost || 0);
}

function getMealType(meal) {
  return meal?.type || meal?.mealType || "Meal";
}

function getCookedCost(item, savedMeals) {
  const directCost = Number(item.estimatedCost || item.totalExtraCost || 0);

  if (directCost > 0) return directCost;

  const matchingMeal = savedMeals.find((meal) => meal.id === item.mealId);
  return getSavedMealCost(matchingMeal);
}

function getWeeklyData(cookedHistory, savedMeals, settings) {
  const takeawayEstimate = getTakeawayEstimate(settings);

  return [3, 2, 1, 0].map((weekOffset) => {
    const daysBackStart = weekOffset * 7 + 6;
    const daysBackEnd = weekOffset * 7;

    const startDate = getDaysAgo(daysBackStart);
    const endDate = getDaysAgo(daysBackEnd);
    endDate.setHours(23, 59, 59, 999);

    const weekItems = cookedHistory.filter((item) => {
      const cookedDate = getCookedMealDate(item);
      if (!cookedDate) return false;
      return cookedDate >= startDate && cookedDate <= endDate;
    });

    const mealCost = weekItems.reduce((total, item) => {
      return total + getCookedCost(item, savedMeals);
    }, 0);

    const takeawayCost = weekItems.length * takeawayEstimate;
    const estimatedSaved = Math.max(0, takeawayCost - mealCost);

    return {
      week: weekOffset === 0 ? "This week" : getWeekLabel(startDate, endDate),
      meals: weekItems.length,
      saved: Number(estimatedSaved.toFixed(3)),
    };
  });
}

function getFavoriteCategories(cookedHistory, savedMeals) {
  const counts = cookedHistory.reduce((acc, item) => {
    const matchingMeal = savedMeals.find((meal) => meal.id === item.mealId);
    const type = item.type || getMealType(matchingMeal);

    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return [];
  }

  return Object.entries(counts)
    .map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
}

function getTopRepeatMeal(cookedHistory) {
  const counts = cookedHistory.reduce((acc, item) => {
    const name = item.name || "Saved meal";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] || null;
}

function rowToSavedMeal(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    name: row.name || data.name || "Saved meal",
    type: row.type || data.type || data.mealType || "Meal",
    mealType: row.type || data.mealType || data.type || "Meal",
    cuisine: row.cuisine || data.cuisine || "Simple",
    mood: row.mood || data.mood || "Any",
    time: Number(row.time_minutes || data.time || data.totalTime || 20),
    totalTime: Number(row.time_minutes || data.totalTime || data.time || 20),
    difficulty: row.difficulty || data.difficulty || "Easy",
    match: Number(row.match_score || data.match || data.matchScore || 80),
    matchScore: Number(row.match_score || data.matchScore || data.match || 80),
    estimatedCost: Number(row.estimated_cost || data.estimatedCost || 0),
    totalExtraCost: Number(
      row.estimated_cost || data.totalExtraCost || data.estimatedCost || 0
    ),
    savedAt:
      row.saved_at || data.savedAt || row.created_at || new Date().toISOString(),
  };
}

function rowToCookedEntry(row) {
  const data = row.data || {};

  return {
    ...data,
    id: row.id,
    mealId: row.meal_id || data.mealId || null,
    name: row.name || data.name || "Cooked meal",
    cookedAt:
      row.cooked_at ||
      data.cookedAt ||
      row.created_at ||
      new Date().toISOString(),
    estimatedCost: Number(row.estimated_cost || data.estimatedCost || 0),
    type: row.type || data.type || "Meal",
    source: row.source || data.source || "Analytics",
  };
}

function CloudSyncBadge({ syncStatus }) {
  const content = {
    loading: {
      label: "Loading cloud analytics",
      icon: Loader2,
      className: "border-sky-300/20 bg-sky-400/10 text-sky-300",
      spin: true,
    },
    synced: {
      label: "Cloud synced",
      icon: Cloud,
      className: "border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]",
      spin: false,
    },
    local: {
      label: "Local only",
      icon: PieChart,
      className: "border-white/10 bg-white/[0.06] text-[#c9cab3]",
      spin: false,
    },
    error: {
      label: "Cloud sync issue",
      icon: AlertTriangle,
      className: "border-red-300/20 bg-red-400/10 text-red-300",
      spin: false,
    },
  };

  const current = content[syncStatus] || content.synced;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-xs font-extrabold ${current.className}`}
    >
      <Icon size={15} className={current.spin ? "animate-spin" : ""} />
      {current.label}
    </div>
  );
}

function PremiumTooltip({ active, payload, label, currency }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12150f]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <p className="mb-2 text-sm font-extrabold text-[#fff8e8]">{label}</p>

      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-bold text-[#b7b89f]">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {entry.dataKey === "saved"
            ? formatMoney(entry.value, currency)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, description, color = "lime" }) {
  const colors = {
    lime: "bg-[#d7f75b]/12 text-[#d7f75b]",
    orange: "bg-orange-400/15 text-orange-300",
    blue: "bg-sky-400/15 text-sky-300",
    purple: "bg-violet-400/15 text-violet-300",
  };

  return (
    <PremiumCard className="p-4" hover>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colors[color]}`}
        >
          <Icon size={19} />
        </div>

        <p className="text-sm font-bold text-[#8f927e]">{label}</p>
      </div>

      <h3 className="display-font text-2xl font-extrabold text-[#fff8e8]">
        {value}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#b7b89f]">{description}</p>
    </PremiumCard>
  );
}

function MiniMetric({ icon: Icon, label, value, color = "lime" }) {
  const colors = {
    lime: "bg-[#d7f75b]/12 text-[#d7f75b]",
    orange: "bg-orange-400/15 text-orange-300",
    blue: "bg-sky-400/15 text-sky-300",
    purple: "bg-violet-400/15 text-violet-300",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f120c]/60 p-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
      >
        <Icon size={18} />
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-[#8f927e]">
          {label}
        </p>
        <h4 className="display-font mt-0.5 text-lg font-extrabold">{value}</h4>
      </div>
    </div>
  );
}

function WeekMiniCard({ week, meals, saved, currency }) {
  const progress = Math.min(100, Math.round((meals / WEEKLY_GOAL) * 100));

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="display-font text-base font-extrabold">{week}</h4>
          <p className="mt-1 text-xs font-bold text-[#8f927e]">
            {meals} meal{meals === 1 ? "" : "s"} ·{" "}
            {formatMoney(saved, currency)}
          </p>
        </div>

        <span className="rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#d7f75b]">
          {progress}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#d7f75b] to-[#f4a340]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CategoryProgress({ item, index }) {
  const colors = [
    "from-[#d7f75b] to-[#f4a340]",
    "from-sky-300 to-[#d7f75b]",
    "from-orange-300 to-red-300",
    "from-violet-300 to-sky-300",
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f120c]/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-[#fff8e8]">{item.name}</h4>
          <p className="text-xs text-[#8f927e]">
            {item.value} cooked meal{item.value === 1 ? "" : "s"}
          </p>
        </div>

        <span className="text-sm font-extrabold text-[#d7f75b]">
          {item.percentage}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${
            colors[index % colors.length]
          }`}
          style={{ width: `${item.percentage}%` }}
        />
      </div>
    </div>
  );
}

function AnalyticsEmptyState({ onOpenDecideMeal, onOpenMealHistory }) {
  return (
    <section className="relative mt-5 overflow-hidden rounded-[1.9rem] border border-[#d7f75b]/15 bg-gradient-to-br from-[#1d2315]/90 via-[#141811]/90 to-[#0d100a]/95 p-8 text-center shadow-2xl shadow-black/20 md:p-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b] shadow-lg shadow-[#d7f75b]/10">
          <TrendingUp size={34} />
        </div>

        <h2 className="display-font text-3xl font-extrabold">
          Cook meals to unlock progress
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#b7b89f] md:text-base">
          Analytics starts after you save a meal and mark it as cooked. Then
          MealMind can show weekly progress, money saved, favorite categories,
          and repeat meals.
        </p>

        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenDecideMeal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c] shadow-lg shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]"
          >
            <ChefHat size={18} />
            Open Decide Meal
          </button>

          <button
            type="button"
            onClick={onOpenMealHistory}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <CalendarDays size={18} />
            Open Meal History
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <Sparkles size={20} className="mx-auto mb-3 text-[#d7f75b]" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Save a meal
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Pick something from Decide Meal.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ChefHat size={20} className="mx-auto mb-3 text-orange-300" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Mark it cooked
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Do this from Meal History.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <Trophy size={20} className="mx-auto mb-3 text-sky-300" />
            <p className="text-sm font-extrabold text-[#fff8e8]">
              Watch progress
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8f927e]">
              Stats unlock automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyProgressPanel({
  cookedThisWeek,
  weeklyCookingData,
  savedMealsWithMissing,
  settings,
}) {
  const goalProgress = Math.min(
    100,
    Math.round((cookedThisWeek / WEEKLY_GOAL) * 100)
  );

  const thisWeek = weeklyCookingData[weeklyCookingData.length - 1];

  return (
    <PremiumCard glow className="p-5 md:p-6" delay={0.05} hover={false}>
      <div className="mb-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={goalProgress}
            size={118}
            stroke={10}
            label="Goal"
            icon={Flame}
            color="#d7f75b"
            delay={0.15}
          />

          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
              <Flame size={15} />
              Weekly progress
            </div>

            <h3 className="display-font text-3xl font-extrabold">
              {cookedThisWeek} / {WEEKLY_GOAL} meals this week
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b7b89f]">
              {cookedThisWeek >= WEEKLY_GOAL
                ? "Weekly goal completed. Keep the streak going."
                : `${
                    WEEKLY_GOAL - cookedThisWeek
                  } more home-cooked meal${
                    WEEKLY_GOAL - cookedThisWeek === 1 ? "" : "s"
                  } completes your weekly goal.`}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
          <MiniMetric
            icon={Utensils}
            label="Cooked"
            value={`${cookedThisWeek} meals`}
            color="lime"
          />

          <MiniMetric
            icon={Wallet}
            label="Saved"
            value={formatMoney(thisWeek.saved, settings.currency)}
            color="blue"
          />

          <MiniMetric
            icon={Leaf}
            label="Reusable"
            value={`${savedMealsWithMissing} meals`}
            color="orange"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {weeklyCookingData.map((week) => (
          <WeekMiniCard
            key={week.week}
            week={week.week}
            meals={week.meals}
            saved={week.saved}
            currency={settings.currency}
          />
        ))}
      </div>
    </PremiumCard>
  );
}

function SavingsTrendPanel({ weeklyCookingData, settings, takeawayEstimate }) {
  const hasTrendData = weeklyCookingData.some((week) => week.saved > 0);

  return (
    <PremiumCard className="p-5 md:p-6" delay={0.12} hover={false}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1 text-sm font-extrabold text-orange-300">
            <Wallet size={15} />
            Money saved
          </div>

          <h3 className="display-font text-2xl font-extrabold">
            Savings trend
          </h3>

          <p className="mt-1 text-sm text-[#b7b89f]">
            Based on {formatMoney(takeawayEstimate, settings.currency)} average
            takeaway estimate.
          </p>
        </div>

        <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300 sm:flex">
          <TrendingUp size={21} />
        </div>
      </div>

      {hasTrendData ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyCookingData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.07)"
                vertical={false}
              />

              <XAxis
                dataKey="week"
                stroke="#8f927e"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#8f927e"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                content={<PremiumTooltip currency={settings.currency} />}
              />

              <Line
                type="monotone"
                dataKey="saved"
                name={`Saved ${settings.currency}`}
                stroke="#f4a340"
                strokeWidth={4}
                dot={{
                  r: 5,
                  fill: "#f4a340",
                  stroke: "#10120c",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 8,
                  fill: "#d7f75b",
                  stroke: "#10120c",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-white/10 bg-[#0f120c]/60 p-6 text-center">
          <TrendingUp size={34} className="mx-auto mb-3 text-orange-300" />
          <h4 className="display-font text-xl font-extrabold">
            No savings trend yet
          </h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#b7b89f]">
            Mark more meals as cooked to build a real weekly savings trend.
          </p>
        </div>
      )}
    </PremiumCard>
  );
}

function FavoriteCategoriesPanel({ favoriteCategories }) {
  return (
    <PremiumCard className="p-5 md:p-6" delay={0.16} hover={false}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
          <PieChart size={21} />
        </div>

        <div>
          <h3 className="display-font text-2xl font-extrabold">
            Favorite categories
          </h3>

          <p className="text-sm text-[#b7b89f]">What you cook most often.</p>
        </div>
      </div>

      {favoriteCategories.length > 0 ? (
        <div className="space-y-3">
          {favoriteCategories.map((item, index) => (
            <CategoryProgress key={item.name} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-white/10 bg-[#0f120c]/60 p-6 text-center">
          <PieChart size={34} className="mx-auto mb-3 text-orange-300" />
          <h4 className="display-font text-xl font-extrabold">
            No favorite category yet
          </h4>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#b7b89f]">
            Cook saved meals to see your most common meal types here.
          </p>
        </div>
      )}
    </PremiumCard>
  );
}

function RecentWinsPanel({ achievements }) {
  return (
    <PremiumCard className="p-5 md:p-6" delay={0.2} hover={false}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
            <Trophy size={21} />
          </div>

          <div>
            <h3 className="display-font text-2xl font-extrabold">
              Recent wins
            </h3>

            <p className="text-sm text-[#b7b89f]">
              Small progress moments from your activity.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b] sm:flex">
          <Sparkles size={14} />
          {achievements.filter((item) => item.active).length} wins
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
        {achievements.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                item.active
                  ? "border-[#d7f75b]/25 bg-[#d7f75b]/10"
                  : "border-white/10 bg-white/[0.035]"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  item.active
                    ? "bg-[#d7f75b] text-[#10120c]"
                    : "bg-white/[0.06] text-[#8f927e]"
                }`}
              >
                <Icon size={18} />
              </div>

              <div>
                <h4 className="display-font text-base font-extrabold">
                  {item.title}
                </h4>
                <p className="mt-0.5 text-xs leading-5 text-[#b7b89f]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PremiumCard>
  );
}

function Analytics() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(() => loadSettings());
  const [savedMeals, setSavedMeals] = useState(() =>
    safeArray(readStorage(SAVED_MEALS_KEY, []))
  );
  const [cookedHistory, setCookedHistory] = useState(() =>
    safeArray(readStorage(COOKED_HISTORY_KEY, []))
  );
  const [syncStatus, setSyncStatus] = useState("loading");

  async function fetchCloudAnalyticsData() {
    if (!user?.id) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("loading");

    const [settingsResult, savedMealsResult, cookedHistoryResult] =
      await Promise.all([
        supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("saved_meals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("cooked_history")
          .select("*")
          .eq("user_id", user.id)
          .order("cooked_at", { ascending: false }),
      ]);

    if (settingsResult.error) {
      console.error("Analytics settings fetch error:", settingsResult.error.message);
      setSyncStatus("error");
      return;
    }

    if (savedMealsResult.error) {
      console.error(
        "Analytics saved meals fetch error:",
        savedMealsResult.error.message
      );
      setSyncStatus("error");
      return;
    }

    if (cookedHistoryResult.error) {
      console.error(
        "Analytics cooked history fetch error:",
        cookedHistoryResult.error.message
      );
      setSyncStatus("error");
      return;
    }

    const cloudSettings =
      settingsResult.data?.settings || settingsResult.data?.data || null;

    const nextSettings = {
      ...defaultSettings,
      ...readStorage(SETTINGS_KEY, {}),
      ...(cloudSettings || {}),
    };

    const nextSavedMeals = safeArray(savedMealsResult.data).map(rowToSavedMeal);
    const nextCookedHistory = safeArray(cookedHistoryResult.data).map(
      rowToCookedEntry
    );

    setSettings(nextSettings);
    setSavedMeals(nextSavedMeals);
    setCookedHistory(nextCookedHistory);

    saveStorage(SETTINGS_KEY, nextSettings);
    saveStorage(SAVED_MEALS_KEY, nextSavedMeals);
    saveStorage(COOKED_HISTORY_KEY, nextCookedHistory);

    setSyncStatus("synced");
  }

  useEffect(() => {
    fetchCloudAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const takeawayEstimate = useMemo(
    () => getTakeawayEstimate(settings),
    [settings]
  );

  const weeklyCookingData = useMemo(() => {
    return getWeeklyData(cookedHistory, savedMeals, settings);
  }, [cookedHistory, savedMeals, settings]);

  const favoriteCategories = useMemo(() => {
    return getFavoriteCategories(cookedHistory, savedMeals);
  }, [cookedHistory, savedMeals]);

  const cookedThisWeek = weeklyCookingData[weeklyCookingData.length - 1].meals;
  const totalCookedMeals = cookedHistory.length;

  const totalMealCost = cookedHistory.reduce((total, item) => {
    return total + getCookedCost(item, savedMeals);
  }, 0);

  const estimatedTakeawayCost = totalCookedMeals * takeawayEstimate;
  const estimatedSaved = Math.max(0, estimatedTakeawayCost - totalMealCost);

  const savedMealsWithMissing = savedMeals.filter((meal) => {
    return safeArray(meal.missingItems || meal.missingIngredientDetails).length > 0;
  }).length;

  const topRepeatMeal = getTopRepeatMeal(cookedHistory);
  const hasAnyData = savedMeals.length > 0 || cookedHistory.length > 0;

  const achievements = [
    {
      title: "First save",
      description: "You saved your first meal.",
      active: savedMeals.length > 0,
      icon: Sparkles,
    },
    {
      title: "Home cook",
      description: "You cooked at least one saved meal.",
      active: cookedHistory.length > 0,
      icon: ChefHat,
    },
    {
      title: "Weekly goal",
      description: `Cook ${WEEKLY_GOAL} meals in one week.`,
      active: cookedThisWeek >= WEEKLY_GOAL,
      icon: Trophy,
    },
  ];

  function openDecideMeal() {
    window.location.href = "/decide-meal";
  }

  function openMealHistory() {
    window.location.href = "/meal-history";
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Analytics"
        title="Your cooking progress"
        description="A simple summary of meals cooked, money saved, favorite categories, and weekly progress."
        action={<CloudSyncBadge syncStatus={syncStatus} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Utensils}
          label="Meals cooked"
          value={totalCookedMeals}
          description="Total meals marked as cooked."
          color="lime"
        />

        <SummaryCard
          icon={Wallet}
          label="Money saved"
          value={formatMoney(estimatedSaved, settings.currency)}
          description={`Compared against ${formatMoney(
            takeawayEstimate,
            settings.currency
          )} takeaway average.`}
          color="blue"
        />

        <SummaryCard
          icon={Leaf}
          label="Saved meals"
          value={savedMeals.length}
          description="Meals ready to cook again."
          color="orange"
        />

        <SummaryCard
          icon={Flame}
          label="Top repeat"
          value={topRepeatMeal ? topRepeatMeal[0] : "None"}
          description={
            topRepeatMeal
              ? `${topRepeatMeal[1]} cooked time${
                  topRepeatMeal[1] === 1 ? "" : "s"
                }.`
              : "Cook a saved meal to create a favorite."
          }
          color="purple"
        />
      </section>

      {!hasAnyData ? (
        <AnalyticsEmptyState
          onOpenDecideMeal={openDecideMeal}
          onOpenMealHistory={openMealHistory}
        />
      ) : (
        <>
          <section className="mt-5">
            <WeeklyProgressPanel
              cookedThisWeek={cookedThisWeek}
              weeklyCookingData={weeklyCookingData}
              savedMealsWithMissing={savedMealsWithMissing}
              settings={settings}
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <SavingsTrendPanel
              weeklyCookingData={weeklyCookingData}
              settings={settings}
              takeawayEstimate={takeawayEstimate}
            />

            <div className="space-y-5">
              <FavoriteCategoriesPanel favoriteCategories={favoriteCategories} />
              <RecentWinsPanel achievements={achievements} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Analytics;