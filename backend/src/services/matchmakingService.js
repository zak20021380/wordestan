const crypto = require('crypto');
const BattleQueue = require('../models/BattleQueue');
const Battle = require('../models/Battle');
const BattleLevel = require('../models/BattleLevel');
const User = require('../models/User');

const BATTLE_DURATION_MS = 120000;
const DISCONNECT_GRACE_MS = 10000;
const MIN_WORD_INTERVAL_MS = 100;
const DEFAULT_GRID_SIZE = 12;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const shuffleArray = (items = []) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateGridFromWords = (words = [], gridSize = 12) => {
  const letters = [];
  words.forEach(word => {
    if (word?.word) {
      letters.push(...word.word.toUpperCase().split(''));
    }
  });

  while (letters.length < gridSize) {
    letters.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
  }

  return shuffleArray(letters).slice(0, gridSize);
};

const toBattleLevelWords = (words = []) => (
  words.map(word => ({
    _id: word._id || undefined,
    text: word.word,
    length: word.word.length,
    points: 10 + Math.max(word.word.length - 3, 0) * 2,
    definition: word.meaning || word.definition || '',
    meaning: word.meaning || word.definition || '',
  }))
);

class MatchmakingService {
  constructor() {
    this.queue = new BattleQueue();
    this.activeBattles = new Map();
    this.challengeCodes = new Map();
    this.onlineUsers = new Map();
  }

  registerOnlineUser(userId, socketId) {
    if (userId && socketId) {
      this.onlineUsers.set(userId.toString(), socketId);
    }
  }

  unregisterOnlineUser(userId) {
    if (!userId) return;
    this.onlineUsers.delete(userId.toString());
  }

  getOnlineCount() {
    return this.onlineUsers.size;
  }

  getQueueSize() {
    return this.queue.size;
  }

  getOnlineSocket(userId) {
    if (!userId) return null;
    return this.onlineUsers.get(userId.toString()) || null;
  }

  enqueue(player) {
    return this.queue.enqueue(player);
  }

  leaveQueue(socketId) {
    return this.queue.remove(socketId);
  }

