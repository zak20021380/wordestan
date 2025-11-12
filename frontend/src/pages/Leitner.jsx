import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  NotebookPen,
  RotateCcw,
  Check,
} from 'lucide-react';
import { leitnerService } from '../services/leitnerService';

const formatStageLabel = (stage) => `جعبه ${stage}`;

const stageGradients = {
  1: 'from-rose-500/40 to-orange-500/20',
  2: 'from-orange-500/30 to-amber-500/10',
  3: 'from-amber-500/30 to-emerald-500/20',
  4: 'from-emerald-500/30 to-sky-500/20',
  5: 'from-sky-500/30 to-violet-500/20',
};

const defaultSummary = {
  total: 0,
  dueCount: 0,
  upcomingCount: 0,
  masteredCount: 0,
  reviewedToday: 0,
  newToday: 0,
  lastReviewAt: null,
  readyPercentage: 0,
  stageCounts: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

const Leitner = () => {
  const queryClient = useQueryClient();
  const [activeCardId, setActiveCardId] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    ['leitner-cards'],
    () => leitnerService.getCards(),
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  const cards = useMemo(() => {
    if (!data?.data?.cards) {
      return [];
    }

    return data.data.cards.map((card) => ({
      ...card,
      nextReviewAt: card.nextReviewAt ? new Date(card.nextReviewAt) : null,
      lastReviewedAt: card.lastReviewedAt ? new Date(card.lastReviewedAt) : null,
      createdAt: card.createdAt ? new Date(card.createdAt) : null,
    }));
  }, [data]);

  const summary = useMemo(() => ({
    ...defaultSummary,
    ...(data?.data?.summary || {}),
  }), [data]);

  const now = useMemo(() => new Date(), [data, isFetching]);

  const dueCards = useMemo(
    () =>
      cards
        .filter((card) => !card.nextReviewAt || card.nextReviewAt <= now)
        .sort((a, b) => {
          if (!a.nextReviewAt && !b.nextReviewAt) return 0;
          if (!a.nextReviewAt) return -1;
          if (!b.nextReviewAt) return 1;
          return a.nextReviewAt - b.nextReviewAt;
        }),
    [cards, now]
  );

  const upcomingCards = useMemo(
    () =>
      cards
        .filter((card) => card.nextReviewAt && card.nextReviewAt > now)
        .sort((a, b) => a.nextReviewAt - b.nextReviewAt),
    [cards, now]
  );

  const stageDistribution = useMemo(() => {
    const total = Math.max(summary.total, 1);
    return Object.entries(summary.stageCounts || {})
      .map(([stage, count]) => ({
        stage: Number(stage),
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => a.stage - b.stage);
  }, [summary]);

  const formatDate = useCallback((date) => {
    if (!date) {
      return '—';
    }

    try {
      const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return dateFormatter.format(date);
    } catch (error) {
      return date.toLocaleString('fa-IR');
    }
  }, []);

  const formatRelativeTime = useCallback((date) => {
    if (!date) {
      return 'بدون زمان‌بندی';
    }

    const diffInMs = date.getTime() - now.getTime();
    const diffInMinutes = Math.round(diffInMs / (60 * 1000));

    const formatter = new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto' });

    if (Math.abs(diffInMinutes) < 60) {
      return formatter.format(diffInMinutes, 'minute');
    }

    const diffInHours = Math.round(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 48) {
      return formatter.format(diffInHours, 'hour');
    }

    const diffInDays = Math.round(diffInHours / 24);
    return formatter.format(diffInDays, 'day');
  }, [now]);

  const reviewMutation = useMutation(
    ({ cardId, result }) => leitnerService.reviewCard(cardId, result),
    {
      onSuccess: (response) => {
        toast.success(response?.message || 'مرور با موفقیت ثبت شد');
        queryClient.invalidateQueries(['leitner-cards']);
      },
      onError: (error) => {
        toast.error(error.message || 'خطا در ثبت مرور');
      },
    }
  );

  const handleReview = async (card, result) => {
    if (!card?._id) {
      return;
    }
    try {
      setActiveCardId(card._id);
      await reviewMutation.mutateAsync({ cardId: card._id, result });
    } finally {
      setActiveCardId(null);
    }
  };

  const highlightCard = dueCards[0] || upcomingCards[0] || null;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/40 via-indigo-600/30 to-sky-500/30 p-8 shadow-[0_0_45px_rgba(79,70,229,0.35)]"
      >
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
        <div className="relative grid gap-8 md:grid-cols-[1.6fr_1fr] items-center">
          <div className="space-y-4 text-white">
            <div className="inline-flex items-center space-x-2 space-x-reverse rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs uppercase tracking-widest shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span>کتابخانه شخصی کلماتت</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-snug">
              جعبه لایتنر حرفه‌ای تو آماده است؛ هر روز چند دقیقه تمرین، یک دنیا پیشرفت.
            </h1>
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-2xl">
              کلماتی که از دل بازی شکار کردی، حالا اینجا با یک برنامه‌ی هوشمند تکرار می‌شوند. هر مرور تو را یک قدم به تسلط کامل نزدیک‌تر می‌کند.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse rounded-xl bg-white/10 px-4 py-3 border border-white/20 backdrop-blur">
                <Brain className="h-5 w-5 text-emerald-200" />
                <div>
                  <div className="text-white/70">کلمات فعال</div>
                  <div className="font-semibold text-white text-lg">{summary.total.toLocaleString('fa-IR')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse rounded-xl bg-white/10 px-4 py-3 border border-white/20 backdrop-blur">
                <Clock className="h-5 w-5 text-amber-200" />
                <div>
                  <div className="text-white/70">مرور امروز</div>
                  <div className="font-semibold text-white text-lg">{summary.reviewedToday.toLocaleString('fa-IR')}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse rounded-xl bg-white/10 px-4 py-3 border border-white/20 backdrop-blur">
                <Sparkles className="h-5 w-5 text-pink-200" />
                <div>
                  <div className="text-white/70">کلمات تازه امروز</div>
                  <div className="font-semibold text-white text-lg">{summary.newToday.toLocaleString('fa-IR')}</div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(15,23,42,0.35)]"
          >
            <div className="absolute inset-x-6 top-6 h-32 rounded-full bg-gradient-to-br from-violet-400/50 to-sky-400/40 blur-3xl" />
            <div className="relative space-y-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-white/60">وضعیت امروز</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="flex items-center space-x-1 space-x-reverse rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/20"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                  <span>به‌روزرسانی</span>
                </button>
              </div>

              <div className="grid gap-3">
                <div className="rounded-xl border border-white/20 bg-black/20 px-4 py-3">
                  <div className="text-xs text-white/60">کلمات آماده مرور</div>
                  <div className="text-2xl font-black">
                    {summary.dueCount.toLocaleString('fa-IR')}
                    <span className="text-sm font-medium text-white/50 mr-1">({summary.readyPercentage.toLocaleString('fa-IR')}٪)</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/10 px-4 py-3">
                  <div className="text-xs text-white/60">آخرین مرورت</div>
                  <div className="text-sm font-semibold text-white">
                    {summary.lastReviewAt ? formatDate(new Date(summary.lastReviewAt)) : 'هنوز مروری ثبت نشده'}
                  </div>
                </div>
              </div>

              {highlightCard ? (
                <div className="rounded-xl border border-white/25 bg-gradient-to-br from-white/20 to-white/5 px-4 py-4 shadow-inner">
                  <div className="text-[11px] text-white/70 mb-1">نوبت بعدی</div>
                  <div className="text-lg font-semibold">{highlightCard.word}</div>
                  <div className="text-xs text-white/60 mt-2 flex items-center justify-between">
                    <span>{highlightCard.meaning || 'معنی‌ای ثبت نشده'}</span>
                    <span>{formatRelativeTime(highlightCard.nextReviewAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-4 text-sm text-white/70">
                  هنوز کارتی برای مرور ثبت نشده. از داخل بازی، کلمات مورد علاقه‌ات رو به لایتنر اضافه کن.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-4">
        <SummaryCard
          title="کلمات آماده مرور"
          value={summary.dueCount}
          subLabel="زمان مرورشون رسیده"
          icon={Clock}
          accent="from-amber-500/30 to-orange-500/10"
        />
        <SummaryCard
          title="کلمات در مسیر"
          value={summary.upcomingCount}
          subLabel="به‌زودی نوبت مرورشون می‌رسه"
          icon={CalendarDays}
          accent="from-sky-500/30 to-blue-500/10"
        />
        <SummaryCard
          title="تسلط‌یافته"
          value={summary.masteredCount}
          subLabel="به جعبه آخر رسیدند"
          icon={ShieldCheck}
          accent="from-emerald-500/30 to-green-500/10"
        />
        <SummaryCard
          title="مرورهای امروز"
          value={summary.reviewedToday}
          subLabel="چند کارت رو امروز بررسی کردی"
          icon={CheckCircle2}
          accent="from-violet-500/30 to-purple-500/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(15,23,42,0.25)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">صف مرور امروز</h2>
              <p className="text-sm text-white/60">کلماتی که الان وقت مرورشونه رو اینجا ببین و نتیجه رو ثبت کن.</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence>
              {dueCards.length > 0 ? (
                dueCards.map((card, index) => (
                  <motion.div
                    key={card._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-emerald-100" dir="ltr">{card.word}</span>
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-100">
                            {formatStageLabel(card.stage)}
                          </span>
                        </div>
                        {card.meaning && (
                          <div className="text-sm text-emerald-50/80">{card.meaning}</div>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-emerald-50/70">
                          <span>آخرین مرور: {card.lastReviewedAt ? formatRelativeTime(card.lastReviewedAt) : 'اولین مرور'}</span>
                          <span>نوبت بعد: {formatRelativeTime(card.nextReviewAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleReview(card, 'fail')}
                          disabled={reviewMutation.isLoading && activeCardId === card._id}
                          className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-60"
                        >
                          <RotateCcw className={`h-4 w-4 ${reviewMutation.isLoading && activeCardId === card._id ? 'animate-spin' : ''}`} />
                          یادم رفت
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(card, 'success')}
                          disabled={reviewMutation.isLoading && activeCardId === card._id}
                          className="flex items-center gap-2 rounded-xl bg-emerald-500/90 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-[0_10px_25px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 disabled:opacity-60"
                        >
                          <Check className="h-4 w-4" />
                          یادم بود
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center text-white/70"
                >
                  <Sparkles className="mx-auto mb-4 h-8 w-8 text-white/60" />
                  <p>فعلاً کلمه‌ای برای مرور فوری نداری. به‌زودی دوباره سر می‌زنیم.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(15,23,42,0.25)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-5 w-5 text-white/70" />
            <div>
              <h2 className="text-lg font-bold text-white">پیشرفت جعبه‌ها</h2>
              <p className="text-xs text-white/60">نسبت کارت‌ها در هر جعبه رو می‌تونی اینجا ببینی.</p>
            </div>
          </div>

          <div className="space-y-3">
            {stageDistribution.map(({ stage, count, percentage }) => (
              <div
                key={stage}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                  <span className="font-medium text-white">{formatStageLabel(stage)}</span>
                  <span>{count.toLocaleString('fa-IR')} کارت ({percentage.toLocaleString('fa-IR')}٪)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stageGradients[stage] || 'from-violet-500/30 to-fuchsia-500/10'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-xs text-white/70">
            <div className="flex items-start gap-2">
              <NotebookPen className="h-4 w-4 text-white/50 mt-0.5" />
              <div>
                <p className="font-medium text-white/80 mb-1">چطور بهترین نتیجه رو بگیرم؟</p>
                <ul className="space-y-1 leading-relaxed">
                  <li>• هر روز چند دقیقه برای مرور اختصاص بده.</li>
                  <li>• بعد از کشف کلمه در بازی، معنیش رو هم ثبت کن تا هنگام مرور سریع‌تر یادآوری بشه.</li>
                  <li>• اگر کلمه‌ای رو فراموش کردی، نترس! با انتخاب «یادم رفت» برنامه مرور هوشمندتر می‌شه.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-sky-500/10 p-6 backdrop-blur-xl"
      >
        <h2 className="text-lg font-bold text-white mb-4">نوبت‌های بعدی</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {upcomingCards.slice(0, 6).map((card) => (
            <div
              key={card._id}
              className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white" dir="ltr">{card.word}</span>
                <span className="text-[11px] rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  {formatStageLabel(card.stage)}
                </span>
              </div>
              <div className="mt-2 text-xs text-white/60">{card.meaning || 'معنی ثبت نشده'}</div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                <span>مرور بعدی:</span>
                <span>{formatRelativeTime(card.nextReviewAt)}</span>
              </div>
            </div>
          ))}
          {upcomingCards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/60">
              <Clock className="mx-auto mb-3 h-8 w-8 opacity-60" />
              <p>فعلاً همه کارت‌ها مرور شدند. به زودی کلمات جدید سر می‌رسند.</p>
            </div>
          )}
        </div>
      </motion.div>

      {isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          خطا در دریافت اطلاعات لایتنر. لطفاً دوباره تلاش کن.
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          در حال بارگذاری جعبه لایتنر...
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, subLabel, icon: Icon, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_15px_35px_rgba(15,23,42,0.25)]`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-40`} />
    <div className="relative flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">{title}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString('fa-IR')}</p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs text-white/70">{subLabel}</p>
    </div>
  </motion.div>
);

export default Leitner;
