import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  ShoppingCart,
  Settings,
  Users
} from 'lucide-react';

// Admin Components

const Admin = () => {
  const location = useLocation();
  const { user } = useAuth();

  const adminNav = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard
    },
    {
      name: 'Words',
      href: '/admin/words',
      icon: BookOpen
    },
    {
      name: 'Levels',
      href: '/admin/levels',
      icon: Layers
    },
    {
      name: 'Coin Packs',
      href: '/admin/coin-packs',
      icon: ShoppingCart
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/60">
              Welcome back, {user?.username}! Manage your game content here.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-secondary-500/20 text-secondary-400 px-4 py-2 rounded-lg">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Admin Mode</span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
            <nav className="space-y-2">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-500 text-white'
                        : 'text-white/60 hover:text-white hover:bg-glass-hover'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Admin;