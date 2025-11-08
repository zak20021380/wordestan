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
      title: 'Drag & Connect',
      description: 'Intuitive drag-to-connect gameplay with live SVG path rendering',
      color: 'text-primary-400'
    },
    {
      icon: Zap,
      title: 'Power-ups',
      description: 'Use hints and auto-solve to overcome challenging levels',
      color: 'text-secondary-400'
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      description: 'Compete with players worldwide and climb the rankings',
      color: 'text-yellow-400'
    },
    {
      icon: Award,
      title: 'Achievements',
      description: 'Unlock achievements and earn rewards as you progress',
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
          Word Connect
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Challenge your vocabulary with our addictive word puzzle game. 
          Drag to connect letters and discover hidden words in a beautiful wooden-themed interface.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/game"
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <Play className="w-6 h-6" />
            <span>Start Playing</span>
          </Link>
          
          <Link
            to="/leaderboard"
            className="bg-glass hover:bg-glass-hover text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2 border border-glass-border"
          >
            <Trophy className="w-6 h-6" />
            <span>View Leaderboard</span>
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
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Progress</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400 mb-2">{user.levelsCleared || 0}</div>
              <div className="text-white/60">Levels Cleared</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{user.coins || 0}</div>
              <div className="text-white/60">Coins</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-400 mb-2">{user.wordsFound || 0}</div>
              <div className="text-white/60">Words Found</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{user.totalScore || 0}</div>
              <div className="text-white/60">Total Score</div>
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
        <h2 className="text-3xl font-bold text-white text-center mb-12">Game Features</h2>
        
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
            <h2 className="text-2xl font-bold text-white">Top Players</h2>
            <Link
              to="/leaderboard"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {leaderboardData.leaderboard.slice(0, 5).map((player, index) => (
              <div
                key={player._id}
                className="flex items-center justify-between bg-glass-hover rounded-lg p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-sm">
                    {player.rank}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.username}</div>
                    <div className="text-white/60 text-sm">
                      {player.levelsCleared} levels • {player.wordsFound} words
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary-400 font-bold">{player.totalScore.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">points</div>
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
            Ready to Challenge Your Vocabulary?
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Join thousands of players in the ultimate word puzzle experience. 
            Connect letters, discover words, and climb the leaderboard!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <Link
                to="/register"
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
              >
                Create Account
              </Link>
            )}
            
            <Link
              to="/game"
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
            >
              Play Now
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;