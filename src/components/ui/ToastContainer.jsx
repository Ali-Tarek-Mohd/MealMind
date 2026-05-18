import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

function getToastTheme(type) {
  if (type === "error") {
    return {
      icon: TriangleAlert,
      iconClass: "bg-red-400/15 text-red-300",
      borderClass: "border-red-300/20",
      glowClass: "bg-red-400/10",
    };
  }

  if (type === "info") {
    return {
      icon: Info,
      iconClass: "bg-sky-400/15 text-sky-300",
      borderClass: "border-sky-300/20",
      glowClass: "bg-sky-400/10",
    };
  }

  return {
    icon: CheckCircle2,
    iconClass: "bg-[#d7f75b]/12 text-[#d7f75b]",
    borderClass: "border-[#d7f75b]/20",
    glowClass: "bg-[#d7f75b]/10",
  };
}

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handleToast(event) {
      const toast = event.detail;

      setToasts((currentToasts) => [toast, ...currentToasts].slice(0, 4));

      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((item) => item.id !== toast.id)
        );
      }, 2800);
    }

    window.addEventListener("mealmind-toast", handleToast);

    return () => {
      window.removeEventListener("mealmind-toast", handleToast);
    };
  }, []);

  function closeToast(id) {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[9999] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const theme = getToastTheme(toast.type);
          const Icon = theme.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`pointer-events-auto relative overflow-hidden rounded-[1.4rem] border ${theme.borderClass} bg-[#12150f]/90 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl`}
            >
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full ${theme.glowClass} blur-2xl`}
              />

              <div className="relative flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${theme.iconClass}`}
                >
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="display-font font-extrabold text-[#fff8e8]">
                    {toast.type === "error"
                      ? "Something went wrong"
                      : toast.type === "info"
                      ? "MealMind"
                      : "Success"}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-[#b7b89f]">
                    {toast.message}
                  </p>
                </div>

                <button
                  onClick={() => closeToast(toast.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#b7b89f] transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;