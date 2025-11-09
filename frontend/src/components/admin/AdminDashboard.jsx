import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { formatToman } from '../../utils/currency';
import {
  Users,
  Layers,
  Type,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Activity,
  Award
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  // Fetch dashboard statistics
  const { data: dashboardData, isLoading } = useQuery(
    ['adminDashboard'],
    () => adminService.getDashboardStats(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const stats = dashboardData?.data;

  const overviewCards = [
    {
      title: 'Total Users',
      value: stats?.overview?.totalUsers || 0,
      icon: Users,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20'
    },
    {
      title: 'Total Levels',
      value: stats?.overview?.totalLevels || 0,
      icon: Layers,
      color: 'text-secondary-400',
      bgColor: 'bg-secondary-500/20'
    },
    {
      title: 'Total Words',
      value: stats?.overview?.totalWords || 0,
      icon: Type,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Coin Packs',
      value: stats?.overview?.totalCoinPacks || 0,
      icon: ShoppingCart,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ];

  const activityCards = [
    {
      title: 'Active Today',
      value: stats?.activity?.activeUsersToday || 0,
      icon: Activity,
      color: 'text-success'
    },
    {
      title: 'New Users Today',
      value: stats?.activity?.newUsersToday || 0,
      icon: TrendingUp,
      color: 'text-blue-400'
    },
    {
      title: 'Total Purchases',
      value: stats?.activity?.totalPurchases || 0,
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      title: 'Total Revenue',
      value: formatToman(stats?.activity?.totalRevenue || 0),
      icon: Award,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {card.value.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">{card.title}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Activity Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Today's Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activityCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4"
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-8 h-8 ${card.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-white">{card.value}</div>
                    <div className="text-white/60 text-sm">{card.title}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Top Levels Section */}
      {stats?.levels?.topLevels && stats.levels.topLevels.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Most Popular Levels</h2>
          <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
            <div className="space-y-4">
              {stats.levels.topLevels.slice(0, 5).map((level, index) => (
                <motion.div
                  key={level._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between bg-glass-hover rounded-lg p-4"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">{level.order}</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">مرحله {level.order}: {level.letters}</div>
                      <div className="text-white/60 text-sm">
                        {level.words?.length || 0} کلمه
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 hover:bg-glass-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400"
            onClick={() => navigate('/admin/users')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate('/admin/users');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="text-center">
              <Users className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <div className="text-white font-medium">Manage Users</div>
              <div className="text-white/60 text-sm">View and manage user accounts</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 hover:bg-glass-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary-400"
            onClick={() => navigate('/admin/words', { state: { openCreate: true } })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate('/admin/words', { state: { openCreate: true } });
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="text-center">
              <Type className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
              <div className="text-white font-medium">Add Words</div>
              <div className="text-white/60 text-sm">Create new word entries</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 hover:bg-glass-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
            onClick={() => navigate('/admin/levels', { state: { openCreate: true } })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate('/admin/levels', { state: { openCreate: true } });
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="text-center">
              <Layers className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-white font-medium">Create Level</div>
              <div className="text-white/60 text-sm">Design new game levels</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 hover:bg-glass-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => navigate('/admin/coin-packs')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate('/admin/coin-packs');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="text-center">
              <ShoppingCart className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-white font-medium">Manage Store</div>
              <div className="text-white/60 text-sm">Update coin packs and pricing</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;