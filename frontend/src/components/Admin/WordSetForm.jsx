import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const MIN_LETTERS = 8;
const MAX_LETTERS = 20;
const MIN_WORDS = 10;

const toBulkText = (words = []) =>
  (Array.isArray(words)
    ? words
        .map((word) => {
          const text = word.word || word.text || '';
          const meaning = word.meaning || word.definition || '';
          return text ? `${text}${meaning ? ` : ${meaning}` : ''}` : null;
        })
        .filter(Boolean)
        .join('\n')
    : '');

const parseLetters = (value) => {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .toUpperCase()
        .replace(/[^A-Z,\s]/g, ' ')
        .split(/[\s,]+/)
        .map((letter) => letter.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_LETTERS);
};

const parseWordLines = (text = '', letters = []) => {
  const letterSet = new Set(letters);
  const rows = [];
  const warnings = [];
  const errors = [];
  const seen = new Set();
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    const [wordPart, ...meaningParts] = trimmed.split(/[:,\t]/);
    const normalizedWord = wordPart ? wordPart.replace(/[^A-Za-z]/g, '').toUpperCase() : '';
    if (!normalizedWord) {
      errors.push({ line: lineNumber, message: 'کلمه نامعتبر است' });
      return;
    }
    if (normalizedWord.length < 3 || normalizedWord.length > 15) {
      errors.push({ line: lineNumber, word: normalizedWord, message: 'طول کلمه باید بین ۳ تا ۱۵ باشد' });
      return;
    }
    if (letters.length) {
      const invalidLetter = normalizedWord.split('').find((letter) => !letterSet.has(letter));
      if (invalidLetter) {
        errors.push({ line: lineNumber, word: normalizedWord, message: `حرف ${invalidLetter} در شبکه نیست` });
        return;
      }
    }
    if (seen.has(normalizedWord)) {
      errors.push({ line: lineNumber, word: normalizedWord, message: 'این کلمه تکراری است' });
      return;
    }
    seen.add(normalizedWord);
    const meaning = meaningParts.join(' ').trim();
    rows.push({ word: normalizedWord, meaning });
    if (!meaning) {
      warnings.push({ line: lineNumber, word: normalizedWord, message: 'معنی وارد نشده است' });
    }
  });

  return {
    words: rows,
    warnings,
    errors,
    counts: {
      valid: Math.max(rows.length - warnings.length, 0),
      warning: warnings.length,
      error: errors.length,
    },
  };
};

