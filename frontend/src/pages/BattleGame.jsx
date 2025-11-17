import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBattle } from '../contexts/BattleContext';
import { useGame } from '../contexts/GameContext';
import Game from './Game';
import BattleTimer from '../components/Battle/BattleTimer';
import QuickChat from '../components/Battle/QuickChat';
import BattleWordSlotsPanel from '../components/Battle/BattleWordSlotsPanel';
import OpponentWordNotification from '../components/Battle/OpponentWordNotification';

const resolvePowerupLabel = (type) => {
  switch (type) {
    case 'hint':
      return 'راهنما';
    case 'auto_solve':
    case 'autoSolve':
      return 'حل خودکار';
    case 'reveal':
      return 'نمایش حرف';
    default:
      return 'ویژه';
  }
};

const BattleGame = () => {
  const {
    state,
    submitWord: submitBattleWord,
    sendQuickChat,
    confirmReady,
    forfeitBattle,
  } = useBattle();
  const { currentLevel, gameState, loadBattleBoard, levelLoading } = useGame();
  const navigate = useNavigate();
  const loadedLevelRef = useRef(null);
  const syncedWordsRef = useRef(new Set());
  const seededInitialWordsRef = useRef(false);
  const prevOpponentWordCountRef = useRef(0);
  const lastPowerupRef = useRef(null);
  const lastShuffleRef = useRef(null);

  const [opponentWordNotification, setOpponentWordNotification] = useState(null);
  const [powerupBanner, setPowerupBanner] = useState(null);
  const [shuffleBanner, setShuffleBanner] = useState(null);

  const battleLevelId = state.battle?.level?._id?.toString() || state.battle?.level?.id || null;
  const currentLevelId = currentLevel?._id?.toString() || null;
  const boardReady = Boolean(
    battleLevelId
      && currentLevelId === battleLevelId
      && currentLevel?.isBattleLevel
  );

  const battleWordGroups = useMemo(() => {
    if (!Array.isArray(currentLevel?.words)) {
      return [];
    }

    const groups = new Map();
    currentLevel.words.forEach((entry) => {
      if (!entry) return;
      const text = (typeof entry === 'string' ? entry : entry.text || '').toUpperCase();
      if (!text) return;
      const length = text.length;
      if (!groups.has(length)) {
        groups.set(length, []);
      }
      groups.get(length).push(text);
    });

    return Array.from(groups.entries())
      .map(([length, words]) => ({ length, words }))
      .sort((a, b) => a.length - b.length);
  }, [currentLevel?.words]);

  const playerWordSet = useMemo(() => {
    if (!boardReady || !Array.isArray(gameState.completedWords)) {
      return new Set();
    }
    return new Set(
      gameState.completedWords
        .filter(Boolean)
        .map((word) => (word || '').toUpperCase())
    );
  }, [boardReady, gameState.completedWords]);

  const opponentWordSet = useMemo(() => {
    if (!boardReady || !Array.isArray(state.opponentWords)) {
      return new Set();
    }
    return new Set(
      state.opponentWords
        .map((word) => (word?.word || word?.text || word || '').toUpperCase())
        .filter(Boolean)
    );
  }, [boardReady, state.opponentWords]);

  const totalWords = useMemo(() => battleWordGroups.reduce((sum, group) => sum + group.words.length, 0), [battleWordGroups]);
  const playerFoundCount = useMemo(() => {
    if (battleWordGroups.length === 0) return 0;
    return battleWordGroups.reduce(
      (count, group) => count + group.words.filter((word) => playerWordSet.has(word)).length,
      0
    );
  }, [battleWordGroups, playerWordSet]);
  const opponentFoundCount = useMemo(() => {
    if (battleWordGroups.length === 0) return 0;
    return battleWordGroups.reduce(
      (count, group) => count + group.words.filter((word) => opponentWordSet.has(word)).length,
      0
    );
  }, [battleWordGroups, opponentWordSet]);

  const myScore = useMemo(
    () => state.myWords.reduce((sum, item) => sum + (item.scoreGain || 0), 0),
    [state.myWords]
  );
  const opponentScore = useMemo(
    () => state.opponentWords.reduce((sum, item) => sum + (item.scoreGain || 0), 0),
    [state.opponentWords]
  );

  const opponentUsername = useMemo(
    () => state.battle?.opponent?.username || '---',
    [state.battle?.opponent?.username]
  );

  useEffect(() => {
    if (!state.battle) {
      navigate('/battle');
      return;
    }
    confirmReady();
  }, [state.battle, confirmReady, navigate]);

  useEffect(() => {
    if (!state.battle?.battleId) {
      syncedWordsRef.current = new Set();
      loadedLevelRef.current = null;
      seededInitialWordsRef.current = false;
      prevOpponentWordCountRef.current = 0;
    }
  }, [state.battle?.battleId]);

  useEffect(() => {
    const levelPayload = state.battle?.level;
    if (!state.battle || !levelPayload?.letters) {
      return;
    }

    const levelId = levelPayload._id?.toString() || levelPayload.id || state.battle.battleId;
    if (!levelId || loadedLevelRef.current === levelId) {
      return;
    }

    try {
      const completedWords = Array.isArray(state.myWords)
        ? state.myWords
            .map((entry) => (entry?.word || entry?.text || '').toUpperCase())
            .filter(Boolean)
        : [];

      loadBattleBoard({
        ...levelPayload,
        _id: levelId,
        battleId: state.battle.battleId,
        completedWords,
      });
      loadedLevelRef.current = levelId;
      syncedWordsRef.current = new Set(completedWords);
      seededInitialWordsRef.current = Boolean(completedWords.length);
    } catch (error) {
      console.error('Failed to prepare battle board', error);
      toast.error(error.message || 'بارگذاری شبکه نبرد ممکن نشد');
    }
  }, [loadBattleBoard, state.battle, state.myWords]);

  useEffect(() => {
    if (!state.battle?.battleId || !boardReady || seededInitialWordsRef.current) {
      return;
    }

    const initialWords = gameState.completedWords || [];
    syncedWordsRef.current = new Set(initialWords.map((word) => (word || '').toUpperCase()));
    seededInitialWordsRef.current = true;
  }, [boardReady, gameState.completedWords, state.battle?.battleId]);

  useEffect(() => {
    if (!state.battle || !boardReady) {
      return;
    }

    const completedWords = gameState.completedWords || [];

    completedWords.forEach((word) => {
      const normalized = (word || '').toUpperCase();
      if (!normalized || syncedWordsRef.current.has(normalized)) {
        return;
      }

      submitBattleWord(normalized);
      syncedWordsRef.current.add(normalized);
    });
  }, [boardReady, gameState.completedWords, state.battle?.battleId, submitBattleWord]);

  useEffect(() => {
    if (!boardReady) {
      prevOpponentWordCountRef.current = state.opponentWords.length;
      return;
    }

    const currentCount = state.opponentWords.length;
    if (currentCount > prevOpponentWordCountRef.current) {
      const latest = state.opponentWords[currentCount - 1];
      const text = (latest?.word || latest?.text || latest || '').toUpperCase();
      if (text) {
        setOpponentWordNotification(text);
      }
    }
    prevOpponentWordCountRef.current = currentCount;
  }, [boardReady, state.opponentWords]);

  useEffect(() => {
    if (!opponentWordNotification) {
      return undefined;
    }
    const timeout = setTimeout(() => setOpponentWordNotification(null), 2000);
    return () => clearTimeout(timeout);
  }, [opponentWordNotification]);

  useEffect(() => {
    const event = state.lastOpponentPowerup;
    if (!event?.timestamp || lastPowerupRef.current === event.timestamp) {
      return;
    }
    lastPowerupRef.current = event.timestamp;
    const label = resolvePowerupLabel(event.powerupType);
    const message = `حریف از پاورآپ ${label} استفاده کرد`;
    toast(message, { icon: '⚡️' });
    setPowerupBanner(message);
  }, [state.lastOpponentPowerup]);

  useEffect(() => {
    const event = state.lastOpponentShuffle;
    if (!event?.timestamp || lastShuffleRef.current === event.timestamp) {
      return;
    }
    lastShuffleRef.current = event.timestamp;
    const message = 'حریف چیدمان حروفش رو تغییر داد';
    toast(message, { icon: '🔄' });
    setShuffleBanner(message);
  }, [state.lastOpponentShuffle]);

  useEffect(() => {
    if (!powerupBanner) {
      return undefined;
    }
    const timeout = setTimeout(() => setPowerupBanner(null), 4000);
    return () => clearTimeout(timeout);
  }, [powerupBanner]);

  useEffect(() => {
    if (!shuffleBanner) {
      return undefined;
    }
    const timeout = setTimeout(() => setShuffleBanner(null), 4000);
    return () => clearTimeout(timeout);
  }, [shuffleBanner]);

  if (!state.battle) {
    return null;
  }

  const renderGameArea = () => {
    if (boardReady) {
      return (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-2">
          <div className="battle-game-host">
            <Game key={`battle-${battleLevelId}`} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] bg-white/5 border border-white/10 rounded-[32px] text-white/70 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-white/60" />
        <p>{levelLoading ? 'در حال آماده‌سازی مرحله...' : 'منتظر بارگذاری مرحله نبرد...'}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <OpponentWordNotification word={opponentWordNotification} />
      <div className="flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <BattleTimer remaining={state.timer.remaining} />
          <div className="text-xs sm:text-sm text-white/70">
            <p>سطح: {state.battle.level?.title || state.battle.level?.letters}</p>
            <p>رقیب: {opponentUsername}</p>
          </div>
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm text-white/70">امتیاز</p>
          <p className="text-2xl font-black tracking-wide">
            شما {myScore} : {opponentScore} حریف
          </p>
          <p className="text-xs text-white/60">
            {playerFoundCount}/{totalWords} کلمه شما • {opponentFoundCount}/{totalWords} حریف
          </p>
        </div>
        <button
          onClick={() => {
            forfeitBattle();
            navigate('/battle');
          }}
          className="text-white/80 hover:text-white text-sm"
        >
          خروج
        </button>
      </div>

      <AnimatePresence>
        {powerupBanner && (
          <motion.div
            key="opponent-powerup"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
          >
            {powerupBanner}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {shuffleBanner && (
          <motion.div
            key="opponent-shuffle"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
          >
            {shuffleBanner}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.countdown && (
          <motion.div
            key={state.countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-6xl font-black text-white"
          >
            {state.countdown}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 xl:grid-cols-[minmax(240px,1fr)_minmax(0,2.1fr)_minmax(240px,1fr)] items-start">
        <BattleWordSlotsPanel
          title="کلمات شما"
          wordGroups={battleWordGroups}
          completedSet={playerWordSet}
          accent="ally"
        />
        <div className="min-w-0">
          {renderGameArea()}
        </div>
        <BattleWordSlotsPanel
          title={`کلمات ${opponentUsername}`}
          wordGroups={battleWordGroups}
          completedSet={opponentWordSet}
          accent="opponent"
        />
      </div>

      <div className="space-y-4">
        <QuickChat onSend={sendQuickChat} />
        {state.opponentTyping && (
          <p className="text-center text-white/70">حریف در حال تایپ...</p>
        )}
      </div>
    </div>
  );
};

export default BattleGame;
