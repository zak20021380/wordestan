const Battle = require('../models/Battle');
const User = require('../models/User');
const Level = require('../models/Level');
const Word = require('../models/Word');
const matchmakingService = require('../services/matchmakingService');
const jwt = require('jsonwebtoken');

// Anti-cheat: Minimum time to find a word (milliseconds)
const MIN_WORD_FIND_TIME = 100;

// Anti-cheat: Maximum reactions per battle
const MAX_REACTIONS_PER_BATTLE = 20;

/**
 * Setup battle socket handlers
 * @param {Object} io - Socket.io instance
 */
function setupBattleSocketHandlers(io) {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`Battle socket connected: ${socket.userId} (${socket.username})`);

    // Get user data
    const user = await User.findById(socket.userId).select('username avatar');

    if (!user) {
      socket.disconnect();
      return;
    }

    // Add user to online users
    matchmakingService.addOnlineUser(socket.userId, {
      username: user.username,
      avatar: user.avatar,
      socketId: socket.id
    });

    // Update user online status in database
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });

    // Emit online users count
    io.emit('battle:online_count', {
      count: matchmakingService.getStats().onlineUsers
    });

    // === QUICK MATCH ===

    socket.on('battle:join_queue', async (data) => {
      try {
        console.log(`User ${socket.username} joining quick match queue`);

        // Check if user already in battle
        if (matchmakingService.isUserInBattle(socket.userId)) {
          return socket.emit('battle:error', {
            message: 'شما در حال حاضر در یک نبرد هستید'
          });
        }

        // Join queue
        const match = matchmakingService.joinQuickMatchQueue({
          userId: socket.userId,
          username: user.username,
          avatar: user.avatar,
          socketId: socket.id,
          level: data.level || null
        });

        if (match) {
          // Match found! Create battle
          await createBattle(io, match, 'quick');
        } else {
          // Added to queue
          socket.emit('battle:queue_joined', {
            position: matchmakingService.getQuickMatchQueueStats().queueLength,
            onlineUsers: matchmakingService.getStats().onlineUsers
          });
        }
      } catch (error) {
        console.error('Join queue error:', error);
        socket.emit('battle:error', {
          message: 'خطا در پیوستن به صف'
        });
      }
    });

    socket.on('battle:leave_queue', () => {
      try {
        matchmakingService.removeFromQuickMatchQueue(socket.userId);
        socket.emit('battle:queue_left');
        console.log(`User ${socket.username} left queue`);
      } catch (error) {
        console.error('Leave queue error:', error);
      }
    });

    // === FRIEND CHALLENGE ===

    socket.on('battle:join_challenge', async (data) => {
      try {
        const { challengeCode } = data;

        console.log(`User ${socket.username} joining challenge ${challengeCode}`);

        // Check if user already in battle
        if (matchmakingService.isUserInBattle(socket.userId)) {
          return socket.emit('battle:error', {
            message: 'شما در حال حاضر در یک نبرد هستید'
          });
        }

        const match = matchmakingService.joinChallenge(challengeCode, {
          userId: socket.userId,
          username: user.username,
          avatar: user.avatar,
          socketId: socket.id
        });

        if (match.error) {
          return socket.emit('battle:error', {
            message: match.error
          });
        }

        // Match found! Create battle
        await createBattle(io, match, 'friend', challengeCode);

        // Clean up challenge
        matchmakingService.cancelChallenge(challengeCode);
      } catch (error) {
        console.error('Join challenge error:', error);
        socket.emit('battle:error', {
          message: 'خطا در پیوستن به چالش'
        });
      }
    });

    // === USER CHALLENGE ===

    socket.on('battle:challenge_user', async (data) => {
      try {
        const { targetUserId } = data;

        // Check if target is online
        if (!matchmakingService.isUserOnline(targetUserId)) {
          return socket.emit('battle:error', {
            message: 'کاربر آنلاین نیست'
          });
        }

        // Check if target is in battle
        if (matchmakingService.isUserInBattle(targetUserId)) {
          return socket.emit('battle:error', {
            message: 'کاربر در حال نبرد است'
          });
        }

        // Send challenge
        matchmakingService.sendUserChallenge(socket.userId, targetUserId, {
          username: user.username,
          avatar: user.avatar
        });

        // Emit to target user
        const targetSocketId = matchmakingService.getUserSocketId(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('battle:challenge_received', {
            from: {
              userId: socket.userId,
              username: user.username,
              avatar: user.avatar
            }
          });
        }

        socket.emit('battle:challenge_sent');
      } catch (error) {
        console.error('Challenge user error:', error);
        socket.emit('battle:error', {
          message: 'خطا در ارسال چالش'
        });
      }
    });

    socket.on('battle:accept_challenge', async (data) => {
      try {
        const { fromUserId } = data;

        const challenge = matchmakingService.acceptUserChallenge(fromUserId, socket.userId);

        if (!challenge) {
          return socket.emit('battle:error', {
            message: 'چالش یافت نشد یا منقضی شده است'
          });
        }

        // Create match
        const fromUser = await User.findById(fromUserId).select('username avatar');

        const match = {
          player1: {
            userId: fromUserId,
            username: fromUser.username,
            avatar: fromUser.avatar,
            socketId: matchmakingService.getUserSocketId(fromUserId)
          },
          player2: {
            userId: socket.userId,
            username: user.username,
            avatar: user.avatar,
            socketId: socket.id
          }
        };

        await createBattle(io, match, 'friend');
      } catch (error) {
        console.error('Accept challenge error:', error);
        socket.emit('battle:error', {
          message: 'خطا در پذیرش چالش'
        });
      }
    });

    socket.on('battle:decline_challenge', (data) => {
      try {
        const { fromUserId } = data;

        matchmakingService.declineUserChallenge(fromUserId, socket.userId);

        // Notify sender
        const senderSocketId = matchmakingService.getUserSocketId(fromUserId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('battle:challenge_declined', {
            by: user.username
          });
        }

        socket.emit('battle:challenge_declined_sent');
      } catch (error) {
        console.error('Decline challenge error:', error);
      }
    });

    // === BATTLE GAMEPLAY ===

    socket.on('battle:player_ready', async (data) => {
      try {
        const { battleId } = data;

        const battle = await Battle.findOne({ battleId });

        if (!battle) {
          return socket.emit('battle:error', {
            message: 'نبرد یافت نشد'
          });
        }

        // Check if user is participant
        if (!battle.isParticipant(socket.userId)) {
          return socket.emit('battle:error', {
            message: 'شما در این نبرد نیستید'
          });
        }

        // Emit to battle room
        socket.join(`battle_${battleId}`);
        io.to(`battle_${battleId}`).emit('battle:player_ready_update', {
          userId: socket.userId,
          ready: true
        });
      } catch (error) {
        console.error('Player ready error:', error);
      }
    });

    socket.on('battle:word_submitted', async (data) => {
      try {
        const { battleId, word, timeTaken } = data;

        // Anti-cheat: Check minimum time
        if (timeTaken < MIN_WORD_FIND_TIME) {
          console.warn(`Possible cheat detected: User ${socket.userId} found word too fast`);
          return socket.emit('battle:error', {
            message: 'زمان یافتن کلمه نامعتبر است'
          });
        }

        const battle = await Battle.findOne({ battleId }).populate('level');

        if (!battle) {
          return socket.emit('battle:error', {
            message: 'نبرد یافت نشد'
          });
        }

        // Check if battle is active
        if (battle.status !== 'active') {
          return socket.emit('battle:error', {
            message: 'نبرد فعال نیست'
          });
        }

        // Check if user is participant
        if (!battle.isParticipant(socket.userId)) {
          return socket.emit('battle:error', {
            message: 'شما در این نبرد نیستید'
          });
        }

        // Validate word exists in level
        const wordDoc = await Word.findOne({
          word: word.toLowerCase(),
          level: battle.level._id
        });

        if (!wordDoc) {
          return socket.emit('battle:word_invalid', {
            word,
            message: 'کلمه نامعتبر است'
          });
        }

        // Record word found
        const recorded = battle.recordWordFound(
          socket.userId,
          wordDoc._id,
          word.toLowerCase(),
          timeTaken
        );

        if (!recorded) {
          return socket.emit('battle:word_already_found', {
            word
          });
        }

        // Calculate score
        battle.calculateScore(socket.userId);

        await battle.save();

        // Emit to both players
        io.to(`battle_${battleId}`).emit('battle:word_found', {
          userId: socket.userId,
          word: word.toLowerCase(),
          wordId: wordDoc._id,
          meaning: wordDoc.meaning,
          timeTaken
        });

        // Check if player completed all words
        const player = battle.getPlayer(socket.userId);
        if (player.wordsFound.length >= battle.totalWords) {
          player.completedAt = new Date();
          await battle.save();

          // Battle complete! Determine winner
          await completeBattle(io, battle);
        }
      } catch (error) {
        console.error('Word submitted error:', error);
        socket.emit('battle:error', {
          message: 'خطا در ثبت کلمه'
        });
      }
    });

    socket.on('battle:reaction', async (data) => {
      try {
        const { battleId, reaction } = data;

        const battle = await Battle.findOne({ battleId });

        if (!battle || !battle.isParticipant(socket.userId)) {
          return;
        }

        const player = battle.getPlayer(socket.userId);

        // Anti-cheat: Limit reactions
        if (player.reactionsSent >= MAX_REACTIONS_PER_BATTLE) {
          return socket.emit('battle:error', {
            message: 'تعداد واکنش‌ها به حد مجاز رسیده است'
          });
        }

        player.reactionsSent += 1;
        await battle.save();

        // Emit to opponent only
        const opponent = battle.getOpponent(socket.userId);
        const opponentSocketId = matchmakingService.getUserSocketId(opponent.userId.toString());

        if (opponentSocketId) {
          io.to(opponentSocketId).emit('battle:reaction_received', {
            from: socket.username,
            reaction
          });
        }
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    socket.on('battle:typing', async (data) => {
      try {
        const { battleId, isTyping } = data;

        const battle = await Battle.findOne({ battleId });

        if (!battle || !battle.isParticipant(socket.userId)) {
          return;
        }

        // Emit to opponent
        const opponent = battle.getOpponent(socket.userId);
        const opponentSocketId = matchmakingService.getUserSocketId(opponent.userId.toString());

        if (opponentSocketId) {
          io.to(opponentSocketId).emit('battle:opponent_typing', {
            isTyping
          });
        }
      } catch (error) {
        console.error('Typing indicator error:', error);
      }
    });

    // === DISCONNECT ===

    socket.on('disconnect', async () => {
      try {
        console.log(`Battle socket disconnected: ${socket.userId} (${socket.username})`);

        // Remove from queue
        matchmakingService.removeFromQuickMatchQueue(socket.userId);

        // Check if user is in battle
        const battleId = matchmakingService.getUserBattle(socket.userId);

        if (battleId) {
          const battle = await Battle.findOne({ battleId });

          if (battle && battle.status === 'active') {
            // Mark player as disconnected
            battle.playerDisconnected(socket.userId);
            await battle.save();

            // Emit to opponent
            const opponent = battle.getOpponent(socket.userId);
            const opponentSocketId = matchmakingService.getUserSocketId(opponent.userId.toString());

            if (opponentSocketId) {
              io.to(opponentSocketId).emit('battle:opponent_disconnected', {
                username: user.username
              });
            }

            // Set timeout for auto-loss
            setTimeout(async () => {
              const updatedBattle = await Battle.findOne({ battleId });

              if (updatedBattle && updatedBattle.status === 'active') {
                const player = updatedBattle.getPlayer(socket.userId);

                // If still disconnected after grace period, forfeit
                if (player.disconnectedAt && !player.reconnectedAt) {
                  console.log(`User ${socket.username} forfeited battle ${battleId}`);
                  await completeBattle(io, updatedBattle, socket.userId);
                }
              }
            }, 10000); // 10 second grace period
          }
        }

        // Remove from online users
        matchmakingService.removeOnlineUser(socket.userId);

        // Update database
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });

        // Emit online count
        io.emit('battle:online_count', {
          count: matchmakingService.getStats().onlineUsers
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
}

/**
 * Create a battle from a match
 */
async function createBattle(io, match, type, challengeCode = null) {
  try {
    const { player1, player2 } = match;

    // Select random level
    const levelsCount = await Level.countDocuments();
    const randomLevel = await Level.findOne()
      .skip(Math.floor(Math.random() * levelsCount))
      .populate('words');

    if (!randomLevel) {
      throw new Error('No levels available');
    }

    // Generate battle ID
    const battleId = Battle.generateBattleId();

    // Create battle document
    const battle = new Battle({
      battleId,
      type,
      challengeCode,
      players: [
        {
          userId: player1.userId,
          username: player1.username,
          avatar: player1.avatar,
          wordsFound: [],
          score: 0
        },
        {
          userId: player2.userId,
          username: player2.username,
          avatar: player2.avatar,
          wordsFound: [],
          score: 0
        }
      ],
      level: randomLevel._id,
      status: 'countdown',
      totalWords: randomLevel.words.length,
      timeLimit: 120, // 2 minutes
      metadata: {
        levelNumber: randomLevel.orderNumber,
        levelTitle: randomLevel.title,
        gridSize: `${randomLevel.grid.length}x${randomLevel.grid[0].length}`
      }
    });

    await battle.save();

    // Register battle in matchmaking service
    matchmakingService.registerBattle(battleId, {
      players: [
        { userId: player1.userId },
        { userId: player2.userId }
      ]
    });

    // Emit match found to both players
    io.to(player1.socketId).emit('battle:match_found', {
      battleId,
      opponent: {
        userId: player2.userId,
        username: player2.username,
        avatar: player2.avatar
      },
      level: {
        id: randomLevel._id,
        title: randomLevel.title,
        orderNumber: randomLevel.orderNumber,
        grid: randomLevel.grid,
        words: randomLevel.words.map(w => ({
          id: w._id,
          word: w.word,
          meaning: w.meaning
        }))
      }
    });

    io.to(player2.socketId).emit('battle:match_found', {
      battleId,
      opponent: {
        userId: player1.userId,
        username: player1.username,
        avatar: player1.avatar
      },
      level: {
        id: randomLevel._id,
        title: randomLevel.title,
        orderNumber: randomLevel.orderNumber,
        grid: randomLevel.grid,
        words: randomLevel.words.map(w => ({
          id: w._id,
          word: w.word,
          meaning: w.meaning
        }))
      }
    });

    // Start countdown after 1 second
    setTimeout(() => {
      startBattleCountdown(io, battleId, player1.socketId, player2.socketId);
    }, 1000);

    console.log(`Battle created: ${battleId} (${player1.username} vs ${player2.username})`);
  } catch (error) {
    console.error('Create battle error:', error);

    // Notify players of error
    if (match.player1.socketId) {
      io.to(match.player1.socketId).emit('battle:error', {
        message: 'خطا در ایجاد نبرد'
      });
    }
    if (match.player2.socketId) {
      io.to(match.player2.socketId).emit('battle:error', {
        message: 'خطا در ایجاد نبرد'
      });
    }
  }
}

/**
 * Start battle countdown
 */
async function startBattleCountdown(io, battleId, socket1, socket2) {
  try {
    const sockets = [socket1, socket2];

    // 3... 2... 1... countdown
    for (let count = 3; count > 0; count--) {
      sockets.forEach(socketId => {
        io.to(socketId).emit('battle:countdown', { count });
      });
      await sleep(1000);
    }

    // Start battle!
    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return;
    }

    battle.status = 'active';
    battle.startTime = new Date();
    await battle.save();

    io.to(socket1).emit('battle:start', {
      battleId,
      startTime: battle.startTime
    });

    io.to(socket2).emit('battle:start', {
      battleId,
      startTime: battle.startTime
    });

    console.log(`Battle started: ${battleId}`);

    // Set battle timeout
    setTimeout(async () => {
      const activeBattle = await Battle.findOne({ battleId });

      if (activeBattle && activeBattle.status === 'active') {
        console.log(`Battle timeout: ${battleId}`);
        await completeBattle(io, activeBattle);
      }
    }, 120000); // 2 minutes
  } catch (error) {
    console.error('Start countdown error:', error);
  }
}

/**
 * Complete a battle and determine winner
 */
async function completeBattle(io, battle, forfeitedUserId = null) {
  try {
    if (battle.status === 'completed') {
      return; // Already completed
    }

    battle.status = 'completed';
    battle.endTime = new Date();
    battle.duration = Math.round((battle.endTime - battle.startTime) / 1000);

    // If someone forfeited, opponent wins
    if (forfeitedUserId) {
      const opponent = battle.getOpponent(forfeitedUserId);
      opponent.isWinner = true;
      battle.winner = opponent.userId;

      const forfeiter = battle.getPlayer(forfeitedUserId);
      forfeiter.isWinner = false;
    } else {
      // Normal completion - determine winner
      battle.determineWinner();
    }

    await battle.save();

    // Update user stats
    const [player1, player2] = battle.players;

    // Update player 1
    const user1 = await User.findById(player1.userId);
    if (user1) {
      await user1.updateBattleStats({
        won: player1.isWinner,
        lost: !player1.isWinner && !battle.isDraw,
        draw: battle.isDraw,
        wordsFound: player1.wordsFound.length,
        duration: battle.duration
      });

      // Award coins and XP
      const coinsAwarded = player1.isWinner ? 50 : (battle.isDraw ? 30 : 10);
      const xpAwarded = player1.isWinner ? 100 : (battle.isDraw ? 50 : 20);

      user1.coins += coinsAwarded;
      user1.totalScore += xpAwarded;
      await user1.save();
    }

    // Update player 2
    const user2 = await User.findById(player2.userId);
    if (user2) {
      await user2.updateBattleStats({
        won: player2.isWinner,
        lost: !player2.isWinner && !battle.isDraw,
        draw: battle.isDraw,
        wordsFound: player2.wordsFound.length,
        duration: battle.duration
      });

      // Award coins and XP
      const coinsAwarded = player2.isWinner ? 50 : (battle.isDraw ? 30 : 10);
      const xpAwarded = player2.isWinner ? 100 : (battle.isDraw ? 50 : 20);

      user2.coins += coinsAwarded;
      user2.totalScore += xpAwarded;
      await user2.save();
    }

    // Emit results to both players
    const player1SocketId = matchmakingService.getUserSocketId(player1.userId.toString());
    const player2SocketId = matchmakingService.getUserSocketId(player2.userId.toString());

    const resultData = {
      battleId: battle.battleId,
      status: battle.isDraw ? 'draw' : (battle.winner ? 'completed' : 'completed'),
      winner: battle.winner,
      isDraw: battle.isDraw,
      duration: battle.duration,
      players: [
        {
          userId: player1.userId,
          username: player1.username,
          wordsFound: player1.wordsFound.length,
          score: player1.score,
          isWinner: player1.isWinner
        },
        {
          userId: player2.userId,
          username: player2.username,
          wordsFound: player2.wordsFound.length,
          score: player2.score,
          isWinner: player2.isWinner
        }
      ]
    };

    if (player1SocketId) {
      io.to(player1SocketId).emit('battle:end', resultData);
    }

    if (player2SocketId) {
      io.to(player2SocketId).emit('battle:end', resultData);
    }

    // Clean up
    matchmakingService.endBattle(battle.battleId);

    console.log(`Battle completed: ${battle.battleId}, Winner: ${battle.winner || 'DRAW'}`);
  } catch (error) {
    console.error('Complete battle error:', error);
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { setupBattleSocketHandlers };
