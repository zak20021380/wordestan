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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-400" />
          <h1 className="text-4xl font-bold text-white">🏆 رتبه‌بندی جهانی</h1>
        </div>
        <p className="text-lg text-white/70 max-w-xl mx-auto">
          فقط نام کاربر، امتیاز کل و رتبه — ساده و شفاف.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
      >
        <div className="flex items-center justify-between mb-6 text-white" dir="rtl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>رتبه‌بندی جهانی</span>
            <span className="text-sm text-white/60">۵۰ بازیکن برتر</span>
          </h2>
        </div>

        {leaderboard.length > 0 ? (
          <div className="divide-y divide-white/5 rounded-xl overflow-hidden border border-white/5">
            {leaderboard.map((player) => {
              const isCurrentUser = user?.username === player.username;

              return (
                <div
                  key={player.rank}
                  className={`bg-black/20 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4 transition-colors ${
                    isCurrentUser ? 'bg-primary-500/10 border-r-4 border-primary-400' : 'border-r-4 border-transparent'
                  }`}
                  dir="rtl"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-white w-8 text-center">
                      {player.rank}
                    </span>
                    <span className="text-2xl w-10 text-center">{getMedal(player.rank)}</span>
                    <span
                      className={`text-base font-semibold ${
                        isCurrentUser ? 'text-primary-200' : 'text-white'
                      }`}
                    >
                      {player.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span>{player.totalScore?.toLocaleString() || 0}</span>
                    <span className="text-sm text-white/60">امتیاز</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-white/60 py-12">هیچ بازیکنی یافت نشد</div>
        )}
      </motion.div>
    </div>
  );
};

export default Leaderboard;