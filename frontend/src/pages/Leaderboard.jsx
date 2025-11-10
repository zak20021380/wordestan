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
  const topPlayers = leaderboard.slice(0, 3);
  const otherPlayers = leaderboard.slice(3);

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#10082e] via-[#07031d] to-[#02000c]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary-500/30 via-purple-500/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-32 -z-10 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl sm:h-72 sm:w-72" />
      <div className="pointer-events-none absolute -left-32 top-56 -z-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl sm:-left-20 sm:h-80 sm:w-80" />

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center text-white"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-xl sm:text-sm">
            <Trophy className="h-5 w-5 text-yellow-300" />
            <span>۵۰ بازیکن برتر جهان</span>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            رتبه‌بندی جهانی بازیکنان
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
            رقابت جهانی را در فضایی مدرن و کاملاً واکنش‌گرا دنبال کنید. جدول افتخار ما تجربه‌ای حرفه‌ای روی موبایل و دسکتاپ رقم می‌زند.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] px-5 py-8 shadow-2xl shadow-primary-900/20 backdrop-blur-2xl sm:px-8"
          dir="rtl"
        >
          <div className="absolute inset-x-10 top-0 -z-10 h-32 rounded-b-full bg-gradient-to-b from-white/10 to-transparent opacity-60" />

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50 sm:text-sm">رده‌بندی نهایی</p>
                <h2 className="mt-1 bg-gradient-to-l from-white to-white/80 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
                  جدول افتخار بازی
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 rounded-2xl bg-gradient-to-r from-white/5 to-transparent px-3 py-2 text-[11px] backdrop-blur-sm sm:justify-center sm:gap-3 sm:px-4 sm:text-xs">
                <span className="flex items-center gap-1.5 rounded-xl bg-yellow-500/10 px-2 py-1 font-medium text-yellow-200 ring-1 ring-yellow-500/30">
                  <span className="text-lg sm:text-xl">🥇</span>
                  رتبه ۱
                </span>
                <span className="flex items-center gap-1.5 rounded-xl bg-gray-400/10 px-2 py-1 font-medium text-gray-200 ring-1 ring-gray-400/30">
                  <span className="text-lg sm:text-xl">🥈</span>
                  رتبه ۲
                </span>
                <span className="flex items-center gap-1.5 rounded-xl bg-orange-500/10 px-2 py-1 font-medium text-orange-200 ring-1 ring-orange-500/30">
                  <span className="text-lg sm:text-xl">🥉</span>
                  رتبه ۳
                </span>
              </div>
            </div>

            {leaderboard.length > 0 ? (
              <div className="flex flex-col gap-8">
                {/* Podium */}
                <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
                  {topPlayers.map((player, index) => {
                    const isCurrentUser = user?.username === player.username;
                    const highlightStyles =
                      player.rank === 1
                        ? 'sm:order-2 sm:-mt-10 bg-gradient-to-br from-yellow-400/20 via-yellow-500/10 to-transparent'
                        : player.rank === 2
                        ? 'sm:order-1'
                        : 'sm:order-3';

                    return (
                      <motion.div
                        key={player.rank}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15, duration: 0.4 }}
                        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-xl transition-transform duration-500 hover:-translate-y-2 hover:shadow-2xl ${highlightStyles}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-70" />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                          <span
                            className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${getRankBadgeStyle(
                              player.rank
                            )}`}
                          >
                            {player.rank}
                          </span>
                          <p className={`text-lg font-bold sm:text-xl ${isCurrentUser ? 'text-primary-100' : 'text-white'}`}>
                            {player.username}
                            {isCurrentUser && (
                              <span className="mr-2 rounded-full bg-primary-500/30 px-2 py-0.5 text-xs font-medium text-primary-50">
                                شما
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-white/60 sm:text-sm">
                            {player.rank === 1 ? 'قهرمان جهانی' : player.rank === 2 ? 'نایب قهرمان' : 'سوم جهانی'}
                          </p>
                          <div className="mt-3 flex flex-col items-center text-white">
                            <span className="text-2xl font-black sm:text-3xl">
                              {player.totalScore?.toLocaleString() || 0}
                            </span>
                            <span className="text-xs text-white/60">امتیاز کل</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Remaining Players */}
                {otherPlayers.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {otherPlayers.map((player, index) => {
                      const isCurrentUser = user?.username === player.username;
                      const medal = getMedal(player.rank);

                      return (
                        <motion.div
                          key={player.rank}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
                          className={`flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-white shadow-lg transition-all duration-300 hover:border-primary-400/40 hover:bg-primary-500/10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 ${getRowStyle(
                            player.rank,
                            isCurrentUser
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-4 sm:justify-start">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold sm:h-12 sm:w-12 ${getRankBadgeStyle(
                                  player.rank
                                )}`}
                              >
                                {player.rank}
                              </span>
                              {medal && <span className="text-2xl sm:text-3xl">{medal}</span>}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col gap-1 text-right sm:items-end">
                            <p className={`text-base font-bold sm:text-lg ${isCurrentUser ? 'text-primary-100' : 'text-white'}`}>
                              {player.username}
                              {isCurrentUser && (
                                <span className="mr-2 rounded-full bg-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-50">
                                  شما
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/50 sm:text-sm">
                              {player.rank <= 10 ? 'بازیکن برتر جهانی' : 'بازیکن فعال جهانی'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-left sm:flex-col sm:items-end sm:justify-center sm:gap-1">
                            <span className="text-lg font-black sm:text-xl">
                              {player.totalScore?.toLocaleString() || 0}
                            </span>
                            <span className="text-xs text-white/50">امتیاز</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl bg-black/30 text-center text-white/60">
                <span className="text-4xl">🕹️</span>
                <p className="mt-4 text-sm">هیچ بازیکنی یافت نشد</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Leaderboard;
