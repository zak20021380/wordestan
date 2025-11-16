import { AnimatePresence, motion } from 'framer-motion';

const OpponentWordNotification = ({ word }) => (
  <AnimatePresence>
    {word && (
      <motion.div
        key={word}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="fixed top-28 right-4 z-[90] pointer-events-none"
      >
        <div className="bg-gradient-to-r from-blue-500/90 via-sky-500/90 to-cyan-400/90 border border-white/10 shadow-[0_15px_45px_rgba(14,165,233,0.45)] rounded-2xl px-5 py-3 text-white text-sm font-semibold">
          حریف کلمه «{word}» را پیدا کرد! 🔥
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default OpponentWordNotification;
