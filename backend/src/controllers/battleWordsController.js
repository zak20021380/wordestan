const mongoose = require('mongoose');
const BattleWordSet = require('../models/BattleWordSet');

const ENGLISH_WORD_REGEX = /^[A-Z]{3,15}$/;
const LETTER_REGEX = /^[A-Z]$/;
const MIN_ACTIVE_WORDS = 10;
const MIN_LETTER_POOL = 8;
const MAX_LETTER_POOL = 20;

const normalizeWord = (value) => {
  if (!value) return '';
  return value.toString().replace(/[^A-Za-z]/g, '').toUpperCase();
};

const normalizeMeaning = (value) => (value ? value.toString().trim().slice(0, 280) : '');

const parseLetterPool = (input) => {
  if (!input) return [];
  let source = input;
  if (typeof input === 'string') {
    source = input
      .split(/[\[\],\s]+/)
      .filter(Boolean);
  }
  if (!Array.isArray(source)) {
    return [];
  }

  const letters = [];
  source.forEach((item) => {
    const letter = (item || '').toString().toUpperCase().trim();
    if (LETTER_REGEX.test(letter) && !letters.includes(letter)) {
      letters.push(letter);
    }
  });
  return letters;
};

const ensureLetterPoolRules = (letters = []) => {
  if (!Array.isArray(letters) || letters.length < MIN_LETTER_POOL || letters.length > MAX_LETTER_POOL) {
    throw new Error(`تعداد حروف شبکه باید بین ${MIN_LETTER_POOL} تا ${MAX_LETTER_POOL} باشد`);
  }
  const invalid = letters.find((letter) => !LETTER_REGEX.test(letter));
  if (invalid) {
    throw new Error(`حرف ${invalid} معتبر نیست`);
  }
};

const transformWordPayload = (payload = {}, letterPool = new Set()) => {
  const word = normalizeWord(payload.word);
  if (!word || !ENGLISH_WORD_REGEX.test(word)) {
    throw new Error('کلمات باید شامل حروف انگلیسی و طول ۳ تا ۱۵ حرف باشند');
  }

  if (letterPool.size > 0) {
    const invalidLetter = word.split('').find((letter) => !letterPool.has(letter));
    if (invalidLetter) {
      throw new Error(`حرف ${invalidLetter} خارج از حروف انتخابی است`);
    }
  }

  return {
    word,
    meaning: normalizeMeaning(payload.meaning || payload.definition),
  };
};

const normalizeWordSource = (words = []) => {
  if (Array.isArray(words)) {
    return words;
  }
  if (typeof words === 'string') {
    return words
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const [first, ...rest] = trimmed.split(/[:,\t]/);
        if (!first) return null;
        return {
          word: first,
          meaning: rest.join(' ').trim(),
        };
      })
      .filter(Boolean);
  }
  return [];
};

const prepareWordList = (words = [], letterPool = new Set()) => {
  const entries = normalizeWordSource(words);
  if (!entries.length) {
    return [];
  }

  const deduped = new Map();
  entries.forEach((entry) => {
    if (!entry) return;
    const payload = transformWordPayload(entry, letterPool);
    if (!deduped.has(payload.word)) {
      deduped.set(payload.word, payload);
    }
  });

  return Array.from(deduped.values());
};

const ensureActivationRules = (words, isActive) => {
  if (isActive && words.length < MIN_ACTIVE_WORDS) {
    throw new Error(`برای فعال شدن مجموعه حداقل ${MIN_ACTIVE_WORDS} کلمه لازم است`);
  }
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit) || 1,
});

const buildWordStats = async () => {
  const [stats] = await BattleWordSet.aggregate([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalSets: { $sum: 1 },
              totalWords: { $sum: { $size: '$words' } },
              activeSets: { $sum: { $cond: ['$isActive', 1, 0] } },
            },
          },
        ],
        usage: [
          { $sort: { usageCount: -1 } },
          { $limit: 1 },
          { $project: { _id: 1, name: 1, usageCount: 1 } },
        ],
      },
    },
  ]);

  const totals = stats?.totals?.[0] ?? { totalSets: 0, totalWords: 0, activeSets: 0 };
  return {
    totalSets: totals.totalSets || 0,
    totalWords: totals.totalWords || 0,
    activeSets: totals.activeSets || 0,
    mostUsedSet: stats?.usage?.[0] || null,
  };
};

exports.getAllWordSets = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', status = '', word = '' } = req.query;
    const numericPage = Math.max(1, Number(page));
    const numericLimit = Math.min(24, Math.max(1, Number(limit)));
    const filters = {};

    if (status === 'active') filters.isActive = true;
    if (status === 'inactive') filters.isActive = false;
    if (search) {
      filters.name = { $regex: search.trim(), $options: 'i' };
    }
    if (word) {
      filters['words.word'] = { $regex: normalizeWord(word), $options: 'i' };
    }

    const [items, total, stats] = await Promise.all([
      BattleWordSet.find(filters)
        .sort({ updatedAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      BattleWordSet.countDocuments(filters),
      buildWordStats(),
    ]);

    res.json({
      success: true,
      data: items,
      meta: buildPaginationMeta(total, numericPage, numericLimit),
      stats,
    });
  } catch (error) {
    console.error('getAllWordSets error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مجموعه‌ها' });
  }
};

exports.getWordSet = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'شناسه نامعتبر است' });
    }
    const set = await BattleWordSet.findById(req.params.id).lean();
    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه یافت نشد' });
    }
    res.json({ success: true, data: set });
  } catch (error) {
    console.error('getWordSet error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مجموعه' });
  }
};

