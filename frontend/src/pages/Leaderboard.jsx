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
            <div className="flex flex-col gap-2 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-white/60">رده‌بندی نهایی</p>
                <h2 className="text-2xl font-bold">جدول افتخار بازی</h2>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-2xl bg-black/30 px-4 py-2 text-sm text-white/80">
                <span className="flex items-center gap-1"><span className="text-base">🥇</span> رتبه ۱</span>
                <span className="hidden h-4 w-px bg-white/20 sm:block" />
                <span className="flex items-center gap-1"><span className="text-base">🥈</span> رتبه ۲</span>
                <span className="hidden h-4 w-px bg-white/20 sm:block" />
                <span className="flex items-center gap-1"><span className="text-base">🥉</span> رتبه ۳</span>
              </div>
            </div>

            {leaderboard.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-12 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/60 sm:text-sm">
                  <span className="col-span-3 text-right sm:col-span-2">رتبه</span>
                  <span className="col-span-5 text-right sm:col-span-6">بازیکن</span>
                  <span className="col-span-4 text-left sm:text-right sm:col-span-4">امتیاز</span>
                </div>

                <div className="divide-y divide-white/5 bg-black/20 backdrop-blur-xl">
                  {leaderboard.map((player) => {
                    const isCurrentUser = user?.username === player.username;

                    return (
                      <div
                        key={player.rank}
                        className={`grid grid-cols-12 items-center gap-2 px-4 py-4 transition-all sm:gap-4 ${
                          isCurrentUser
                            ? 'bg-primary-500/10 shadow-inner shadow-primary-500/20'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="col-span-3 flex justify-end sm:col-span-2">
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base font-bold text-white">
                            {player.rank}
                            {getMedal(player.rank) && (
                              <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs">
                                {getMedal(player.rank)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-5 text-right sm:col-span-6">
                          <p
                            className={`text-sm font-semibold sm:text-base ${
                              isCurrentUser ? 'text-primary-100' : 'text-white'
                            }`}
                          >
                            {player.username}
                          </p>
                          <p className="text-xs text-white/60 sm:text-sm">بازیکن جهانی</p>
                        </div>

                        <div className="col-span-4 flex flex-col items-end text-left sm:col-span-4 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                          <span className="text-lg font-bold text-white sm:text-xl">
                            {player.totalScore?.toLocaleString() || 0}
                          </span>
                          <span className="text-xs text-white/60 sm:text-sm">امتیاز</span>
                        </div>
                      </div>
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
