import { motion } from 'framer-motion';
import { Loader2, Swords } from 'lucide-react';
import clsx from 'clsx';

const statusCopy = {
  idle: 'نبرد سریع',
  searching: 'در حال پیدا کردن حریف...',
  matched: 'حریف پیدا شد!'
};

const QuickMatchButton = ({ status = 'idle', onStart, onCancel, onlineCount = 0 }) => {
  const isSearching = status === 'searching';
  const isMatched = status === 'matched';

  return (
    <div className="bg-glass backdrop-blur-xl rounded-3xl border border-white/10 p-6 text-center shadow-glass">
      <p className="text-white/70 mb-2">بازیکنان آنلاین: {onlineCount}</p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={isSearching ? onCancel : onStart}
        className={clsx(
          'w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-lg font-bold transition-all',
          isSearching
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
            : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white',
        )}
      >
        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
        <span>{statusCopy[status] || statusCopy.idle}</span>
      </motion.button>
      {isSearching && (
        <button onClick={onCancel} className="mt-4 text-white/70 hover:text-white text-sm">
          لغو جستجو
        </button>
      )}
      {isMatched && <p className="text-emerald-400 mt-3">آماده شو! نبرد داره شروع می‌شه</p>}
    </div>
  );
};

export default QuickMatchButton;
