import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gift, RefreshCcw, Save, Swords, Sparkles } from 'lucide-react';
import { adminService } from '../../services/adminService';

const defaultValues = {
  skipLevelCoinsReward: '0',
  skipLevelPointsReward: '0',
  wordFoundCoinsReward: '0',
  wordFoundPointsReward: '0'
};

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (error) {
    return new Date(value).toLocaleString('fa-IR');
  }
};

const normalizeValues = (data) => ({
  skipLevelCoinsReward: String(data?.skipLevelCoinsReward ?? 0),
  skipLevelPointsReward: String(data?.skipLevelPointsReward ?? 0),
  wordFoundCoinsReward: String(data?.wordFoundCoinsReward ?? 0),
  wordFoundPointsReward: String(data?.wordFoundPointsReward ?? 0)
});

const RewardSettings = () => {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState(() => ({ ...defaultValues }));
  const [initialValues, setInitialValues] = useState(() => ({ ...defaultValues }));

  const {
    data: settingsResponse,
    isLoading,
    isFetching,
    refetch
  } = useQuery(['adminRewardSettings'], () => adminService.getRewardSettings(), {
    staleTime: 5 * 60 * 1000,
    onSuccess: (response) => {
      if (response?.data) {
        const normalized = normalizeValues(response.data);
        setFormValues(normalized);
        setInitialValues(normalized);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'دریافت تنظیمات با خطا مواجه شد.');
    }
  });

  const updateMutation = useMutation((payload) => adminService.updateRewardSettings(payload), {
    onSuccess: (response) => {
      toast.success('تنظیمات پاداش با موفقیت ذخیره شد.');
      if (response?.data) {
        const normalized = normalizeValues(response.data);
        setFormValues(normalized);
        setInitialValues(normalized);
        queryClient.setQueryData(['adminRewardSettings'], response);
      } else {
        refetch();
      }
    },
    onError: (error) => {
      toast.error(error.message || 'ذخیره تنظیمات با خطا مواجه شد.');
    }
  });

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      skipLevelCoinsReward: Number(formValues.skipLevelCoinsReward || 0),
      skipLevelPointsReward: Number(formValues.skipLevelPointsReward || 0),
      wordFoundCoinsReward: Number(formValues.wordFoundCoinsReward || 0),
      wordFoundPointsReward: Number(formValues.wordFoundPointsReward || 0)
    };

    const invalidField = Object.entries(payload).find(([, value]) => !Number.isFinite(value) || value < 0);
    if (invalidField) {
      toast.error('مقادیر باید اعداد غیرمنفی باشند.');
      return;
    }

    updateMutation.mutate(payload);
  };

  const handleReset = () => {
    setFormValues(initialValues);
  };

  const hasChanges = useMemo(() => {
    return Object.keys(formValues).some((key) => formValues[key] !== initialValues[key]);
  }, [formValues, initialValues]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const lastUpdatedAt = settingsResponse?.data?.updatedAt;
  const updatedBy = settingsResponse?.data?.updatedBy;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">تنظیمات پاداش بازی</h2>
          <p className="text-white/70">
            مقدار سکه و امتیاز قابل دریافت برای عبور از مرحله یا پیدا کردن هر کلمه را مدیریت کن.
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse bg-secondary-500/20 text-secondary-200 px-4 py-2 rounded-xl">
          <Gift className="w-5 h-5" />
          <span className="font-medium">پاداش‌های پویا</span>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-glass backdrop-blur-lg border border-glass-border rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">پاداش عبور از مرحله</h3>
                <p className="text-white/50 text-sm mt-1">
                  مقادیر زیر در صورت انتخاب کاربر برای رد کردن مرحله به حساب او اضافه می‌شوند.
                </p>
              </div>
              <Swords className="w-10 h-10 text-primary-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col space-y-2">
                <span className="text-white/70 text-sm">سکه دریافتی</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formValues.skipLevelCoinsReward}
                  onChange={handleInputChange('skipLevelCoinsReward')}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="مثلاً 50"
                />
              </label>
              <label className="flex flex-col space-y-2">
                <span className="text-white/70 text-sm">امتیاز دریافتی</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formValues.skipLevelPointsReward}
                  onChange={handleInputChange('skipLevelPointsReward')}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="مثلاً 20"
                />
              </label>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-glass backdrop-blur-lg border border-glass-border rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">پاداش کشف کلمه جدید</h3>
                <p className="text-white/50 text-sm mt-1">
                  با هر کلمه‌ای که بازیکن پیدا می‌کند سکه و امتیاز تعیین شده در اینجا تعلق می‌گیرد.
                </p>
              </div>
              <Sparkles className="w-10 h-10 text-yellow-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col space-y-2">
                <span className="text-white/70 text-sm">سکه دریافتی</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formValues.wordFoundCoinsReward}
                  onChange={handleInputChange('wordFoundCoinsReward')}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="مثلاً 5"
                />
              </label>
              <label className="flex flex-col space-y-2">
                <span className="text-white/70 text-sm">امتیاز دریافتی</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formValues.wordFoundPointsReward}
                  onChange={handleInputChange('wordFoundPointsReward')}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="مثلاً 10"
                />
              </label>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-glass backdrop-blur-lg border border-glass-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="text-white/80 text-sm flex items-center space-x-2 space-x-reverse">
              <Save className="w-4 h-4 text-primary-300" />
              <span>آخرین بروزرسانی: {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : 'ثبت نشده'}</span>
            </div>
            {updatedBy && (
              <div className="text-white/60 text-sm">توسط: {updatedBy.username || updatedBy.email}</div>
            )}
            {isFetching && (
              <div className="text-primary-300 text-xs">در حال به‌روزرسانی اطلاعات...</div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || updateMutation.isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/80 transition ${
                !hasChanges || updateMutation.isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/10'
              }`}
            >
              <RefreshCcw className="w-4 h-4" />
              بازنشانی
            </button>
            <button
              type="submit"
              disabled={!hasChanges || updateMutation.isLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-500 text-white font-medium transition ${
                (!hasChanges || updateMutation.isLoading)
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-primary-400'
              }`}
            >
              <Save className="w-4 h-4" />
              {updateMutation.isLoading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default RewardSettings;
