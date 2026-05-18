import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Utensils,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function FloatingOrb({ className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0.25, 0.65, 0.25],
        scale: [0.95, 1.08, 0.95],
        y: [0, -18, 0],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={className}
    />
  );
}

function BenefitRow({ icon: Icon, title, description }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group flex items-start gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl transition hover:border-[#d7f75b]/25 hover:bg-[#d7f75b]/[0.055]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d7f75b]/15 bg-[#d7f75b]/10 text-[#d7f75b] transition group-hover:scale-105 group-hover:bg-[#d7f75b] group-hover:text-[#10120c]">
        <Icon size={20} strokeWidth={2.5} />
      </div>

      <div>
        <h3 className="display-font text-base font-extrabold text-[#fff8e8]">
          {title}
        </h3>
        <p className="mt-1 text-sm font-medium leading-6 text-[#9fa38d]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8f927e]">
        {label}
      </p>
      <p className="display-font mt-1 text-lg font-extrabold text-[#fff8e8]">
        {value}
      </p>
    </div>
  );
}

function AuthInput({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  rightElement,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[#f8f4dc]">
        {label}
      </span>

      <div className="relative">
        <Icon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858978]"
        />

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cx(
            "h-[54px] w-full rounded-[1.15rem] border border-white/10 bg-[#070b07]/85 pl-11 text-sm font-bold text-[#fff8e8] outline-none transition",
            "placeholder:text-[#656957]",
            "focus:border-[#d7f75b]/50 focus:bg-[#0b1009] focus:shadow-[0_0_0_4px_rgba(215,247,91,0.08)]",
            rightElement ? "pr-12" : "pr-4"
          )}
        />

        {rightElement}
      </div>
    </label>
  );
}

function AuthModeToggle({ isRegister, setMode, clearMessages }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[1.25rem] border border-white/10 bg-[#070b07]/70 p-1.5">
      <button
        type="button"
        onClick={() => {
          setMode("login");
          clearMessages();
        }}
        className={cx(
          "h-11 rounded-2xl text-sm font-extrabold transition",
          !isRegister
            ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20"
            : "text-[#9fa38d] hover:bg-white/[0.06] hover:text-white"
        )}
      >
        Login
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("register");
          clearMessages();
        }}
        className={cx(
          "h-11 rounded-2xl text-sm font-extrabold transition",
          isRegister
            ? "bg-[#d7f75b] text-[#10120c] shadow-lg shadow-[#d7f75b]/20"
            : "text-[#9fa38d] hover:bg-white/[0.06] hover:text-white"
        )}
      >
        Register
      </button>
    </div>
  );
}

