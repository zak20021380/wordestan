import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { gameService } from '../services/gameService';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  CheckCircle,
  Trophy,
  Coins,
  Shuffle,
  Loader2,
  Lock,
  LogIn,
  UserPlus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Milestone,
  X,
  PartyPopper,
  Stars,
  Plus,
  Check
} from 'lucide-react';
import GameCanvas from '../components/GameCanvas';
import { addWordToLeitner } from '../services/leitnerService';

const NO_LEVEL_STATUSES = new Set([
  'no_published_levels',
  'no_levels_for_new_user',
  'all_levels_completed',
]);

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
    levelTransition,
    clearLevelTransition,
    autoSolveResult,
    clearAutoSolveResult,
    levelCompletionStatus,
    loadNextLevel,
    loadLevelById,
    powerUpUsage,
    markPowerUpUsed,
  } = useGame();
  const { user, isAuthenticated, updateUser } = useAuth();

  const [showMeanings, setShowMeanings] = useState(false);
  const [activeMeaning, setActiveMeaning] = useState(null);
  const [shuffleUsageCount, setShuffleUsageCount] = useState(0);
  const [shuffleModal, setShuffleModal] = useState({ type: null });
  const [isPurchasingShuffle, setIsPurchasingShuffle] = useState(false);
  const [showAutoSolveModal, setShowAutoSolveModal] = useState(false);
  const [showAutoSolvePrompt, setShowAutoSolvePrompt] = useState(false);
  const [isConfirmingNextLevel, setIsConfirmingNextLevel] = useState(false);
  const [completionPromptContext, setCompletionPromptContext] = useState(null);
  const [powerUpsUsed, setPowerUpsUsed] = useState({ shuffle: false, autoSolve: false });
  const [newLevelsModal, setNewLevelsModal] = useState(null);
  const [leitnerWords, setLeitnerWords] = useState(new Set()); // Track words added to Leitner
  const [addingToLeitner, setAddingToLeitner] = useState(null); // Track loading state per word
  const shuffleCost = 15;
  const currentLevelId = currentLevel?._id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLevelId = searchParams.get('levelId');
  const lastRequestedLevelRef = useRef(null);
  const previousMetaStatusRef = useRef(levelMeta?.status ?? null);
  const hasInitializedMetaStatusRef = useRef(false);
  const hasShownNewLevelsModalRef = useRef(false);
  const faNumberFormatter = useMemo(() => new Intl.NumberFormat('fa-IR'), []);
  const formatNumber = useCallback(
    (value) => {
      if (value === null || value === undefined) {
        return '—';
      }
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        return '—';
      }
      return faNumberFormatter.format(numeric);
    },
    [faNumberFormatter]
  );

  const transitionCopy = useMemo(() => {
    if (!levelTransition) {
      return null;
    }

    const parseOrder = (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      const numeric = Number(value);
      return Number.isNaN(numeric) ? null : numeric;
    };

    const to = parseOrder(
      levelTransition.to ?? levelTransition?.cause?.to ?? levelTransition?.cause?.target
    );
    const from = parseOrder(levelTransition.from ?? levelTransition?.cause?.from);
    const difference =
      typeof levelTransition.difference === 'number'
        ? levelTransition.difference
        : to !== null && from !== null
        ? to - from
        : null;
    const diffValue = difference ?? 0;
    const absDifference = Math.abs(diffValue);
    const isForward = diffValue >= 0;
    let type = levelTransition.type || levelTransition?.cause?.type || 'advanced';
    if (type === 'changed') {
      type = 'advanced';
    }

    const toLabel = to !== null ? `مرحله ${formatNumber(to)}` : 'یک مرحله جدید';
    let title;
    let description;
    let badge;

    if (type === 'completed') {
      title = 'مرحله رو ترکوندی! 🎉';
      description = `تبریک! مرحله قبلی رو کامل کردی و حالا ${toLabel} جلوت قرار داره.`;
      badge = 'اتمام مرحله';
    } else if (type === 'skipped') {
      title = 'پرش سریع به مرحله جدید 🚀';
      if (absDifference > 1) {
        description = `یکهو ${formatNumber(absDifference)} مرحله جلو زدی و حالا توی ${toLabel} هستی.`;
      } else {
        description = `این مرحله رو رد کردی و مستقیم رفتی سراغ ${toLabel}.`;
      }
      badge = 'پرش مرحله';
    } else if (!isForward) {
      title = 'برگشتی یه مرحله عقب 🔁';
      description = `برگشتی به ${toLabel} تا دوباره امتحانش کنی.`;
      badge = 'بازگشت';
      type = 'revisit';
    } else {
      title = 'مرحله جدید باز شد ✨';
      description = `الان وارد ${toLabel} شدی. بزن بریم برای شکار کلمات تازه!`;
      badge = 'مرحله جدید';
      type = 'advanced';
    }

    const differenceLabel =
      absDifference > 0
        ? `${isForward ? '+' : '−'}${formatNumber(absDifference)}`
        : null;

    const differenceSummary =
      absDifference > 0
        ? isForward
          ? `${formatNumber(absDifference)} مرحله جلو رفتی`
          : `${formatNumber(absDifference)} مرحله برگشتی`
        : null;

    return {
      title,
      description,
      badge,
      type,
      from,
      to,
      difference: diffValue,
      absDifference,
      isForward,
      differenceLabel,
      differenceSummary,
      userProgress: levelTransition.userProgress ?? null,
    };
  }, [levelTransition, formatNumber]);

  useEffect(() => {
    setPowerUpsUsed(powerUpUsage);
  }, [powerUpUsage]);

  useEffect(() => {
    setShuffleUsageCount(0);
  }, [currentLevelId]);

  useEffect(() => {
    const status = levelMeta?.status ?? null;
    const hasLevel = Boolean(currentLevel);

    if (!hasInitializedMetaStatusRef.current) {
      previousMetaStatusRef.current = status;
      hasInitializedMetaStatusRef.current = true;

      if (!hasLevel && NO_LEVEL_STATUSES.has(status)) {
        hasShownNewLevelsModalRef.current = false;
      }

      return;
    }

    const previousStatus = previousMetaStatusRef.current;
    const previouslyNoLevels = NO_LEVEL_STATUSES.has(previousStatus);
    const nowInNoLevelState = !hasLevel && NO_LEVEL_STATUSES.has(status);

    if (previouslyNoLevels && hasLevel && !hasShownNewLevelsModalRef.current) {
      setNewLevelsModal({
        previousStatus,
        status,
        levelOrder: currentLevel?.order ?? null,
        timestamp: Date.now(),
      });
      hasShownNewLevelsModalRef.current = true;
    }

    if (nowInNoLevelState) {
      hasShownNewLevelsModalRef.current = false;
    }

    previousMetaStatusRef.current = status;
  }, [levelMeta?.status, currentLevel]);

  useEffect(() => {
    if (!newLevelsModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNewLevelsModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newLevelsModal]);

  const handleCloseNewLevelsModal = useCallback(() => {
    setNewLevelsModal(null);
  }, []);

  const transitionAccent = useMemo(() => {
    if (!transitionCopy) {
      return null;
    }

    switch (transitionCopy.type) {
      case 'completed':
        return {
          icon: 'text-emerald-200',
          chip: 'from-emerald-500/20 to-green-500/20',
          chipBorder: 'border-emerald-500/40',
          chipText: 'text-emerald-100',
        };
      case 'skipped':
        return {
          icon: 'text-amber-200',
          chip: 'from-amber-500/20 to-orange-500/20',
          chipBorder: 'border-amber-500/40',
          chipText: 'text-amber-100',
        };
      case 'revisit':
        return {
          icon: 'text-cyan-200',
          chip: 'from-cyan-500/20 to-blue-500/20',
          chipBorder: 'border-cyan-500/40',
          chipText: 'text-cyan-100',
        };
      default:
        return {
          icon: 'text-primary-200',
          chip: 'from-primary-500/20 to-secondary-500/20',
          chipBorder: 'border-primary-500/40',
          chipText: 'text-primary-100',
        };
    }
  }, [transitionCopy]);

  useEffect(() => {
    if (!requestedLevelId) {
      lastRequestedLevelRef.current = null;
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (requestedLevelId === currentLevelId) {
      lastRequestedLevelRef.current = requestedLevelId;
      return;
    }

    if (lastRequestedLevelRef.current === requestedLevelId) {
      return;
    }

    lastRequestedLevelRef.current = requestedLevelId;

    loadLevelById(requestedLevelId, {
      completionSource: 'manual',
      transitionType: 'changed',
    })
      .catch((error) => {
        toast.error(error.message || 'باز کردن این مرحله ممکن نشد');
        lastRequestedLevelRef.current = null;
        setSearchParams({}, { replace: true });
      });
  }, [requestedLevelId, isAuthenticated, loadLevelById, currentLevelId, setSearchParams]);

  useEffect(() => {
    if (!levelTransition) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        clearLevelTransition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levelTransition, clearLevelTransition]);

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
        _id: typeof entry === 'string' ? undefined : entry._id,
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
        _id: detail?._id,
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

  const totalLevelWordCount = useMemo(() => {
    if (!Array.isArray(currentLevel?.words)) {
      return 0;
    }

    return currentLevel.words.filter(Boolean).length;
  }, [currentLevel?.words]);

  const newLevelsCopy = useMemo(() => {
    if (!newLevelsModal) {
      return null;
    }

    const previousStatus = newLevelsModal.previousStatus;
    const levelOrder = newLevelsModal.levelOrder ?? null;
    const orderLabel = levelOrder ? `مرحله ${formatNumber(levelOrder)}` : 'مرحله جدید';

    let description = 'چند مرحله جدید به بازی اضافه شده و همین الان می‌تونی بری سراغشون.';
    if (previousStatus === 'all_levels_completed') {
      description = 'منتظر مرحله‌های تازه بودی و بالاخره رسیدن! وقتشه دوباره بدرخشی و رکورد تازه بزنی.';
    } else if (previousStatus === 'no_levels_for_new_user') {
      description = 'اولین مرحله‌های بازی منتشر شدن. آماده‌ای اولین تجربه‌ات رو شروع کنی؟';
    } else if (previousStatus === 'no_published_levels') {
      description = 'حالا دیگه بازی آماده‌ست و مرحله‌های تازه در دسترس تو قرار گرفتن. بیا و اولین نفر باش!';
    }

    const spotlight = levelOrder
      ? `از همین الان ${orderLabel} برای بازی آماده‌ست.`
      : 'اولین مرحله همین الآن آماده تجربه کردنه!';

    const progress = levelMeta?.userProgress ?? null;
    const clearedLevels = formatNumber(progress?.levelsCleared ?? (user?.levelsCleared ?? 0));

    const progressSummary = isGuestMode
      ? 'برای اینکه پیشرفت و سکه‌ها همیشه ذخیره بشن، همین الان حساب بساز و بعد برو سراغ مراحل جدید.'
      : `تا حالا ${clearedLevels} مرحله رو پشت سر گذاشتی. آماده‌ای بری سراغ مرحله‌های تازه؟`;

    return {
      badge: 'مرحله‌های تازه',
      title: '🎉 مرحله‌های جدید رسید!',
      description,
      spotlight,
      progressSummary,
      orderLabel,
    };
  }, [newLevelsModal, formatNumber, isGuestMode, levelMeta?.userProgress, user?.levelsCleared]);

  const resolvedClearedLevelsLabel = useMemo(
    () => formatNumber(levelMeta?.userProgress?.levelsCleared ?? (user?.levelsCleared ?? 0)),
    [formatNumber, levelMeta?.userProgress?.levelsCleared, user?.levelsCleared]
  );

  const hasCompletedAllWords = totalLevelWordCount > 0 && completedWordSet.size >= totalLevelWordCount;
  const hasSyncedCompletion = Boolean(levelCompletionStatus?.completed);
  const hasAutoSolveCompletion = Boolean(autoSolveResult?.levelCompleted);
  const shouldShowCompletionPrompt =
    isAuthenticated && showAutoSolvePrompt && (hasAutoSolveCompletion || hasCompletedAllWords || hasSyncedCompletion);
  const CompletionIcon = Trophy;
  const completionIconAccent = 'text-amber-200';
  const completionBadgeStyles = 'text-amber-200 border-amber-300/40 bg-amber-500/10';
  const completionBadgeCopy = 'مرحله تکمیل شد';
  const completionTitleCopy = '🏆 عالی کار! مرحله تموم شد!';
  const completionStars = levelCompletionStatus?.stars ?? autoSolveResult?.starsEarned ?? null;
  const completionPowerUps = levelCompletionStatus?.powerUpsUsed ?? autoSolveResult?.powerUpsUsed ?? powerUpsUsed;
  const usedShuffleThisLevel = Boolean(completionPowerUps?.shuffle);
  const usedAutoSolveThisLevel = Boolean(completionPowerUps?.autoSolve);
  const completionDescriptionCopy = completionStars === 3
    ? 'بدون کمک! عااالی! 🔥'
    : completionStars === 2
      ? 'خوب بود! 👍'
      : completionStars === 1
        ? 'تونستی تمومش کنی! 💪'
        : 'عالی کار کردی! ✨';
  const completionStarElements = useMemo(() => (
    Array.from({ length: 3 }).map((_, index) => {
      const isFilled = completionStars !== null && index < completionStars;
      return (
        <motion.span
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isFilled ? 1 : 0.2,
            scale: isFilled ? 1 : 0.9,
          }}
          transition={{ delay: index * 0.2, duration: 0.35 }}
          className={`text-xl sm:text-2xl ${isFilled
            ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.65)]'
            : 'text-white/20'
          }`}
        >
          {isFilled ? '⭐' : '☆'}
        </motion.span>
      );
    })
  ), [completionStars]);

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
    setShuffleUsageCount(0);
    setShowAutoSolvePrompt(false);
    setCompletionPromptContext(null);
  }, [currentLevelId]);

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

  useEffect(() => {
    if (!shuffleModal.type) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShuffleModal({ type: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shuffleModal.type]);

  useEffect(() => {
    if (!autoSolveResult) {
      setShowAutoSolveModal(false);
      if (!hasCompletedAllWords && !hasSyncedCompletion) {
        setShowAutoSolvePrompt(false);
        setCompletionPromptContext(null);
      }
      return;
    }

    setShowAutoSolveModal(true);
    if (autoSolveResult.levelCompleted) {
      setCompletionPromptContext('auto');
      setShowAutoSolvePrompt(true);
    }
  }, [autoSolveResult, hasCompletedAllWords, hasSyncedCompletion]);

  useEffect(() => {
    if (hasAutoSolveCompletion) {
      return;
    }

    if (hasCompletedAllWords || hasSyncedCompletion) {
      setCompletionPromptContext((prev) => prev ?? 'manual');
      setShowAutoSolvePrompt(true);
    } else {
      setShowAutoSolvePrompt(false);
      setCompletionPromptContext(null);
    }
  }, [hasCompletedAllWords, hasAutoSolveCompletion, hasSyncedCompletion]);

  const handleCloseShuffleModal = useCallback(() => {
    if (isPurchasingShuffle) {
      return;
    }
    setShuffleModal({ type: null });
  }, [isPurchasingShuffle]);

  const handleShuffleClick = useCallback(() => {
    if (!gameCanvasRef.current?.shuffleLetters) {
      return;
    }

    if (shuffleUsageCount === 0) {
      gameCanvasRef.current.shuffleLetters();
      setShuffleUsageCount(1);
      setPowerUpsUsed(prev => (prev.shuffle ? prev : { ...prev, shuffle: true }));
      markPowerUpUsed('shuffle');
      return;
    }

    if (!isAuthenticated) {
      setShuffleModal({ type: 'guest' });
      return;
    }

    if ((user?.coins ?? 0) < shuffleCost) {
      setShuffleModal({ type: 'insufficient' });
      return;
    }

    setShuffleModal({ type: 'confirm' });
  }, [shuffleUsageCount, isAuthenticated, user?.coins, shuffleCost, markPowerUpUsed]);

  const handleConfirmShufflePurchase = useCallback(async () => {
    if (!isAuthenticated || isPurchasingShuffle) {
      if (!isAuthenticated) {
        setShuffleModal({ type: 'guest' });
      }
      return;
    }

    setIsPurchasingShuffle(true);

    try {
      const response = await gameService.purchaseShuffle(currentLevelId);
      const remainingCoins = response?.data?.remainingCoins;

      if (typeof remainingCoins === 'number' && Number.isFinite(remainingCoins)) {
        updateUser({ coins: remainingCoins });
      }

      setShuffleUsageCount(prev => prev + 1);
      setPowerUpsUsed(prev => (prev.shuffle ? prev : { ...prev, shuffle: true }));
      markPowerUpUsed('shuffle');
      setShuffleModal({ type: null });
      gameCanvasRef.current?.shuffleLetters?.();
      toast.success('چیدمان با موفقیت تغییر کرد ✨');
    } catch (error) {
      toast.error(error.message || 'در خرید چیدمان مشکلی پیش اومد');
    } finally {
      setIsPurchasingShuffle(false);
    }
  }, [
    isAuthenticated,
    isPurchasingShuffle,
    currentLevelId,
    updateUser,
    markPowerUpUsed,
  ]);

  const renderShuffleModalContent = () => {
    switch (shuffleModal.type) {
      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">تغییر چیدمان با پرداخت سکه</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                برای تغییر دوباره چیدمان، باید {formatNumber(shuffleCost)} سکه پرداخت کنی. بعد از تایید، حروف با یک ترکیب جدید نمایش داده می‌شن.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">موجودی فعلی</p>
                    <p className="text-lg font-semibold text-white">{formatNumber(user?.coins ?? 0)} سکه</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span>−</span>
                  <span className="font-semibold text-white">{formatNumber(shuffleCost)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleCloseShuffleModal}
                disabled={isPurchasingShuffle}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>انصراف</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmShufflePurchase}
                disabled={isPurchasingShuffle}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPurchasingShuffle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                <span>تایید و پرداخت</span>
              </button>
            </div>
          </div>
        );
      case 'insufficient':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">سکه کافی نیست!</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                برای تغییر دوباره چیدمان به {formatNumber(shuffleCost)} سکه نیاز داری، اما موجودی فعلی‌ت کمتره. می‌تونی به فروشگاه بری و بسته سکه تهیه کنی.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleCloseShuffleModal}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white px-4 py-2.5 rounded-xl transition-all"
              >
                <span>باشه</span>
              </button>
              <Link
                to="/store"
                onClick={handleCloseShuffleModal}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-400 hover:via-secondary-400 hover:to-primary-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all"
              >
                <Coins className="w-4 h-4" />
                <span>رفتن به فروشگاه</span>
              </Link>
            </div>
          </div>
        );
      case 'guest':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">ورود یا ثبت‌نام برای سکه‌ها</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                اولین تغییر چیدمان رایگان بود! برای اینکه بتونی دوباره چیدمان حروف رو عوض کنی و سکه خرج کنی، لازمه وارد حساب کاربری‌ت بشی یا ثبت‌نام کنی.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                to="/register"
                onClick={handleCloseShuffleModal}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-400 hover:via-secondary-400 hover:to-primary-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>ثبت‌نام</span>
              </Link>
              <Link
                to="/login"
                onClick={handleCloseShuffleModal}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white px-5 py-2.5 rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود</span>
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
      const result = await autoSolve();
      setPowerUpsUsed(prev => (prev.autoSolve ? prev : { ...prev, autoSolve: true }));
      markPowerUpUsed('autoSolve');
      return result;
    } catch (error) {
      toast.error(error.message || 'یه مشکلی پیش اومد!');
    }
  };

  const handleAddToLeitner = async (wordId, wordText) => {
    if (!isAuthenticated) {
      toast.error('برای استفاده از جعبه لایتنر باید وارد حساب کاربری شوی!');
      return;
    }

    // Check if already added
    if (leitnerWords.has(wordId)) {
      toast('این کلمه قبلاً به جعبه لایتنر اضافه شده است', {
        icon: '📚',
      });
      return;
    }

    setAddingToLeitner(wordId);

    try {
      await addWordToLeitner(wordId, currentLevelId);

      // Add to local set
      setLeitnerWords(prev => new Set([...prev, wordId]));

      toast.success(
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>کلمه "{wordText}" به جعبه لایتنر اضافه شد!</span>
        </div>,
        {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          },
        }
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'خطا در افزودن به جعبه لایتنر';
      toast.error(errorMessage);
    } finally {
      setAddingToLeitner(null);
    }
  };

  const handleCloseAutoSolveModal = () => {
    setShowAutoSolveModal(false);
    if (!autoSolveResult?.levelCompleted) {
      clearAutoSolveResult();
    }
  };

  const handleNextLevel = useCallback(async () => {
    const levelCompleted = hasAutoSolveCompletion || hasCompletedAllWords || hasSyncedCompletion;

    if (!levelCompleted) {
      setShowAutoSolvePrompt(false);
      setCompletionPromptContext(null);
      clearAutoSolveResult();
      return;
    }

    const contextToRestore = completionPromptContext;

    try {
      setIsConfirmingNextLevel(true);
      setShowAutoSolvePrompt(false);
      setCompletionPromptContext(null);
      await loadNextLevel();
      clearAutoSolveResult();
    } catch (error) {
      toast.error(error.message || 'نتونستیم مرحله بعدی رو بیاریم!');
      setCompletionPromptContext(contextToRestore);
      setShowAutoSolvePrompt(true);
    } finally {
      setIsConfirmingNextLevel(false);
    }
  }, [
    clearAutoSolveResult,
    completionPromptContext,
    hasAutoSolveCompletion,
    hasCompletedAllWords,
    hasSyncedCompletion,
    loadNextLevel,
  ]);

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
                type="button"
                onClick={handleShuffleClick}
                disabled={isPurchasingShuffle}
                aria-busy={isPurchasingShuffle}
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 disabled:hover:from-cyan-500/20 disabled:hover:to-blue-500/20 border border-cyan-500/30 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
              >
                {isPurchasingShuffle ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال تغییر...</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-5 h-5" />
                    <span>چیدمان جدید</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-white/50 text-center">
              اولین تغییر چیدمان رایگانه؛ بعد از اون هر بار {formatNumber(shuffleCost)} سکه هزینه داره.
            </p>
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
                <div className="flex items-start space-x-2 space-x-reverse text-right">
                  <Sparkles className="mt-0.5 w-5 h-5 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <div className="leading-tight">
                    <span className="block text-sm font-semibold text-white">جادوی حل خودکار</span>
                    <span className="block text-[11px] text-white/70">وقتی گیر کردی، اجازه بده جادو یک کلمه تازه برات کشف کنه</span>
                  </div>
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

                  const isInLeitner = leitnerWords.has(detail._id);
                  const isAdding = addingToLeitner === detail._id;

                  return (
                    <motion.div
                      key={detail.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasMeaning) {
                              return;
                            }
                            setActiveMeaning(detail);
                            setShowMeanings(true);
                          }}
                          disabled={!hasMeaning}
                          title={hasMeaning ? `معنی: ${detail.meaning}` : undefined}
                          className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 border text-success transition-colors ${
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
                        </button>

                        {isAuthenticated && (
                          <button
                            type="button"
                            onClick={() => handleAddToLeitner(detail._id, detail.text)}
                            disabled={isAdding || isInLeitner}
                            title={isInLeitner ? 'در جعبه لایتنر' : 'افزودن به جعبه لایتنر'}
                            className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
                              isInLeitner
                                ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                                : 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 active:scale-95'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isAdding ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isInLeitner ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <BookOpen className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
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
      <AnimatePresence>
        {shouldShowCompletionPrompt && (
          <motion.div
            key="auto-solve-banner"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="fixed top-6 left-6 z-[65] max-w-sm"
          >
            <div className="bg-gradient-to-br from-emerald-500/20 via-purple-500/30 to-cyan-500/20 border border-white/15 backdrop-blur-md rounded-2xl p-5 shadow-[0_20px_60px_rgba(76,29,149,0.45)] text-right">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl bg-white/10 border border-white/20 ${completionIconAccent}`}>
                  <CompletionIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-3">
                  {completionPromptContext && (
                    <span className={`inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-tight ${completionBadgeStyles}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {completionBadgeCopy}
                    </span>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white/90">{completionTitleCopy}</p>
                    {completionStars !== null && (
                      <div className="flex items-center gap-1 text-amber-300">
                        {completionStarElements}
                      </div>
                    )}
                    <p className="text-xs text-white/70 leading-relaxed">{completionDescriptionCopy}</p>
                    {(usedShuffleThisLevel || usedAutoSolveThisLevel) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-white/70">
                        {usedShuffleThisLevel && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-amber-100">
                            <Shuffle className="w-3.5 h-3.5" />
                            تغییر چیدمان
                          </span>
                        )}
                        {usedAutoSolveThisLevel && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary-400/40 bg-primary-500/10 px-2.5 py-0.5 text-primary-100">
                            <Sparkles className="w-3.5 h-3.5" />
                            حل خودکار
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleNextLevel}
                      disabled={isConfirmingNextLevel}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white text-sm font-semibold transition-all disabled:opacity-70"
                    >
                      {isConfirmingNextLevel ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>بریم مرحله بعد →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {newLevelsModal && newLevelsCopy && (
          <motion.div
            key="new-levels-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
            onClick={handleCloseNewLevelsModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-purple-950/90 to-slate-950/95 px-6 py-7 text-right shadow-[0_45px_140px_rgba(14,10,45,0.65)] sm:px-10 sm:py-10"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-secondary-500/20 blur-3xl" />
              <button
                type="button"
                onClick={handleCloseNewLevelsModal}
                className="absolute top-5 left-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="بستن"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative flex flex-col gap-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-primary-500/30 via-purple-500/25 to-cyan-500/30 text-white shadow-[0_25px_60px_rgba(88,28,135,0.45)] sm:h-20 sm:w-20">
                      <PartyPopper className="h-8 w-8 drop-shadow-[0_0_18px_rgba(255,255,255,0.45)] sm:h-10 sm:w-10" />
                    </div>
                    <div className="space-y-3 text-right">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-tight text-white/80 sm:text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-primary-200" />
                        <span>{newLevelsCopy.badge}</span>
                      </div>
                      <h2 className="text-2xl font-black leading-snug text-white drop-shadow-[0_10px_30px_rgba(15,23,42,0.35)] sm:text-3xl">
                        {newLevelsCopy.title}
                      </h2>
                      <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                        {newLevelsCopy.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-white">
                        <Milestone className="h-5 w-5 text-primary-200" />
                        <span className="text-sm font-semibold sm:text-base">{newLevelsCopy.orderLabel}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-white/60 sm:text-sm">
                        <Stars className="h-4 w-4 text-amber-300" />
                        <span>{resolvedClearedLevelsLabel} مرحله فتح شده</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-white/70 sm:text-sm">{newLevelsCopy.spotlight}</p>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 via-indigo-500/10 to-cyan-500/20 p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-primary-100" />
                      <span className="text-sm font-semibold sm:text-base">وقت درخشش دوباره ✨</span>
                    </div>
                    <p className="text-xs leading-relaxed text-white/80 sm:text-sm">{newLevelsCopy.progressSummary}</p>
                    {isGuestMode && (
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 transition-all hover:bg-white/20 sm:text-sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>ثبت‌نام و ذخیره پیشرفت</span>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-white/60 sm:text-sm">
                    همین الان وارد مرحله‌ی تازه شو؛ هرچی زودتر شروع کنی، زودتر رکورد جدید می‌زنی.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={handleCloseNewLevelsModal}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_20px_55px_rgba(99,102,241,0.45)] transition-all hover:from-primary-400 hover:to-secondary-400 hover:shadow-[0_25px_65px_rgba(99,102,241,0.55)] sm:text-base"
                    >
                      <span>بزن بریم!</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {shuffleModal.type && (
          <motion.div
            key="shuffle-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
            onClick={handleCloseShuffleModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-lg bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 border border-white/10 rounded-3xl px-6 py-7 sm:px-8 shadow-[0_40px_140px_rgba(12,10,45,0.65)]"
            >
              <button
                type="button"
                onClick={handleCloseShuffleModal}
                disabled={isPurchasingShuffle}
                className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mt-2">{renderShuffleModalContent()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {levelTransition && transitionCopy && (
          <motion.div
            key="level-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-3 py-5 sm:px-4 sm:py-10"
            onClick={clearLevelTransition}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-xl bg-slate-950/95 border border-white/10 rounded-2xl px-4 py-5 sm:px-7 sm:py-8 shadow-lg shadow-primary-900/30 text-right"
            >
              <button
                type="button"
                onClick={clearLevelTransition}
                className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-5 sm:gap-6">
                <div className="sm:hidden space-y-4 text-center">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <Milestone className={`w-6 h-6 ${transitionAccent?.icon ?? 'text-primary-200'}`} />
                    </div>
                    <div className="space-y-2 w-full">
                      <div
                        className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold ${
                          transitionAccent
                            ? `mx-auto bg-gradient-to-r ${transitionAccent.chip} ${transitionAccent.chipText} ${transitionAccent.chipBorder}`
                            : 'mx-auto bg-white/10 border-white/20 text-primary-100'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{transitionCopy.badge}</span>
                      </div>
                      <div className="space-y-1.5 text-white/80">
                        <h3 className="text-base font-bold leading-snug">{transitionCopy.title}</h3>
                        <p className="text-xs leading-relaxed">{transitionCopy.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-white/80">
                    {transitionCopy.from !== null && (
                      <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-[11px]">
                        <p className="text-white/60">مرحله قبلی</p>
                        <p className="text-sm font-semibold text-white">{formatNumber(transitionCopy.from)}</p>
                      </div>
                    )}
                    {transitionCopy.to !== null && (
                      <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-[11px]">
                        <p className="text-white/60">مرحله جدید</p>
                        <p className="text-sm font-semibold text-white">{formatNumber(transitionCopy.to)}</p>
                      </div>
                    )}
                  </div>

                  {transitionCopy.differenceSummary && (
                    <div className="mx-auto flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-white/70">
                      {transitionCopy.isForward ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-cyan-200" />
                      )}
                      <span>{transitionCopy.differenceSummary}</span>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="shrink-0 p-3 rounded-xl bg-white/10 border border-white/15">
                      <Milestone className={`w-8 h-8 sm:w-9 sm:h-9 ${transitionAccent?.icon ?? 'text-primary-200'}`} />
                    </div>
                    <div className="space-y-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          transitionAccent
                            ? `bg-gradient-to-r ${transitionAccent.chip} ${transitionAccent.chipText} ${transitionAccent.chipBorder}`
                            : 'bg-white/10 border-white/20 text-primary-100'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{transitionCopy.badge}</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                          {transitionCopy.title}
                        </h3>
                        <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                          {transitionCopy.description}
                        </p>
                      </div>
                      {transitionCopy.differenceSummary && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[11px] text-white/70">
                          {transitionCopy.isForward ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-200" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-cyan-200" />
                          )}
                          <span>{transitionCopy.differenceSummary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {transitionCopy.to !== null && (
                    <div className="flex sm:block justify-end sm:justify-start">
                      <div className="rounded-xl bg-white/8 border border-white/15 px-4 py-3 text-center min-w-[120px]">
                        <p className="text-xs text-white/60">مرحله جدید</p>
                        <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                          {formatNumber(transitionCopy.to)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {(transitionCopy.from !== null || transitionCopy.to !== null || transitionCopy.differenceLabel) && (
                  <div className="hidden sm:grid sm:grid-cols-3 gap-3">
                    {transitionCopy.from !== null && (
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-right space-y-1">
                        <p className="text-xs text-white/60">مرحله قبلی</p>
                        <p className="text-lg font-semibold text-white">
                          {formatNumber(transitionCopy.from)}
                        </p>
                      </div>
                    )}
                    {transitionCopy.to !== null && (
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-right space-y-1">
                        <p className="text-xs text-white/60">مرحله فعلی</p>
                        <p className="text-lg font-semibold text-white">
                          {formatNumber(transitionCopy.to)}
                        </p>
                      </div>
                    )}
                    {transitionCopy.differenceLabel && (
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-right space-y-1">
                        <p className="text-xs text-white/60">تغییر مرحله</p>
                        <p className="text-base font-semibold text-white">
                          {transitionCopy.differenceLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {transitionCopy.userProgress && (
                  <div className="hidden sm:grid sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-right space-y-1">
                      <p className="text-xs text-white/60">مرحله فعلی بازیکن</p>
                      <p className="text-lg font-semibold text-white">
                        {transitionCopy.userProgress.currentLevel != null
                          ? `مرحله ${formatNumber(transitionCopy.userProgress.currentLevel)}`
                          : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-right space-y-1">
                      <p className="text-xs text-white/60">مراحل تکمیل‌شده</p>
                      <p className="text-lg font-semibold text-white">
                        {formatNumber(transitionCopy.userProgress.levelsCleared ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-right space-y-1">
                      <p className="text-xs text-white/60">امتیاز کل</p>
                      <p className="text-lg font-semibold text-white">
                        {formatNumber(transitionCopy.userProgress.totalScore ?? 0)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/70">
                  <p className="leading-relaxed text-white/70 text-center sm:text-right">
                    {transitionCopy.type === 'completed'
                      ? 'امتیاز مرحله قبل برات ذخیره شد. برای مرحله جدید آماده‌ای؟'
                      : 'تغییر مرحله ذخیره شد. وقتشه ادامه بدی!'}
                  </p>
                  <button
                    type="button"
                    onClick={clearLevelTransition}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-primary-400 hover:via-secondary-400 hover:to-primary-400"
                  >
                    <span>بزن بریم</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAutoSolveModal && autoSolveResult && (
          <motion.div
            key="auto-solve-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={handleCloseAutoSolveModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/10 px-6 py-8 text-center text-white shadow-[0_40px_120px_rgba(12,10,45,0.6)]"
            >
              <button
                type="button"
                onClick={handleCloseAutoSolveModal}
                className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
                <div className="flex flex-col items-center gap-6">
                  <div className="p-3 rounded-2xl bg-primary-500/20 border border-primary-400/30 text-primary-100">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">کلمه‌ای پیدا شد ✨</h3>
                    <p className="text-sm text-white/70">یکی از کلمات با موفقیت پیدا شد.</p>
                  </div>
                  {typeof autoSolveResult?.starsEarned === 'number' && (
                    <div className="flex flex-col items-center gap-1 text-xs text-white/70">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, index) => {
                          const isFilled = index < (autoSolveResult.starsEarned ?? 0);
                          return (
                            <span
                              key={`auto-solve-star-${index}`}
                              className={`text-lg ${isFilled ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]' : 'text-white/20'}`}
                            >
                              {isFilled ? '⭐' : '☆'}
                            </span>
                          );
                        })}
                      </div>
                      <span>
                        {autoSolveResult.starsEarned === 3
                          ? 'بدون کمک! عااالی! 🔥'
                          : autoSolveResult.starsEarned === 2
                            ? 'با یک تغییر چیدمان، دو ستاره گرفتی 🌟'
                            : 'حل خودکار یعنی یک ستاره، ولی مرحله کامل شد 💪'}
                      </span>
                    </div>
                  )}
                  {autoSolveResult?.word?.text && (
                    <div className="w-full rounded-2xl border border-primary-400/30 bg-primary-500/10 p-4">
                      <p className="text-xs text-primary-200 mb-2">کلمه حل‌شده</p>
                      <p className="text-2xl font-extrabold tracking-wide" dir="ltr">
                        {autoSolveResult.word.text}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCloseAutoSolveModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-400 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>باشه</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    </div>
  );
};

export default Game;