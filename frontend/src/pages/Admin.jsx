import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Dashboard, 
  Words, 
  Layers, 
  ShoppingCart, 
  Settings,
  BarChart3,
  Users,
  Gamepad2
} from 'lucide-react';

// Admin Components
import AdminDashboard from '../components/admin/AdminDashboard';
import WordManagement from '../components/admin/WordManagement';
import LevelManagement from '../components/admin/LevelManagement';
import CoinPackManagement from '../components/admin/CoinPackManagement';

const Admin = () => {
  const location = useLocation();
  const { user } = useAuth();

  const adminNav = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Dashboard,
      component: AdminDashboard
    },
    {
      name: 'Words',
      href: '/admin/words',
      icon: Words,
      component: WordManagement
    },
    {
      name: 'Levels',
      href: '/admin/levels',
      icon: Layers,
      component: LevelManagement
    },
    {
      name: 'Coin Packs',
      href: '/admin/coin-packs',
      icon: ShoppingCart,
      component: CoinPackManagement
    }
  ];

  const isActive = (path) => location.pathname === path;

  const CurrentComponent = adminNav.find(nav => nav.href === location.pathname)?.component || AdminDashboard;

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
            <CurrentComponent />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Admin;