  createChallengeCode(host) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.challengeCodes.set(code, {
      code,
      host,
      createdAt: Date.now(),
      expiresAt,
      accepted: false
    });
    return { code, expiresAt };
  }

  consumeChallenge(code) {
    const record = this.challengeCodes.get(code);
    if (!record) {
      return null;
    }
    if (record.expiresAt < Date.now()) {
      this.challengeCodes.delete(code);
      return null;
    }
    record.accepted = true;
    this.challengeCodes.delete(code);
    return record;
  }

  async createBattle(type, players) {
    const battleLevel = await this.pickBattleLevel();
    if (!battleLevel) {
      throw new Error('No battle levels available');
    }

    const levelWords = toBattleLevelWords(battleLevel.words);
    const desiredGridSize = battleLevel.gridSize || DEFAULT_GRID_SIZE;
    const presetLetters = Array.isArray(battleLevel.letters) && battleLevel.letters.length
      ? [...battleLevel.letters]
      : typeof battleLevel.letterString === 'string' && battleLevel.letterString.length
        ? battleLevel.letterString.split('')
        : [];

    let letterPool = presetLetters.slice(0, desiredGridSize);
    if (letterPool.length < desiredGridSize) {
      const fallbackLetters = generateGridFromWords(battleLevel.words, desiredGridSize);
      letterPool = fallbackLetters.slice(0, desiredGridSize);
    }

    if (letterPool.length < desiredGridSize) {
      while (letterPool.length < desiredGridSize) {
        letterPool.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      }
    }

    const levelPayload = {
      _id: battleLevel._id,
      title: battleLevel.name,
      letters: letterPool.join(''),
      letterPool,
      words: levelWords,
    };

    const battleId = crypto.randomBytes(6).toString('hex');

    const playerState = {};
    players.forEach(player => {
      playerState[player.userId.toString()] = {
        ...player,
        socketId: player.socketId,
        ready: false,
        disconnectedAt: null,
        words: new Set(),
        score: 0,
        totalWordsFound: 0,
        lastSubmissionAt: 0,
        completedAt: null,
        typing: false
      };
    });

    const state = {
      id: battleId,
      type,
      level: levelPayload,
      levelWords,
      levelWordSet: new Set(levelWords.map(word => word.text)),
      players: playerState,
      battleLevelId: battleLevel._id,
      createdAt: Date.now(),
      startTime: null,
      endTime: null,
      status: 'waiting',
      countdownTimer: null,
      timer: null,
      globalWordOwners: new Map()
    };

    this.activeBattles.set(battleId, state);

    await Battle.create({
      battleId,
      type,
      level: null,
      battleLevel: battleLevel._id,
      letters: levelPayload.letters,
      words: levelWords,
      status: 'waiting',
      players: players.map(p => ({
        userId: p.userId,
        username: p.username,
        avatar: p.avatar ?? null,
        wordsFound: [],
        score: 0,
        finalTime: null,
        isWinner: false
      }))
    });

    await BattleLevel.findByIdAndUpdate(battleLevel._id, { $inc: { usageCount: 1 } });

    return state;
  }

  getBattle(battleId) {
    return this.activeBattles.get(battleId);
  }

  setPlayerReady(battleId, userId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    const player = battle.players[userId.toString()];
    if (!player) return battle;
    player.ready = true;
    return battle;
  }

  recordTyping(battleId, userId, typing) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    const player = battle.players[userId.toString()];
    if (!player) return;
    player.typing = Boolean(typing);
  }

  async handleWordFound(battleId, userId, rawWord) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'active') {
      return { status: 'invalid' };
    }

    const player = battle.players[userId.toString()];
    if (!player) {
      return { status: 'invalid' };
    }

    const now = Date.now();
    if (player.lastSubmissionAt && now - player.lastSubmissionAt < MIN_WORD_INTERVAL_MS) {
      return { status: 'rate_limited' };
    }
    player.lastSubmissionAt = now;

    const normalizedWord = typeof rawWord === 'string' ? rawWord.trim().toUpperCase() : '';
    if (!normalizedWord || !battle.levelWordSet.has(normalizedWord)) {
      return { status: 'invalid_word' };
    }

    if (player.words.has(normalizedWord)) {
      return { status: 'duplicate' };
    }

    const wordMeta = battle.levelWords.find(word => word.text === normalizedWord);
    if (!wordMeta) {
      return { status: 'invalid_word' };
    }

    player.words.add(normalizedWord);
    player.totalWordsFound += 1;

    if (!battle.globalWordOwners) {
      battle.globalWordOwners = new Map();
    }
    const firstFinder = battle.globalWordOwners.get(normalizedWord);
    const wasFirst = !firstFinder;
    if (wasFirst) {
      battle.globalWordOwners.set(normalizedWord, player.userId);
    }

    let scoreGain = 10;
    if (wordMeta.length >= 6) {
      scoreGain += 10;
    }
    if (wasFirst) {
      scoreGain += 5;
    }

    player.score += scoreGain;
    if (player.words.size === battle.levelWordSet.size) {
      player.completedAt = Date.now();
    }

    return {
      status: 'ok',
      word: normalizedWord,
      scoreGain,
      totalScore: player.score,
      wasFirst,
      player
    };
  }

  markStart(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    battle.status = 'active';
    battle.startTime = Date.now();
    return battle;
  }

  scheduleTimeout(battleId, onTimeout) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    if (battle.timer) {
      clearTimeout(battle.timer);
    }
    battle.timer = setTimeout(() => {
      onTimeout(battleId);
    }, BATTLE_DURATION_MS);
  }

  setCountdown(battleId, timer) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    if (battle.countdownTimer) {
      clearTimeout(battle.countdownTimer);
    }
    battle.countdownTimer = timer;
  }

  async finalizeBattle(battleId, reason = 'completed', explicitWinnerId = null) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) {
      return null;
    }

    battle.status = reason === 'cancelled' ? 'cancelled' : 'completed';
    battle.endTime = Date.now();
    if (battle.timer) {
      clearTimeout(battle.timer);
    }
    if (battle.countdownTimer) {
      clearTimeout(battle.countdownTimer);
    }

    const players = Object.values(battle.players);
    const resolvedWinnerId = explicitWinnerId || this.resolveWinner(players);
    const summary = await this.persistBattle(battle, resolvedWinnerId);

    this.activeBattles.delete(battleId);
    return { ...summary, winnerId: resolvedWinnerId };
  }

  resolveWinner(players) {
    if (!Array.isArray(players) || players.length === 0) {
      return null;
    }

    const sorted = [...players].sort((a, b) => {
      if (b.words.size !== a.words.size) {
        return b.words.size - a.words.size;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.completedAt && b.completedAt) {
        return a.completedAt - b.completedAt;
      }
      if (a.completedAt) return -1;
      if (b.completedAt) return 1;
      return 0;
    });

    if (sorted.length >= 2) {
      const [first, second] = sorted;
      if (
        first.words.size === second.words.size &&
        first.score === second.score &&
        (!first.completedAt || !second.completedAt || first.completedAt === second.completedAt)
      ) {
        return null;
      }
    }

    return sorted[0]?.userId || null;
  }

  async persistBattle(battle, winnerId) {
    const endTime = new Date();
    const startTime = battle.startTime ? new Date(battle.startTime) : endTime;
    const duration = battle.startTime ? endTime.getTime() - battle.startTime : 0;

    const players = Object.values(battle.players).map(player => ({
      userId: player.userId,
      username: player.username,
      avatar: player.avatar ?? null,
      wordsFound: Array.from(player.words),
      score: player.score,
      finalTime: player.completedAt ? player.completedAt - battle.startTime : null,
      isWinner: winnerId ? player.userId.toString() === winnerId.toString() : false
    }));

    await Battle.findOneAndUpdate(
      { battleId: battle.id },
      {
        status: battle.status,
        startTime,
        endTime,
        duration,
        winner: winnerId,
        players
      },
      { upsert: true }
    );

    await Promise.all(
      players.map(player => this.updateUserStats(player, battle, winnerId))
    );

    return { players, duration };
  }

  async updateUserStats(player, battle, winnerId) {
    const user = await User.findById(player.userId);
    if (!user) {
      return;
    }

    if (!user.battleStats) {
      user.battleStats = {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        totalWordsFound: 0,
        fastestWin: null,
        longestStreak: 0,
        currentStreak: 0
      };
    }

    user.battleStats.totalBattles += 1;
    user.battleStats.totalWordsFound += player.wordsFound.length;

    let result = 'draw';
    if (winnerId) {
      result = winnerId.toString() === player.userId.toString() ? 'win' : 'loss';
    }

    if (result === 'win') {
      user.battleStats.wins += 1;
      user.battleStats.currentStreak += 1;
      if (!user.battleStats.fastestWin || player.finalTime < user.battleStats.fastestWin) {
        user.battleStats.fastestWin = player.finalTime;
      }
      if (user.battleStats.currentStreak > user.battleStats.longestStreak) {
        user.battleStats.longestStreak = user.battleStats.currentStreak;
      }
      user.coins += 50;
      user.experience = (user.experience || 0) + 100;
    } else if (result === 'loss') {
      user.battleStats.losses += 1;
      user.battleStats.currentStreak = 0;
      user.coins += 10;
      user.experience = (user.experience || 0) + 20;
    } else {
      user.battleStats.draws += 1;
      user.battleStats.currentStreak = 0;
      user.coins += 20;
      user.experience = (user.experience || 0) + 40;
    }

    user.battleStats.winRate = user.battleStats.totalBattles
      ? Number(((user.battleStats.wins / user.battleStats.totalBattles) * 100).toFixed(2))
      : 0;

    await user.save();
  }

  markDisconnected(battleId, userId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    const player = battle.players[userId.toString()];
    if (!player) return null;
    player.disconnectedAt = Date.now();
    return battle;
  }

  shouldForfeit(player) {
    if (!player?.disconnectedAt) {
      return false;
    }
    return Date.now() - player.disconnectedAt > DISCONNECT_GRACE_MS;
  }

  markReconnected(battleId, userId, socketId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    const player = battle.players[userId.toString()];
    if (!player) return null;
    player.disconnectedAt = null;
    player.socketId = socketId;
    return battle;
  }

  async pickBattleLevel() {
    return BattleLevel.findOne({ isActive: true, 'words.9': { $exists: true } })
      .sort({ usageCount: 1, updatedAt: -1 })
      .lean(false);
  }
}

module.exports = new MatchmakingService();
