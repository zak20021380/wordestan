import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Gamepad2,
  ShoppingCart,
  Trophy,
  Settings,
  Menu,
  X,
  User,
  Coins,
  LogOut,
  Edit2,
  Calendar,
  Award,
  Target,
  Zap,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const navigation = [
    { name: 'خونه', href: '/', icon: Home },
    { name: 'بازی', href: '/game', icon: Gamepad2 },
    { name: 'فروشگاه', href: '/store', icon: ShoppingCart },
    { name: 'امتیازها', href: '/leaderboard', icon: Trophy },
  ];

  const adminNavigation = [
    { name: 'پنل ادمین', href: '/admin', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'نامشخص';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-glass backdrop-blur-xl border-b-2 border-glass-border sticky top-0 z-50 shadow-[0_4px_30px_rgba(168,85,247,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 space-x-reverse group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all group-hover:scale-110">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">وردستان</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl transition-all font-medium ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                        : 'text-white/80 hover:text-white hover:bg-glass-hover hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Admin Navigation */}
              {user?.isAdmin && adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-xl transition-all font-medium border-2 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-accent-500 to-blue-500 text-white border-accent-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                        : 'text-accent-300 hover:text-white hover:bg-accent-500/20 border-accent-500/30 hover:border-accent-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {isAuthenticated && user ? (
                <>
                  {/* Coins Display */}
                  <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-accent-500/20 to-accent-600/10 px-4 py-2 rounded-xl border border-accent-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Coins className="w-5 h-5 text-accent-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    <span className="text-white font-bold">
                      {user.coins?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center space-x-2 space-x-reverse text-white hover:bg-glass-hover px-4 py-2 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] border ${
                        isProfileOpen
                          ? 'border-primary-500/50 bg-glass-hover shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'border-transparent hover:border-primary-500/30'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="hidden sm:block font-medium">{user.username}</span>
                    </button>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 mt-2 w-80 bg-glass-dark backdrop-blur-xl border-2 border-glass-border rounded-2xl shadow-[0_8px_40px_rgba(168,85,247,0.3)] overflow-hidden z-50"
                          style={{ direction: 'rtl' }}
                        >
                          {/* Header */}
                          <div className="bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 p-4 border-b-2 border-glass-border">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-white font-bold text-lg">{user.username}</h3>
                                {user.email && (
                                  <div className="flex items-center space-x-1 space-x-reverse text-white/60 text-sm">
                                    <Mail className="w-3 h-3" />
                                    <span>{user.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* User Info */}
                          <div className="p-4 border-b border-glass-border/50">
                            <div className="flex items-center space-x-2 space-x-reverse text-white/60 text-sm">
                              <Calendar className="w-4 h-4" />
                              <span>عضو از: {formatDate(user.createdAt)}</span>
                            </div>
                            {user.lastActive && (
                              <div className="flex items-center space-x-2 space-x-reverse text-white/60 text-sm mt-2">
                                <Zap className="w-4 h-4" />
                                <span>آخرین بازدید: {formatDate(user.lastActive)}</span>
                              </div>
                            )}
                          </div>

                          {/* Game Stats */}
                          <div className="p-4 border-b border-glass-border/50">
                            <h4 className="text-white/80 font-semibold mb-3 flex items-center space-x-2 space-x-reverse">
                              <Award className="w-4 h-4" />
                              <span>آمار بازی</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {/* Total Score */}
                              <div className="bg-glass-hover/50 rounded-lg p-3 border border-primary-500/20">
                                <div className="text-white/60 text-xs mb-1">کل امتیاز</div>
                                <div className="text-white font-bold text-lg">
                                  {user.totalScore?.toLocaleString() || 0}
                                </div>
                              </div>

                              {/* Levels Cleared */}
                              <div className="bg-glass-hover/50 rounded-lg p-3 border border-secondary-500/20">
                                <div className="text-white/60 text-xs mb-1">مراحل تکمیل‌شده</div>
                                <div className="text-white font-bold text-lg">
                                  {user.levelsCleared || 0}
                                </div>
                              </div>

                              {/* Words Found */}
                              <div className="bg-glass-hover/50 rounded-lg p-3 border border-accent-500/20">
                                <div className="text-white/60 text-xs mb-1">کلمات پیداشده</div>
                                <div className="text-white font-bold text-lg">
                                  {user.wordsFound || 0}
                                </div>
                              </div>

                              {/* Best Streak */}
                              <div className="bg-glass-hover/50 rounded-lg p-3 border border-orange-500/20">
                                <div className="text-white/60 text-xs mb-1">بهترین رکورد</div>
                                <div className="text-white font-bold text-lg">
                                  {user.bestStreak || 0}
                                </div>
                              </div>

                              {/* Current Streak */}
                              <div className="bg-glass-hover/50 rounded-lg p-3 border border-green-500/20">
                                <div className="text-white/60 text-xs mb-1">رکورد فعلی</div>
                                <div className="text-white font-bold text-lg">
                                  {user.currentStreak || 0}
                                </div>
                              </div>

                              {/* Coins */}
                              <div className="bg-glass-hover/50 rounded-lg p-3 border border-accent-500/20">
                                <div className="text-white/60 text-xs mb-1">سکه‌ها</div>
                                <div className="text-white font-bold text-lg flex items-center space-x-1 space-x-reverse">
                                  <Coins className="w-4 h-4 text-accent-400" />
                                  <span>{user.coins?.toLocaleString() || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress History */}
                          {user.completedLevels && user.completedLevels.length > 0 && (
                            <div className="p-4 border-b border-glass-border/50">
                              <h4 className="text-white/80 font-semibold mb-2 flex items-center space-x-2 space-x-reverse">
                                <Target className="w-4 h-4" />
                                <span>مراحل تکمیل‌شده</span>
                              </h4>
                              <div className="text-white/60 text-sm">
                                {Array.isArray(user.completedLevels)
                                  ? user.completedLevels.map((level, idx) => (
                                      <span key={idx} className="inline-block bg-primary-500/20 px-2 py-1 rounded-md ml-1 mb-1">
                                        {level.name || `مرحله ${level.order || idx + 1}`}
                                      </span>
                                    ))
                                  : `${user.completedLevels} مرحله`
                                }
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="p-3">
                            <button
                              onClick={() => {
                                setIsProfileOpen(false);
                                navigate('/settings');
                              }}
                              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 mb-2 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-white border border-primary-500/30 hover:border-primary-500/50 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>ویرایش پروفایل</span>
                            </button>

                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>خروج</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Link
                    to="/login"
                    className="text-white/80 hover:text-white px-4 py-2 rounded-xl transition-all hover:bg-glass-hover font-medium"
                  >
                    ورود
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white px-6 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] font-bold"
                  >
                    ثبت‌نام
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white hover:bg-glass-hover p-2 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-glass-dark backdrop-blur-xl border-t-2 border-glass-border"
            >
              <div className="px-4 py-4 space-y-2">
                {[...navigation, ...(user?.isAdmin ? adminNavigation : [])].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all font-medium ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                          : 'text-white/80 hover:text-white hover:bg-glass-hover hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-glass backdrop-blur-xl border-t-2 border-glass-border mt-auto shadow-[0_-4px_30px_rgba(168,85,247,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent font-medium">&copy; 2024 وردستان - ساخته شده با ❤️ برای جوونای ایران</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;