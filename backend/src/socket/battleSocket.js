const crypto = require('crypto');
const matchmakingService = require('../services/matchmakingService');
const { authenticateSocket } = require('../middleware/battleAuth');
const User = require('../models/User');

const COUNTDOWN_MS = 3000;
const BATTLE_DURATION = 120;
const QUICK_CHAT_COOLDOWN = 10000;

module.exports = (io) => {
  const namespace = io.of('/battle');
  const directChallenges = new Map();
  const activeBattleLookup = new Map();

  namespace.use(authenticateSocket);

  namespace.on('connection', (socket) => {
    const user = socket.data.user;
    matchmakingService.registerOnlineUser(user._id, socket.id);
    socket.emit('connected', { online: matchmakingService.getOnlineCount() });

    const existingBattleId = activeBattleLookup.get(user._id.toString());
    if (existingBattleId) {
      const battle = matchmakingService.markReconnected(existingBattleId, user._id, socket.id);
      if (battle) {
        socket.join(existingBattleId);
        socket.emit('battle_resume', {
          battleId: existingBattleId,
          level: {
            _id: battle.level._id,
            letters: battle.level.letters,
            gridSize: battle.level.gridSize,
            wordCount: battle.levelWordSet.size,
            words: Array.isArray(battle.level.words)
              ? battle.level.words.map(word => ({
                  text: word.text,
                  meaning: word.meaning,
                  category: word.category,
                  difficulty: word.difficulty
                }))
              : battle.levelWords.map(w => ({ text: w.text }))
          },
          players: Object.values(battle.players).map(player => ({
            userId: player.userId.toString(),
            score: player.score,
            words: Array.from(player.words),
            typing: player.typing
          })),
          remainingTime: battle.startTime
            ? Math.max(0, BATTLE_DURATION - Math.floor((Date.now() - battle.startTime) / 1000))
            : BATTLE_DURATION
        });
        socket.to(existingBattleId).emit('opponent_reconnected');
      }
    }

    socket.on('join_queue', async () => {
      try {
        const match = matchmakingService.enqueue({
          userId: user._id,
          username: user.username,
          avatar: user.avatar ?? null,
          socketId: socket.id
        });

        socket.emit('queue_joined', {
          online: matchmakingService.getOnlineCount(),
          queueSize: matchmakingService.getQueueSize()
        });

        if (match) {
          await startBattle('quick', match);
        }
      } catch (error) {
        console.error('join_queue error', error);
        socket.emit('queue_error', { message: 'حریفی یافت نشد' });
      }
    });

    socket.on('leave_queue', () => {
      matchmakingService.leaveQueue(socket.id);
      socket.emit('queue_left');
    });

    socket.on('create_challenge', () => {
      const challenge = matchmakingService.createChallengeCode({
        userId: user._id,
        username: user.username,
        avatar: user.avatar ?? null,
        socketId: socket.id
      });
      socket.emit('challenge_created', challenge);
    });

    socket.on('join_challenge', async ({ code }) => {
      try {
        const record = matchmakingService.consumeChallenge((code || '').toUpperCase());
        if (!record) {
          return socket.emit('challenge_error', { message: 'کد نامعتبر است یا منقضی شده' });
        }

        const players = [
          record.host,
          {
            userId: user._id,
            username: user.username,
            avatar: user.avatar ?? null,
            socketId: socket.id
          }
        ];

        await startBattle('friend', players);
      } catch (error) {
        console.error('join_challenge error', error);
        socket.emit('challenge_error', { message: 'خطا در پیوستن به نبرد' });
      }
    });

    socket.on('challenge_user', async ({ username }) => {
      try {
        if (!username) {
          return socket.emit('challenge_error', { message: 'نام کاربری الزامی است' });
        }

        const opponent = await User.findOne({
          username: { $regex: new RegExp(`^${username}$`, 'i') }
        });

        if (!opponent) {
          return socket.emit('challenge_error', { message: 'کاربر یافت نشد' });
        }

        const opponentSocketId = matchmakingService.getOnlineSocket(opponent._id);
        if (!opponentSocketId) {
          return socket.emit('challenge_error', { message: 'کاربر آفلاین است' });
        }

        const challengeId = crypto.randomBytes(6).toString('hex');
        const expiresAt = Date.now() + 30000;
        directChallenges.set(challengeId, {
          id: challengeId,
          from: {
            userId: user._id,
            username: user.username,
            avatar: user.avatar ?? null,
            socketId: socket.id
          },
          toUserId: opponent._id,
          expiresAt
        });

        namespace.to(opponentSocketId).emit('challenge_received', {
          challengeId,
          from: {
            username: user.username,
            avatar: user.avatar ?? null
          },
          expiresAt
        });

        socket.emit('challenge_sent', {
          challengeId,
          opponent: {
            username: opponent.username,
            avatar: opponent.avatar ?? null
          },
          expiresAt
        });

        setTimeout(() => {
          const record = directChallenges.get(challengeId);
          if (record) {
            directChallenges.delete(challengeId);
            namespace.to(record.from.socketId).emit('challenge_expired', { challengeId });
            const targetSocket = matchmakingService.getOnlineSocket(record.toUserId);
            if (targetSocket) {
              namespace.to(targetSocket).emit('challenge_expired', { challengeId });
            }
          }
        }, 30000);
      } catch (error) {
        console.error('challenge_user error', error);
        socket.emit('challenge_error', { message: 'خطا در ارسال چالش' });
      }
    });

    socket.on('accept_challenge', async ({ challengeId }) => {
      const record = directChallenges.get(challengeId);
      if (!record) {
        return socket.emit('challenge_error', { message: 'چالش یافت نشد' });
      }
      if (record.toUserId.toString() !== user._id.toString()) {
        return socket.emit('challenge_error', { message: 'به این چالش دسترسی ندارید' });
      }

      directChallenges.delete(challengeId);
      const players = [
        record.from,
        {
          userId: user._id,
          username: user.username,
          avatar: user.avatar ?? null,
          socketId: socket.id
        }
      ];
      await startBattle('friend', players);
    });

    socket.on('decline_challenge', ({ challengeId }) => {
      const record = directChallenges.get(challengeId);
      if (!record) return;
      const requester = record.from.socketId;
      namespace.to(requester).emit('challenge_declined', { challengeId });
      directChallenges.delete(challengeId);
    });

    socket.on('battle_ready', ({ battleId }) => {
      const battle = matchmakingService.setPlayerReady(battleId, user._id);
      if (!battle) return;
      socket.join(battleId);
      const ready = Object.values(battle.players).every(player => player.ready);
      if (ready) {
        startCountdown(battleId);
      }
    });

    socket.on('word_found', async ({ battleId, word }) => {
      const result = await matchmakingService.handleWordFound(battleId, user._id, word);
      if (result.status !== 'ok') {
        socket.emit('word_rejected', { reason: result.status });
        return;
      }

      namespace.to(battleId).emit('opponent_word', {
        battleId,
        userId: user._id,
        word: result.word,
        score: result.player.score,
        scoreGain: result.scoreGain,
        wasFirst: result.wasFirst
      });

      socket.emit('word_accepted', {
        word: result.word,
        scoreGain: result.scoreGain,
        totalScore: result.totalScore
      });

      const battle = matchmakingService.getBattle(battleId);
      if (battle && result.player.words.size === battle.levelWordSet.size) {
        finalizeBattle(battleId, user._id);
      }
    });

    socket.on('opponent_typing', ({ battleId, typing }) => {
      matchmakingService.recordTyping(battleId, user._id, typing);
      socket.to(battleId).emit('opponent_typing', { typing });
    });

    socket.on('quick_chat', ({ battleId, emoji }) => {
      const now = Date.now();
      if (!socket.data.lastQuickChat) {
        socket.data.lastQuickChat = 0;
      }
      if (now - socket.data.lastQuickChat < QUICK_CHAT_COOLDOWN) {
        return;
      }
      socket.data.lastQuickChat = now;
      socket.to(battleId).emit('quick_chat', { emoji });
    });

    socket.on('battle_leave', async ({ battleId }) => {
      await finalizeBattle(battleId, null, getOpponentId(battleId, user._id), 'cancelled');
    });

    socket.on('disconnect', () => {
      matchmakingService.leaveQueue(socket.id);
      matchmakingService.unregisterOnlineUser(user._id);
      const battleId = activeBattleLookup.get(user._id.toString());
      if (!battleId) {
        return;
      }
      const battle = matchmakingService.markDisconnected(battleId, user._id);
      if (!battle) {
        return;
      }
      socket.to(battleId).emit('opponent_disconnected');
      setTimeout(async () => {
        const player = battle.players[user._id.toString()];
        if (matchmakingService.shouldForfeit(player)) {
          await finalizeBattle(battleId, null, getOpponentId(battleId, user._id), 'cancelled');
        }
      }, 10000);
    });
  });

  const startBattle = async (type, players) => {
    const battle = await matchmakingService.createBattle(type, players);
    players.forEach(player => {
      activeBattleLookup.set(player.userId.toString(), battle.id);
      const opponent = players.find(p => p.userId.toString() !== player.userId.toString());
      namespace.to(player.socketId).emit('match_found', {
        battleId: battle.id,
        opponent: opponent
          ? {
              userId: opponent.userId.toString(),
              username: opponent.username,
              avatar: opponent.avatar ?? null
            }
          : null,
        level: {
          _id: battle.level._id,
          id: battle.level._id,
          title: battle.level.title,
          letters: battle.level.letters,
          gridSize: battle.level.gridSize,
          difficulty: battle.level.difficulty,
          wordCount: battle.levelWordSet.size,
          words: Array.isArray(battle.level.words)
            ? battle.level.words.map(word => ({
                _id: word._id,
                text: word.text,
                meaning: word.meaning,
                category: word.category,
                difficulty: word.difficulty
              }))
            : battle.levelWords.map(w => ({ text: w.text }))
        },
        type
      });
    });
  };

  const startCountdown = (battleId) => {
    const battle = matchmakingService.getBattle(battleId);
    if (!battle) return;
    namespace.to(battleId).emit('countdown_start', { duration: 3 });
    const timer = setTimeout(() => {
      beginBattle(battleId);
    }, COUNTDOWN_MS);
    matchmakingService.setCountdown(battleId, timer);
  };

  const beginBattle = (battleId) => {
    const battle = matchmakingService.markStart(battleId);
    if (!battle) return;
    namespace.to(battleId).emit('battle_start', {
      duration: BATTLE_DURATION,
      letters: battle.level.letters,
      gridSize: battle.level.gridSize,
    });
    matchmakingService.scheduleTimeout(battleId, async () => {
      await finalizeBattle(battleId);
    });
  };

  const finalizeBattle = async (
    battleId,
    winnerId = null,
    fallbackWinner = null,
    reason = 'completed'
  ) => {
    const summary = await matchmakingService.finalizeBattle(battleId, reason, winnerId || fallbackWinner);
    if (!summary) return;
    namespace.to(battleId).emit('battle_end', {
      winner: summary.winnerId ? summary.winnerId.toString() : null,
      players: summary.players.map(player => ({
        ...player,
        userId: player.userId.toString()
      })),
      duration: summary.duration
    });
    summary.players.forEach(player => {
      activeBattleLookup.delete(player.userId.toString());
    });
  };

  const getOpponentId = (battleId, userId) => {
    const battle = matchmakingService.getBattle(battleId);
    if (!battle) return null;
    const opponent = Object.values(battle.players).find(player => player.userId.toString() !== userId.toString());
    return opponent?.userId || null;
  };
};
