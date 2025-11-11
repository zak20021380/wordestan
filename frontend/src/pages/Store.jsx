import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { storeService } from '../services/storeService';
import { formatToman } from '../utils/currency';
import {
  ShoppingCart,
  Coins,
  CheckCircle,
  Loader2,
  Crown,
  Gem,
  Zap,
  Plus,
  Sparkles,
  Trophy,
  X,
  ArrowRight
} from 'lucide-react';

const Store = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedPack, setSelectedPack] = useState(null);

  // Fetch coin packs
  const { data: coinPacks, isLoading: packsLoading } = useQuery(
    ['coinPacks'],
    () => storeService.getCoinPacks(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const paymentMutation = useMutation(
    ({ packId }) => storeService.requestPayment(packId),
    {
      onSuccess: (response) => {
        const paymentUrl = response?.data?.paymentUrl || response?.paymentUrl;
        if (paymentUrl) {
          toast.success('در حال انتقال به درگاه پرداخت...');
          window.location.href = paymentUrl;
        } else {
          toast.error('آدرس پرداخت یافت نشد');
        }
      },
      onError: (error) => {
        toast.error(error.message || 'خطا در اتصال به درگاه پرداخت');
      },
    }
  );

  const handlePurchase = (pack) => {
    setSelectedPack(pack);
  };

  const handleCloseModal = () => {
    if (paymentMutation.isLoading) return;
    setSelectedPack(null);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPack) return;
    paymentMutation.mutate({ packId: selectedPack._id });
  };

  const getPackIcon = (pack) => {
    if (pack.featured) return <Crown className="w-6 h-6 text-primary-400" />;
    if (pack.popular) return <Zap className="w-6 h-6 text-secondary-400" />;
    if ((pack.coins ?? 0) >= 500) return <Gem className="w-6 h-6 text-primary-500" />;
    return <Coins className="w-6 h-6 text-accent-400" />;
  };

  if (packsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence>
        {selectedPack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-3 sm:px-4 py-6"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-white/10 rounded-2xl shadow-2xl shadow-primary-900/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/15 via-transparent to-secondary-500/15" />

              {/* Close button */}
              <button
                onClick={handleCloseModal}
                disabled={paymentMutation.isLoading}
                className="absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative flex flex-col">
                <div className="p-5 sm:p-6 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">تایید خرید</h2>
                      <p className="text-xs text-white/60">جزئیات بسته انتخابی خود را بررسی کنید</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white">{selectedPack.name}</span>
                          {selectedPack.featured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white">ویژه</span>
                          )}
                          {selectedPack.popular && !selectedPack.featured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-500/20 text-secondary-200 border border-secondary-400/40">محبوب</span>
                          )}
                        </div>
                        {selectedPack.description && (
                          <p className="text-[11px] leading-relaxed text-white/60 mt-1 max-h-12 overflow-hidden">{selectedPack.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] text-white/50">قیمت</span>
                        <span className="text-base font-bold text-accent-300">{formatToman(selectedPack.price)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                      <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="w-4 h-4 text-accent-300" />
                          <span className="text-[11px] text-white/60">سکه اصلی</span>
                        </div>
                        <div className="text-sm font-bold text-white">{(selectedPack.coins ?? 0).toLocaleString()}</div>
                      </div>

                      <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-green-300" />
                          <span className="text-[11px] text-white/60">سکه جایزه</span>
                        </div>
                        <div className="text-sm font-bold text-white">{(selectedPack.bonusCoins ?? 0).toLocaleString()}</div>
                      </div>

                      <div className="col-span-2 rounded-lg bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-white" />
                            <span className="text-[11px] text-white/70">جمع کل سکه</span>
                          </div>
                          <span className="text-sm font-bold text-white">
                            {(selectedPack.totalCoins ?? ((selectedPack.coins ?? 0) + (selectedPack.bonusCoins ?? 0))).toLocaleString()} سکه
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/60 bg-black/30 border border-white/5 rounded-xl px-3 py-2">
                    <span>مبلغ قابل پرداخت</span>
                    <div className="text-right text-sm font-semibold text-white">
                      {formatToman(selectedPack.price)}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={paymentMutation.isLoading}
                      className="group relative overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all duration-300 hover:shadow-primary-500/60 hover:scale-[1.01] active:scale-[0.99] disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700" />
                      {paymentMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>در حال اتصال به درگاه پرداخت...</span>
                        </>
                      ) : (
                        <>
                          <span>تایید و پرداخت</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCloseModal}
                      disabled={paymentMutation.isLoading}
                      className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      انصراف
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-[11px] text-white/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                    <span>پرداخت از طریق درگاه امن زرین‌پال انجام می‌شود</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <ShoppingCart className="w-10 h-10 text-primary-400" />
          <h1 className="text-4xl font-bold text-white">فروشگاه سکه</h1>
        </div>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          سکه بخرید تا ویژگی حل خودکار و تجربه بازی خود را بهبود بخشید
        </p>
      </motion.div>

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">موجودی شما</h2>
            <p className="text-white/60">موجودی فعلی سکه</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-3xl font-bold text-accent-400 mb-1">
              <Coins className="w-8 h-8" />
              <span>{user?.coins?.toLocaleString() || 0}</span>
            </div>
            <p className="text-white/60 text-sm">سکه</p>
          </div>
        </div>
      </motion.div>

      {/* Coin Packs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
        {coinPacks?.data?.map((pack, index) => (
          <motion.div
            key={pack._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`group relative overflow-hidden rounded-3xl border backdrop-blur-xl bg-gradient-to-br from-glass via-glass to-glass/40 transition-all duration-300 ${
              pack.featured
                ? 'border-primary-400/60 ring-2 ring-primary-400/40 shadow-xl shadow-primary-500/25'
                : pack.popular
                ? 'border-secondary-400/60 shadow-xl shadow-secondary-500/25'
                : 'border-white/10 shadow-lg shadow-accent-500/15'
            } p-5 sm:p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/30`}
          >
            <span className="pointer-events-none absolute -top-16 -left-16 h-32 w-32 rounded-full bg-primary-500/30 blur-3xl" aria-hidden />
            <span className="pointer-events-none absolute -bottom-20 -right-12 h-36 w-36 rounded-full bg-secondary-500/20 blur-3xl" aria-hidden />

            {/* Pack Header */}
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div className="flex items-center gap-3">
                {getPackIcon(pack)}
                <div className="flex flex-col">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{pack.name}</h3>
                  {pack.description && (
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{pack.description}</p>
                  )}
                </div>
              </div>

              {pack.featured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary-400/40 bg-gradient-to-r from-primary-500/25 to-secondary-500/25 px-3 py-1 text-[11px] font-medium text-primary-200">
                  ویژه
                </span>
              )}

              {pack.popular && (
                <span className="inline-flex items-center gap-1 rounded-full border border-secondary-400/40 bg-gradient-to-r from-secondary-500/25 to-accent-500/25 px-3 py-1 text-[11px] font-medium text-secondary-200">
                  محبوب
                </span>
              )}
            </div>

            {/* Coin Amount */}
            <div className="relative rounded-2xl border border-white/5 bg-white/10 p-5 text-center shadow-inner shadow-black/5 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3 text-primary-200">
                <Coins className="h-7 w-7 sm:h-8 sm:w-8 text-accent-300 drop-shadow" />
                <span className="text-3xl font-black tracking-wide bg-gradient-to-r from-primary-300 via-accent-200 to-secondary-300 bg-clip-text text-transparent">
                  {(pack.coins ?? 0).toLocaleString()}
                </span>
              </div>

              {pack.bonusCoins > 0 && (
                <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs sm:text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  <span>+{pack.bonusCoins} سکه جایزه</span>
                </div>
              )}

              <div className="mt-3 text-xs sm:text-sm text-white/60">
                جمع: {(pack.totalCoins ?? ((pack.coins ?? 0) + (pack.bonusCoins ?? 0))).toLocaleString()} سکه
              </div>
            </div>

            {/* Price */}
            <div className="relative mb-6 flex flex-col items-center gap-2 text-center">
              <span className="rounded-full bg-white/5 px-4 py-1 text-xs font-medium text-white/70">
                قیمت به تومان
              </span>
              <div className="text-3xl font-extrabold text-white drop-shadow-sm">
                {formatToman(pack.price)}
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(pack)}
              disabled={paymentMutation.isLoading}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 py-3 px-6 font-semibold text-white shadow-xl shadow-primary-500/40 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:py-3.5"
            >
              <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20 bg-white" aria-hidden />
              {paymentMutation.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>در حال پردازش...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span className="mr-2">خرید</span>
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8"
      >
        <h2 className="text-2xl font-bold text-white text-center mb-8">کارهایی که می‌توانید با سکه انجام دهید</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">حل خودکار</h3>
            <p className="text-white/60">یک کلمه را به طور خودکار با 50 سکه کامل کنید</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">تسریع پیشرفت</h3>
            <p className="text-white/60">مراحل را سریع‌تر کامل کنید و در جدول امتیازات بالا بروید</p>
          </div>
        </div>
      </motion.div>

      {/* Purchase History */}
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <PurchaseHistory />
        </motion.div>
      )}
    </div>
  );
};

