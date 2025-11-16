import api from './api';

/**
 * Battle Service
 * Handles all battle-related API calls
 */

const battleService = {
  /**
   * Get user's battle stats
   */
  getBattleStats: async () => {
    const response = await api.get('/battles/stats');
    return response.data;
  },

  /**
   * Get battle history
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   */
  getBattleHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/battles/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  /**
   * Get battle details by ID
   * @param {string} battleId
   */
  getBattleDetails: async (battleId) => {
    const response = await api.get(`/battles/${battleId}`);
    return response.data;
  },

  /**
   * Create a friend challenge
   */
  createFriendChallenge: async () => {
    const response = await api.post('/battles/challenge/create');
    return response.data;
  },

  /**
   * Get challenge details
   * @param {string} challengeCode
   */
  getChallengeDetails: async (challengeCode) => {
    const response = await api.get(`/battles/challenge/${challengeCode}`);
    return response.data;
  },

  /**
   * Cancel a challenge
   * @param {string} challengeCode
   */
  cancelChallenge: async (challengeCode) => {
    const response = await api.delete(`/battles/challenge/${challengeCode}`);
    return response.data;
  },

  /**
   * Get online users
   */
  getOnlineUsers: async () => {
    const response = await api.get('/battles/users/online');
    return response.data;
  },

  /**
   * Search users by username
   * @param {string} query
   */
  searchUsers: async (query) => {
    const response = await api.get(`/battles/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * Get queue stats
   */
  getQueueStats: async () => {
    const response = await api.get('/battles/queue/stats');
    return response.data;
  },

  /**
   * Request rematch
   * @param {string} battleId
   */
  requestRematch: async (battleId) => {
    const response = await api.post(`/battles/${battleId}/rematch`);
    return response.data;
  },

  /**
   * Get battle leaderboard
   * @param {number} page
   * @param {number} limit
   */
  getBattleLeaderboard: async (page = 1, limit = 50) => {
    const response = await api.get(`/battles/leaderboard?page=${page}&limit=${limit}`);
    return response.data;
  }
};

export default battleService;
