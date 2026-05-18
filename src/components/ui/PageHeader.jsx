import { motion } from "framer-motion";

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {eyebrow && (
          <p className="mb-2 text-sm font-extrabold text-[#d7f75b]">
            {eyebrow}
          </p>
        )}

        <h2 className="display-font text-4xl font-extrabold tracking-tight md:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-2xl text-[#b7b89f]">{description}</p>
        )}
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          {action}
        </motion.div>
      )}
    </header>
  );
}

export default PageHeader;