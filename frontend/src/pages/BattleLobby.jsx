import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattle } from '../contexts/BattleContext';
import { useAuth } from '../contexts/AuthContext';
import battleService from '../services/battleService';

const BattleLobby = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const {
    connectSocket,
    isConnected,
    onlineCount,
    joinQuickMatch,
    leaveQueue,
    inQueue,
    queuePosition,
    currentBattle,
    battleStatus,
    setActiveChallenge,
    error,
    setError
  } = useBattle();

  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'friend'
  const [battleStats, setBattleStats] = useState(null);
  const [challengeCode, setChallengeCode] = useState(null);
  const [challengeLink, setChallengeLink] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    if (token && !isConnected) {
      connectSocket(token);
    }
  }, [token, isConnected, connectSocket]);

  // Fetch battle stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await battleService.getBattleStats();
        if (response.success) {
          setBattleStats(response.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch battle stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Redirect to battle when match found
  useEffect(() => {
    if (currentBattle && battleStatus) {
      navigate('/battle/game');
    }
  }, [currentBattle, battleStatus, navigate]);

  // Handle quick match
  const handleQuickMatch = () => {
    if (!isConnected) {
      setError('لطفا منتظر اتصال به سرور بمانید');
      return;
    }
    joinQuickMatch();
  };

  // Handle cancel queue
  const handleCancelQueue = () => {
    leaveQueue();
  };

  // Handle create friend challenge
  const handleCreateChallenge = async () => {
    try {
      setIsCreatingChallenge(true);
      const response = await battleService.createFriendChallenge();

      if (response.success) {
        setChallengeCode(response.data.challengeCode);
        setChallengeLink(response.data.shareUrl);
        setActiveChallenge(response.data);
      }
    } catch (error) {
      setError('خطا در ایجاد چالش');
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  // Handle cancel challenge
  const handleCancelChallenge = async () => {
    if (!challengeCode) return;

    try {
      await battleService.cancelChallenge(challengeCode);
      setChallengeCode(null);
      setChallengeLink(null);
      setActiveChallenge(null);
    } catch (error) {
      console.error('Failed to cancel challenge:', error);
    }
  };

  // Copy challenge link
  const handleCopyLink = () => {
    if (challengeLink) {
      navigator.clipboard.writeText(challengeLink);
      setError('لینک کپی شد!');
      setTimeout(() => setError(null), 2000);
    }
  };

  // Share on Telegram
  const handleShareTelegram = () => {
    if (challengeLink) {
      const text = `بیا توی هرف‌لند باهام نبرد کن! 🎮\n${challengeLink}`;
      window.open(`https://t.me/share/url?url=${encodeURIComponent(challengeLink)}&text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // Search users
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await battleService.searchUsers(query);

      if (response.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">⚔️ نبرد ۱ در ۱</h1>
          <p className="text-purple-200">با دیگران رقابت کن و مهارتت رو نشون بده!</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="bg-purple-800/50 px-4 py-2 rounded-lg">
              <span className="text-green-400">● </span>
              <span className="text-sm">{onlineCount} نفر آنلاین</span>
            </div>
            {battleStats && (
              <div className="bg-purple-800/50 px-4 py-2 rounded-lg">
                <span className="text-sm">برد: {battleStats.wins} | باخت: {battleStats.losses}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-100 px-4 py-3 rounded-lg mb-4 text-center">
            در حال اتصال به سرور...
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'quick'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-purple-800/30 text-purple-200 hover:bg-purple-800/50'
            }`}
          >
            نبرد سریع
          </button>
          <button
            onClick={() => setActiveTab('friend')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'friend'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-purple-800/30 text-purple-200 hover:bg-purple-800/50'
            }`}
          >
            چالش دوستان
          </button>
        </div>

        {/* Quick Match Tab */}
        {activeTab === 'quick' && (
          <div className="bg-purple-800/30 rounded-xl p-8 backdrop-blur-sm">
            {!inQueue ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-2xl font-bold mb-2">نبرد سریع</h2>
                  <p className="text-purple-200">با یک حریف تصادفی مسابقه بده</p>
                </div>

                <button
                  onClick={handleQuickMatch}
                  disabled={!isConnected}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-12 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-all disabled:cursor-not-allowed disabled:transform-none"
                >
                  شروع نبرد 🚀
                </button>

                <div className="mt-6 text-sm text-purple-300">
                  <p>• مدت زمان: 2 دقیقه</p>
                  <p>• پیدا کن کلمات رو زودتر از حریفت</p>
                  <p>• جایزه برنده: 50 سکه + 100 امتیاز</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white"></div>
                  </div>
                  <h2 className="text-2xl font-bold mt-4">جستجوی حریف...</h2>
                  <p className="text-purple-200 mt-2">منتظر بمان تا حریفی پیدا شود</p>
                  {queuePosition > 0 && (
                    <p className="text-sm text-purple-300 mt-2">موقعیت در صف: {queuePosition}</p>
                  )}
                </div>

                <button
                  onClick={handleCancelQueue}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
                >
                  لغو
                </button>

                <p className="mt-6 text-sm text-purple-300">
                  اگر بعد از 60 ثانیه حریفی پیدا نشد، دوستی رو دعوت کن!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Friend Challenge Tab */}
        {activeTab === 'friend' && (
          <div className="space-y-6">
            {/* Create Challenge */}
            <div className="bg-purple-800/30 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">اشتراک‌گذاری لینک</h3>

              {!challengeCode ? (
                <button
                  onClick={handleCreateChallenge}
                  disabled={isCreatingChallenge}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-bold py-4 rounded-lg transition-all"
                >
                  {isCreatingChallenge ? 'در حال ایجاد...' : 'ایجاد کد چالش 🔗'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-purple-900/50 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <span className="text-sm text-purple-300">کد چالش:</span>
                      <div className="text-3xl font-bold tracking-widest mt-1">{challengeCode}</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-all"
                      >
                        📋 کپی لینک
                      </button>
                      <button
                        onClick={handleShareTelegram}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all"
                      >
                        📤 تلگرام
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCancelChallenge}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-all"
                  >
                    لغو چالش
                  </button>

                  <p className="text-xs text-purple-300 text-center">
                    این کد بعد از 5 دقیقه منقضی می‌شود
                  </p>
                </div>
              )}
            </div>

            {/* Search Users */}
            <div className="bg-purple-800/30 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">جستجوی کاربر</h3>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="نام کاربری را وارد کنید..."
                className="w-full bg-purple-900/50 text-white placeholder-purple-400 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {isSearching && (
                <p className="text-center text-purple-300">در حال جستجو...</p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="bg-purple-900/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                          {user.avatar || '👤'}
                        </div>
                        <div>
                          <div className="font-semibold">{user.username}</div>
                          <div className="text-xs text-purple-300">
                            {user.isOnline ? '🟢 آنلاین' : '⚪ آفلاین'}
                          </div>
                        </div>
                      </div>
                      {user.isOnline && (
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-all">
                          چالش
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Battle Stats */}
        {battleStats && (
          <div className="mt-6 bg-purple-800/30 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 text-center">آمار شما</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{battleStats.wins}</div>
                <div className="text-sm text-purple-300">برد</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{battleStats.losses}</div>
                <div className="text-sm text-purple-300">باخت</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{battleStats.winRate}%</div>
                <div className="text-sm text-purple-300">نرخ برد</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{battleStats.currentStreak}</div>
                <div className="text-sm text-purple-300">برد متوالی</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/battle/history')}
            className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-all"
          >
            📜 تاریخچه نبردها
          </button>
          <button
            onClick={() => navigate('/battle/leaderboard')}
            className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-all"
          >
            🏆 رتبه‌بندی
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleLobby;
