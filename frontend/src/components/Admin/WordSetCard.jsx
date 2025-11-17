import { PenSquare, Trash2, ShieldCheck, Sword } from 'lucide-react';

const difficultyClasses = {
  'آسان': 'text-emerald-400 bg-emerald-500/10',
  'متوسط': 'text-amber-400 bg-amber-500/10',
  'سخت': 'text-rose-400 bg-rose-500/10',
};

const WordSetCard = ({ wordSet, onEdit, onDelete, onToggleActive }) => {
  if (!wordSet) {
    return null;
  }

  const difficultyChip = difficultyClasses[wordSet.difficulty] || difficultyClasses['متوسط'];
  const wordCount = wordSet.words?.length || 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <Sword className="w-5 h-5 text-primary-300" />
            <span>{wordSet.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span className={`px-3 py-1 rounded-full ${difficultyChip}`}>
              سختی: {wordSet.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10">{wordCount} کلمه</span>
            <span className="px-3 py-1 rounded-full bg-white/10">شبکه {wordSet.gridSize} حرفی</span>
            {wordSet.isActive ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> فعال
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-white/10">غیرفعال</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(wordSet)}
            className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-primary-500/20"
            title="ویرایش مجموعه"
          >
            <PenSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(wordSet)}
            className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-rose-500/20"
            title="حذف مجموعه"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
        <span>استفاده شده: {wordSet.usageCount?.toLocaleString('fa-IR') || 0} بار</span>
        <span>آخرین بروزرسانی: {new Date(wordSet.updatedAt).toLocaleDateString('fa-IR')}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-white/60">
          {(wordSet.words || []).slice(0, 4).map(word => (
            <span key={word._id || word.word} className="px-2 py-1 rounded-full bg-white/10">
              {word.word || word.text}
            </span>
          ))}
          {wordCount > 4 && <span>+{wordCount - 4} کلمه دیگر</span>}
        </div>
        <button
          type="button"
          onClick={() => onToggleActive?.(wordSet)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            wordSet.isActive
              ? 'bg-white/10 hover:bg-rose-500/20'
              : 'bg-primary-500/20 hover:bg-primary-500/40'
          }`}
        >
          {wordSet.isActive ? 'غیرفعال شود' : 'فعال شود'}
        </button>
      </div>
    </div>
  );
};

export default WordSetCard;
