import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardService } from '../services/leaderboardService';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Crown } from 'lucide-react';

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
  const topThree = leaderboard.slice(0, 3);
  const restOfPlayers = leaderboard.slice(3);

  const getPodiumHeight = (rank) => {
    if (rank === 1) return 'h-32 sm:h-40';
    if (rank === 2) return 'h-24 sm:h-32';
    if (rank === 3) return 'h-20 sm:h-28';
    return 'h-16';
  };

  const getPodiumGradient = (rank) => {
    if (rank === 1) return 'from-yellow-500/30 to-yellow-600/20';
    if (rank === 2) return 'from-gray-400/30 to-gray-500/20';
    if (rank === 3) return 'from-orange-500/30 to-orange-600/20';
    return 'from-white/10 to-white/5';
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
    return 'bg-white/10 text-white/90 ring-1 ring-white/10';
  };

  const getRowStyle = (rank, isCurrentUser) => {
    if (isCurrentUser) {
      return 'bg-gradient-to-r from-primary-500/30 via-primary-500/20 to-transparent ring-2 ring-primary-500/40 shadow-lg shadow-primary-500/20';
    }
    if (rank <= 10) {
      return 'bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 hover:shadow-md';
    }
    return 'bg-white/[0.02] hover:bg-white/5';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500/20 border-t-primary-500"></div>
          <p className="text-white/60 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12">
      {/* Background Effects */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-br from-primary-500/20 via-purple-500/10 to-transparent blur-3xl" />
      <div className="absolute inset-x-0 top-40 -z-10 h-96 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 blur-3xl" />

      <div className="max-w-6xl mx-auto space-y-6 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-6 sm:pt-8"
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-3 sm:px-5 py-2 backdrop-blur-xl ring-1 ring-white/20">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
            <span className="text-xs sm:text-sm font-semibold text-white">۵۰ بازیکن برتر جهان</span>
          </div>
          <h1 className="mt-4 sm:mt-6 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-l from-white via-white to-white/70 bg-clip-text text-transparent">
              جدول افتخار
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/60 max-w-2xl mx-auto px-4">
            رقابت با بهترین‌ها و کسب رتبه‌های برتر در جهان وُردستان
          </p>
        </motion.div>

        {leaderboard.length > 0 ? (
          <>
            {/* Top 3 Podium - Redesigned for Mobile */}
            {topThree.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                {/* Mobile: Vertical Cards */}
                <div className="flex flex-col gap-3 sm:hidden" dir="rtl">
                  {topThree.map((player, index) => {
                    const isCurrentUser = user?.username === player.username;
                    return (
                      <motion.div
                        key={player.rank}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getPodiumGradient(
                          player.rank
                        )} p-4 backdrop-blur-xl ring-1 ring-white/20 shadow-xl`}
                      >
                        {/* Crown for #1 */}
                        {player.rank === 1 && (
                          <Crown className="absolute top-2 left-2 h-6 w-6 text-yellow-400 animate-pulse" />
                        )}

                        <div className="flex items-center gap-4">
                          {/* Rank Badge */}
                          <div className="flex-shrink-0">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black ${getRankBadgeStyle(player.rank)}`}>
                              {player.rank}
                            </div>
                          </div>

                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-white truncate">
                                {player.username}
                              </h3>
                              {isCurrentUser && (
                                <span className="flex-shrink-0 rounded-full bg-primary-500/40 px-2 py-0.5 text-xs font-medium text-primary-100 ring-1 ring-primary-400/50">
                                  شما
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="text-2xl font-black text-white">
                                {player.totalScore?.toLocaleString() || 0}
                              </span>
                              <span className="text-xs text-white/60">امتیاز</span>
                            </div>
                          </div>

                          {/* Medal */}
                          <div className="flex-shrink-0 text-4xl">
                            {player.rank === 1 && '🥇'}
                            {player.rank === 2 && '🥈'}
                            {player.rank === 3 && '🥉'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Desktop: Podium Style */}
                <div className="hidden sm:block">
                  <div className="relative flex items-end justify-center gap-4 px-4" dir="ltr">
                    {/* 2nd Place */}
                    {topThree[1] && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center flex-1 max-w-[200px]"
                      >
                        <div className="relative mb-4">
                          <div className="absolute -inset-2 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-xl"></div>
                          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-300/50 flex items-center justify-center">
                            <span className="text-3xl">🥈</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 text-center" dir="rtl">
                          {topThree[1].username}
                        </h3>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-4 w-4 text-gray-300" />
                          <span className="text-xl font-black text-white">
                            {topThree[1].totalScore?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className={`w-full ${getPodiumHeight(2)} rounded-t-2xl bg-gradient-to-br ${getPodiumGradient(2)} backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center`}>
                          <span className="text-4xl font-black text-white/90">2</span>
                        </div>
                      </motion.div>
                    )}

                    {/* 1st Place */}
                    {topThree[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center flex-1 max-w-[220px]"
                      >
                        <Crown className="h-8 w-8 text-yellow-400 mb-2 animate-pulse" />
                        <div className="relative mb-4">
                          <div className="absolute -inset-3 bg-gradient-to-br from-yellow-400/40 to-yellow-600/40 rounded-full blur-2xl animate-pulse"></div>
                          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 ring-4 ring-yellow-300/70 shadow-2xl shadow-yellow-500/50 flex items-center justify-center">
                            <span className="text-4xl">🥇</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-white mb-1 text-center" dir="rtl">
                          {topThree[0].username}
                        </h3>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-5 w-5 text-yellow-400" />
                          <span className="text-2xl font-black bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                            {topThree[0].totalScore?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className={`w-full ${getPodiumHeight(1)} rounded-t-2xl bg-gradient-to-br ${getPodiumGradient(1)} backdrop-blur-xl ring-2 ring-yellow-400/30 shadow-2xl shadow-yellow-500/20 flex items-center justify-center`}>
                          <span className="text-5xl font-black text-white">1</span>
                        </div>
                      </motion.div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center flex-1 max-w-[200px]"
                      >
                        <div className="relative mb-4">
                          <div className="absolute -inset-2 bg-gradient-to-br from-orange-400/30 to-orange-500/30 rounded-full blur-xl"></div>
                          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 ring-4 ring-orange-300/50 flex items-center justify-center">
                            <span className="text-3xl">🥉</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 text-center" dir="rtl">
                          {topThree[2].username}
                        </h3>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="h-4 w-4 text-orange-300" />
                          <span className="text-xl font-black text-white">
                            {topThree[2].totalScore?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div className={`w-full ${getPodiumHeight(3)} rounded-t-2xl bg-gradient-to-br ${getPodiumGradient(3)} backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center`}>
                          <span className="text-4xl font-black text-white/90">3</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest of Players - Improved Design */}
            {restOfPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-2xl"
              >
                <div className="p-3 sm:p-6" dir="rtl">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
                    <h2 className="text-base sm:text-xl font-bold text-white">
                      سایر بازیکنان برتر
                    </h2>
                    <span className="mr-auto text-xs sm:text-sm text-white/50">
                      {restOfPlayers.length} بازیکن
                    </span>
                  </div>

                  {/* Players List */}
                  <div className="space-y-2">
                    {restOfPlayers.map((player, index) => {
                      const isCurrentUser = user?.username === player.username;

                      return (
                        <motion.div
                          key={player.rank}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.02, duration: 0.3 }}
                          className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 ${getRowStyle(
                            player.rank,
                            isCurrentUser
                          )}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            {/* Rank Badge */}
                            <div className="flex-shrink-0">
                              <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-transform group-hover:scale-110 ${getRankBadgeStyle(
                                player.rank
                              )}`}>
                                {player.rank}
                              </div>
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-sm sm:text-base font-bold truncate ${
                                  isCurrentUser ? 'text-primary-200' : 'text-white'
                                }`}>
                                  {player.username}
                                </h3>
                                {isCurrentUser && (
                                  <span className="flex-shrink-0 rounded-full bg-primary-500/40 px-2 py-0.5 text-xs font-medium text-primary-100 ring-1 ring-primary-400/50">
                                    شما
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/40 mt-0.5">
                                {player.rank <= 10 ? 'بازیکن برتر' : 'بازیکن'}
                              </p>
                            </div>

                            {/* Score */}
                            <div className="flex-shrink-0 text-left" dir="ltr">
                              <div className="flex items-baseline gap-1">
                                <span className="text-base sm:text-lg font-black text-white">
                                  {player.totalScore?.toLocaleString() || 0}
                                </span>
                              </div>
                              <p className="text-xs text-white/40 text-right" dir="rtl">امتیاز</p>
                            </div>
                          </div>

                          {/* Top 10 Indicator */}
                          {player.rank <= 10 && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-purple-500"></div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-center text-white/60 p-8"
          >
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white/80 mb-2">هیچ بازیکنی یافت نشد</h3>
            <p className="text-sm text-white/50">اولین نفری باشید که رتبه کسب می‌کند!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
