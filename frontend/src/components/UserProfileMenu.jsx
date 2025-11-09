import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Loader2,
  Pencil,
  Mail,
  CalendarDays,
  Trophy,
  Flame,
  Coins,
  History,
  ListChecks,
  BookOpen,
  X,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '0';
  }

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return '0';
  }

  return numberValue.toLocaleString('fa-IR');
};

const formatDate = (value, withTime = false) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' })
  });

  return dateFormatter.format(date);
};

const UserProfileMenu = () => {
  const { user, updateUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formState, setFormState] = useState({ username: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const completedLevels = useMemo(() => {
    const source = profile?.completedLevels ?? user?.completedLevels;

    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((level, index) => ({
      id: level?._id || `${index}`,
      order: level?.order,
      letters: level?.letters
    }));
  }, [profile, user]);

  const stats = useMemo(() => ([
    {
      label: 'مراحل تکمیل‌شده',
      value: formatNumber(profile?.levelsCleared ?? user?.levelsCleared ?? 0),
      icon: ListChecks
    },
    {
      label: 'کل امتیاز',
      value: formatNumber(profile?.totalScore ?? user?.totalScore ?? 0),
      icon: Trophy
    },
    {
      label: 'کلمات پیداشده',
      value: formatNumber(profile?.wordsFound ?? user?.wordsFound ?? 0),
      icon: BookOpen
    },
    {
      label: 'بهترین رکورد پیاپی',
      value: formatNumber(profile?.bestStreak ?? user?.bestStreak ?? 0),
      icon: Flame
    },
    {
      label: 'رکورد فعلی',
      value: formatNumber(profile?.currentStreak ?? user?.currentStreak ?? 0),
      icon: History
    },
    {
      label: 'سکه‌ها',
      value: formatNumber(profile?.coins ?? user?.coins ?? 0),
      icon: Coins
    }
  ]), [profile, user]);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const profileData = await authService.getMe();
      setProfile(profileData);
      setFormState({
        username: profileData?.username || '',
        email: profileData?.email || ''
      });
      updateUser(profileData);
    } catch (fetchError) {
      console.error('Failed to load profile', fetchError);
      setError(fetchError.message || 'خطا در دریافت اطلاعات پروفایل');
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      setIsEditing(false);
      return;
    }

    setIsOpen(true);
    await fetchProfile();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = {};

      const currentUsername = activeProfile?.username || '';
      const nextUsername = typeof formState.username !== 'undefined' ? formState.username.trim() : currentUsername;
      if (nextUsername && nextUsername !== currentUsername) {
        payload.username = nextUsername;
      }

      const currentEmail = activeProfile?.email || null;
      const trimmedEmail = typeof formState.email === 'string' ? formState.email.trim() : '';
      const nextEmail = trimmedEmail.length > 0 ? trimmedEmail : null;
      if (nextEmail !== currentEmail) {
        payload.email = nextEmail;
      }

      if (Object.keys(payload).length === 0) {
        toast('تغییری برای ذخیره وجود ندارد');
        setIsEditing(false);
        return;
      }

      const updatedProfile = await authService.updateProfile(payload);
      setProfile(updatedProfile);
      setFormState({
        username: updatedProfile?.username || '',
        email: updatedProfile?.email || ''
      });
      updateUser(updatedProfile);
      toast.success('پروفایل با موفقیت به‌روزرسانی شد');
      setIsEditing(false);
    } catch (saveError) {
      console.error('Failed to save profile', saveError);
      const message = saveError.message || saveError.response?.data?.message || 'خطا در به‌روزرسانی پروفایل';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setIsEditing(false);
  };

  const activeProfile = profile || user;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 space-x-reverse text-white px-4 py-2 rounded-xl transition-colors bg-slate-800/80 hover:bg-slate-700 border border-slate-700"
        type="button"
      >
        <UserIcon className="w-5 h-5" />
        <span className="hidden sm:block font-medium">{activeProfile?.username || 'کاربر'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed sm:absolute left-0 sm:left-auto sm:right-0 top-16 sm:top-auto mt-0 sm:mt-3 w-full sm:w-[360px] md:w-[420px] max-w-[95vw] bg-slate-900 border border-slate-700 rounded-none sm:rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="px-5 py-5 border-b border-slate-700 bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-white">{activeProfile?.username || 'کاربر'}</p>
                  <p className="text-sm text-white/70 flex items-center gap-2 mt-2">
                    <Mail className="w-4 h-4 text-accent-400" />
                    {activeProfile?.email || 'ایمیل ثبت نشده'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <p className="text-xs text-white/70 flex items-center gap-1 justify-end">
                      <CalendarDays className="w-4 h-4 text-secondary-400" />
                      عضو از {formatDate(activeProfile?.createdAt)}
                    </p>
                    <p className="text-xs text-white/70 flex items-center gap-1 justify-end mt-1">
                      <History className="w-4 h-4 text-secondary-400" />
                      آخرین فعالیت: {formatDate(activeProfile?.lastActive, true)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsEditing(false);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-white/70 transition-colors hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:ring-offset-2 focus:ring-offset-slate-800"
                    aria-label="بستن پنجره پروفایل"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-200px)] sm:max-h-[600px] overflow-y-auto bg-slate-900">
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary-400" />
                  آمار بازی
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {stats.map(({ label, value, icon: IconComponent }) => (
                    <div
                      key={label}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 flex items-center gap-2 hover:border-primary-500/40 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary-300" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{value}</p>
                        <p className="text-xs text-white/70">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-accent-400" />
                  تاریخچه پیشرفت
                </h4>
                {error && !isLoading ? (
                  <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
                ) : null}

                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <History className="w-5 h-5 text-secondary-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">آخرین بازی</p>
                        <p className="text-xs text-white/70">{formatDate(activeProfile?.lastActive, true)}</p>
                      </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-accent-300" />
                        لیست مراحل تکمیل‌شده
                      </p>
                      {completedLevels.length > 0 ? (
                        <ul className="max-h-28 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {completedLevels.map((level, index) => (
                            <li
                              key={level.id}
                              className="flex items-center justify-between text-xs text-white/80 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                            >
                              <span className="font-bold">مرحله {level.order ?? index + 1}</span>
                              {level.letters ? (
                                <span className="text-white/60 font-medium">{level.letters}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-white/60">هنوز مرحله‌ای تکمیل نشده است.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-primary-500/20 pt-4">
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-3">
                    <div>
                      <label htmlFor="username" className="block text-xs font-semibold text-white/70 mb-2">
                        نام کاربری
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={formState.username}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary-400/60 focus:ring-1 focus:ring-primary-400/60"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-white/70 mb-2">
                        ایمیل
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-secondary-400/60 focus:ring-1 focus:ring-secondary-400/60"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormState({
                            username: activeProfile?.username || '',
                            email: activeProfile?.email || ''
                          });
                        }}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-slate-800 border border-slate-700"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-lg bg-primary-600 text-sm font-bold text-white hover:bg-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-bold text-white hover:border-primary-400/40 hover:bg-slate-700"
                    >
                      <Pencil className="w-4 h-4" />
                      ویرایش پروفایل
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/40 text-sm font-bold text-red-200 hover:border-red-400/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      خروج
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileMenu;
