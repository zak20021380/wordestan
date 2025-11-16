import { useBattle } from '../contexts/BattleContext';
import { useAuth } from '../contexts/AuthContext';
import { useMemo, useState } from 'react';

const filters = [
  { value: 'all', label: 'همه' },
  { value: 'win', label: 'برد' },
  { value: 'loss', label: 'باخت' },
];

const BattleHistory = () => {
  const { history } = useBattle();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter((battle) => {
      const me = battle.players.find((player) => player.userId === user?._id);
      if (!me) return false;
      return filter === 'win' ? me.isWinner : !me.isWinner;
    });
  }, [history, filter, user?._id]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {filters.map((option) => (
          <button
            key={option.value}
            className={`px-4 py-2 rounded-2xl font-bold ${filter === option.value ? 'bg-primary-500 text-white' : 'bg-white/10 text-white/60'}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4">
        {filtered.map((battle) => (
          <div key={battle.battleId} className="bg-white/5 rounded-3xl border border-white/10 p-4 text-white/80">
            <p className="text-white font-bold mb-2">نبرد {battle.type === 'quick' ? 'سریع' : 'دوستانه'}</p>
            <div className="grid grid-cols-2 gap-2">
              {battle.players.map((player) => (
                <div key={player.userId} className={`rounded-2xl p-3 ${player.isWinner ? 'bg-emerald-500/10 border border-emerald-400/40' : 'bg-white/5 border border-white/5'}`}>
                  <p className="text-white font-bold">{player.username}</p>
                  <p>کلمات: {player.wordsFound.length}</p>
                  <p>امتیاز: {player.score}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-white/60 text-center">نبردی برای نمایش وجود ندارد.</p>}
      </div>
    </div>
  );
};

export default BattleHistory;
