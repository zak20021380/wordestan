import { useEffect, useState } from 'react';
import WordForm from './WordForm';

const difficulties = ['آسان', 'متوسط', 'سخت'];

const WordSetForm = ({ open, initialValue, onClose, onSubmit }) => {
  const [formState, setFormState] = useState({
    name: '',
    difficulty: 'متوسط',
    gridSize: 12,
    isActive: true,
  });
  const [words, setWords] = useState([]);
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);

  useEffect(() => {
    if (initialValue) {
      setFormState({
        name: initialValue.name || '',
        difficulty: initialValue.difficulty || 'متوسط',
        gridSize: initialValue.gridSize || 12,
        isActive: Boolean(initialValue.isActive),
      });
      setWords(initialValue.words || []);
    } else {
      setFormState({ name: '', difficulty: 'متوسط', gridSize: 12, isActive: true });
      setWords([]);
    }
  }, [initialValue]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({ ...formState, words });
  };

  const handleAddWord = (payload) => {
    if (!payload?.word) {
      return;
    }
    const normalized = payload.word.toUpperCase();
    setWords((prev) => {
      const exists = prev.some((word) => (word.word || '').toUpperCase() === normalized);
      if (editingWord) {
        return prev.map((word) =>
          word === editingWord || (word._id && word._id === editingWord._id)
            ? { ...word, ...payload, word: normalized }
            : word
        );
      }
      if (exists) {
        return prev;
      }
      return [...prev, { ...payload, word: normalized }];
    });
    setWordModalOpen(false);
    setEditingWord(null);
  };

  const removeWord = (target) => {
    setWords((prev) => prev.filter((word) => word._id !== target._id && word.word !== target.word));
  };

  const canActivate = words.length >= 10;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-[32px] border border-slate-700 bg-slate-900/95 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">مجموعه جدید نبرد</p>
            <h3 className="text-2xl font-bold">{initialValue ? 'ویرایش مجموعه' : 'ایجاد مجموعه کلمات'}</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white" type="button">
            ×
          </button>
        </div>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">نام مجموعه</label>
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="کلمات روزمره"
                required
              />
            </div>
            <div>
              <label className="text-sm text-white/70">سطح سختی</label>
              <div className="mt-1 flex items-center gap-2">
                {difficulties.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormState((prev) => ({ ...prev, difficulty: level }))}
                    className={`flex-1 rounded-2xl border px-3 py-2 text-sm ${
                      formState.difficulty === level
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-white/70">تعداد حروف در شبکه</label>
              <input
                type="number"
                min={6}
                max={24}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
                value={formState.gridSize}
                onChange={(e) => setFormState((prev) => ({ ...prev, gridSize: Number(e.target.value) }))}
              />
              <p className="text-xs text-white/50 mt-1">باید بزرگتر از طول طولانی‌ترین کلمه باشد</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="set-active"
                checked={formState.isActive}
                onChange={(e) => setFormState((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
                disabled={!canActivate}
              />
              <label htmlFor="set-active" className="text-sm text-white/70">
                فعال بودن مجموعه (حداقل ۱۰ کلمه)
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">کلمات ({words.length})</h4>
              <button
                type="button"
                onClick={() => {
                  setEditingWord(null);
                  setWordModalOpen(true);
                }}
                className="rounded-2xl bg-primary-500/20 px-4 py-2 text-sm"
              >
                + افزودن کلمه
              </button>
            </div>
            <div className="mt-4 grid gap-3 max-h-64 overflow-auto pr-1">
              {words.length === 0 && (
                <p className="text-sm text-white/60">هنوز کلمه‌ای اضافه نشده است.</p>
              )}
              {words.map((word) => (
                <div
                  key={word._id || word.word}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">{word.word}</p>
                    <p className="text-xs text-white/60">
                      {word.category} • سختی {word.difficulty}
                      {word.definition ? ` • ${word.definition}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-white/60 hover:text-white"
                      onClick={() => {
                        setEditingWord(word);
                        setWordModalOpen(true);
                      }}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      className="text-rose-400 hover:text-rose-200"
                      onClick={() => removeWord(word)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-6 py-2">
              لغو
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-primary-500/80 px-6 py-2 font-bold disabled:opacity-50"
              disabled={!formState.name || words.length === 0}
            >
              ذخیره مجموعه
            </button>
          </div>
        </form>
        <WordForm
          open={wordModalOpen}
          initialValue={editingWord}
          onClose={() => {
            setWordModalOpen(false);
            setEditingWord(null);
          }}
          onSubmit={handleAddWord}
        />
      </div>
    </div>
  );
};

export default WordSetForm;
