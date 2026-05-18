import { motion } from "framer-motion";
import { ChefHat, Clock, ForkKnife, Leaf, Sparkle } from "@phosphor-icons/react";
import ProgressRing from "./ui/ProgressRing";
import PremiumButton from "./ui/PremiumButton";
import { showToast } from "./ui/toast";

function MealPickCard() {
  function handleCookThis() {
    showToast("Chicken Rice Bowl added to today’s cooking plan.");
  }

  function handleChangeMood() {
    showToast("Open Decide Meal to change your mood and get a new pick.", "info");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[2.35rem] border border-white/10 bg-gradient-to-br from-[#252a16] via-[#171a10] to-[#0d0f09] p-6 shadow-2xl shadow-black/35 md:p-8"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d7f75b]/14 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-110px] right-28 h-72 w-72 rounded-full bg-orange-400/12 blur-3xl" />
      <div className="pointer-events-none absolute left-[-120px] top-1/2 h-72 w-72 rounded-full bg-sky-400/5 blur-3xl" />

      <div className="relative grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7f75b]/20 bg-[#d7f75b]/10 px-3 py-1 text-sm font-extrabold text-[#d7f75b]">
              <Sparkle size={15} weight="fill" />
              Tonight’s smart pick
            </div>

            <h3 className="display-font max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
              Chicken Rice Bowl
            </h3>

            <p className="mt-4 max-w-xl text-base leading-7 text-[#c9cab3]">
              Uses chicken before it expires, keeps dinner simple, and matches
              your usual high-protein comfort meals.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-[#fff8e8]">
                <Clock size={16} weight="duotone" />
                25 min
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-[#fff8e8]">
                <ChefHat size={16} weight="duotone" />
                Easy
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-[#fff8e8]">
                <Leaf size={16} weight="duotone" />
                High protein
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-bold text-[#fff8e8]">
                0.400 KWD extra
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PremiumButton icon={ForkKnife} onClick={handleCookThis}>
              Cook This
            </PremiumButton>

            <PremiumButton
              variant="secondary"
              icon={Sparkle}
              onClick={handleChangeMood}
            >
              Change Mood
            </PremiumButton>
          </div>
        </div>

        <div className="relative flex min-h-80 items-center justify-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-80 w-80 items-center justify-center rounded-[3.2rem] border border-white/10 bg-gradient-to-br from-[#fff8e8] via-[#f3d99a] to-[#cc8734] p-5 shadow-2xl shadow-black/35"
          >
            <div className="absolute inset-5 rounded-[2.55rem] bg-gradient-to-br from-[#4b2f15] via-[#9c5a23] to-[#d89b3d]" />

            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff8e8] shadow-2xl shadow-black/20">
              <div className="absolute left-6 top-8 h-16 w-24 rounded-full bg-[#f2d28b]" />
              <div className="absolute bottom-7 right-7 h-16 w-20 rounded-full bg-[#d46a3f]" />
              <div className="absolute left-14 top-16 h-20 w-24 rotate-12 rounded-[2rem] bg-[#b96c32]" />
              <div className="absolute bottom-9 left-9 h-9 w-9 rounded-full bg-[#d7f75b]" />
              <div className="absolute right-10 top-8 h-8 w-8 rounded-full bg-[#d7f75b]" />
              <div className="absolute left-20 bottom-12 h-5 w-5 rounded-full bg-[#f4a340]" />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="absolute -left-5 top-8 rounded-2xl border border-white/20 bg-[#10120c]/85 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-xl"
            >
              <p className="text-xs font-semibold text-[#b7b89f]">Uses soon</p>
              <p className="font-extrabold text-orange-300">
                Chicken · 3 days
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="absolute -right-8 bottom-5 rounded-[2rem] border border-white/20 bg-[#10120c]/85 p-3 shadow-xl shadow-black/25 backdrop-blur-xl"
            >
              <ProgressRing
                value={91}
                size={112}
                stroke={9}
                label="Match"
                icon={Sparkle}
                delay={0.45}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default MealPickCard;