// Purchase History Component
const PurchaseHistory = () => {
  const { data: purchases, isLoading } = useQuery(
    ['purchaseHistory'],
    () => storeService.getPurchaseHistory(),
    {
      enabled: true,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8">
      <h2 className="text-2xl font-bold text-white mb-6">تاریخچه خرید</h2>
      
      {purchases?.data?.purchases?.length > 0 ? (
        <div className="space-y-3">
          {purchases.data.purchases.slice(0, 5).map((purchase) => (
            <div
              key={purchase._id}
              className="flex items-center justify-between bg-glass-hover rounded-lg p-4"
            >
              <div>
                <div className="text-white font-medium">
                  {purchase.packId?.name || purchase.packId?.title || 'بسته سکه'}
                </div>
                <div className="text-white/60 text-sm">
                  {new Date(purchase.createdAt).toLocaleString('fa-IR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="mt-1 text-xs">
                  <span
                    className={`px-2 py-1 rounded-full font-semibold ${
                      purchase.status === 'completed'
                        ? 'bg-green-500/20 text-green-300'
                        : purchase.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {purchase.status === 'completed'
                      ? 'موفق'
                      : purchase.status === 'pending'
                        ? 'در انتظار'
                        : 'ناموفق'}
                  </span>
                  {purchase.paymentMethod && (
                    <span className="ml-2 text-white/50">
                      ({purchase.paymentMethod === 'zarinpal' ? 'زرین پال' : purchase.paymentMethod})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-accent-400 font-medium">
                  <Coins className="w-4 h-4" />
                  <span>+{purchase.amount}</span>
                </div>
                <div className="text-white/60 text-sm">
                  {formatToman(purchase.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-white/40 py-8">
          هنوز خریدی انجام نشده است
        </div>
      )}
    </div>
  );
};

export default Store;