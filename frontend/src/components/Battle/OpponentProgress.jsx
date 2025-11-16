import clsx from 'clsx';

const OpponentProgress = ({ myWords = [], opponentWords = [], totalWords = 0 }) => {
  const myPercent = totalWords ? (myWords.length / totalWords) * 100 : 0;
  const opponentPercent = totalWords ? (opponentWords.length / totalWords) * 100 : 0;

  return (
    <div className="bg-white/5 rounded-3xl border border-white/10 p-4 space-y-3">
      <div className="flex justify-between text-white text-sm">
        <span>شما: {myWords.length}</span>
        <span>حریف: {opponentWords.length}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-400 to-secondary-400" style={{ width: `${myPercent}%` }} />
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400" style={{ width: `${opponentPercent}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-right text-white/70 text-xs">
        <div>
          <p className="font-bold text-white mb-1">کلمات شما</p>
          <div className="flex flex-wrap gap-2">
            {myWords.map((word) => (
              <span key={word.word || word} className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-200 text-xs">
                {word.word || word}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-bold text-white mb-1">کلمات حریف</p>
          <div className="flex flex-wrap gap-2">
            {opponentWords.map((word) => (
              <span key={word.word || word} className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs">
                {word.word || word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentProgress;
