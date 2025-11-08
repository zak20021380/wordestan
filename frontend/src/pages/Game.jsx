import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Lightbulb, 
  Sparkles, 
  CheckCircle, 
  XCircle,
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
    submitWord,
    getHint,
    autoSolve,
    isCompletingWord,
    isGettingHint,
    isAutoSolving,
    levelLoading
  } = useGame();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle word submission
  const handleSubmitWord = async () => {
    if (!gameState.currentWord || gameState.currentWord.length < 3) {
      showErrorMessage('کلمه باید حداقل 3 حرف داشته باشد');
      return;
    }

    try {
      const result = await submitWord();
      showSuccessMessage(result.message);

      // Update user coins if provided
      if (result.data) {
        user.coins = result.data.totalCoins;
        user.totalScore = result.data.totalScore;
      }
    } catch (error) {
      showErrorMessage(error.message || 'کلمه نامعتبر');
    }
  };

  const showSuccessMessage = (message) => {
    setShowSuccess(true);
    toast.success(message);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 2000);
  };

  const handleGetHint = async () => {
    if (user.coins < 10) {
      toast.error('سکه کافی برای راهنما وجود ندارد');
      return;
    }

    try {
      await getHint();
    } catch (error) {
      toast.error(error.message || 'دریافت راهنما ناموفق بود');
    }
  };

  const handleAutoSolve = async () => {
    if (user.coins < 50) {
      toast.error('سکه کافی برای حل خودکار وجود ندارد');
      return;
    }

    try {
      await autoSolve();
    } catch (error) {
      toast.error(error.message || 'حل خودکار ناموفق بود');
    }
  };

  // Loading state
  if (levelLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white/60">در حال بارگذاری بازی...</p>
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
          <Trophy className="w-20 h-20 text-primary-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">تبریک می‌گوییم!</h2>
          <p className="text-white/60 text-lg mb-6">
            شما تمام مراحل موجود را تکمیل کردید!
          </p>
          <div className="flex items-center justify-center space-x-2 space-x-reverse text-primary-400">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-semibold">کار فوق‌العاده‌ای بود!</span>
            <Sparkles className="w-6 h-6" />
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
              <h1 className="text-3xl font-bold text-white mb-2">
                مرحله {currentLevel.order}: {currentLevel.name}
              </h1>
              <p className="text-white/60 mb-4">{currentLevel.description}</p>

              {/* Progress Bar */}
              <div className="flex items-center space-x-4 space-x-reverse mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-white/60 mb-1">
                    <span>پیشرفت</span>
                    <span>{completedCount}/{totalCount} کلمه</span>
                  </div>
                  <div className="w-full bg-glass-hover rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full"
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
              <div className="bg-glass-hover rounded-lg px-4 py-3 text-center">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-yellow-400 mb-1">
                  <Coins className="w-5 h-5" />
                  <span className="text-2xl font-bold">{user?.coins || 0}</span>
                </div>
                <p className="text-white/60 text-sm">سکه</p>
              </div>

              <div className="bg-glass-hover rounded-lg px-4 py-3 text-center">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-primary-400 mb-1">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">{user?.totalScore || 0}</span>
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
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleSubmitWord}
                disabled={!gameState.currentWord || isCompletingWord}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-glass-hover disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                {isCompletingWord ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>ارسال کلمه</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="bg-glass-hover hover:bg-glass text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <RotateCcw className="w-5 h-5" />
                <span>شروع مجدد</span>
              </button>
            </div>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-4 p-4 bg-success/20 border border-success/30 rounded-lg text-success flex items-center space-x-2 space-x-reverse"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>کلمه کامل شد!</span>
                </motion.div>
              )}

              {showError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-4 p-4 bg-danger/20 border border-danger/30 rounded-lg text-danger flex items-center space-x-2 space-x-reverse"
                >
                  <XCircle className="w-5 h-5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
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
            <h3 className="text-white font-semibold mb-4 flex items-center space-x-2 space-x-reverse">
              <Target className="w-5 h-5 text-primary-400" />
              <span>کلمه فعلی</span>
            </h3>

            <div className="bg-glass-hover rounded-lg p-4 mb-4 min-h-[60px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {gameState.currentWord ? (
                  <motion.span
                    key={gameState.currentWord}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="text-2xl font-bold text-white tracking-widest"
                  >
                    {gameState.currentWord}
                  </motion.span>
                ) : (
                  <span className="text-white/40">برای اتصال حروف بکشید</span>
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
            <h3 className="text-white font-semibold mb-4">قدرت‌های ویژه</h3>

            <div className="space-y-3">
              <button
                onClick={handleGetHint}
                disabled={isGettingHint || user?.coins < 10}
                className="w-full bg-secondary-500/20 hover:bg-secondary-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Lightbulb className="w-5 h-5 text-secondary-400" />
                  <span>راهنما</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse text-yellow-400">
                  <Coins className="w-4 h-4" />
                  <span>10</span>
                </div>
              </button>

              <button
                onClick={handleAutoSolve}
                disabled={isAutoSolving || user?.coins < 50}
                className="w-full bg-primary-500/20 hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Sparkles className="w-5 h-5 text-primary-400" />
                  <span>حل خودکار</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse text-yellow-400">
                  <Coins className="w-4 h-4" />
                  <span>50</span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Completed Words */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
          >
            <h3 className="text-white font-semibold mb-4">کلمات یافته‌شده</h3>

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
                  هنوز کلمه‌ای پیدا نشده
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