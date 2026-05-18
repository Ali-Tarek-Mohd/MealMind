import { motion } from "framer-motion";
import { Alarm, ArrowRight, Fire, Leaf } from "@phosphor-icons/react";
import { expiringItems } from "../data/demoData";
import PremiumCard from "./ui/PremiumCard";
import ProgressRing from "./ui/ProgressRing";
import PremiumButton from "./ui/PremiumButton";

function UseSoonCard() {
  return (
    <PremiumCard glow className="p-5 md:p-6" delay={0.08}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1 text-sm font-extrabold text-orange-300">
            <Alarm size={15} weight="fill" />
            Needs attention
          </div>

          <h3 className="display-font text-2xl font-extrabold">Use soon</h3>

          <p className="mt-1 text-sm leading-6 text-[#b7b89f]">
            Rescue ingredients before they lose freshness.
          </p>
        </div>

        <ProgressRing
          value={74}
          size={86}
          stroke={8}
          label="Rescue"
          icon={Leaf}
          color="#f4a340"
          delay={0.25}
        />
      </div>

      <div className="space-y-3">
        {expiringItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.12 + index * 0.08 }}
            className="group rounded-2xl border border-white/10 bg-[#11130d]/70 p-4 transition hover:border-orange-300/20 hover:bg-orange-400/[0.06]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-400/15 text-orange-300">
                  <Fire size={19} weight="duotone" />
                </div>

                <div>
                  <h4 className="font-extrabold">{item.name}</h4>
                  <p className="text-sm text-[#b7b89f]">{item.tag}</p>
                </div>
              </div>

              <span className="rounded-full bg-orange-400/15 px-3 py-1 text-sm font-extrabold text-orange-300">
                {item.days} days
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5">
        <PremiumButton variant="secondary" icon={ArrowRight} className="w-full">
          Open Use Soon
        </PremiumButton>
      </div>
    </PremiumCard>
  );
}

export default UseSoonCard;