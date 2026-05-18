import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import ToastContainer from "../components/ui/ToastContainer";

function AppLayout({ children }) {
  return (
    <div className="h-screen overflow-hidden bg-[#070b07] text-[#fff8e8]">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[8%] top-[-12%] h-[34rem] w-[34rem] rounded-full bg-[#d7f75b]/10 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[35rem] w-[35rem] rounded-full bg-orange-400/10 blur-[125px]" />
        <div className="absolute bottom-[-14%] left-[38%] h-[35rem] w-[35rem] rounded-full bg-sky-400/8 blur-[130px]" />
      </div>

      <ToastContainer />

      <div className="relative flex h-screen">
        <Sidebar />

        <motion.main
          key={window.location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="h-screen min-w-0 flex-1 overflow-y-auto px-4 pb-28 pt-24 sm:px-5 md:px-8 lg:px-10 lg:pb-8 lg:pt-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export default AppLayout;