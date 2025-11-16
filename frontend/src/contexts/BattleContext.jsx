import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import battleService from '../services/battleService';

const BattleContext = createContext();

export const useBattle = () => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within BattleProvider');
  }
  return context;
};

export const BattleProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Battle state
  const [currentBattle, setCurrentBattle] = useState(null);
  const [battleStatus, setBattleStatus] = useState(null); // 'waiting' | 'countdown' | 'active' | 'completed'
  const [opponent, setOpponent] = useState(null);
  const [level, setLevel] = useState(null);

  // Matchmaking state
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  // Challenge state
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [receivedChallenges, setReceivedChallenges] = useState([]);

  // Game state
  const [myWordsFound, setMyWordsFound] = useState([]);
  const [opponentWordsFound, setOpponentWordsFound] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [battleStartTime, setBattleStartTime] = useState(null);
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);

  // Battle result
  const [battleResult, setBattleResult] = useState(null);

  // Error handling
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  /**
   * Initialize socket connection
   */
  const connectSocket = useCallback((token) => {
    if (socketRef.current?.connected) {
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const newSocket = io(API_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('Battle socket connected');
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Battle socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Battle socket connection error:', err);
      setError('خطا در اتصال به سرور');
    });

    // Online count
    newSocket.on('battle:online_count', (data) => {
      setOnlineCount(data.count);
    });

    // Queue events
    newSocket.on('battle:queue_joined', (data) => {
      setInQueue(true);
      setQueuePosition(data.position);
    });

    newSocket.on('battle:queue_left', () => {
      setInQueue(false);
      setQueuePosition(0);
    });

    // Match found
    newSocket.on('battle:match_found', (data) => {
      console.log('Match found:', data);
      setInQueue(false);
      setCurrentBattle(data.battleId);
      setOpponent(data.opponent);
      setLevel(data.level);
      setBattleStatus('countdown');
      setMyWordsFound([]);
      setOpponentWordsFound([]);
      setMyScore(0);
      setOpponentScore(0);
    });

    // Countdown
    newSocket.on('battle:countdown', (data) => {
      console.log('Countdown:', data.count);
    });

    // Battle start
    newSocket.on('battle:start', (data) => {
      console.log('Battle started:', data);
      setBattleStatus('active');
      setBattleStartTime(new Date(data.startTime));
    });

    // Word found
    newSocket.on('battle:word_found', (data) => {
      const isMe = data.userId === socketRef.current?.userId;

      if (isMe) {
        setMyWordsFound(prev => [...prev, {
          word: data.word,
          wordId: data.wordId,
          meaning: data.meaning,
          timeTaken: data.timeTaken
        }]);
      } else {
        setOpponentWordsFound(prev => [...prev, {
          word: data.word,
          wordId: data.wordId,
          meaning: data.meaning,
          timeTaken: data.timeTaken
        }]);
      }
    });

    // Word invalid
    newSocket.on('battle:word_invalid', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // Word already found
    newSocket.on('battle:word_already_found', (data) => {
      setError('این کلمه قبلا پیدا شده است');
      setTimeout(() => setError(null), 3000);
    });

    // Opponent typing
    newSocket.on('battle:opponent_typing', (data) => {
      setIsOpponentTyping(data.isTyping);
      if (data.isTyping) {
        setTimeout(() => setIsOpponentTyping(false), 2000);
      }
    });

    // Opponent disconnected
    newSocket.on('battle:opponent_disconnected', (data) => {
      setError(`${data.username} قطع شد...`);
    });

    // Battle end
    newSocket.on('battle:end', (data) => {
      console.log('Battle ended:', data);
      setBattleStatus('completed');
      setBattleResult(data);
    });

    // Challenge events
    newSocket.on('battle:challenge_received', (data) => {
      setReceivedChallenges(prev => [...prev, data]);
    });

    newSocket.on('battle:challenge_declined', (data) => {
      setError(`${data.by} چالش را رد کرد`);
      setTimeout(() => setError(null), 3000);
    });

    newSocket.on('battle:challenge_sent', () => {
      console.log('Challenge sent');
    });

    // Reaction received
    newSocket.on('battle:reaction_received', (data) => {
      // Handle reaction display
      console.log('Reaction received:', data);
    });

    // Errors
    newSocket.on('battle:error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    return newSocket;
  }, []);

  /**
   * Disconnect socket
   */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  /**
   * Join quick match queue
   */
  const joinQuickMatch = useCallback(() => {
    if (!socketRef.current?.connected) {
      setError('اتصال برقرار نیست');
      return;
    }

    socketRef.current.emit('battle:join_queue', {});
  }, []);

  /**
   * Leave queue
   */
  const leaveQueue = useCallback(() => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('battle:leave_queue');
    setInQueue(false);
  }, []);

  /**
   * Join challenge by code
   */
  const joinChallenge = useCallback((challengeCode) => {
    if (!socketRef.current?.connected) {
      setError('اتصال برقرار نیست');
      return;
    }

    socketRef.current.emit('battle:join_challenge', { challengeCode });
  }, []);

  /**
   * Challenge a user
   */
  const challengeUser = useCallback((targetUserId) => {
    if (!socketRef.current?.connected) {
      setError('اتصال برقرار نیست');
      return;
    }

    socketRef.current.emit('battle:challenge_user', { targetUserId });
  }, []);

  /**
   * Accept challenge
   */
  const acceptChallenge = useCallback((fromUserId) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('battle:accept_challenge', { fromUserId });

    // Remove from received challenges
    setReceivedChallenges(prev =>
      prev.filter(c => c.from.userId !== fromUserId)
    );
  }, []);

  /**
   * Decline challenge
   */
  const declineChallenge = useCallback((fromUserId) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('battle:decline_challenge', { fromUserId });

    // Remove from received challenges
    setReceivedChallenges(prev =>
      prev.filter(c => c.from.userId !== fromUserId)
    );
  }, []);

  /**
   * Submit word
   */
  const submitWord = useCallback((word, timeTaken) => {
    if (!socketRef.current?.connected || !currentBattle) {
      setError('نبرد فعال نیست');
      return;
    }

    socketRef.current.emit('battle:word_submitted', {
      battleId: currentBattle,
      word,
      timeTaken
    });
  }, [currentBattle]);

  /**
   * Send reaction
   */
  const sendReaction = useCallback((reaction) => {
    if (!socketRef.current?.connected || !currentBattle) return;

    socketRef.current.emit('battle:reaction', {
      battleId: currentBattle,
      reaction
    });
  }, [currentBattle]);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((isTyping) => {
    if (!socketRef.current?.connected || !currentBattle) return;

    socketRef.current.emit('battle:typing', {
      battleId: currentBattle,
      isTyping
    });
  }, [currentBattle]);

  /**
   * Mark player as ready
   */
  const markReady = useCallback(() => {
    if (!socketRef.current?.connected || !currentBattle) return;

    socketRef.current.emit('battle:player_ready', {
      battleId: currentBattle
    });
  }, [currentBattle]);

  /**
   * Reset battle state
   */
  const resetBattle = useCallback(() => {
    setCurrentBattle(null);
    setBattleStatus(null);
    setOpponent(null);
    setLevel(null);
    setMyWordsFound([]);
    setOpponentWordsFound([]);
    setMyScore(0);
    setOpponentScore(0);
    setBattleStartTime(null);
    setBattleResult(null);
    setActiveChallenge(null);
  }, []);

  const value = {
    // Socket state
    socket,
    isConnected,
    onlineCount,

    // Battle state
    currentBattle,
    battleStatus,
    opponent,
    level,

    // Matchmaking
    inQueue,
    queuePosition,

    // Challenge
    activeChallenge,
    setActiveChallenge,
    receivedChallenges,

    // Game state
    myWordsFound,
    opponentWordsFound,
    myScore,
    opponentScore,
    battleStartTime,
    isOpponentTyping,
    battleResult,

    // Error
    error,
    setError,

    // Actions
    connectSocket,
    disconnectSocket,
    joinQuickMatch,
    leaveQueue,
    joinChallenge,
    challengeUser,
    acceptChallenge,
    declineChallenge,
    submitWord,
    sendReaction,
    sendTypingIndicator,
    markReady,
    resetBattle
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
};

export default BattleContext;
