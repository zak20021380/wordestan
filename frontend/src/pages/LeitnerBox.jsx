import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getLeitnerStats,
  getLeitnerWords,
  getDueWords,
  reviewWord,
  deleteCard,
  archiveCard,
  resetCard
} from '../services/leitnerService';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  Brain,
  TrendingUp,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  Target,
  Award,
  Clock,
  Zap,
  BarChart3,
  Play,
  Home
} from 'lucide-react';

const LeitnerBox = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'review', 'boxes'
  const [selectedBox, setSelectedBox] = useState(null);
  const [boxWords, setBoxWords] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Box colors and intervals
  const boxConfig = [
    { number: 1, color: 'red', interval: '1 روز', gradient: 'from-red-500 to-pink-500', bgGradient: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/30' },
    { number: 2, color: 'orange', interval: '3 روز', gradient: 'from-orange-500 to-yellow-500', bgGradient: 'from-orange-500/20 to-yellow-500/20', border: 'border-orange-500/30' },
    { number: 3, color: 'yellow', interval: '1 هفته', gradient: 'from-yellow-500 to-green-500', bgGradient: 'from-yellow-500/20 to-green-500/20', border: 'border-yellow-500/30' },
    { number: 4, color: 'blue', interval: '2 هفته', gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
    { number: 5, color: 'purple', interval: '1 ماه', gradient: 'from-purple-500 to-pink-500', bgGradient: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getLeitnerStats();
      setStats(response.data);
    } catch (error) {
      toast.error('خطا در دریافت آمار');
    } finally {
      setLoading(false);
    }
  };

  const loadBoxWords = async (boxNumber) => {
    try {
      setLoading(true);
      const response = await getLeitnerWords({ box: boxNumber });
      setBoxWords(response.data);
      setSelectedBox(boxNumber);
      setActiveView('boxes');
    } catch (error) {
      toast.error('خطا در دریافت کلمات');
    } finally {
      setLoading(false);
    }
  };

  const startReview = async () => {
    try {
      setReviewLoading(true);
      const response = await getDueWords(20);

      if (response.data.length === 0) {
        toast('هیچ کلمه‌ای برای مرور آماده نیست! 🎉', {
          icon: '✅',
        });
        return;
      }

      setReviewQueue(response.data);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setActiveView('review');
    } catch (error) {
      toast.error('خطا در شروع مرور');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReview = async (result) => {
    if (reviewQueue.length === 0) return;

    const currentCard = reviewQueue[currentCardIndex];

    try {
      await reviewWord(currentCard._id, result);

      // Move to next card
      if (currentCardIndex < reviewQueue.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
      } else {
        // Review complete
        toast.success('مرور تکمیل شد! 🎉');
        setActiveView('dashboard');
        loadStats();
      }
    } catch (error) {
      toast.error('خطا در ثبت نتیجه مرور');
    }
  };

  const handleDelete = async (cardId) => {
    if (!confirm('آیا مطمئنی که می‌خواهی این کلمه را حذف کنی؟')) return;

    try {
      await deleteCard(cardId);
      toast.success('کلمه حذف شد');
      if (selectedBox) {
        loadBoxWords(selectedBox);
      }
      loadStats();
    } catch (error) {
      toast.error('خطا در حذف کلمه');
    }
  };

  const handleReset = async (cardId) => {
    try {
      await resetCard(cardId);
      toast.success('کارت به جعبه اول بازگشت');
      if (selectedBox) {
        loadBoxWords(selectedBox);
      }
      loadStats();
    } catch (error) {
      toast.error('خطا در بازنشانی کارت');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-12 text-center"
        >
          <BookOpen className="w-20 h-20 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            جعبه لایتنر
          </h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            برای استفاده از جعبه لایتنر و یادگیری حرفه‌ای کلمات، ابتدا وارد حساب کاربری خود شوید.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              ورود
            </Link>
            <Link
              to="/register"
              className="bg-glass hover:bg-glass-hover border border-glass-border text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              ثبت‌نام
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-white/70">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (activeView === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                جعبه لایتنر
              </h1>
              <p className="text-white/70 text-lg">
                سیستم حرفه‌ای یادگیری با تکرار فاصله‌دار
              </p>
            </div>
            <Link
              to="/game"
              className="flex items-center gap-2 bg-glass hover:bg-glass-hover border border-glass-border text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <Home className="w-5 h-5" />
              <span>بازگشت به بازی</span>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/30 border border-purple-400/40">
                <BookOpen className="w-6 h-6 text-purple-200" />
              </div>
              <span className="text-3xl font-bold text-white">{stats?.totalCards || 0}</span>
            </div>
            <h3 className="text-white/80 font-semibold mb-1">کل کلمات</h3>
            <p className="text-white/60 text-sm">در جعبه لایتنر</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl border border-cyan-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/30 border border-cyan-400/40">
                <Clock className="w-6 h-6 text-cyan-200" />
              </div>
              <span className="text-3xl font-bold text-white">{stats?.dueForReview || 0}</span>
            </div>
            <h3 className="text-white/80 font-semibold mb-1">آماده برای مرور</h3>
            <p className="text-white/60 text-sm">امروز</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl border border-green-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/30 border border-green-400/40">
                <TrendingUp className="w-6 h-6 text-green-200" />
              </div>
              <span className="text-3xl font-bold text-white">{stats?.averageAccuracy || 0}%</span>
            </div>
            <h3 className="text-white/80 font-semibold mb-1">دقت</h3>
            <p className="text-white/60 text-sm">میانگین موفقیت</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl border border-yellow-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-yellow-500/30 border border-yellow-400/40">
                <Award className="w-6 h-6 text-yellow-200" />
              </div>
              <span className="text-3xl font-bold text-white">{stats?.masteredWords || 0}</span>
            </div>
            <h3 className="text-white/80 font-semibold mb-1">کلمات تسلط</h3>
            <p className="text-white/60 text-sm">در جعبه 5</p>
          </motion.div>
        </div>

        {/* Start Review Button */}
        {stats?.dueForReview > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={startReview}
            disabled={reviewLoading}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-400 hover:via-pink-400 hover:to-cyan-400 text-white font-bold text-xl py-6 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Play className="w-7 h-7" />
            <span>شروع مرور ({stats.dueForReview} کلمه)</span>
          </motion.button>
        )}

        {/* Leitner Boxes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">جعبه‌های لایتنر</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {boxConfig.map((box, index) => (
              <motion.button
                key={box.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                onClick={() => loadBoxWords(box.number)}
                className={`bg-gradient-to-br ${box.bgGradient} backdrop-blur-lg rounded-2xl border ${box.border} p-6 hover:scale-105 transition-all text-right`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-semibold bg-gradient-to-r ${box.gradient} bg-clip-text text-transparent`}>
                    جعبه {box.number}
                  </span>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${box.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    {box.number}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-white">{stats?.byBox?.[box.number] || 0}</span>
                  <span className="text-white/60 text-sm mr-2">کلمه</span>
                </div>
                <p className="text-white/60 text-xs">مرور: {box.interval}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-400/30">
              <Brain className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">سیستم لایتنر چیست؟</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                سیستم لایتنر یک روش یادگیری مبتنی بر تکرار فاصله‌دار است. کلماتی که به درستی یاد می‌گیرید به جعبه‌های بالاتر منتقل می‌شوند و با فواصل زمانی بیشتر مرور می‌شوند.
                کلماتی که اشتباه می‌کنید به جعبه اول برمی‌گردند تا بیشتر تمرین شوند. این روش به شما کمک می‌کند تا زمان خود را روی کلماتی که نیاز به تمرین بیشتری دارند متمرکز کنید.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Review View
  if (activeView === 'review' && reviewQueue.length > 0) {
    const currentCard = reviewQueue[currentCardIndex];
    const progress = ((currentCardIndex + 1) / reviewQueue.length) * 100;

    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">
              کارت {currentCardIndex + 1} از {reviewQueue.length}
            </span>
            <span className="text-white/70 text-sm">پیشرفت: {Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-glass rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Flashcard */}
        <motion.div
          key={currentCardIndex}
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-glass backdrop-blur-lg rounded-3xl border border-glass-border p-12 mb-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />

          {/* Card Content */}
          <div className="relative z-10 text-center">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm font-semibold">
                <Target className="w-4 h-4" />
                جعبه {currentCard.box}
              </span>
            </div>

            <h2 className="text-6xl font-bold text-white mb-8">
              {currentCard.wordId.text}
            </h2>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="flex items-center gap-2 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold py-3 px-8 rounded-xl transition-all"
              >
                <Eye className="w-5 h-5" />
                <span>نمایش معنی</span>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-white/60 text-sm mb-2">معنی:</p>
                  <p className="text-white text-2xl font-semibold leading-relaxed">
                    {currentCard.wordId.meaning || currentCard.wordId.description || 'معنی ثبت نشده'}
                  </p>
                </div>

                {currentCard.notes && (
                  <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-4">
                    <p className="text-cyan-200 text-sm">{currentCard.notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4"
          >
            <button
              onClick={() => handleReview('incorrect')}
              className="bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 text-white font-semibold py-4 px-6 rounded-xl transition-all flex flex-col items-center gap-2"
            >
              <X className="w-6 h-6 text-red-300" />
              <span>نمی‌دونم</span>
              <span className="text-xs text-white/60">برگشت به جعبه 1</span>
            </button>

            <button
              onClick={() => handleReview('skipped')}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 text-white font-semibold py-4 px-6 rounded-xl transition-all flex flex-col items-center gap-2"
            >
              <ArrowRight className="w-6 h-6 text-yellow-300" />
              <span>بعداً</span>
              <span className="text-xs text-white/60">مرور فردا</span>
            </button>

            <button
              onClick={() => handleReview('correct')}
              className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 text-white font-semibold py-4 px-6 rounded-xl transition-all flex flex-col items-center gap-2"
            >
              <Check className="w-6 h-6 text-green-300" />
              <span>بلدم</span>
              <span className="text-xs text-white/60">جعبه بعدی</span>
            </button>
          </motion.div>
        )}

        {/* Exit Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setActiveView('dashboard');
              loadStats();
            }}
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            خروج از مرور
          </button>
        </div>
      </div>
    );
  }

  // Box Words View
  if (activeView === 'boxes' && selectedBox) {
    const boxInfo = boxConfig.find(b => b.number === selectedBox);

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${boxInfo.bgGradient} backdrop-blur-lg rounded-2xl border ${boxInfo.border} p-6`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${boxInfo.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                {selectedBox}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">جعبه {selectedBox}</h2>
                <p className="text-white/70">مرور هر {boxInfo.interval} • {boxWords.length} کلمه</p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('dashboard')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-6 rounded-xl transition-all flex items-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>بازگشت</span>
            </button>
          </div>
        </motion.div>

        {/* Words List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxWords.map((card, index) => (
            <motion.div
              key={card._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-2xl font-bold text-white">{card.wordId.text}</h3>
                <span className="text-xs text-white/50">
                  #{card.reviewCount}
                </span>
              </div>

              <p className="text-white/70 text-sm mb-3">
                {card.wordId.meaning || card.wordId.description || 'معنی ثبت نشده'}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-green-500/20 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                  ✓ {card.correctCount}
                </span>
                <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-1 rounded">
                  ✗ {card.incorrectCount}
                </span>
                <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-1 rounded">
                  {card.getAccuracy ? card.getAccuracy() : Math.round((card.correctCount / (card.correctCount + card.incorrectCount || 1)) * 100)}%
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReset(card._id)}
                  title="بازنشانی به جعبه 1"
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white py-2 px-3 rounded-lg transition-all text-xs flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ریست</span>
                </button>
                <button
                  onClick={() => handleDelete(card._id)}
                  title="حذف کلمه"
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 py-2 px-3 rounded-lg transition-all text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {boxWords.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">هنوز کلمه‌ای در این جعبه نیست</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default LeitnerBox;
