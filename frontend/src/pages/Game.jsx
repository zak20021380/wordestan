import { useRef, useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  CheckCircle,
  Trophy,
  Coins,
  Shuffle,
  Lock,
  LogIn,
  UserPlus,
  ArrowRight,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import GameCanvas from '../components/GameCanvas';
import StageCompletionPopup from '../components/StageCompletionPopup';

const Game = () => {
  const gameCanvasRef = useRef(null);

  const {
    currentLevel,
    gameState,
    autoSolve,
    isAutoSolving,
    levelLoading,
    levelMeta,
    isGuestMode,
    stageCompletion,
    clearStageCompletion
  } = useGame();
  const { user, isAuthenticated } = useAuth();

  const [showMeanings, setShowMeanings] = useState(false);
  const [activeMeaning, setActiveMeaning] = useState(null);

  const levelWordDetails = useMemo(() => {
    if (!Array.isArray(currentLevel?.words)) {
      return new Map();
    }

    const details = new Map();

    currentLevel.words.forEach((entry) => {
      if (!entry) {
        return;
      }

      const text = (typeof entry === 'string' ? entry : entry.text || '').toUpperCase();

      if (!text) {
        return;
      }

      details.set(text, {
        text,
        meaning: typeof entry === 'string' ? undefined : entry.meaning,
      });
    });

    return details;
  }, [currentLevel?.words]);

  const completedWordDetails = useMemo(() => {
    if (!Array.isArray(gameState.completedWords) || gameState.completedWords.length === 0) {
      return [];
    }

    return gameState.completedWords.map((word) => {
      const text = (word || '').toUpperCase();
      const detail = levelWordDetails.get(text);

      return {
        text,
        meaning: detail?.meaning,
      };
    });
  }, [gameState.completedWords, levelWordDetails]);

  const completedWordSet = useMemo(() => {
    if (!Array.isArray(gameState.completedWords)) {
      return new Set();
    }

    return new Set(
      gameState.completedWords
        .filter(Boolean)
        .map((word) => word.toUpperCase())
    );
  }, [gameState.completedWords]);

  const levelWordsByLength = useMemo(() => {
    if (!Array.isArray(currentLevel?.words) || currentLevel.words.length === 0) {
      return [];
    }

    const groups = new Map();

    currentLevel.words.forEach((entry) => {
      if (!entry) {
        return;
      }

      const text = (typeof entry === 'string' ? entry : entry.text || '').toUpperCase();

      if (!text) {
        return;
      }

      const length = text.length;

      if (!groups.has(length)) {
        groups.set(length, []);
      }

      groups.get(length).push(text);
    });

    return Array.from(groups.entries())
      .map(([length, words]) => ({
        length,
        words,
      }))
      .sort((a, b) => a.length - b.length);
  }, [currentLevel?.words]);

  const completedMeaningDetails = useMemo(
    () => completedWordDetails.filter((detail) => detail.meaning),
    [completedWordDetails]
  );

  const hasMeaningWords = completedMeaningDetails.length > 0;

  useEffect(() => {
    setShowMeanings(false);
    setActiveMeaning(null);
  }, [currentLevel?._id]);

  useEffect(() => {
    if (!activeMeaning) {
      return;
    }

    if (!completedMeaningDetails.some((detail) => detail.text === activeMeaning.text)) {
      setActiveMeaning(null);
    }
  }, [completedMeaningDetails, activeMeaning]);

  useEffect(() => {
    if (completedMeaningDetails.length === 0) {
      setShowMeanings(false);
    }
  }, [completedMeaningDetails.length]);

  const handleAutoSolve = async () => {
    if (!isAuthenticated) {
      toast.error('برای استفاده از پاور آپ‌ها باید وارد حساب کاربری شوی!');
      return;
    }

    if ((user?.coins ?? 0) < 50) {
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

  const userLevelsCleared = isAuthenticated ? (user?.levelsCleared ?? 0) : 0;
  const emptyStateStatus = levelMeta?.status;
  const isNewUser = isAuthenticated && userLevelsCleared === 0;
  const noLevelsForNewUser =
    emptyStateStatus === 'no_published_levels' ||
    emptyStateStatus === 'no_levels_for_new_user' ||
    emptyStateStatus === 'all_levels_completed' ||
    (!emptyStateStatus && isNewUser);

  const guestCompletionUnlocked = isGuestMode && levelMeta?.guestCompleted;

  // No more levels available
  if (!currentLevel) {
    if (isGuestMode) {
      const isError = levelMeta?.status === 'guest_level_error';
      return (
        <div className="flex items-center justify-center h-96">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-12 max-w-lg"
          >
            <Sparkles className="w-20 h-20 text-purple-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              {isError ? 'اوه! نتونستیم مرحله رو بیاریم' : 'هنوز مرحله‌ای منتشر نشده!'}
            </h2>
            <p className="text-white/60 text-lg">
              {isError
                ? 'یه مشکلی در ارتباط با سرور پیش اومده. یکم دیگه دوباره امتحان کن یا بعداً سر بزن.'
                : 'به زودی مرحله اول بازی منتشر می‌شه. حتماً برگرد و اولین نفر باش که بازی می‌کنه!'}
            </p>
          </motion.div>
        </div>
      );
    }

    if (isNewUser && noLevelsForNewUser) {
      return (
        <div className="flex items-center justify-center h-96">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-12"
          >
            <Sparkles className="w-20 h-20 text-purple-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              هنوز مرحله‌ای اضافه نشده! زودی میاد! ✨
            </h2>
            <p className="text-white/60 text-lg">
              بازی در حال آماده‌سازیه، صبر کن تا اولین مرحله منتشر بشه.
            </p>
          </motion.div>
        </div>
      );
    }

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
      {isGuestMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-lg shadow-[0_0_30px_rgba(168,85,247,0.25)]"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start space-x-3 space-x-reverse">
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40">
                <Lock className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">در حالت مهمان هستی!</h2>
                <p className="text-white/70 text-sm md:text-base">
                  برای ذخیره پیشرفتت، جمع کردن سکه و باز کردن مراحل بعدی، همین الان ثبت‌نام کن یا وارد شو.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="flex items-center justify-center space-x-2 space-x-reverse bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-semibold py-2.5 px-6 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all"
              >
                <UserPlus className="w-5 h-5" />
                <span>ثبت‌نام رایگان</span>
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center space-x-2 space-x-reverse bg-glass hover:bg-glass-hover border border-glass-border text-white font-semibold py-2.5 px-6 rounded-xl transition-all"
              >
                <LogIn className="w-5 h-5" />
                <span>ورود</span>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

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
              {isGuestMode && (
                <span className="inline-flex items-center space-x-2 space-x-reverse text-xs font-semibold text-white/80 bg-purple-500/30 border border-purple-500/40 rounded-full px-3 py-1 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>حالت مهمان</span>
                </span>
              )}
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
            {isGuestMode ? (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border border-purple-500/30 rounded-lg px-4 py-4 text-center shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                  <p className="text-white/80 font-semibold mb-2">امتیازها برای کاربرای ثبت‌نامی ذخیره می‌شه</p>
                  <p className="text-white/60 text-sm">
                    با ثبت‌نام می‌تونی سکه جمع کنی و تو جدول امتیازات بدرخشی.
                  </p>
                </div>
              </div>
            ) : (
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
            )}
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
            <GameCanvas ref={gameCanvasRef} />

            {/* Action Buttons */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => gameCanvasRef.current?.shuffleLetters?.()}
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center space-x-2 space-x-reverse"
              >
                <Shuffle className="w-5 h-5" />
                <span>چیدمان جدید</span>
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
            <div className="mb-4 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white/70">کلمات این مرحله</h4>
                <span className="text-xs text-white/50">با هر کشف، حروف کامل می‌شن</span>
              </div>

              {levelWordsByLength.length === 0 ? (
                <div className="text-center text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg py-3">
                  هنوز کلمه‌ای برای این مرحله ثبت نشده.
                </div>
              ) : (
                <div className="space-y-5">
                  {levelWordsByLength.map(({ length, words }) => (
                    <div key={length} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-white/80">
                          کلمات {length} حرفی
                        </span>
                        <span className="text-[11px] text-white/40">{words.length} کلمه</span>
                      </div>

                      <div className="space-y-3">
                        {words.map((word, index) => {
                          const isCompleted = completedWordSet.has(word);
                          const letters = word.split('');

                          return (
                            <div
                              key={`${word}-${index}`}
                              className="flex justify-center gap-2"
                              dir="ltr"
                            >
                              {letters.map((letter, letterIndex) => (
                                <div
                                  key={`${word}-${letterIndex}`}
                                  className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg font-bold tracking-wide uppercase transition-all ${
                                    isCompleted
                                      ? 'border-purple-400/70 bg-gradient-to-br from-purple-500/40 via-pink-500/40 to-cyan-500/40 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                                      : 'border-white/15 bg-white/5 text-transparent'
                                  }`}
                                >
                                  {isCompleted ? letter : ''}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            {isGuestMode ? (
              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-purple-300" />
                </div>
                <p className="text-white/70 mb-4 text-sm">
                  با ثبت‌نام می‌تونی پاور آپ‌ها رو فعال کنی و وقتی گیر کردی، حل خودکار بخری.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-all"
                  >
                    ثبت‌نام و فعال‌سازی پاور آپ‌ها
                  </Link>
                  <Link
                    to="/login"
                    className="bg-glass hover:bg-glass-hover border border-glass-border text-white font-semibold py-2.5 px-4 rounded-lg transition-all"
                  >
                    من قبلاً حساب دارم
                  </Link>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAutoSolve}
                disabled={isAutoSolving || (user?.coins ?? 0) < 50}
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
            )}
          </motion.div>

          {/* Completed Words */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
          >
            <h3 className="font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">کلماتی که پیدا کردی</h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {completedWordDetails.length > 0 ? (
                completedWordDetails.map((detail, index) => {
                  const hasMeaning = Boolean(detail.meaning);
                  const isActiveMeaning = activeMeaning?.text === detail.text;

                  return (
                    <motion.button
                      key={detail.text}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        if (!hasMeaning) {
                          return;
                        }
                        setActiveMeaning(detail);
                        setShowMeanings(true);
                      }}
                      disabled={!hasMeaning}
                      title={hasMeaning ? `معنی: ${detail.meaning}` : undefined}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 border text-success transition-colors ${
                        isActiveMeaning
                          ? 'bg-primary-500/20 border-primary-400/60'
                          : 'bg-success/20 border-success/30'
                      } ${
                        hasMeaning
                          ? 'cursor-pointer hover:bg-primary-500/10 hover:border-primary-400/60 focus:outline-none focus:ring-2 focus:ring-primary-400/40'
                          : 'cursor-default focus:outline-none opacity-80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-success font-medium">{detail.text}</span>
                        {hasMeaning && (
                          <span className="flex items-center space-x-1 space-x-reverse text-primary-200 text-xs bg-primary-500/10 border border-primary-500/20 rounded-md px-2 py-0.5">
                            <Lightbulb className="w-3 h-3" />
                            <span>معنی</span>
                          </span>
                        )}
                      </div>
                      <CheckCircle
                        className={`w-4 h-4 ${
                          isActiveMeaning
                            ? 'text-primary-200 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]'
                            : 'text-success'
                        }`}
                      />
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center text-white/40 py-8">
                  هنوز کلمه‌ای پیدا نکردی
                </div>
              )}
            </div>
            <AnimatePresence>
              {activeMeaning?.meaning && (
                <motion.div
                  key={`meaning-${activeMeaning.text}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 bg-primary-500/10 border border-primary-400/30 rounded-xl p-4"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-400/40">
                      <Lightbulb className="w-5 h-5 text-primary-200" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white/70 mb-1">
                        معنی {activeMeaning.text}
                      </div>
                      <div className="text-primary-100 font-semibold text-lg leading-relaxed">
                        {activeMeaning.meaning}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMeaning(null)}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      بستن
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowMeanings((prev) => !prev)}
                disabled={!hasMeaningWords}
                className={`w-full inline-flex items-center justify-between rounded-lg px-4 py-2 transition-colors ${
                  hasMeaningWords
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary-400/50'
                    : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed focus:outline-none'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Lightbulb className="w-4 h-4 text-primary-200" />
                  <span className="font-medium">معانی کلمات</span>
                </div>
                {showMeanings && hasMeaningWords ? (
                  <ChevronUp className="w-4 h-4 text-white/70" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/70" />
                )}
              </button>
              <AnimatePresence initial={false}>
                {showMeanings && hasMeaningWords && (
                  <motion.div
                    key="meanings-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 space-y-2 overflow-hidden"
                  >
                    {completedMeaningDetails.map((detail) => {
                      const isHighlighted = activeMeaning?.text === detail.text;
                      return (
                        <div
                          key={detail.text}
                          className={`flex items-start space-x-3 space-x-reverse rounded-xl border px-3 py-2 ${
                            isHighlighted
                              ? 'border-primary-400/60 bg-primary-500/15'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-400/30">
                            <BookOpen className="w-4 h-4 text-primary-200" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">{detail.text}</div>
                            <p className="text-white/80 text-sm leading-relaxed mt-1">{detail.meaning}</p>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
              {!hasMeaningWords && (
                <p className="text-white/40 text-xs text-center mt-3">
                  برای دیدن معانی، کلماتی با معنی ذخیره کن.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Guest Completion Popup */}
      <AnimatePresence>
        {guestCompletionUnlocked && (
          <motion.div
            key="guest-complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="max-w-2xl w-full bg-gradient-to-br from-purple-900/90 via-wood-900/95 to-cyan-900/80 border border-purple-400/40 rounded-3xl p-8 text-center shadow-[0_40px_120px_rgba(17,12,28,0.65)]"
            >
              <div className="flex flex-col items-center space-y-4">
                <Sparkles className="w-14 h-14 text-cyan-300 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]" />
                <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                  واااای! عالی بود! برای ادامه ثبت‌نام کن!
                </h2>
                <p className="text-white/80 text-lg max-w-xl">
                  مرحله اول رو ترکوندی! برای اینکه مراحل بعدی رو باز کنی و پیشرفتت همیشه ذخیره بشه، همین الان حساب بساز.
                </p>

                <div className="grid md:grid-cols-3 gap-4 w-full text-left">
                  {["مراحل بیشتری باز می‌شه", "سکه جمع می‌کنی و پاور آپ می‌خری", "تو جدول امتیازات می‌درخشی"].map(benefit => (
                    <div
                      key={benefit}
                      className="flex items-center space-x-3 space-x-reverse bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-300" />
                      <span className="text-white/90 text-sm font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 w-full">
                  <Link
                    to="/register"
                    className="flex items-center justify-center space-x-3 space-x-reverse bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-400 hover:via-secondary-400 hover:to-primary-400 text-white font-semibold py-3 px-8 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all w-full md:w-auto"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>ثبت‌نام و ادامه ماجرا</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center space-x-3 space-x-reverse bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all w-full md:w-auto"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>قبلاً حساب داشتم</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Completion Popup for Authenticated Users */}
      <AnimatePresence>
        {stageCompletion && !isGuestMode && (
          <StageCompletionPopup
            currentStage={stageCompletion.currentStage}
            nextStage={stageCompletion.nextStage}
            coinsEarned={stageCompletion.coinsEarned}
            levelBonus={stageCompletion.levelBonus}
            onClose={clearStageCompletion}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;