function AuthCard({
  isRegister,
  setMode,
  clearMessages,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  errorMessage,
  message,
  loadingSubmit,
  handleSubmit,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26, scale: 0.96, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      className="relative mx-auto w-full max-w-[470px]"
    >
      <div className="absolute -inset-[1px] rounded-[2.25rem] bg-gradient-to-br from-[#d7f75b]/30 via-white/5 to-orange-300/20 opacity-80 blur-[1px]" />

      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#10150d]/86 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7f75b]/14 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative rounded-[1.9rem] border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 text-[#d7f75b]">
                {isRegister ? (
                  <UserPlus size={21} strokeWidth={2.5} />
                ) : (
                  <ShieldCheck size={21} strokeWidth={2.5} />
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f927e]">
                  {isRegister ? "New account" : "Secure access"}
                </p>
                <h2 className="display-font text-xl font-extrabold">
                  {isRegister ? "Create workspace" : "Welcome back"}
                </h2>
              </div>
            </div>

            <div className="hidden rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-xs font-extrabold text-[#d7f75b] sm:block">
              Supabase
            </div>
          </div>

          <AuthModeToggle
            isRegister={isRegister}
            setMode={setMode}
            clearMessages={clearMessages}
          />

          <div className="my-6 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
            <h3 className="display-font text-2xl font-extrabold">
              {isRegister
                ? "Start your kitchen account"
                : "Log in to your kitchen"}
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-[#9fa38d]">
              {isRegister
                ? "Create your account and begin saving MealMind data online."
                : "Continue to your saved pantry, meals, grocery list, and progress."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <AuthInput
                label="Name"
                icon={User}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ali"
              />
            )}

            <AuthInput
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />

            <AuthInput
              label="Password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8f927e] transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold leading-6 text-red-200"
              >
                {errorMessage}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#d7f75b]/20 bg-[#d7f75b]/10 p-4 text-sm font-bold leading-6 text-[#d7f75b]"
              >
                {message}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loadingSubmit}
              className={cx(
                "group relative h-[54px] w-full overflow-hidden rounded-[1.15rem] bg-[#d7f75b] px-5 text-sm font-extrabold text-[#10120c]",
                "shadow-xl shadow-[#d7f75b]/20 transition hover:-translate-y-0.5 hover:bg-[#e4ff75]",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              )}
            >
              <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-[120%]" />

              <span className="relative inline-flex items-center justify-center gap-2">
                {loadingSubmit
                  ? "Please wait..."
                  : isRegister
                  ? "Create account"
                  : "Enter MealMind"}

                {!loadingSubmit && <ArrowRight size={18} />}
              </span>
            </button>
          </form>

          <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-[#070b07]/60 p-4">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d7f75b]/10 text-[#d7f75b]">
              <Check size={15} strokeWidth={3} />
            </div>

            <p className="text-xs font-bold leading-5 text-[#8f927e]">
              Your account uses Supabase authentication and Row Level Security,
              so each user only accesses their own kitchen data.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Auth() {
  const { isLoggedIn, loadingAuth } = useAuth();

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isRegister = mode === "register";

  if (!loadingAuth && isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  function clearMessages() {
    setMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    if (isRegister && !fullName.trim()) {
      setErrorMessage("Enter your name.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoadingSubmit(true);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data?.user) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName.trim(),
          });

          if (profileError) {
            console.error("Profile creation error:", profileError.message);
          }
        }

        setMessage(
          "Account created. If email confirmation is enabled, check your inbox."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setMessage("Logged in successfully.");
      }
    } finally {
      setLoadingSubmit(false);
    }
  }

  const authCardProps = {
    isRegister,
    setMode,
    clearMessages,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errorMessage,
    message,
    loadingSubmit,
    handleSubmit,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050805] text-[#fff8e8]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(215,247,91,0.18),transparent_32%),radial-gradient(circle_at_82%_22%,rgba(244,163,64,0.13),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.10),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.045)_0%,transparent_18%,transparent_70%,rgba(255,255,255,0.035)_100%)]" />
        <div className="absolute inset-0 bg-[#050805]/45" />

        <FloatingOrb
          delay={0}
          className="absolute left-[8%] top-[14%] h-24 w-24 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 blur-sm"
        />
        <FloatingOrb
          delay={1.2}
          className="absolute bottom-[18%] left-[42%] h-20 w-20 rounded-full border border-sky-300/15 bg-sky-300/10 blur-sm"
        />
        <FloatingOrb
          delay={2}
          className="absolute right-[12%] top-[20%] h-28 w-28 rounded-full border border-orange-300/15 bg-orange-300/10 blur-sm"
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_470px] lg:gap-8 lg:px-8 lg:py-6">
        <motion.section
          initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-3xl lg:mx-0"
        >
          <div className="mb-5 flex items-center gap-3 sm:mb-8">
            <motion.div
              whileHover={{ rotate: -4, scale: 1.04 }}
              className="flex h-13 w-13 items-center justify-center rounded-[1.15rem] bg-[#d7f75b] text-[#10120c] shadow-2xl shadow-[#d7f75b]/20 sm:h-15 sm:w-15 sm:rounded-[1.3rem]"
            >
              <Utensils size={28} strokeWidth={2.6} />
            </motion.div>

            <div>
              <h1 className="display-font text-2xl font-extrabold tracking-tight">
                MealMind
              </h1>
              <p className="text-sm font-medium text-[#9fa38d]">
                Smart kitchen assistant
              </p>
            </div>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1.5 text-sm font-extrabold text-[#d7f75b] shadow-lg shadow-[#d7f75b]/5">
            <Cloud size={16} />
            Cloud kitchen workspace
          </div>

          <h2 className="display-font max-w-3xl text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-6xl xl:text-7xl">
            Your kitchen,
            <span className="block bg-gradient-to-r from-[#d7f75b] via-[#fff8e8] to-[#f4a340] bg-clip-text text-transparent">
              beautifully synced.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#b7b89f] sm:mt-6 sm:text-lg sm:leading-8">
            Save your pantry, grocery list, meals, cooking history, and
            preferences under one private account built for real daily use.
          </p>

          <div className="mt-5 lg:hidden">
            <AuthCard {...authCardProps} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:mt-8">
            <MiniStat label="Sync" value="Cloud ready" />
            <MiniStat label="Privacy" value="User locked" />
            <MiniStat label="Flow" value="Meal to pantry" />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:mt-8">
            <BenefitRow
              icon={ShieldCheck}
              title="Private kitchen data"
              description="Every user gets their own pantry, grocery list, meals, and settings."
            />
            <BenefitRow
              icon={Cloud}
              title="Prepared for cloud sync"
              description="Built to work across devices once the app is deployed."
            />
            <BenefitRow
              icon={Sparkles}
              title="Smart meal workflow"
              description="Move from pantry to meal ideas, grocery list, cooking history, and analytics."
            />
            <BenefitRow
              icon={CheckCircle2}
              title="Professional product feel"
              description="A real login experience instead of a simple local demo screen."
            />
          </div>
        </motion.section>

        <div className="hidden lg:block">
          <AuthCard {...authCardProps} />
        </div>
      </div>
    </main>
  );
}

export default Auth;