exports.createWordSet = async (req, res) => {
  try {
    const {
      name,
      letters: rawLetters,
      words: rawWords,
      isActive = true,
    } = req.body || {};

    const letters = parseLetterPool(rawLetters);
    ensureLetterPoolRules(letters);
    const words = prepareWordList(rawWords, new Set(letters));
    if (!words.length) {
      throw new Error('حداقل یک کلمه برای ایجاد مجموعه لازم است');
    }
    ensureActivationRules(words, isActive);

    const created = await BattleWordSet.create({
      name,
      letters,
      words,
      isActive,
      createdBy: req.user?._id || null,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('createWordSet error:', error);
    const message = error.message?.includes('duplicate key')
      ? 'نام مجموعه تکراری است'
      : error.message || 'خطا در ایجاد مجموعه';
    res.status(400).json({ success: false, message });
  }
};

exports.updateWordSet = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'شناسه نامعتبر است' });
    }

    const set = await BattleWordSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه یافت نشد' });
    }

    const payload = { ...req.body };
    if (payload.name) set.name = payload.name;
    if (payload.letters) {
      const letters = parseLetterPool(payload.letters);
      ensureLetterPoolRules(letters);
      set.letters = letters;
    }
    if (typeof payload.isActive === 'boolean') set.isActive = payload.isActive;

    if (payload.words) {
      const words = prepareWordList(payload.words, new Set(set.letters));
      set.words = words;
    }

    ensureActivationRules(set.words, set.isActive);
    await set.save();
    res.json({ success: true, data: set });
  } catch (error) {
    console.error('updateWordSet error:', error);
    res.status(400).json({ success: false, message: error.message || 'خطا در بروزرسانی مجموعه' });
  }
};

exports.deleteWordSet = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'شناسه نامعتبر است' });
    }
    const set = await BattleWordSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه یافت نشد' });
    }
    if (set.usageCount > 0) {
      return res.status(400).json({ success: false, message: 'این مجموعه در نبردها استفاده شده و قابل حذف نیست' });
    }
    await set.deleteOne();
    res.json({ success: true, message: 'مجموعه حذف شد' });
  } catch (error) {
    console.error('deleteWordSet error:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف مجموعه' });
  }
};

exports.addWordToSet = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'شناسه نامعتبر است' });
    }
    const set = await BattleWordSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه یافت نشد' });
    }
    const wordPayload = transformWordPayload(req.body || {}, new Set(set.letters));
    if (set.words.some((item) => item.word === wordPayload.word)) {
      return res.status(400).json({ success: false, message: 'این کلمه قبلاً به مجموعه اضافه شده است' });
    }
    set.words.push(wordPayload);
    ensureActivationRules(set.words, set.isActive);
    await set.save();
    res.status(201).json({ success: true, data: set });
  } catch (error) {
    console.error('addWordToSet error:', error);
    res.status(400).json({ success: false, message: error.message || 'افزودن کلمه ناموفق بود' });
  }
};

exports.removeWordFromSet = async (req, res) => {
  try {
    const { id, wordId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(wordId)) {
      return res.status(400).json({ success: false, message: 'شناسه نامعتبر است' });
    }
    const set = await BattleWordSet.findById(id);
    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه یافت نشد' });
    }
    const initialLength = set.words.length;
    set.words = set.words.filter((word) => word._id.toString() !== wordId);
    if (initialLength === set.words.length) {
      return res.status(404).json({ success: false, message: 'کلمه یافت نشد' });
    }
    ensureActivationRules(set.words, set.isActive);
    await set.save();
    res.json({ success: true, data: set });
  } catch (error) {
    console.error('removeWordFromSet error:', error);
    res.status(400).json({ success: false, message: error.message || 'حذف کلمه ناموفق بود' });
  }
};

exports.bulkImport = async (req, res) => {
  try {
    const { setId, words: rawWords } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(setId)) {
      return res.status(400).json({ success: false, message: 'شناسه مجموعه نامعتبر است' });
    }
    const set = await BattleWordSet.findById(setId);
    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه یافت نشد' });
    }
    const words = prepareWordList(rawWords, new Set(set.letters));
    const existingWords = new Set(set.words.map((word) => word.word));
    const filtered = words.filter((word) => !existingWords.has(word.word));
    if (!filtered.length) {
      return res.status(400).json({ success: false, message: 'همه کلمات وارد شده تکراری هستند' });
    }
    set.words.push(...filtered);
    ensureActivationRules(set.words, set.isActive);
    await set.save();
    res.json({ success: true, data: set, imported: filtered.length });
  } catch (error) {
    console.error('bulkImport error:', error);
    res.status(400).json({ success: false, message: error.message || 'وارد کردن کلمات ناموفق بود' });
  }
};

exports.getRandomBattleWords = async (req, res) => {
  try {
    const [set] = await BattleWordSet.aggregate([
      { $match: { isActive: true, 'words.9': { $exists: true } } },
      { $sample: { size: 1 } },
    ]);

    if (!set) {
      return res.status(404).json({ success: false, message: 'مجموعه فعال برای نبرد وجود ندارد' });
    }

    res.json({ success: true, data: set });
  } catch (error) {
    console.error('getRandomBattleWords error:', error);
    res.status(500).json({ success: false, message: 'خطا در انتخاب مجموعه' });
  }
};
