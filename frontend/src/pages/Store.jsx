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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-primary-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-primary-500/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 pointer-events-none" />

              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }} />
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseModal}
                disabled={paymentMutation.isLoading}
                className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="بستن"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Header with icon */}
                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/50"
                  >
                    <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">تایید خرید</h2>
                  <p className="text-white/60 text-xs sm:text-sm">مشخصات بسته خریداری شده را بررسی کنید</p>
                </div>

                {/* Pack Details Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-xl"
                >
                  {/* Pack header with badge */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4 md:mb-5 pb-3 sm:pb-4 border-b border-white/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{selectedPack.name}</h3>
                        {selectedPack.featured && (
                          <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                            ویژه
                          </span>
                        )}
                      </div>
                      {selectedPack.description && (
                        <p className="text-white/70 text-xs sm:text-sm leading-relaxed">{selectedPack.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Coins breakdown */}
                  <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 md:mb-5">
                    <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-accent-500/10 border border-accent-500/20">
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-accent-500/20 flex items-center justify-center shrink-0">
                          <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-accent-400" />
                        </div>
                        <div>
                          <div className="text-white/80 text-xs font-medium">سکه اصلی</div>
                          <div className="text-white font-bold text-base sm:text-lg">{(selectedPack.coins ?? 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {(selectedPack.bonusCoins ?? 0) > 0 && (
                      <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="text-white/80 text-xs font-medium">سکه جایزه</div>
                            <div className="text-green-400 font-bold text-base sm:text-lg">+{(selectedPack.bonusCoins ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total coins highlight */}
                  <div className="bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 rounded-lg sm:rounded-xl p-3 sm:p-3.5 md:p-4 border border-primary-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shrink-0">
                          <CheckCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-white/90 text-xs sm:text-sm font-medium">جمع کل دریافتی</div>
                          <div className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                            {(selectedPack.totalCoins ?? ((selectedPack.coins ?? 0) + (selectedPack.bonusCoins ?? 0))).toLocaleString()}
                            <span className="text-sm sm:text-base text-white/80 mr-1">سکه</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price section */}
                  <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 font-medium text-sm sm:text-base">مبلغ قابل پرداخت:</span>
                      <div className="text-left">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-accent-400 to-accent-300 bg-clip-text text-transparent">
                          {formatToman(selectedPack.price)}
                        </div>
                        <div className="text-white/50 text-xs">تومان</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2 sm:space-y-2.5 md:space-y-3"
                >
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={paymentMutation.isLoading}
                    className="group w-full relative overflow-hidden flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-primary-600 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-3.5 md:py-4 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/60 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:shadow-none"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {paymentMutation.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="text-sm sm:text-base">در حال اتصال به درگاه پرداخت...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base sm:text-lg">تایید و پرداخت</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCloseModal}
                    disabled={paymentMutation.isLoading}
                    className="w-full py-2.5 sm:py-3 md:py-3.5 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    انصراف
                  </button>
                </motion.div>

                {/* Security notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 sm:mt-4 md:mt-5 text-center text-white/50 text-xs"
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>پرداخت از طریق درگاه امن زرین‌پال</span>
                  </div>
                </motion.div>
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {coinPacks?.data?.map((pack, index) => (
          <motion.div
            key={pack._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className={`bg-gradient-to-br from-glass via-glass to-glass/50 backdrop-blur-lg rounded-2xl border ${
              pack.featured ? 'border-primary-500/50 ring-2 ring-primary-400/50 shadow-lg shadow-primary-500/20' :
              pack.popular ? 'border-secondary-500/50 shadow-lg shadow-secondary-500/20' :
              'border-glass-border shadow-lg shadow-accent-500/10'
            } p-6 hover:bg-glass-hover transition-all transform hover:scale-105`}
          >
            {/* Pack Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getPackIcon(pack)}
                <h3 className="text-xl font-bold text-white">{pack.name}</h3>
              </div>
              
              {pack.featured && (
                <span className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-400 text-xs font-medium px-2 py-1 rounded-full border border-primary-400/30">
                  ویژه
                </span>
              )}

              {pack.popular && (
                <span className="bg-gradient-to-r from-secondary-500/20 to-accent-500/20 text-secondary-400 text-xs font-medium px-2 py-1 rounded-full border border-secondary-400/30">
                  محبوب
                </span>
              )}
            </div>

            {/* Description */}
            {pack.description && (
              <p className="text-white/60 text-sm mb-4">{pack.description}</p>
            )}

            {/* Coin Amount */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Coins className="w-8 h-8 text-accent-400" />
                <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  {(pack.coins ?? 0).toLocaleString()}
                </span>
              </div>
              
              {pack.bonusCoins > 0 && (
                <div className="flex items-center justify-center space-x-1 text-green-400 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>+{pack.bonusCoins} سکه جایزه</span>
                </div>
              )}

              <div className="text-white/60 text-sm mt-1">
                جمع: {(pack.totalCoins ?? ((pack.coins ?? 0) + (pack.bonusCoins ?? 0))).toLocaleString()} سکه
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white">
                {formatToman(pack.price)}
              </div>
              <div className="text-white/60 text-sm">قیمت به تومان</div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(pack)}
              disabled={paymentMutation.isLoading}
              className="w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-primary-600 disabled:bg-glass-hover disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-secondary-500/50"
            >
              {paymentMutation.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>در حال پردازش...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>خرید</span>
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
                  {new Date(purchase.createdAt).toLocaleDateString()}
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