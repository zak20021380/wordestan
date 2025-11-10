import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CheckCircle2,
  Lock,
  Unlock,
  Star,
  Sparkles,
  Play,
  Filter,
  MapPin,
  Coins,
} from 'lucide-react';
import { gameService } from '../services/gameService';
import { useAuth } from '../contexts/AuthContext';

const FILTERS = [
  { id: 'all', label: 'همه' },
  { id: 'completed', label: 'تکمیل شده' },
  { id: 'locked', label: 'قفل شده' },
];

const statusConfig = {
  completed: {
    label: 'تکمیل شده',
    icon: CheckCircle2,
    iconClass: 'text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    chipClass: 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/40',
    cardClass: 'from-emerald-500/10 to-emerald-400/5 border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
  },
  available: {
    label: 'آماده بازی',
    icon: Unlock,
    iconClass: 'text-secondary-200 drop-shadow-[0_0_12px_rgba(192,132,252,0.55)]',
    chipClass: 'bg-secondary-500/15 text-secondary-100 border border-secondary-400/40',
    cardClass: 'from-secondary-500/10 to-primary-500/5 border-secondary-400/40 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
  },
  locked: {
    label: 'قفل',
    icon: Lock,
    iconClass: 'text-white/35',
    chipClass: 'bg-white/10 text-white/60 border border-white/15',
    cardClass: 'from-white/10 to-white/5 border-white/10',
  },
};

