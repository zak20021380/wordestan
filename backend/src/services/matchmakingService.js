/**
 * Matchmaking Queue Service
 * In-memory service for managing battle matchmaking
 */

class MatchmakingQueue {
  constructor() {
    // Queue for quick match
    this.quickMatchQueue = [];

    // Active challenges (friend battles)
    this.activeChallenges = new Map(); // challengeCode -> challenge data

    // Track online users
    this.onlineUsers = new Map(); // userId -> socket data

    // Active battles
    this.activeBattles = new Map(); // battleId -> battle data

    // User to battle mapping
    this.userToBattle = new Map(); // userId -> battleId

    // Queue timeout (60 seconds)
    this.QUEUE_TIMEOUT = 60000;

    // Challenge expiry (5 minutes)
    this.CHALLENGE_EXPIRY = 5 * 60 * 1000;

    // Disconnect grace period (10 seconds)
    this.DISCONNECT_GRACE_PERIOD = 10000;
  }

  // === QUICK MATCH QUEUE ===

  /**
   * Add user to quick match queue
   * @param {Object} userData - { userId, username, avatar, socketId, level }
   * @returns {Object|null} - Match data if opponent found, null otherwise
   */
  joinQuickMatchQueue(userData) {
    // Check if user already in queue
    const existingIndex = this.quickMatchQueue.findIndex(
      u => u.userId === userData.userId
    );

    if (existingIndex !== -1) {
      // Update socket ID if reconnecting
      this.quickMatchQueue[existingIndex].socketId = userData.socketId;
      this.quickMatchQueue[existingIndex].joinedAt = Date.now();
      return null;
    }

    // Add timestamp
    const queueEntry = {
      ...userData,
      joinedAt: Date.now()
    };

    // Check if there's someone waiting
    if (this.quickMatchQueue.length > 0) {
      // Match with first person in queue
      const opponent = this.quickMatchQueue.shift();

      return {
        player1: opponent,
        player2: queueEntry
      };
    }

    // No match found, add to queue
    this.quickMatchQueue.push(queueEntry);

    // Set timeout to remove from queue
    setTimeout(() => {
      this.removeFromQuickMatchQueue(userData.userId);
    }, this.QUEUE_TIMEOUT);

    return null;
  }

