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
      color: 'text-primary-400'
    },
    {
      icon: Zap,
      title: 'قدرت‌های ویژه',
      description: 'از راهنما و حل خودکار برای عبور از مراحل سخت استفاده کنید',
      color: 'text-secondary-400'
    },
    {
      icon: Trophy,
      title: 'جدول امتیازات',
      description: 'با بازیکنان سراسر جهان رقابت کنید و رتبه خود را ارتقا دهید',
      color: 'text-yellow-400'
    },
    {
      icon: Award,
      title: 'دستاوردها',
      description: 'دستاوردها را باز کنید و با پیشرفت خود جوایز کسب کنید',
      color: 'text-purple-400'
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
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
          کلمات متصل
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          دانش واژگان خود را با بازی پازل کلمات اعتیادآور ما به چالش بکشید.
          حروف را به هم وصل کنید و کلمات پنهان را کشف کنید.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/game"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <Play className="w-6 h-6" />
            <span>شروع بازی</span>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-glass hover:bg-glass-hover text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse border border-glass-border"
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
          className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">پیشرفت شما</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400 mb-2">{user.levelsCleared || 0}</div>
              <div className="text-white/60">مراحل طی‌شده</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{user.coins || 0}</div>
              <div className="text-white/60">سکه</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-400 mb-2">{user.wordsFound || 0}</div>
              <div className="text-white/60">کلمات یافته‌شده</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{user.totalScore || 0}</div>
              <div className="text-white/60">امتیاز کل</div>
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
        <h2 className="text-3xl font-bold text-white text-center mb-12">ویژگی‌های بازی</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6 text-center hover:bg-glass-hover transition-colors"
              >
                <div className={`w-12 h-12 ${feature.color} mx-auto mb-4`}>
                  <Icon className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
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
          className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">بازیکنان برتر</h2>
            <Link
              to="/leaderboard"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              مشاهده همه ←
            </Link>
          </div>

          <div className="space-y-3">
            {leaderboardData.leaderboard.slice(0, 5).map((player, index) => (
              <div
                key={player._id}
                className="flex items-center justify-between bg-glass-hover rounded-lg p-4"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-sm">
                    {player.rank}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.username}</div>
                    <div className="text-white/60 text-sm">
                      {player.levelsCleared} مرحله • {player.wordsFound} کلمه
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-primary-400 font-bold">{player.totalScore.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">امتیاز</div>
                </div>
              </div>
            ))}
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
        <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 backdrop-blur-lg rounded-2xl border border-glass-border p-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            آماده‌اید دانش واژگان خود را به چالش بکشید؟
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            به هزاران بازیکن در بهترین تجربه پازل کلمات بپیوندید.
            حروف را به هم وصل کنید، کلمات را کشف کنید و در جدول امتیازات بالا بروید!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <Link
                to="/register"
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
              >
                ساخت حساب کاربری
              </Link>
            )}

            <Link
              to="/game"
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
            >
              شروع بازی
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;