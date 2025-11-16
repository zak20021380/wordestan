import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../contexts/BattleContext';
import OpponentProgress from '../components/Battle/OpponentProgress';
import BattleTimer from '../components/Battle/BattleTimer';
import QuickChat from '../components/Battle/QuickChat';

const BattleGame = () => {
  const {
    state,
    submitWord,
    setTyping,
    sendQuickChat,
    confirmReady,
    forfeitBattle,
  } = useBattle();
  const [word, setWord] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.battle) {
      navigate('/battle');
      return;
    }
    confirmReady();
  }, [state.battle, confirmReady, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!word) return;
    submitWord(word);
    setTyping(false);
    setWord('');
  };

  if (!state.battle) {
    return null;
  }

  const letters = state.battle.level?.letters?.split('') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BattleTimer remaining={state.timer.remaining} />
        <div className="text-white text-center">
          <p className="text-lg font-bold">شما vs {state.battle.opponent?.username || '---'}</p>
          <p className="text-white/70 text-sm">سطح: {state.battle.level?.letters}</p>
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

      <div className="bg-white/5 rounded-3xl border border-white/10 p-6 text-center">
        <div className="grid grid-cols-4 gap-3 place-items-center">
          {letters.map((letter, index) => (
            <div key={`${letter}-${index}`} className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl text-white font-bold">
              {letter}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={word}
          onChange={(event) => {
            setWord(event.target.value);
            setTyping(true);
          }}
          onBlur={() => setTyping(false)}
          placeholder="کلمه‌ای که پیدا کردی..."
          className="flex-1 bg-white/5 rounded-2xl border border-white/10 text-white px-4 py-3"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 rounded-2xl font-bold"
        >
          تایید
        </button>
      </form>

      <OpponentProgress
        myWords={state.myWords}
        opponentWords={state.opponentWords}
        totalWords={state.battle.level?.wordCount || 0}
      />

      <QuickChat onSend={sendQuickChat} />

      {state.opponentTyping && (
        <p className="text-center text-white/70">حریف در حال تایپ...</p>
      )}

      <div className="bg-white/5 rounded-3xl border border-white/10 p-4 text-white/70 text-sm">
        <p>امتیاز شما: {state.myWords.reduce((sum, item) => sum + (item.scoreGain || 0), 0)}</p>
        <p>امتیاز حریف: {state.opponentWords.reduce((sum, item) => sum + (item.scoreGain || 0), 0)}</p>
      </div>
    </div>
  );
};

export default BattleGame;
