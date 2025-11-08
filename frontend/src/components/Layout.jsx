import { useState } from 'react';
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
  User,
  Coins,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'خانه', href: '/', icon: Home },
    { name: 'بازی', href: '/game', icon: Gamepad2 },
    { name: 'فروشگاه', href: '/store', icon: ShoppingCart },
    { name: 'جدول امتیازات', href: '/leaderboard', icon: Trophy },
  ];

  const adminNavigation = [
    { name: 'پنل مدیریت', href: '/admin', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-glass backdrop-blur-lg border-b border-glass-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">کلمات متصل</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-500 text-white'
                        : 'text-white/80 hover:text-white hover:bg-glass-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
                    className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-colors border ${
                      isActive(item.href)
                        ? 'bg-secondary-500 text-white border-secondary-400'
                        : 'text-secondary-300 hover:text-white hover:bg-secondary-500/20 border-secondary-500/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
                  <div className="flex items-center space-x-2 space-x-reverse bg-glass-hover px-3 py-2 rounded-lg">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-medium">
                      {user.coins?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button className="flex items-center space-x-2 space-x-reverse text-white hover:bg-glass-hover px-3 py-2 rounded-lg transition-colors">
                      <User className="w-5 h-5" />
                      <span className="hidden sm:block">{user.username}</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 space-x-reverse text-white/80 hover:text-white hover:bg-danger/20 px-3 py-2 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Link
                    to="/login"
                    className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    ورود
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
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
              className="md:hidden bg-glass border-t border-glass-border"
            >
              <div className="px-4 py-4 space-y-2">
                {[...navigation, ...(user?.isAdmin ? adminNavigation : [])].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-500 text-white'
                          : 'text-white/80 hover:text-white hover:bg-glass-hover'
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
      <footer className="bg-glass backdrop-blur-lg border-t border-glass-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-white/60">
            <p>&copy; 2024 بازی کلمات متصل. تمامی حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;