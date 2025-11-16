const BattleTimer = ({ remaining = 120 }) => {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const danger = remaining <= 30;

  return (
    <div className={`px-4 py-2 rounded-2xl font-bold text-lg ${danger ? 'bg-red-500/20 text-red-200 animate-pulse' : 'bg-white/10 text-white'}`}>
      ⏱️ {minutes}:{seconds}
    </div>
  );
};

export default BattleTimer;
