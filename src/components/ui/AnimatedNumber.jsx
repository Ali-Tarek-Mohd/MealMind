import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

function AnimatedNumber({ value = 0, suffix = "", decimals = 0, delay = 0 }) {
  const count = useMotionValue(0);

  const rounded = useTransform(count, (latest) => {
    return `${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1,
      delay,
      ease: "easeOut",
    });

    return controls.stop;
  }, [count, value, delay]);

  return <motion.span>{rounded}</motion.span>;
}

export default AnimatedNumber;