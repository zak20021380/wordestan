import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattle } from '../contexts/BattleContext';

const BattleResults = () => {
  const { state, startQuickMatch } = useBattle();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.results) {
      navigate('/battle');
    }
  }, [state.results, navigate]);

  if (!state.results) {
    return null;
  }

  const winnerId = state.results.winner;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-glass backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center space-y-6">
      <h1 className="text-3xl font-bold text-white">نتیجه نبرد</h1>
      <div className="grid grid-cols-2 gap-4 text-white">
        {state.results.players.map((player) => (
          <div key={player.userId} className={`rounded-2xl border p-4 ${winnerId === player.userId ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-lg font-bold">{player.username}</p>
            <p className="text-white/70">کلمات: {player.wordsFound.length}</p>
            <p className="text-white/70">امتیاز: {player.score}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/battle')} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-bold">
          بازگشت به لابی
        </button>
        <button onClick={startQuickMatch} className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-2xl font-bold">
          نبرد مجدد
        </button>
      </div>
    </motion.div>
  );
};

export default BattleResults;
