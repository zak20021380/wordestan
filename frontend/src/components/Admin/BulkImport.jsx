import { useState } from 'react';

const parseCsv = (text = '') => {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((row) => row.filter(Boolean).length > 0)
    .map(([word, definition, category, difficulty]) => ({
      word,
      definition,
      category,
      difficulty: Number(difficulty) || 3,
    }));
};

const BulkImport = ({ open, onClose, onImport }) => {
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        setError('فایلی معتبر نیست یا خالی است');
        return;
      }
      setPreview(rows);
      setError(null);
    } catch (err) {
      setError('خواندن فایل ناموفق بود');
    }
  };

  const handleImport = async () => {
    if (!preview.length) {
      setError('ابتدا فایل را بارگذاری کنید');
      return;
    }
    setLoading(true);
    try {
      await onImport?.(preview);
      setPreview([]);
      onClose?.();
    } catch (err) {
      setError(err.message || 'وارد کردن کلمات ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-white">
      <div className="w-full max-w-2xl rounded-[32px] border border-slate-700 bg-slate-900/95 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">ورود گروهی کلمات</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white" type="button">
            ×
          </button>
        </div>
        <p className="mt-2 text-sm text-white/70">فرمت فایل: Word,Meaning,Category,Difficulty</p>
        <div className="mt-4">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="w-full rounded-2xl border border-dashed border-white/20 bg-transparent px-4 py-3"
          />
        </div>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        <div className="mt-4 max-h-60 overflow-auto rounded-2xl border border-white/10 bg-white/5">
          {preview.length === 0 ? (
            <p className="p-4 text-sm text-white/60">ابتدا فایل را انتخاب کنید تا پیش‌نمایش را ببینید.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/60">
                  <th className="px-4 py-2 text-right">کلمه</th>
                  <th className="px-4 py-2 text-right">معنی</th>
                  <th className="px-4 py-2 text-right">دسته</th>
                  <th className="px-4 py-2 text-right">سختی</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={`${row.word}-${index}`} className="odd:bg-white/5">
                    <td className="px-4 py-2 font-semibold">{row.word}</td>
                    <td className="px-4 py-2 text-white/70">{row.definition}</td>
                    <td className="px-4 py-2 text-white/70">{row.category}</td>
                    <td className="px-4 py-2 text-white/70">{row.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-6 py-2">
            لغو
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="rounded-2xl bg-primary-500/80 px-6 py-2 font-bold disabled:opacity-50"
            disabled={loading || preview.length === 0}
          >
            {loading ? 'در حال ارسال...' : 'وارد کردن'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
