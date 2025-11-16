import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBattle } from '../contexts/BattleContext';
import { useGame } from '../contexts/GameContext';
import GameCanvas from '../components/GameCanvas';
import OpponentProgress from '../components/Battle/OpponentProgress';
import BattleTimer from '../components/Battle/BattleTimer';
import QuickChat from '../components/Battle/QuickChat';

const BattleGame = () => {
  const {
    state,
    submitWord: submitBattleWord,
    sendQuickChat,
    confirmReady,
    forfeitBattle,
  } = useBattle();
  const { currentLevel, gameState, loadLevelById, levelLoading } = useGame();
  const navigate = useNavigate();
  const loadedLevelRef = useRef(null);
  const syncedWordsRef = useRef(new Set());
  const seededInitialWordsRef = useRef(false);

  const battleLevelId = state.battle?.level?._id?.toString() || null;
  const currentLevelId = currentLevel?._id?.toString() || null;
  const boardReady = Boolean(battleLevelId && currentLevelId === battleLevelId);

  const totalWords = state.battle?.level?.wordCount || 0;
  const myPercent = totalWords ? (state.myWords.length / totalWords) * 100 : 0;
  const opponentPercent = totalWords ? (state.opponentWords.length / totalWords) * 100 : 0;

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
    }
  }, [state.battle?.battleId]);

  useEffect(() => {
    const battleLevelId = state.battle?.level?._id;
    if (!state.battle || !battleLevelId) {
      return;
    }

    if (loadedLevelRef.current === battleLevelId) {
      return;
    }

    loadLevelById(battleLevelId, {
      completionSource: 'battle',
      transitionType: 'changed',
    })
      .then(() => {
        loadedLevelRef.current = battleLevelId;
      })
      .catch((error) => {
        console.error('Failed to load battle level', error);
        toast.error(error.message || 'بارگذاری مرحله نبرد ممکن نشد');
      });
  }, [state.battle?.level?._id, loadLevelById]);

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

  if (!state.battle) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BattleTimer remaining={state.timer.remaining} />
        <div className="text-white text-center">
          <p className="text-lg font-bold">شما vs {opponentUsername}</p>
          <p className="text-white/70 text-sm">سطح: {state.battle.level?.title || state.battle.level?.letters}</p>
        </div>
        <button
          onClick={() => {
            forfeitBattle();
            navigate('/battle');
          }}
          className="text-white/70 hover:text-white text-sm"
        >
          خروج
        </button>
      </div>

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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-white/5 rounded-3xl border border-white/10 p-4 overflow-hidden min-h-[420px]">
            {boardReady ? (
              <GameCanvas />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-white/70 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-white/60" />
                <p>{levelLoading ? 'در حال آماده‌سازی مرحله...' : 'منتظر بارگذاری مرحله نبرد...'}</p>
              </div>
            )}

            {boardReady && (
              <div className="absolute inset-x-4 top-4 pointer-events-none">
                <OpponentProgress
                  myWords={state.myWords}
                  opponentWords={state.opponentWords}
                  totalWords={state.battle.level?.wordCount || 0}
                />
              </div>
            )}
          </div>

          <QuickChat onSend={sendQuickChat} />

          {state.opponentTyping && (
            <p className="text-center text-white/70">حریف در حال تایپ...</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-3xl border border-white/10 p-4 text-white">
            <h3 className="font-semibold text-lg mb-3 text-center">پیشرفت نبرد</h3>
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>کلمات شما</span>
              <span>
                {state.myWords.length} / {totalWords}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-secondary-400"
                style={{ width: `${myPercent.toFixed(2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>کلمات حریف</span>
              <span>
                {state.opponentWords.length} / {totalWords}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                style={{ width: `${opponentPercent.toFixed(2)}%` }}
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl border border-white/10 p-4 text-white/70 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>امتیاز شما</span>
              <span className="text-white font-semibold">
                {state.myWords.reduce((sum, item) => sum + (item.scoreGain || 0), 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>امتیاز حریف</span>
              <span className="text-white font-semibold">
                {state.opponentWords.reduce((sum, item) => sum + (item.scoreGain || 0), 0)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 text-center text-white/80">
              {state.results?.status === 'finished'
                ? 'نبرد به پایان رسیده'
                : 'هر کلمه درست امتیاز میاره؛ سریع‌تر باش!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleGame;
