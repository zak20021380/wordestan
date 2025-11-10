import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardService } from '../services/leaderboardService';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery(
    ['leaderboard', 'global'],
    () => leaderboardService.getLeaderboard(50, 0),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const leaderboard = data?.data?.leaderboard || [];

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) {
      return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 shadow-lg shadow-yellow-500/50 ring-2 ring-yellow-300';
    }
    if (rank === 2) {
      return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-900 shadow-lg shadow-gray-400/50 ring-2 ring-gray-300';
    }
    if (rank === 3) {
      return 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-orange-900 shadow-lg shadow-orange-500/50 ring-2 ring-orange-300';
    }
    if (rank <= 10) {
      return 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white ring-1 ring-white/20';
    }
    return 'bg-white/10 text-white/90';
  };

  const getRowStyle = (rank, isCurrentUser) => {
    if (isCurrentUser) {
      return 'bg-primary-500/20 shadow-inner shadow-primary-500/30 ring-1 ring-primary-500/30';
    }
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent hover:from-yellow-500/20';
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-gray-400/10 via-transparent to-transparent hover:from-gray-400/20';
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-orange-500/10 via-transparent to-transparent hover:from-orange-500/20';
    }
    return 'hover:bg-white/5';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-primary-500/30 via-purple-500/20 to-transparent blur-3xl" />

      <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-xl">
            <Trophy className="h-6 w-6 text-yellow-300" />
            <span className="text-sm font-medium text-white/80">۵۰ بازیکن برتر</span>
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            رتبه‌بندی جهانی
          </h1>
          <p className="mt-4 text-base text-white/70 sm:text-lg">
            با تازه‌ترین سبک طراحی، وضعیت بازیکنان برتر را در یک نگاه ببینید. رتبه‌ها به‌روزرسانی
            زنده و تطبیق‌پذیر با موبایل.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-primary-900/20 backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-6" dir="rtl">
            <div className="flex flex-col gap-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50 sm:text-sm">
                  رده‌بندی نهایی
                </p>
                <h2 className="mt-1 bg-gradient-to-l from-white to-white/80 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
                  جدول افتخار بازی
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 rounded-2xl bg-gradient-to-r from-black/40 to-black/20 px-3 py-2 text-xs backdrop-blur-sm sm:justify-center sm:gap-3 sm:px-4 sm:text-sm">
                <span className="flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-2 py-1 ring-1 ring-yellow-500/20">
                  <span className="text-lg sm:text-xl">🥇</span>
                  <span className="font-medium text-yellow-200">رتبه ۱</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-gray-400/10 px-2 py-1 ring-1 ring-gray-400/20">
                  <span className="text-lg sm:text-xl">🥈</span>
                  <span className="font-medium text-gray-200">رتبه ۲</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2 py-1 ring-1 ring-orange-500/20">
                  <span className="text-lg sm:text-xl">🥉</span>
                  <span className="font-medium text-orange-200">رتبه ۳</span>
                </span>
              </div>
            </div>

            {leaderboard.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/60">
                  <span className="col-span-2 text-right">رتبه</span>
                  <span className="col-span-6 text-right">بازیکن</span>
                  <span className="col-span-4 text-center">امتیاز</span>
                </div>

                <div className="divide-y divide-white/5 bg-black/20 backdrop-blur-xl">
                  {leaderboard.map((player, index) => {
                    const isCurrentUser = user?.username === player.username;
                    const medal = getMedal(player.rank);

                    return (
                      <motion.div
                        key={player.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className={`grid grid-cols-12 items-center gap-3 px-4 py-4 transition-all duration-300 sm:gap-4 sm:px-6 ${getRowStyle(
                          player.rank,
                          isCurrentUser
                        )}`}
                      >
                        {/* Rank Badge - Mobile & Desktop */}
                        <div className="col-span-3 flex items-center justify-end gap-2 sm:col-span-2 sm:gap-3">
                          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
                            <span
                              className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold transition-transform hover:scale-110 sm:h-12 sm:w-12 sm:text-lg ${getRankBadgeStyle(
                                player.rank
                              )}`}
                            >
                              {player.rank}
                            </span>
                            {medal && (
                              <span className="text-2xl sm:text-3xl animate-pulse">
                                {medal}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Player Info */}
                        <div className="col-span-6 sm:col-span-6">
                          <div className="flex flex-col gap-1">
                            <p
                              className={`text-sm font-bold sm:text-lg ${
                                isCurrentUser
                                  ? 'text-primary-200'
                                  : player.rank <= 3
                                  ? 'text-white'
                                  : 'text-white/90'
                              }`}
                            >
                              {player.username}
                              {isCurrentUser && (
                                <span className="mr-2 rounded-full bg-primary-500/30 px-2 py-0.5 text-xs font-medium text-primary-100">
                                  شما
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/50 sm:text-sm">
                              {player.rank <= 3 ? 'بازیکن افتخاری' : 'بازیکن جهانی'}
                            </p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="col-span-3 flex flex-col items-center justify-center gap-0.5 sm:col-span-4">
                          <div className="flex items-baseline gap-1 sm:gap-2">
                            <span
                              className={`text-base font-black sm:text-xl ${
                                player.rank <= 3
                                  ? 'bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent'
                                  : 'text-white'
                              }`}
                            >
                              {player.totalScore?.toLocaleString() || 0}
                            </span>
                          </div>
                          <span className="text-xs text-white/50">امتیاز</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl bg-black/30 text-center text-white/60">
                <span className="text-4xl">🕹️</span>
                <p className="mt-4 text-sm">هیچ بازیکنی یافت نشد</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
