import { motion } from 'framer-motion';
import { Trophy, Coins, Sparkles, ArrowRight, Star } from 'lucide-react';

const StageCompletionPopup = ({
  currentStage,
  nextStage,
  coinsEarned,
  levelBonus,
  onClose
}) => {
  const totalReward = (coinsEarned || 0) + (levelBonus || 0);

  return (
    <motion.div
      key="stage-complete"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          mass: 0.5
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-gradient-to-br from-purple-900/95 via-pink-900/90 to-cyan-900/85 border border-purple-400/50 rounded-3xl p-8 md:p-10 text-center shadow-[0_40px_120px_rgba(17,12,28,0.8)] overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.5, 1.2], rotate: 360 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.3, 1], rotate: -360 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Trophy Icon with Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="p-4 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-400/30 border-2 border-yellow-400/50"
              >
                <Trophy className="w-16 h-16 md:w-20 md:h-20 text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
              </motion.div>

              {/* Floating Stars */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 1, 0],
                    x: [0, (i - 1) * 40, (i - 1) * 60],
                    y: [0, -20, -40]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5 + i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Congratulations Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent mb-3">
              آفرین! تبریک می‌گم! 🎉
            </h2>
            <p className="text-white/90 text-lg md:text-xl font-semibold mb-2">
              مرحله {currentStage} رو با موفقیت رد کردی!
            </p>
          </motion.div>

          {/* Rewards Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="my-8 space-y-4"
          >
            {/* Total Coins Earned */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 space-x-reverse mb-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Coins className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                </motion.div>
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  +{totalReward}
                </span>
              </div>
              <p className="text-white/80 text-sm md:text-base">
                سکه جمع کردی!
              </p>
            </div>

            {/* Breakdown */}
            {levelBonus > 0 && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-center space-x-1 space-x-reverse text-cyan-300 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">{coinsEarned}</span>
                  </div>
                  <p className="text-white/60 text-xs">پاداش کلمه آخر</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-center space-x-1 space-x-reverse text-purple-300 mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold">{levelBonus}</span>
                  </div>
                  <p className="text-white/60 text-xs">جایزه تکمیل مرحله</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Next Stage Info */}
          {nextStage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border border-purple-400/30 rounded-2xl p-5 mb-6"
            >
              <div className="flex items-center justify-center space-x-2 space-x-reverse text-purple-200 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">مرحله بعدی</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                مرحله {nextStage}
              </p>
              <p className="text-white/70 text-sm mt-2">
                آماده‌ای برای چالش جدید؟
              </p>
            </motion.div>
          )}

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-400 hover:via-pink-400 hover:to-cyan-400 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] transition-all flex items-center justify-center space-x-3 space-x-reverse group"
          >
            <span>بریم مرحله بعدی</span>
            <motion.div
              animate={{ x: [-5, 0, -5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </motion.button>

          {/* Motivational Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-4 text-white/50 text-xs md:text-sm"
          >
            عالی پیش می‌ری! همینطوری ادامه بده 💪
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StageCompletionPopup;
