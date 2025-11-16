import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { battleService } from '../services/battleService';
import { useBattleSocket } from '../hooks/useBattleSocket';

const BattleContext = createContext(null);

const initialState = {
  queueStatus: 'idle',
  onlineCount: 0,
  battle: null,
  countdown: null,
  timer: { remaining: 120, isRunning: false },
  myWords: [],
  opponentWords: [],
  opponentTyping: false,
  quickChats: [],
  results: null,
  waitingMessage: null,
  challengeCode: null,
  challengeError: null,
  incomingChallenge: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'QUEUE_START':
      return { ...state, queueStatus: 'searching', waitingMessage: action.payload };
    case 'QUEUE_CANCEL':
      return { ...state, queueStatus: 'idle', waitingMessage: null };
    case 'SOCKET_ONLINE':
      return { ...state, onlineCount: action.payload };
    case 'MATCH_FOUND':
      return {
        ...state,
        queueStatus: 'matched',
        waitingMessage: null,
        battle: action.payload,
        myWords: [],
        opponentWords: [],
        quickChats: [],
        opponentTyping: false,
        countdown: null,
        timer: { remaining: 120, isRunning: false },
        results: null,
        incomingChallenge: null,
      };
    case 'COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'BATTLE_START':
      return { ...state, timer: { remaining: action.payload, isRunning: true }, countdown: null };
    case 'RESUME_BATTLE':
      return {
        ...state,
        battle: action.payload.battle,
        myWords: action.payload.myWords,
        opponentWords: action.payload.opponentWords,
        timer: { remaining: action.payload.remainingTime, isRunning: true },
        queueStatus: 'matched',
      };
    case 'TIMER_TICK':
      return { ...state, timer: { ...state.timer, remaining: Math.max(0, action.payload) } };
    case 'WORD_ACCEPTED':
      return { ...state, myWords: [...state.myWords, action.payload] };
    case 'OPPONENT_WORD':
      return { ...state, opponentWords: [...state.opponentWords, action.payload], opponentTyping: false };
    case 'OPPONENT_TYPING':
      return { ...state, opponentTyping: action.payload };
    case 'QUICK_CHAT':
      return { ...state, quickChats: [...state.quickChats, action.payload] };
    case 'BATTLE_END':
      return { ...state, results: action.payload, queueStatus: 'idle', timer: { ...state.timer, isRunning: false } };
    case 'WAITING_MESSAGE':
      return { ...state, waitingMessage: action.payload };
    case 'CHALLENGE_CODE':
      return { ...state, challengeCode: action.payload, challengeError: null };
    case 'CHALLENGE_ERROR':
      return { ...state, challengeError: action.payload };
    case 'INCOMING_CHALLENGE':
      return { ...state, incomingChallenge: action.payload };
    case 'CLEAR_CHALLENGE':
      return { ...state, incomingChallenge: null };
    case 'RESET_BATTLE':
      return { ...initialState, onlineCount: state.onlineCount };
    default:
      return state;
  }
};