const PreviewModal = ({ open, rows = [], warnings = [], errors = [], onClose }) => {
  if (!open) return null;

  const warningLookup = new Set(warnings.map((item) => item.word));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 text-white">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/95 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold">پیش‌نمایش {rows.length} کلمه</h3>
          <button type="button" onClick={onClose} className="text-2xl text-white/60 hover:text-white">
            ×
          </button>
        </div>
        <div className="mt-3 max-h-[50vh] overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-2 sm:px-3 py-1.5 text-right">#</th>
                <th className="px-2 sm:px-3 py-1.5 text-right">کلمه</th>
                <th className="px-2 sm:px-3 py-1.5 text-right hidden sm:table-cell">معنی</th>
                <th className="px-2 sm:px-3 py-1.5 text-right">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.word}-${index}`} className="odd:bg-white/5">
                  <td className="px-2 sm:px-3 py-1.5">{index + 1}</td>
                  <td className="px-2 sm:px-3 py-1.5 font-semibold">{row.word}</td>
                  <td className="px-2 sm:px-3 py-1.5 text-white/80 hidden sm:table-cell">{row.meaning || '—'}</td>
                  <td className="px-2 sm:px-3 py-1.5">
                    {warningLookup.has(row.word) ? (
                      <span className="text-amber-400 text-xs">⚠️</span>
                    ) : (
                      <span className="text-emerald-400 text-xs">✅</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors.length > 0 && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-200">
            <p className="font-bold mb-1">{errors.length} خطا</p>
            <ul className="space-y-0.5 max-h-24 overflow-auto">
              {errors.slice(0, 3).map((error) => (
                <li key={`${error.line}-${error.word || error.message}`}>
                  خط {error.line}: {error.word ? `${error.word} - ` : ''}
                  {error.message}
                </li>
              ))}
              {errors.length > 3 && <li>و {errors.length - 3} خطای دیگر...</li>}
            </ul>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary-500/80 px-4 sm:px-5 py-1.5 sm:py-2 text-sm font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

const WordSetForm = ({ open, initialValue, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [lettersInput, setLettersInput] = useState('');
  const [wordsInput, setWordsInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialValue) {
      setName(initialValue.name || '');
      setLettersInput(Array.isArray(initialValue.letters) ? initialValue.letters.join(',') : initialValue.letters || '');
      setWordsInput(toBulkText(initialValue.words || []));
      setIsActive(Boolean(initialValue.isActive));
    } else {
      setName('');
      setLettersInput('');
      setWordsInput('');
      setIsActive(true);
    }
  }, [initialValue]);

  const letters = useMemo(() => parseLetters(lettersInput), [lettersInput]);
  const parsed = useMemo(() => parseWordLines(wordsInput, letters), [wordsInput, letters]);
  const canActivate = parsed.words.length >= MIN_WORDS;
  const canSave =
    name.trim().length >= 3 &&
    letters.length >= MIN_LETTERS &&
    parsed.words.length >= MIN_WORDS &&
    parsed.counts.error === 0;

  useEffect(() => {
    if (!canActivate && isActive) {
      setIsActive(false);
    }
  }, [canActivate, isActive]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onSubmit?.({
      name: name.trim(),
      letters,
      words: parsed.words.map(({ word, meaning }) => ({ word, meaning })),
      isActive,
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setWordsInput((prev) => (prev ? `${prev.trim()}\n${text.trim()}` : text.trim()));
    } catch (error) {
      console.error('bulk upload failed', error);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl sm:rounded-[32px] border border-white/10 bg-slate-900/95 p-4 sm:p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-white/60">مجموعه اختصاصی نبرد</p>
            <h3 className="text-lg sm:text-xl font-bold">
              {initialValue ? 'ویرایش مجموعه' : 'ایجاد مجموعه کلمات'}
            </h3>
          </div>
          <button onClick={onClose} className="text-2xl text-white/60 hover:text-white" type="button">
            ×
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs sm:text-sm text-white/70">نام مجموعه</label>
              <input
                className="mt-1 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="کلمات ویژه"
                required
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm text-white/70">فعال بودن مجموعه</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-transparent"
                  checked={isActive}
                  disabled={!canActivate}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-xs sm:text-sm text-white/80">
                  {canActivate ? 'فعال شود' : `نیاز به حداقل ${MIN_WORDS} کلمه`}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="text-xs sm:text-sm text-white/70 flex items-center justify-between">
              <span>حروف شبکه</span>
              <span className="text-xs text-white/50">
                {letters.length}/{MIN_LETTERS} (حداکثر {MAX_LETTERS})
              </span>
            </label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={lettersInput}
              onChange={(e) => setLettersInput(e.target.value)}
              placeholder="A,B,C,D,E,F,G,H,I,J,K,L"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {letters.length === 0 ? (
                <span className="text-xs text-white/60">حروف را با ویرگول یا فاصله جدا کنید.</span>
              ) : (
                letters.map((letter) => (
                  <span key={letter} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold">
                    {letter}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm text-white/70">افزودن کلمات</label>
              <span className="text-xs text-white/50">{parsed.words.length} کلمه</span>
            </div>
            <textarea
              value={wordsInput}
              onChange={(e) => setWordsInput(e.target.value)}
              placeholder={'EXAMPLE : مثال\nHOUSE,خانه\nAPPLE\tسیب'}
              className="mt-2 h-32 sm:h-36 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
            />
            <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="text-xs text-white/60">
                <p>فرمت: WORD : معنی | WORD,معنی</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/80"
                >
                  <Upload className="w-3.5 h-3.5" /> آپلود
                </button>
              </div>
            </div>
            {parsed.errors.length > 0 && (
              <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-200">
                <p className="font-bold">{parsed.errors.length} خطا</p>
                <ul className="mt-1 space-y-0.5">
                  {parsed.errors.slice(0, 2).map((error) => (
                    <li key={`${error.line}-${error.word || error.message}`}>
                      خط {error.line}: {error.word ? `${error.word} - ` : ''}
                      {error.message}
                    </li>
                  ))}
                  {parsed.errors.length > 2 && <li>و {parsed.errors.length - 2} خطای دیگر...</li>}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-emerald-300 text-xs">
                ✅ {parsed.counts.valid}
              </span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-amber-300 text-xs">
                ⚠️ {parsed.counts.warning}
              </span>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-rose-300 text-xs">
                ❌ {parsed.counts.error}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-xl border border-white/20 px-3 py-1.5 text-xs sm:text-sm text-white/80"
              >
                پیش‌نمایش
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-500/80 px-4 py-1.5 text-sm font-bold disabled:opacity-40"
                disabled={!canSave}
              >
                ذخیره
              </button>
            </div>
          </div>
        </form>
        <PreviewModal
          open={previewOpen}
          rows={parsed.words}
          warnings={parsed.warnings}
          errors={parsed.errors}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    </div>
  );
};

export default WordSetForm;
