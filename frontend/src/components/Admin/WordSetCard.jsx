import { PenSquare, Trash2, ShieldCheck, Sword } from 'lucide-react';

const WordSetCard = ({ wordSet, onEdit, onDelete, onToggleActive }) => {
  if (!wordSet) {
    return null;
  }

  const wordCount = wordSet.words?.length || 0;
  const letters = Array.isArray(wordSet.letters)
    ? wordSet.letters
    : typeof wordSet.letters === 'string'
      ? wordSet.letters.split('')
      : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <Sword className="w-5 h-5 text-primary-300" />
            <span>{wordSet.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
            <span className="px-3 py-1 rounded-full bg-white/10">{wordCount} کلمه</span>
            <span className="px-3 py-1 rounded-full bg-white/10">{letters.length} حرف شبکه</span>
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
          {letters.length === 0 && <span>حروف ثبت نشده</span>}
          {letters.slice(0, 12).map((letter) => (
            <span key={`${wordSet._id}-${letter}`} className="px-2 py-1 rounded-full bg-white/10 font-semibold">
              {letter}
            </span>
          ))}
          {letters.length > 12 && <span>+{letters.length - 12}</span>}
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