export const BattleProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { socket, status: socketStatus, error: socketError } = useBattleSocket({ enabled: isAuthenticated, token });
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  const loadStats = useCallback(async () => {
    try {
      const data = await battleService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load battle stats', error);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await battleService.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load battle history', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadHistory();
    }
  }, [isAuthenticated, loadStats, loadHistory]);

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      connected: (payload) => dispatch({ type: 'SOCKET_ONLINE', payload: payload.online }),
      queue_joined: (payload) => dispatch({ type: 'WAITING_MESSAGE', payload: 'در حال جستجوی حریف...' }),
      queue_left: () => dispatch({ type: 'QUEUE_CANCEL' }),
      queue_error: (payload) => toast.error(payload.message || 'حریفی یافت نشد'),
      challenge_created: (payload) => {
        dispatch({ type: 'CHALLENGE_CODE', payload });
        toast.success('کد نبرد ساخته شد');
      },
      challenge_error: (payload) => dispatch({ type: 'CHALLENGE_ERROR', payload: payload.message }),
      challenge_received: (payload) => {
        dispatch({ type: 'INCOMING_CHALLENGE', payload });
        toast.success(`چالش جدید از ${payload.from?.username || 'یک بازیکن'}`);
      },
      challenge_declined: () => {
        dispatch({ type: 'CLEAR_CHALLENGE' });
        toast('حریف درخواست رو رد کرد');
      },
      challenge_expired: () => {
        dispatch({ type: 'CLEAR_CHALLENGE' });
        toast('زمان چالش تموم شد');
      },
      match_found: (payload) => {
        dispatch({ type: 'MATCH_FOUND', payload });
        navigate('/battle/live');
      },
      countdown_start: (payload) => dispatch({ type: 'COUNTDOWN', payload: payload.duration }),
      battle_start: (payload) => dispatch({ type: 'BATTLE_START', payload: payload.duration }),
      word_accepted: (payload) => dispatch({ type: 'WORD_ACCEPTED', payload }),
      opponent_word: (payload) => dispatch({ type: 'OPPONENT_WORD', payload }),
      opponent_typing: (payload) => dispatch({ type: 'OPPONENT_TYPING', payload: payload.typing }),
      quick_chat: (payload) => dispatch({ type: 'QUICK_CHAT', payload }),
      opponent_disconnected: () => toast('حریف قطع شد. ۱۰ ثانیه فرصت داره برگرده.'),
      opponent_reconnected: () => toast.success('حریف برگشت!'),
      battle_resume: (payload) => {
        const opponent = payload.players?.find((player) => player.userId !== user?._id);
        const me = payload.players?.find((player) => player.userId === user?._id);
        dispatch({
          type: 'RESUME_BATTLE',
          payload: {
            battle: {
              battleId: payload.battleId,
              level: payload.level,
              opponent,
            },
            myWords: me?.words?.map((word) => ({ word })) || [],
            opponentWords: opponent?.words?.map((word) => ({ word })) || [],
            remainingTime: payload.remainingTime,
          },
        });
      },
      battle_end: (payload) => {
        dispatch({ type: 'BATTLE_END', payload });
        loadStats();
        loadHistory();
        navigate('/battle/results');
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, navigate, loadHistory, loadStats, user?._id]);

  useEffect(() => {
    if (socketError) {
      toast.error(socketError || 'اتصال برقرار نشد');
    }
  }, [socketError]);

  useEffect(() => {
    if (!state.timer.isRunning) return;
    const interval = setInterval(() => {
      dispatch({ type: 'TIMER_TICK', payload: state.timer.remaining - 1 });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.timer.isRunning, state.timer.remaining]);

  const emit = useCallback((event, payload = {}) => {
    if (!socket) {
      toast.error('اتصال سوکت برقرار نیست');
      return;
    }
    socket.emit(event, payload);
  }, [socket]);

  const startQuickMatch = useCallback(() => {
    dispatch({ type: 'QUEUE_START', payload: 'در حال جستجوی حریف...' });
    emit('join_queue');
  }, [emit]);

  const cancelQuickMatch = useCallback(() => {
    emit('leave_queue');
    dispatch({ type: 'QUEUE_CANCEL' });
  }, [emit]);

  const confirmReady = useCallback(() => {
    if (!state.battle) return;
    emit('battle_ready', { battleId: state.battle.battleId });
  }, [emit, state.battle]);

  const submitWord = useCallback((word) => {
    if (!state.battle || !word) return;
    emit('word_found', { battleId: state.battle.battleId, word });
  }, [emit, state.battle]);

  const setTyping = useCallback((typing) => {
    if (!state.battle) return;
    emit('opponent_typing', { battleId: state.battle.battleId, typing });
  }, [emit, state.battle]);

  const sendQuickChat = useCallback((emoji) => {
    if (!state.battle) return;
    emit('quick_chat', { battleId: state.battle.battleId, emoji });
  }, [emit, state.battle]);

  const forfeitBattle = useCallback(() => {
    if (!state.battle) return;
    emit('battle_leave', { battleId: state.battle.battleId });
    dispatch({ type: 'RESET_BATTLE' });
  }, [emit, state.battle]);

  const createChallengeLink = useCallback(() => {
    emit('create_challenge');
  }, [emit]);

  const joinWithCode = useCallback((code) => {
    emit('join_challenge', { code });
  }, [emit]);

  const challengeByUsername = useCallback((username) => {
    emit('challenge_user', { username });
  }, [emit]);

  const acceptChallenge = useCallback((challengeId) => {
    emit('accept_challenge', { challengeId });
    dispatch({ type: 'CLEAR_CHALLENGE' });
  }, [emit]);

  const declineChallenge = useCallback((challengeId) => {
    emit('decline_challenge', { challengeId });
    dispatch({ type: 'CLEAR_CHALLENGE' });
  }, [emit]);

  const value = useMemo(() => ({
    state,
    stats,
    history,
    socketStatus,
    startQuickMatch,
    cancelQuickMatch,
    confirmReady,
    submitWord,
    setTyping,
    sendQuickChat,
    forfeitBattle,
    createChallengeLink,
    joinWithCode,
    challengeByUsername,
    acceptChallenge,
    declineChallenge,
    reloadHistory: loadHistory,
    reloadStats: loadStats,
  }), [
    state,
    stats,
    history,
    socketStatus,
    startQuickMatch,
    cancelQuickMatch,
    confirmReady,
    submitWord,
    setTyping,
    sendQuickChat,
    forfeitBattle,
    createChallengeLink,
    joinWithCode,
    challengeByUsername,
    acceptChallenge,
    declineChallenge,
    loadHistory,
    loadStats,
  ]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};

export const useBattle = () => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within BattleProvider');
  }
  return context;
};
