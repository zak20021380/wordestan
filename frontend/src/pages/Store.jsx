import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { storeService } from '../services/storeService';
import {
  ShoppingCart,
  Coins,
  Star,
  CheckCircle,
  Loader2,
  Crown,
  Gem,
  Zap,
  Plus,
  Sparkles,
  Trophy
} from 'lucide-react';

const Store = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPack, setSelectedPack] = useState(null);

  // Fetch coin packs
  const { data: coinPacks, isLoading: packsLoading } = useQuery(
    ['coinPacks'],
    () => storeService.getCoinPacks(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const packs = coinPacks ?? [];

  // Purchase mutation
  const purchaseMutation = useMutation(
    ({ packId }) => storeService.mockPurchase(packId),
    {
      onSuccess: (data) => {
        toast.success(`خرید موفقیت‌آمیز بود! +${data.data.coinsAwarded} سکه`);
        queryClient.invalidateQueries(['coinPacks']);
        queryClient.invalidateQueries(['nextLevel', user?.id]);
        setSelectedPack(null);
      },
      onError: (error) => {
        toast.error(error.message || 'خرید ناموفق بود');
      },
    }
  );

  const handlePurchase = async (pack) => {
    if (user.coins < 0 && pack.price > 0) {
      toast.error('سکه کافی برای این خرید ندارید');
      return;
    }

    setSelectedPack(pack._id);
    try {
      await purchaseMutation.mutateAsync({ packId: pack._id });
    } finally {
      setSelectedPack(null);
    }
  };

  const getPackIcon = (pack) => {
    if (pack.featured) return <Crown className="w-6 h-6 text-primary-400" />;
    if (pack.popular) return <Zap className="w-6 h-6 text-secondary-400" />;
    if (pack.amount >= 500) return <Gem className="w-6 h-6 text-primary-500" />;
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
        {packs.length === 0 && (
          <div className="col-span-full text-center text-white/60 py-12 bg-glass backdrop-blur-lg rounded-2xl border border-glass-border">
            در حال حاضر بسته‌ای برای نمایش وجود ندارد.
          </div>
        )}

        {packs.map((pack, index) => (
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
                <h3 className="text-xl font-bold text-white">{pack.title}</h3>
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
                  {pack.amount.toLocaleString()}
                </span>
              </div>
              
              {pack.bonusCoins > 0 && (
                <div className="flex items-center justify-center space-x-1 text-green-400 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>+{pack.bonusCoins} سکه جایزه</span>
                </div>
              )}

              <div className="text-white/60 text-sm mt-1">
                جمع: {pack.totalCoins.toLocaleString()} سکه
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white">
                ${pack.price.toFixed(2)}
              </div>
              <div className="text-white/60 text-sm">
                {pack.currency}
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(pack)}
              disabled={purchaseMutation.isLoading && selectedPack === pack._id}
              className="w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-primary-600 disabled:bg-glass-hover disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-secondary-500/50"
            >
              {purchaseMutation.isLoading && selectedPack === pack._id ? (
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
                  {purchase.packId?.title || 'بسته سکه'}
                </div>
                <div className="text-white/60 text-sm">
                  {new Date(purchase.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-accent-400 font-medium">
                  <Coins className="w-4 h-4" />
                  <span>+{purchase.amount}</span>
                </div>
                <div className="text-white/60 text-sm">
                  ${purchase.price}
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