  /**
   * Remove user from quick match queue
   * @param {String} userId
   * @returns {Boolean} - True if removed, false if not found
   */
  removeFromQuickMatchQueue(userId) {
    const index = this.quickMatchQueue.findIndex(u => u.userId === userId);

    if (index !== -1) {
      this.quickMatchQueue.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get quick match queue stats
   * @returns {Object} - Queue statistics
   */
  getQuickMatchQueueStats() {
    return {
      queueLength: this.quickMatchQueue.length,
      onlineUsers: this.onlineUsers.size,
      activeBattles: this.activeBattles.size
    };
  }

  // === FRIEND CHALLENGES ===

  /**
   * Create a friend challenge
   * @param {String} challengeCode
   * @param {Object} creatorData - { userId, username, avatar, socketId }
   * @returns {Object} - Challenge data
   */
  createChallenge(challengeCode, creatorData) {
    const challenge = {
      code: challengeCode,
      creator: creatorData,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.CHALLENGE_EXPIRY,
      status: 'waiting'
    };

    this.activeChallenges.set(challengeCode, challenge);

    // Auto-expire challenge
    setTimeout(() => {
      this.expireChallenge(challengeCode);
    }, this.CHALLENGE_EXPIRY);

    return challenge;
  }

  /**
   * Join a friend challenge
   * @param {String} challengeCode
   * @param {Object} joinerData - { userId, username, avatar, socketId }
   * @returns {Object|null} - Match data if successful, null otherwise
   */
  joinChallenge(challengeCode, joinerData) {
    const challenge = this.activeChallenges.get(challengeCode);

    if (!challenge) {
      return { error: 'کد چالش نامعتبر است' };
    }

    if (challenge.status !== 'waiting') {
      return { error: 'این چالش دیگر معتبر نیست' };
    }

    if (Date.now() > challenge.expiresAt) {
      this.activeChallenges.delete(challengeCode);
      return { error: 'زمان چالش تمام شده است' };
    }

    if (challenge.creator.userId === joinerData.userId) {
      return { error: 'نمی‌توانید با خودتان بازی کنید' };
    }

    // Mark challenge as matched
    challenge.status = 'matched';

    return {
      player1: challenge.creator,
      player2: joinerData
    };
  }

  /**
   * Cancel a challenge
   * @param {String} challengeCode
   * @returns {Boolean}
   */
  cancelChallenge(challengeCode) {
    return this.activeChallenges.delete(challengeCode);
  }

  /**
   * Expire a challenge
   * @param {String} challengeCode
   */
  expireChallenge(challengeCode) {
    const challenge = this.activeChallenges.get(challengeCode);

    if (challenge && challenge.status === 'waiting') {
      challenge.status = 'expired';
      this.activeChallenges.delete(challengeCode);
    }
  }

  /**
   * Get challenge by code
   * @param {String} challengeCode
   * @returns {Object|null}
   */
  getChallenge(challengeCode) {
    return this.activeChallenges.get(challengeCode) || null;
  }

  // === USERNAME CHALLENGE ===

  /**
   * Send challenge to specific user
   * @param {String} fromUserId
   * @param {String} toUserId
   * @param {Object} challengeData
   * @returns {Boolean}
   */
  sendUserChallenge(fromUserId, toUserId, challengeData) {
    // Store pending challenge
    const challengeKey = `${fromUserId}_${toUserId}`;
    this.activeChallenges.set(challengeKey, {
      type: 'user_challenge',
      from: fromUserId,
      to: toUserId,
      data: challengeData,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30000, // 30 seconds
      status: 'pending'
    });

    // Auto-expire
    setTimeout(() => {
      this.activeChallenges.delete(challengeKey);
    }, 30000);

    return true;
  }

  /**
   * Accept user challenge
   * @param {String} fromUserId
   * @param {String} toUserId
   * @returns {Object|null}
   */
  acceptUserChallenge(fromUserId, toUserId) {
    const challengeKey = `${fromUserId}_${toUserId}`;
    const challenge = this.activeChallenges.get(challengeKey);

    if (!challenge || challenge.status !== 'pending') {
      return null;
    }

    this.activeChallenges.delete(challengeKey);
    return challenge;
  }

  /**
   * Decline user challenge
   * @param {String} fromUserId
   * @param {String} toUserId
   * @returns {Boolean}
   */
  declineUserChallenge(fromUserId, toUserId) {
    const challengeKey = `${fromUserId}_${toUserId}`;
    return this.activeChallenges.delete(challengeKey);
  }

  // === ONLINE USERS ===

  /**
   * Add online user
   * @param {String} userId
   * @param {Object} userData - { username, avatar, socketId }
   */
  addOnlineUser(userId, userData) {
    this.onlineUsers.set(userId, {
      ...userData,
      connectedAt: Date.now(),
      lastSeen: Date.now()
    });
  }

  /**
   * Remove online user
   * @param {String} userId
   */
  removeOnlineUser(userId) {
    this.onlineUsers.delete(userId);
    this.removeFromQuickMatchQueue(userId);
  }

  /**
   * Update user's last seen
   * @param {String} userId
   */
  updateUserLastSeen(userId) {
    const user = this.onlineUsers.get(userId);
    if (user) {
      user.lastSeen = Date.now();
    }
  }

  /**
   * Get online users list
   * @param {String} excludeUserId - User to exclude from list
   * @returns {Array}
   */
  getOnlineUsers(excludeUserId = null) {
    const users = [];

    this.onlineUsers.forEach((userData, userId) => {
      if (userId !== excludeUserId) {
        users.push({
          userId,
          username: userData.username,
          avatar: userData.avatar,
          isInBattle: this.userToBattle.has(userId)
        });
      }
    });

    return users;
  }

  /**
   * Check if user is online
   * @param {String} userId
   * @returns {Boolean}
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get user's socket ID
   * @param {String} userId
   * @returns {String|null}
   */
  getUserSocketId(userId) {
    const user = this.onlineUsers.get(userId);
    return user ? user.socketId : null;
  }

  // === ACTIVE BATTLES ===

  /**
   * Register active battle
   * @param {String} battleId
   * @param {Object} battleData
   */
  registerBattle(battleId, battleData) {
    this.activeBattles.set(battleId, {
      ...battleData,
      startedAt: Date.now()
    });

    // Map users to battle
    if (battleData.players) {
      battleData.players.forEach(player => {
        this.userToBattle.set(player.userId, battleId);
      });
    }
  }

  /**
   * End battle
   * @param {String} battleId
   */
  endBattle(battleId) {
    const battle = this.activeBattles.get(battleId);

    if (battle && battle.players) {
      // Remove user to battle mappings
      battle.players.forEach(player => {
        this.userToBattle.delete(player.userId);
      });
    }

    this.activeBattles.delete(battleId);
  }

  /**
   * Get battle by ID
   * @param {String} battleId
   * @returns {Object|null}
   */
  getBattle(battleId) {
    return this.activeBattles.get(battleId) || null;
  }

  /**
   * Get user's current battle
   * @param {String} userId
   * @returns {String|null} - battleId
   */
  getUserBattle(userId) {
    return this.userToBattle.get(userId) || null;
  }

  /**
   * Check if user is in battle
   * @param {String} userId
   * @returns {Boolean}
   */
  isUserInBattle(userId) {
    return this.userToBattle.has(userId);
  }

  // === CLEANUP ===

  /**
   * Clean up stale data
   */
  cleanup() {
    const now = Date.now();

    // Remove expired queue entries
    this.quickMatchQueue = this.quickMatchQueue.filter(
      entry => (now - entry.joinedAt) < this.QUEUE_TIMEOUT
    );

    // Remove stale online users (inactive for 5 minutes)
    this.onlineUsers.forEach((userData, userId) => {
      if (now - userData.lastSeen > 5 * 60 * 1000) {
        this.removeOnlineUser(userId);
      }
    });
  }

  /**
   * Get service stats
   * @returns {Object}
   */
  getStats() {
    return {
      quickMatchQueue: this.quickMatchQueue.length,
      activeChallenges: this.activeChallenges.size,
      onlineUsers: this.onlineUsers.size,
      activeBattles: this.activeBattles.size
    };
  }
}

// Singleton instance
const matchmakingService = new MatchmakingQueue();

// Run cleanup every minute
setInterval(() => {
  matchmakingService.cleanup();
}, 60000);

module.exports = matchmakingService;
