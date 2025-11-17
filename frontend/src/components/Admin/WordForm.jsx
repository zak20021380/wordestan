import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const ratingScale = [1, 2, 3, 4, 5];

const defaultCategories = ['حیوانات', 'غذا', 'ورزش', 'مکان', 'اشیا', 'آموزشی'];

const WordForm = ({ open, initialValue, onClose, onSubmit, categories = defaultCategories }) => {
  const [formState, setFormState] = useState({
    word: '',
    definition: '',
    category: categories[0],
    difficulty: 3,
  });

  useEffect(() => {
    if (initialValue) {
      setFormState({
        word: initialValue.word || initialValue.text || '',
        definition: initialValue.definition || initialValue.meaning || '',
        category: initialValue.category || categories[0],
        difficulty: initialValue.difficulty || 3,
      });
    } else {
      setFormState({ word: '', definition: '', category: categories[0], difficulty: 3 });
    }
  }, [initialValue, categories]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({ ...formState, word: formState.word.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-700 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">افزودن کلمه</h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">×</button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-white/70">کلمه (انگلیسی)</label>
            <input
              value={formState.word}
              onChange={(e) => setFormState((prev) => ({ ...prev, word: e.target.value.toUpperCase() }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
              placeholder="EXAMPLE"
              required
              maxLength={15}
            />
          </div>
          <div>
            <label className="text-sm text-white/70">معنی (فارسی)</label>
            <input
              value={formState.definition}
              onChange={(e) => setFormState((prev) => ({ ...prev, definition: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
              placeholder="مثال"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">دسته‌بندی</label>
            <select
              value={formState.category}
              onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-white/70">سطح سختی</label>
            <div className="mt-2 flex items-center gap-2">
              {ratingScale.map((rating) => (
                <button
                  type="button"
                  key={rating}
                  onClick={() => setFormState((prev) => ({ ...prev, difficulty: rating }))}
                  className="text-amber-400"
                >
                  <Star
                    className={`w-6 h-6 ${
                      rating <= formState.difficulty ? 'fill-current' : 'fill-transparent opacity-40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/80"
            >
              لغو
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-primary-500/80 px-6 py-2 text-sm font-bold"
            >
              ذخیره کلمه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WordForm;
