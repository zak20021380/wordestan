import clsx from 'clsx';

const accentThemes = {
  ally: {
    letter:
      'border-emerald-400/70 bg-gradient-to-br from-emerald-500/40 via-green-500/30 to-lime-500/30 text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.35)]',
  },
  opponent: {
    letter:
      'border-sky-400/70 bg-gradient-to-br from-blue-500/40 via-sky-500/30 to-cyan-500/30 text-cyan-50 shadow-[0_0_18px_rgba(14,165,233,0.35)]',
  },
};

const BattleWordSlotsPanel = ({ title, wordGroups = [], completedSet = new Set(), accent = 'ally' }) => {
  const theme = accentThemes[accent] || accentThemes.ally;
  const totalWords = wordGroups.reduce((sum, group) => sum + group.words.length, 0);
  const completedCount = wordGroups.reduce((sum, group) => {
    const resolved = group.words.filter((word) => completedSet.has(word));
    return sum + resolved.length;
  }, 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-white space-y-4 max-h-[70vh] overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white/90">{title}</p>
          <p className="text-xs text-white/60">کلمات پیدا شده</p>
        </div>
        <div className="text-sm font-bold text-white/90">
          {completedCount} / {totalWords}
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-1">
        {wordGroups.length === 0 ? (
          <div className="text-center text-xs text-white/60 bg-white/5 border border-white/10 rounded-2xl py-4">
            هنوز کلمه‌ای برای این مرحله ثبت نشده.
          </div>
        ) : (
          wordGroups.map(({ length, words }) => (
            <div key={`battle-slot-${length}`} className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between text-xs text-white/70 mb-3">
                <span>کلمات {length} حرفی</span>
                <span>{words.length} کلمه</span>
              </div>

              <div className="space-y-2">
                {words.map((word) => {
                  const letters = word.split('');
                  const isCompleted = completedSet.has(word);

                  return (
                    <div key={`${word}-slot`} className="flex justify-center gap-1 sm:gap-1.5" dir="ltr">
                      {letters.map((letter, index) => (
                        <div
                          key={`${word}-${letter}-${index}`}
                          className={clsx(
                            'w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center text-base font-bold tracking-wide uppercase transition-all',
                            isCompleted
                              ? theme.letter
                              : 'border-white/15 bg-white/5 text-transparent'
                          )}
                        >
                          {isCompleted ? letter : ''}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BattleWordSlotsPanel;