const LevelMap = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const hasScrolledRef = useRef(false);
  const gridRef = useRef(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('fa-IR'), []);
  const formatNumber = useCallback(
    (value) => {
      if (value === null || value === undefined) {
        return '۰';
      }
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        return '۰';
      }
      return numberFormatter.format(numeric);
    },
    [numberFormatter]
  );

  const { data, isLoading } = useQuery(
    ['gameLevels'],
    () => gameService.getLevels(),
    {
      staleTime: 60 * 1000,
      onError: (error) => {
        toast.error(error.message || 'بارگذاری مراحل با خطا مواجه شد');
      },
    }
  );

  const levels = data?.data?.levels ?? [];
  const stats = data?.data?.stats ?? {};
  const unlockCost = data?.data?.unlockCost ?? 70;
  const totalStarsEarned = stats.totalStars
    ?? levels.filter(level => level.isCompleted).reduce((sum, level) => sum + (level.stars || 0), 0);
  const maxStarsAvailable = stats.maxStars ?? (levels.length * 3);

  const progressPercentage = useMemo(() => {
    const percentage = stats.progressPercentage ?? null;
    if (percentage !== null && percentage !== undefined) {
      return Math.min(100, Math.max(0, percentage));
    }

    const total = levels.length;
    if (total === 0) {
      return 0;
    }
    const completedCount = levels.filter(level => level.isCompleted).length;
    return Math.round((completedCount / total) * 100);
  }, [levels, stats.progressPercentage]);

  const filteredLevels = useMemo(() => {
    switch (filter) {
      case 'completed':
        return levels.filter(level => level.status === 'completed');
      case 'locked':
        return levels.filter(level => level.status === 'locked');
      default:
        return levels;
    }
  }, [filter, levels]);

  useEffect(() => {
    if (isLoading || hasScrolledRef.current) {
      return;
    }

    const currentLevel = levels.find(level => level.isCurrent);
    if (currentLevel) {
      const element = document.getElementById(`level-card-${currentLevel.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        hasScrolledRef.current = true;
      }
    }
  }, [isLoading, levels]);

  const renderStars = useCallback((count = 0) => {
    return (
      <div className="flex items-center space-x-1 space-x-reverse">
        {Array.from({ length: 3 }).map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.35)] ${
              index < count ? 'text-amber-300 fill-amber-300' : 'text-white/25'
            }`}
          />
        ))}
      </div>
    );
  }, []);

  const unlockMutation = useMutation(
    (levelId) => gameService.unlockLevel(levelId),
    {
      onSuccess: (response) => {
        toast.success('مرحله جدید باز شد! بزن بریم 🚀');
        if (response?.data?.coins !== undefined) {
          updateUser({
            coins: response.data.coins,
            currentLevel: response.data.currentLevel,
          });
        }
        queryClient.invalidateQueries(['gameLevels']);
        if (user?.id) {
          queryClient.invalidateQueries(['nextLevel', user.id]);
        }

        const unlockedLevelId = response?.data?.levelId;
        if (unlockedLevelId) {
          navigate(`/game?levelId=${unlockedLevelId}`);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'باز کردن مرحله با خطا مواجه شد');
      },
    }
  );

  const handleUnlockLevel = useCallback((level) => {
    if (!level?.id || !level.canUnlock) {
      toast.error('برای باز کردن این مرحله باید مراحل قبلی را پیش ببری');
      return;
    }

    if ((user?.coins ?? 0) < unlockCost) {
      toast.error('سکه‌هات کافی نیست! یه سر به فروشگاه بزن 🛒');
      return;
    }

    unlockMutation.mutate(level.id);
  }, [unlockMutation, unlockCost, user?.coins]);

  const handlePlayLevel = useCallback((level) => {
    if (!level?.id) {
      return;
    }

    if (level.isCompleted || level.status === 'completed') {
      toast.success('این مرحله رو قبلاً فتح کردی! 🌟');
      return;
    }

    if (level.status === 'locked') {
      handleUnlockLevel(level);
      return;
    }

    navigate(`/game?levelId=${level.id}`);
  }, [handleUnlockLevel, navigate]);

  const renderLevelCard = (level) => {
    const config = statusConfig[level.status] ?? statusConfig.locked;
    const StatusIcon = level.status === 'available' && level.isCurrent ? Sparkles : config.icon;
    const cardHighlight = level.isCurrent
      ? 'ring-2 ring-secondary-300/70 shadow-[0_0_30px_rgba(192,132,252,0.45)]'
      : '';
    const completedGlow = level.status === 'completed'
      ? 'ring-2 ring-emerald-300/30 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
      : '';

    return (
      <motion.div
        layout
        key={level.id}
        id={`level-card-${level.id}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.25 }}
        whileHover={{ scale: 1.015 }}
        className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl px-5 py-6 min-h-[220px] flex flex-col justify-between transition-all duration-300 ${
          cardHighlight || ''
        } ${completedGlow} bg-gradient-to-br ${config.cardClass}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 space-x-reverse text-white/80">
            <MapPin className="w-4 h-4 text-secondary-200" />
            <span className="text-sm font-medium">مرحله {formatNumber(level.order)}</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.chipClass}`}>
            {level.isCurrent ? 'مرحله فعلی' : config.label}
          </span>
        </div>

        <div className="flex flex-col items-center text-center mt-6 space-y-3">
          <StatusIcon className={`w-12 h-12 ${config.iconClass}`} />
          <p className="text-xl font-black tracking-[0.4em] text-white/90 uppercase">
            {level.letters || '——'}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center space-x-2 space-x-reverse">
              {renderStars(level.stars)}
              <span className="font-semibold text-white/80">{formatNumber(level.completionPercentage)}٪</span>
            </div>
            <span>
              {formatNumber(level.completedWords)} / {formatNumber(level.totalWords)} کلمه
            </span>
          </div>

          <div className="flex flex-col space-y-2">
            {level.status === 'completed' ? (
              <button
                type="button"
                disabled
                className="flex items-center justify-center space-x-2 space-x-reverse rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-100 opacity-90 cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ تکمیل شده</span>
              </button>
            ) : level.status !== 'locked' ? (
              <button
                type="button"
                onClick={() => handlePlayLevel(level)}
                className="flex items-center justify-center space-x-2 space-x-reverse rounded-2xl bg-gradient-to-r from-secondary-500 to-primary-500 px-4 py-2 text-sm font-bold text-white shadow-[0_15px_35px_rgba(168,85,247,0.25)] transition-all hover:shadow-[0_18px_45px_rgba(168,85,247,0.4)]"
              >
                <Play className="w-4 h-4" />
                <span>بازی کن</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleUnlockLevel(level)}
                  disabled={!level.canUnlock || unlockMutation.isLoading}
                  className={`flex items-center justify-center space-x-2 space-x-reverse rounded-2xl px-4 py-2 text-sm font-bold transition-all ${
                    level.canUnlock
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-[0_15px_35px_rgba(251,191,36,0.25)] hover:shadow-[0_18px_45px_rgba(251,191,36,0.35)]'
                      : 'bg-white/5 text-white/40 cursor-not-allowed'
                  } ${unlockMutation.isLoading ? 'opacity-70' : ''}`}
                >
                  <Coins className="w-4 h-4" />
                  <span>باز کن {formatNumber(unlockCost)}🪙</span>
                </button>
                {!level.canUnlock && (
                  <p className="text-xs text-white/55 text-center">
                    این مرحله هنوز در دسترس نیست. اول مرحله‌های قبلی رو برو! 💪
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse h-[220px]"
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary-900/60 via-secondary-900/50 to-wood-900/60 p-6 sm:p-8 shadow-[0_25px_80px_rgba(168,85,247,0.25)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35)_0%,_rgba(30,30,60,0.2)_55%,_rgba(9,9,26,0.9)_100%)]" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 space-x-reverse text-white/80">
                <Sparkles className="w-6 h-6 text-secondary-200" />
                <h1 className="text-2xl font-black tracking-tight text-white">نقشه مراحل حرفه‌ای</h1>
              </div>
              <p className="text-white/70 max-w-3xl leading-relaxed">
                مسیر پیشرفتت رو اینجا ببین و هر مرحله‌ای رو که دوست داری انتخاب کن. اگر عجله داری، با ۷۰ سکه مرحله‌های بعدی رو همونجا باز کن! 🌟
              </p>
            </div>
            <div className="flex flex-col items-start space-y-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl text-white/80">
              <span className="text-sm">پیشرفت کلی</span>
              <p className="text-2xl font-black text-white">
                {formatNumber(stats.completedLevels ?? 0)}/{formatNumber(stats.totalLevels ?? levels.length)} مرحله • {formatNumber(totalStarsEarned)} ستاره از {formatNumber(maxStarsAvailable)}
              </p>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary-400 via-primary-400 to-accent-400 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center space-x-4 space-x-reverse text-xs text-white/60">
                <span>قفل: {formatNumber(stats.lockedLevels ?? levels.filter(level => level.status === 'locked').length)}</span>
                <span>قابل بازی: {formatNumber(stats.availableLevels ?? levels.filter(level => level.status !== 'locked').length)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_25px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 space-x-reverse text-white/70">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-semibold">فیلتر مراحل</span>
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map(({ id, label }) => {
              const isActive = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-secondary-500 to-primary-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={gridRef} className="mt-8">
          {isLoading ? (
            renderLoadingState()
          ) : filteredLevels.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 py-16 text-center text-white/60">
              <Lock className="mb-4 h-10 w-10 text-white/40" />
              <p className="text-lg font-semibold">هنوز مرحله‌ای با این فیلتر پیدا نشد.</p>
              <p className="mt-2 text-sm">فیلتر رو عوض کن یا برو سراغ مرحله‌های جدید!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              <AnimatePresence mode="popLayout">
                {filteredLevels.map(renderLevelCard)}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LevelMap;
