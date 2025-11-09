import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Coins, Star, Crown, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/adminService';

const initialFormState = {
  name: '',
  description: '',
  coins: '',
  price: '',
  bonusCoins: '',
  order: '',
  currency: 'USD',
  imageUrl: '',
  featured: false,
  popular: false,
  isActive: true
};

const CoinPackManagement = () => {
  const [packs, setPacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getCoinPacks();
      setPacks(response.data || []);
    } catch (err) {
      setError(err.message || 'دریافت بسته‌ها با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedPack(null);
    setFormData(initialFormState);
    setFormError('');
    setShowModal(true);
  };

  const handleEditPack = (pack) => {
    setIsEditing(true);
    setSelectedPack(pack);
    setFormError('');
    setFormData({
      name: pack.name || '',
      description: pack.description || '',
      coins: pack.coins != null ? String(pack.coins) : '',
      price: pack.price != null ? String(pack.price) : '',
      bonusCoins: pack.bonusCoins != null ? String(pack.bonusCoins) : '',
      order: pack.order != null ? String(pack.order) : '',
      currency: pack.currency || 'USD',
      imageUrl: pack.imageUrl || '',
      featured: Boolean(pack.featured),
      popular: Boolean(pack.popular),
      isActive: pack.isActive !== undefined ? Boolean(pack.isActive) : true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (formLoading) {
      return;
    }
    setShowModal(false);
    setSelectedPack(null);
    setFormData(initialFormState);
    setFormError('');
    setIsEditing(false);
  };

  const handleDeletePack = async (pack) => {
    if (!window.confirm(`آیا از حذف بسته «${pack.name}» مطمئن هستی؟`)) {
      return;
    }

    try {
      setProcessingId(pack._id);
      setError('');
      await adminService.deleteCoinPack(pack._id);
      setSuccess('بسته با موفقیت حذف شد.');
      await fetchPacks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'حذف بسته با خطا مواجه شد.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const coins = Number(formData.coins);
    const price = Number(formData.price);
    const bonusCoins = Number(formData.bonusCoins || 0);
    const order = formData.order === '' ? 0 : Number(formData.order);

    if (!formData.name.trim()) {
      setFormError('عنوان بسته را وارد کن.');
      return;
    }

    if (!Number.isFinite(coins) || coins < 10) {
      setFormError('تعداد سکه‌ها باید عددی معتبر و حداقل ۱۰ باشد.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError('قیمت باید یک عدد معتبر باشد.');
      return;
    }

    if (!Number.isFinite(bonusCoins) || bonusCoins < 0) {
      setFormError('تعداد سکه هدیه معتبر نیست.');
      return;
    }

    setFormError('');

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      coins,
      price,
      bonusCoins,
      totalCoins: coins + bonusCoins,
      order,
      currency: formData.currency || 'USD',
      imageUrl: formData.imageUrl.trim() || undefined,
      featured: formData.featured,
      popular: formData.popular,
      isActive: formData.isActive
    };

    console.log(`${isEditing ? 'Updating' : 'Creating'} coin pack payload:`, payload);

    try {
      setFormLoading(true);
      setError('');

      if (isEditing && selectedPack) {
        await adminService.updateCoinPack(selectedPack._id, payload);
        setSuccess('بسته با موفقیت ویرایش شد.');
      } else {
        await adminService.createCoinPack(payload);
        setSuccess('بسته جدید با موفقیت ساخته شد.');
      }

      closeModal();
      await fetchPacks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.message || 'ذخیره بسته با خطا مواجه شد.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredPacks = useMemo(() => {
    if (!searchTerm.trim()) {
      return packs;
    }

    const lowerTerm = searchTerm.toLowerCase();
    return packs.filter((pack) => {
      const name = pack.name?.toLowerCase() || '';
      const description = pack.description?.toLowerCase() || '';
      return name.includes(lowerTerm) || description.includes(lowerTerm);
    });
  }, [packs, searchTerm]);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat('fa-IR'),
    []
  );

  const formatPrice = (price, currency) => {
    if (price == null) {
      return '—';
    }

    try {
      return new Intl.NumberFormat('fa-IR', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } catch (e) {
      return `${numberFormatter.format(price)} ${currency || ''}`;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">مدیریت بسته‌های سکه</h2>
          <p className="text-white/60">بسته‌های فروشگاه را از همین‌جا بساز، ویرایش کن یا حذف کن.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-reverse space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>افزودن بسته</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded-xl p-4">
          <p className="text-green-400 text-center font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-danger/20 border border-danger rounded-xl p-4 flex items-center space-x-reverse space-x-2">
          <ShieldAlert className="w-5 h-5 text-danger" />
          <p className="text-danger font-medium flex-1 text-center">{error}</p>
        </div>
      )}

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
      <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
        {loading ? (
          <div className="text-center text-white/60 py-10">در حال بارگذاری بسته‌ها...</div>
        ) : filteredPacks.length === 0 ? (
          <div className="text-center text-white/60 py-10">بسته‌ای پیدا نشد. بسته جدید بساز!</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.map((pack, index) => (
              <motion.div
                key={pack._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6 ${
                  pack.featured ? 'ring-2 ring-yellow-400/50' : ''
                } hover:bg-glass-hover transition-all`}
              >
                {/* Pack Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-reverse space-x-2">
                    {pack.featured && <Crown className="w-6 h-6 text-yellow-400" />}
                    {pack.popular && <Star className="w-6 h-6 text-orange-400" />}
                    {!pack.featured && !pack.popular && <Coins className="w-6 h-6 text-yellow-400" />}
                    <div>
                      <h3 className="text-xl font-bold text-white">{pack.name}</h3>
                      <p className="text-white/50 text-xs mt-1">
                        {pack.isActive ? 'فعال' : 'غیرفعال'} • ترتیب نمایش: {numberFormatter.format(pack.order ?? 0)}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${pack.isActive ? 'bg-green-500/20 text-green-400' : 'bg-danger/20 text-danger'}`}>
                    {pack.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                {/* Coin Amount */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-reverse space-x-2 mb-2">
                    <Coins className="w-8 h-8 text-yellow-400" />
                    <span className="text-3xl font-bold text-white">
                      {numberFormatter.format(pack.totalCoins ?? ((pack.coins ?? 0) + (pack.bonusCoins ?? 0)))}
                    </span>
                  </div>

                  <div className="text-white/60 text-sm mt-1">
                    مجموع سکه‌ها (اصلی: {numberFormatter.format(pack.coins ?? 0)}
                    {pack.bonusCoins ? ` + هدیه: ${numberFormatter.format(pack.bonusCoins)}` : ''})
                  </div>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(pack.price, pack.currency)}
                  </div>
                  <div className="text-white/60 text-sm">
                    {pack.currency || 'USD'}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-center mb-6 text-white/60 text-sm space-y-1">
                  <div>
                    {numberFormatter.format(pack.timesPurchased || 0)} بار خریداری شده
                  </div>
                  <div>
                    درآمد ثبت‌شده: {formatPrice(pack.revenueGenerated || 0, pack.currency)}
                  </div>
                </div>

                {pack.description && (
                  <p className="text-white/50 text-sm mb-4 line-clamp-3">{pack.description}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center space-x-reverse space-x-2">
                  <button
                    onClick={() => handleEditPack(pack)}
                    className="p-2 text-white/60 hover:text-white hover:bg-glass rounded-lg transition-colors"
                    disabled={processingId === pack._id}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePack(pack)}
                    className="p-2 text-white/60 hover:text-danger hover:bg-glass rounded-lg transition-colors disabled:opacity-50"
                    disabled={processingId === pack._id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Pack Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-glass backdrop-blur-lg rounded-2xl border border-glass-border w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto px-4 py-6 sm:px-6 sm:py-8"
          >
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {isEditing ? 'ویرایش بسته سکه' : 'افزودن بسته سکه'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">عنوان بسته</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="عنوان بسته را وارد کن"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">تعداد سکه اصلی</label>
                  <input
                    type="number"
                    min="10"
                    value={formData.coins}
                    onChange={(e) => handleFormChange('coins', e.target.value)}
                    placeholder="مثلاً 100"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                    disabled={formLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">سکه هدیه</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonusCoins}
                    onChange={(e) => handleFormChange('bonusCoins', e.target.value)}
                    placeholder="مثلاً 20"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">قیمت</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    placeholder="مثلاً 0.99"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                    disabled={formLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">واحد پول</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => handleFormChange('currency', e.target.value.toUpperCase())}
                    placeholder="USD"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 uppercase"
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">ترتیب نمایش</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => handleFormChange('order', e.target.value)}
                    placeholder="مثلاً 1"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">تصویر (اختیاری)</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                    placeholder="آدرس تصویر بسته"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">توضیحات (اختیاری)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="توضیحات کوتاه درباره بسته"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 resize-none"
                  disabled={formLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-reverse space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-glass-border text-primary-500 focus:ring-primary-500"
                    checked={formData.featured}
                    onChange={(e) => handleFormChange('featured', e.target.checked)}
                    disabled={formLoading}
                  />
                  <span className="text-white">نمایش به‌عنوان ویژه</span>
                </label>

                <label className="flex items-center space-x-reverse space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-glass-border text-primary-500 focus:ring-primary-500"
                    checked={formData.popular}
                    onChange={(e) => handleFormChange('popular', e.target.checked)}
                    disabled={formLoading}
                  />
                  <span className="text-white">برچسب محبوب</span>
                </label>

                <label className="flex items-center space-x-reverse space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-glass-border text-primary-500 focus:ring-primary-500"
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                    disabled={formLoading}
                  />
                  <span className="text-white">فعال باشد</span>
                </label>
              </div>

              {formError && (
                <div className="bg-danger/20 border border-danger rounded-lg p-3 text-danger text-sm text-center">
                  {formError}
                </div>
              )}

              <div className="flex space-x-reverse space-x-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-glass-hover hover:bg-glass text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  disabled={formLoading}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? 'در حال ذخیره...' : isEditing ? 'ذخیره تغییرات' : 'ثبت بسته'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CoinPackManagement;
