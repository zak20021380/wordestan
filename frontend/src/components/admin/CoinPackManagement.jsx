import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Coins, Star, Crown } from 'lucide-react';

const CoinPackManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const packs = [
    { title: 'بسته شروع', amount: 100, price: 99000, featured: false, popular: false, purchases: 18 },
    { title: 'بسته ارزشمند', amount: 250, price: 199000, featured: false, popular: true, purchases: 34 },
    { title: 'بسته ویژه', amount: 500, price: 349000, featured: true, popular: false, purchases: 27 },
    { title: 'بسته حرفه‌ای', amount: 1000, price: 649000, featured: true, popular: true, purchases: 15 },
    { title: 'پیشنهاد روزانه', amount: 200, price: 149000, featured: false, popular: true, purchases: 42 },
    { title: 'بسته تازه‌کار', amount: 50, price: 69000, featured: false, popular: false, purchases: 21 }
  ];

  const numberFormatter = new Intl.NumberFormat('fa-IR');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">مدیریت بسته‌های سکه</h2>
          <p className="text-white/60">بسته‌های سکه فروشگاه را مدیریت کنید</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-reverse space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>افزودن بسته</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="جستجو میان بسته‌های سکه..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      </div>

      {/* Coin Packs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6 ${
              pack.featured ? 'ring-2 ring-yellow-400/50' : ''
            } hover:bg-glass-hover transition-all transform hover:scale-105`}
          >
            {/* Pack Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-reverse space-x-2">
                {pack.featured && <Crown className="w-6 h-6 text-yellow-400" />}
                {pack.popular && <Star className="w-6 h-6 text-orange-400" />}
                {!pack.featured && !pack.popular && <Coins className="w-6 h-6 text-yellow-400" />}
                <h3 className="text-xl font-bold text-white">{pack.title}</h3>
              </div>

              {pack.featured && (
                <span className="bg-yellow-400/20 text-yellow-400 text-xs font-medium px-2 py-1 rounded-full">
                  ویژه
                </span>
              )}

              {pack.popular && !pack.featured && (
                <span className="bg-orange-400/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full">
                  محبوب
                </span>
              )}
            </div>

            {/* Coin Amount */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-reverse space-x-2 mb-2">
                <Coins className="w-8 h-8 text-yellow-400" />
                <span className="text-3xl font-bold text-white">
                  {numberFormatter.format(pack.amount)}
                </span>
              </div>

              <div className="text-white/60 text-sm mt-1">
                مجموع سکه‌ها
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white">
                {numberFormatter.format(pack.price)}
              </div>
              <div className="text-white/60 text-sm">
                تومان
              </div>
            </div>

            {/* Stats */}
            <div className="text-center mb-6">
              <div className="text-white/60 text-sm">
                {numberFormatter.format(pack.purchases)} بار خریداری شده
              </div>
              <div className="text-white/60 text-sm">
                درآمد: {numberFormatter.format(pack.price * pack.purchases)} تومان
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center space-x-reverse space-x-2">
              <button className="p-2 text-white/60 hover:text-white hover:bg-glass rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-2 text-white/60 hover:text-danger hover:bg-glass rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Pack Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-6">افزودن بسته سکه</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">عنوان بسته</label>
                <input
                  type="text"
                  placeholder="عنوان بسته را وارد کنید"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">تعداد سکه</label>
                  <input
                    type="number"
                    placeholder="تعداد سکه‌ها"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">قیمت (تومان)</label>
                  <input
                    type="number"
                    placeholder="قیمت به تومان"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">سکه هدیه</label>
                <input
                  type="number"
                  placeholder="تعداد سکه هدیه (اختیاری)"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">توضیحات</label>
                <textarea
                  placeholder="توضیحات بسته (اختیاری)"
                  rows={3}
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-reverse space-x-2">
                  <input type="checkbox" className="rounded border-glass-border text-primary-500 focus:ring-primary-500" />
                  <span className="text-white">ویژه شود</span>
                </label>

                <label className="flex items-center space-x-reverse space-x-2">
                  <input type="checkbox" className="rounded border-glass-border text-primary-500 focus:ring-primary-500" />
                  <span className="text-white">به‌عنوان محبوب</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-reverse space-x-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-glass-hover hover:bg-glass text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                ثبت بسته
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CoinPackManagement;