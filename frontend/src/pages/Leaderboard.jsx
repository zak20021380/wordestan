import { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardService } from '../services/leaderboardService';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';

const Leaderboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('global');

  // Fetch global leaderboard
  const { data: globalData, isLoading: globalLoading } = useQuery(
    ['leaderboard', 'global'],
    () => leaderboardService.getLeaderboard(50, 0),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch user's rank
  const { data: myRankData, isLoading: myRankLoading } = useQuery(
    ['myRank'],
    () => leaderboardService.getMyRank(),
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch leaderboard statistics
  const { data: statsData } = useQuery(
    ['leaderboardStats'],
    () => leaderboardService.getLeaderboardStats(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Star className="w-6 h-6 text-white/40" />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-amber-600 to-amber-800';
    return 'from-primary-500 to-primary-700';
  };

  const renderPlayerRow = (player, isUser = false) => (
    <motion.div
      key={player.id || player._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-4 rounded-lg mb-2 ${
        isUser 
          ? 'bg-primary-500/20 border border-primary-400/50' 
          : 'bg-glass-hover hover:bg-glass'
      } transition-colors`}
    >
      <div className="flex items-center space-x-4">
        {/* Rank */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${getRankColor(player.rank)}">
          <span className="text-white font-bold text-sm">{player.rank}</span>
        </div>

        {/* Player Info */}
        <div>
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${isUser ? 'text-primary-400' : 'text-white'}`}>
              {player.username}
            </span>
            {isUser && (
              <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded-full">
                You
              </span>
            )}
          </div>
          <div className="text-white/60 text-sm flex items-center space-x-4">
            <span>{player.levelsCleared || 0} levels</span>
            <span>{player.wordsFound || 0} words</span>
            <span>{player.bestStreak || 0} best streak</span>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-2xl font-bold text-white">
          {player.totalScore?.toLocaleString() || 0}
        </div>
        <div className="text-white/60 text-sm">points</div>
      </div>
    </motion.div>
  );

  if (globalLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-400" />
          <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
        </div>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          See how you stack up against other word puzzle enthusiasts from around the world
        </p>
      </motion.div>

      {/* Stats Overview */}
      {statsData?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 text-center">
            <Users className="w-8 h-8 text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {statsData.data.totalPlayers.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">Total Players</div>
          </div>
          
          <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 text-center">
            <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {statsData.data.activePlayersToday.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">Active Today</div>
          </div>
          
          <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 text-center">
            <Zap className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(statsData.data.statistics.averageScore).toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">Avg Score</div>
          </div>
          
          <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4 text-center">
            <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {statsData.data.statistics.maxScore.toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">Top Score</div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-glass backdrop-blur-lg rounded-xl p-1 border border-glass-border">
          <button
            onClick={() => setSelectedTab('global')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'global'
                ? 'bg-primary-500 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Global
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setSelectedTab('personal')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'personal'
                  ? 'bg-primary-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Your Rank
            </button>
          )}
        </div>
      </div>

      {/* Global Leaderboard */}
      {selectedTab === 'global' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span>Global Rankings</span>
            </h2>
            <div className="text-white/60">
              Top 50 Players
            </div>
          </div>
          
          {globalData?.data?.leaderboard?.length > 0 ? (
            <div className="space-y-2">
              {globalData.data.leaderboard.map((player) => 
                renderPlayerRow(player, user && player._id === user._id)
              )}
            </div>
          ) : (
            <div className="text-center text-white/60 py-12">
              No players found
            </div>
          )}
        </motion.div>
      )}

      {/* Personal Rank */}
      {selectedTab === 'personal' && isAuthenticated && myRankData?.data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Your Rank */}
          <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Star className="w-6 h-6 text-primary-400" />
              <span>Your Ranking</span>
            </h2>
            
            {renderPlayerRow(myRankData.data.user, true)}
          </div>

          {/* Nearby Players */}
          {myRankData.data.nearby && myRankData.data.nearby.length > 0 && (
            <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
              <h3 className="text-xl font-bold text-white mb-6">Players Near You</h3>
              <div className="space-y-2">
                {myRankData.data.nearby.map((player) => 
                  renderPlayerRow(player, player._id === user._id)
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;