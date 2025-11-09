import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  CheckCircle,
  Trophy,
  Coins,
  RotateCcw,
  Target
} from 'lucide-react';
import GameCanvas from '../components/GameCanvas';

const Game = () => {
  const {
    currentLevel,
    gameState,
    autoSolve,
    isAutoSolving,
    levelLoading
  } = useGame();
  const { user } = useAuth();

  const handleAutoSolve = async () => {
    if (user.coins < 50) {
      toast.error('سکه کافی نداری برای حل خودکار!');
      return;
    }

    try {
      await autoSolve();
    } catch (error) {
      toast.error(error.message || 'یه مشکلی پیش اومد!');
    }
  };

  // Loading state
  if (levelLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          <p className="text-white/60">صبر کن، داریم بازی رو میاریم...</p>
        </div>
      </div>
    );
  }

  // No more levels available
  if (!currentLevel) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-12"
        >
          <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">واااای! دمت گرم! 🎉</h2>
          <p className="text-white/60 text-lg mb-6">
            همه مراحل رو رد کردی! افرین!
          </p>
          <div className="flex items-center justify-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            <Sparkles className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <span className="text-xl font-semibold">عالی بود! 🔥</span>
            <Sparkles className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          </div>
        </motion.div>
      </div>
    );
  }

  const completedCount = gameState.completedWords.length;
  const totalCount = currentLevel.words.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Game Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Level Info */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                مرحله {currentLevel.order}
              </h1>
              <p className="text-white/60 mb-4">حروف: {currentLevel.letters}</p>

              {/* Progress Bar */}
              <div className="flex items-center space-x-4 space-x-reverse mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-white/60 mb-1">
                    <span>پیشرفت</span>
                    <span>{completedCount}/{totalCount} کلمه</span>
                  </div>
                  <div className="w-full bg-glass-hover rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 h-2 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-gradient-to-br from-yellow-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center border border-yellow-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-yellow-400 mb-1">
                  <Coins className="w-5 h-5 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">{user?.coins || 0}</span>
                </div>
                <p className="text-white/60 text-sm">سکه</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-purple-400 mb-1">
                  <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{user?.totalScore || 0}</span>
                </div>
                <p className="text-white/60 text-sm">امتیاز</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Canvas */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-glass/30 backdrop-blur-lg rounded-2xl border border-glass-border p-6"
          >
            <GameCanvas />

            {/* Action Buttons */}
            <div className="flex justify-center sm:justify-end mt-6">
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center space-x-2 space-x-reverse"
              >
                <RotateCcw className="w-5 h-5" />
                <span>از اول</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Word Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              <Target className="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <span>کلمه الان</span>
            </h3>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 mb-4 min-h-[60px] flex items-center justify-center shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
              <AnimatePresence mode="wait">
                {gameState.currentWord ? (
                  <motion.span
                    key={gameState.currentWord}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent tracking-widest drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  >
                    {gameState.currentWord}
                  </motion.span>
                ) : (
                  <span className="text-white/40">حروف رو وصل کن</span>
                )}
              </AnimatePresence>
            </div>

            <div className="text-sm text-white/60">
              طول: {gameState.currentWord.length} حرف
            </div>
          </motion.div>

          {/* Power-ups */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
          >
            <h3 className="font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">پاور آپ‌ها</h3>

            <button
              onClick={handleAutoSolve}
              disabled={isAutoSolving || user?.coins < 50}
              className="w-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 text-white py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <Sparkles className="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span>حل خودکار</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse text-yellow-400">
                <Coins className="w-4 h-4" />
                <span>50</span>
              </div>
            </button>
          </motion.div>

          {/* Completed Words */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
          >
            <h3 className="font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">کلماتی که پیدا کردی</h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameState.completedWords.length > 0 ? (
                gameState.completedWords.map((word, index) => (
                  <motion.div
                    key={word}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-success/20 border border-success/30 rounded-lg px-3 py-2"
                  >
                    <span className="text-success font-medium">{word}</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-white/40 py-8">
                  هنوز کلمه‌ای پیدا نکردی
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Game;