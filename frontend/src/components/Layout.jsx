import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Gamepad2,
  ShoppingCart,
  Trophy,
  Settings,
  Menu,
  X,
  Coins,
  Milestone,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileMenu from './UserProfileMenu';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const baseNavigation = useMemo(() => [
    { name: 'خونه', href: '/', icon: Home },
    { name: 'بازی', href: '/game', icon: Gamepad2 },
    { name: 'مراحل', href: '/levels', icon: Milestone },
    { name: 'فروشگاه', href: '/store', icon: ShoppingCart },
    { name: 'امتیازها', href: '/leaderboard', icon: Trophy },
  ], []);

  const navigation = useMemo(() => {
    if (!isAuthenticated) {
      return baseNavigation;
    }

    return [
      baseNavigation[0],
      baseNavigation[1],
      { name: 'جعبه لایتنر', href: '/leitner', icon: BookOpen },
      ...baseNavigation.slice(2),
    ];
  }, [baseNavigation, isAuthenticated]);

  const adminNavigation = [
    { name: 'پنل ادمین', href: '/admin', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

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
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">حرف‌لند</span>
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
                  <UserProfileMenu />
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
            <p className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent font-medium">&copy; 2024 حرف‌لند - ساخته شده با 💜 برای جوونای ایران</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;