import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardService } from '../services/leaderboardService';
import { 
  Play, 
  Trophy, 
  Users, 
  Star, 
  TrendingUp,
  Target,
  Zap,
  Award
} from 'lucide-react';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState(null);

  // Fetch leaderboard data
  const { data: leaderboard } = useQuery(
    ['leaderboard', 'home'],
    () => leaderboardService.getLeaderboard(5, 0),
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  useEffect(() => {
    if (leaderboard?.data) {
      setLeaderboardData(leaderboard.data);
    }
  }, [leaderboard]);

  const features = [
    {
      icon: Target,
      title: 'کشیدن و اتصال',
      description: 'گیم‌پلی آسان با اتصال حروف به یکدیگر',
      color: 'text-primary-400',
      bgGradient: 'from-primary-500/20 to-primary-600/10'
    },
    {
      icon: Zap,
      title: 'قدرت‌های ویژه',
      description: 'از راهنما و حل خودکار برای عبور از مراحل سخت استفاده کنید',
      color: 'text-secondary-400',
      bgGradient: 'from-secondary-500/20 to-secondary-600/10'
    },
    {
      icon: Trophy,
      title: 'جدول امتیازات',
      description: 'با بازیکنان سراسر جهان رقابت کنید و رتبه خود را ارتقا دهید',
      color: 'text-accent-400',
      bgGradient: 'from-accent-500/20 to-accent-600/10'
    },
    {
      icon: Award,
      title: 'دستاوردها',
      description: 'دستاوردها را باز کنید و با پیشرفت خود جوایز کسب کنید',
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-blue-600/10'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-gradient-shift bg-[length:200%_auto]">
          کلمات متصل
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg">
          دانش واژگان خود را با بازی پازل کلمات اعتیادآور ما به چالش بکشید.
          حروف را به هم وصل کنید و کلمات پنهان را کشف کنید.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/game"
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 space-x-reverse shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]"
          >
            <Play className="w-6 h-6" />
            <span>شروع بازی</span>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-glass hover:bg-glass-hover text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-2 space-x-reverse border-2 border-glass-border hover:border-primary-400 backdrop-blur-xl shadow-glass hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            <Trophy className="w-6 h-6" />
            <span>مشاهده جدول امتیازات</span>
          </Link>
        </div>
      </motion.div>

      {/* User Stats Section */}
      {isAuthenticated && user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-glass backdrop-blur-xl rounded-3xl border-2 border-glass-border p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] transition-all"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-8 text-center">پیشرفت شما</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20 hover:border-primary-500/40 transition-all">
              <div className="text-4xl font-bold text-primary-400 mb-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{user.levelsCleared || 0}</div>
              <div className="text-white/70 font-medium">مراحل طی‌شده</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-accent-500/10 to-accent-600/5 border border-accent-500/20 hover:border-accent-500/40 transition-all">
              <div className="text-4xl font-bold text-accent-400 mb-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">{user.coins || 0}</div>
              <div className="text-white/70 font-medium">سکه</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-secondary-500/10 to-secondary-600/5 border border-secondary-500/20 hover:border-secondary-500/40 transition-all">
              <div className="text-4xl font-bold text-secondary-400 mb-2 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">{user.wordsFound || 0}</div>
              <div className="text-white/70 font-medium">کلمات یافته‌شده</div>
            </div>

            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="text-4xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{user.totalScore || 0}</div>
              <div className="text-white/70 font-medium">امتیاز کل</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent text-center mb-12">ویژگی‌های بازی</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`bg-glass backdrop-blur-xl rounded-2xl border-2 border-glass-border p-6 text-center hover:bg-glass-hover transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 ${feature.color} mx-auto mb-4 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]`}>
                    <Icon className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white/95">{feature.title}</h3>
                  <p className="text-white/70 group-hover:text-white/80">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Leaderboard Preview */}
      {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-glass backdrop-blur-xl rounded-3xl border-2 border-glass-border p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">بازیکنان برتر</h2>
            <Link
              to="/leaderboard"
              className="text-primary-400 hover:text-primary-300 transition-all font-bold hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            >
              مشاهده همه ←
            </Link>
          </div>

          <div className="space-y-3">
            {leaderboardData.leaderboard.slice(0, 5).map((player, index) => {
              const rankColors = [
                'from-accent-400 to-accent-600',
                'from-secondary-400 to-secondary-600',
                'from-primary-400 to-primary-600',
                'from-blue-400 to-blue-600',
                'from-primary-300 to-secondary-300'
              ];
              return (
                <div
                  key={player._id}
                  className="flex items-center justify-between bg-gradient-to-r from-glass-purple to-glass-dark rounded-xl p-4 border border-glass-border hover:border-primary-500/30 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${rankColors[index]} text-white font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className="text-white font-bold">{player.username}</div>
                      <div className="text-white/70 text-sm">
                        {player.levelsCleared} مرحله • {player.wordsFound} کلمه
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-primary-400 font-bold text-lg drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">{player.totalScore.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">امتیاز</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <div className="relative bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 backdrop-blur-xl rounded-3xl border-2 border-glass-border p-10 shadow-[0_0_60px_rgba(168,85,247,0.2)] overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-accent-500/10 animate-gradient-shift bg-[length:200%_auto]"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-300 via-secondary-300 to-accent-300 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              آماده‌اید دانش واژگان خود را به چالش بکشید؟
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
              به هزاران بازیکن در بهترین تجربه پازل کلمات بپیوندید.
              حروف را به هم وصل کنید، کلمات را کشف کنید و در جدول امتیازات بالا بروید!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-secondary-500 to-accent-500 hover:from-secondary-400 hover:to-accent-400 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 hover:-translate-y-1 shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.7)]"
                >
                  ساخت حساب کاربری
                </Link>
              )}

              <Link
                to="/game"
                className="bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-400 hover:to-blue-400 text-white font-bold py-4 px-10 rounded-xl transition-all transform hover:scale-105 hover:-translate-y-1 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]"
              >
                شروع بازی
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;