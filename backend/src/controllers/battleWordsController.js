const mongoose = require('mongoose');
const BattleWordSet = require('../models/BattleWordSet');

const ENGLISH_WORD_REGEX = /^[A-Z]+$/i;
const MIN_ACTIVE_WORDS = 10;

const normalizeDifficulty = (value) => {
  const normalized = (value || '').trim();
  if (['آسان', 'متوسط', 'سخت'].includes(normalized)) {
    return normalized;
  }

  const map = {
    easy: 'آسان',
    medium: 'متوسط',
    hard: 'سخت',
  };

  return map[normalized.toLowerCase()] || 'متوسط';
};

const normalizeWord = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

const clampDifficulty = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return 3;
  }
  return Math.min(5, Math.max(1, Math.round(numeric)));
};

const toCategory = (value) => {
  if (!value) return 'عمومی';
  return value.toString().trim().slice(0, 64) || 'عمومی';
};

const transformWordPayload = (payload = {}) => {
  const word = normalizeWord(payload.word);
  if (!word || !ENGLISH_WORD_REGEX.test(word)) {
    throw new Error('کلمات باید فقط شامل حروف انگلیسی باشند');
  }
  if (word.length < 3 || word.length > 15) {
    throw new Error('طول کلمه باید بین ۳ تا ۱۵ حرف باشد');
  }

  return {
    word,
    definition: (payload.definition || '').toString().trim().slice(0, 280),
    category: toCategory(payload.category),
    difficulty: clampDifficulty(payload.difficulty),
    letters: word.split(''),
    minLetters: Math.min(Math.max(Number(payload.minLetters) || word.length, 3), word.length),
  };
};

const prepareWordList = (words = []) => {
  if (!Array.isArray(words)) {
    return [];
  }

  const deduped = new Map();
  words.forEach((entry) => {
    if (!entry) return;
    const payload = transformWordPayload(entry);
    if (!deduped.has(payload.word)) {
      deduped.set(payload.word, payload);
    }
  });

  return Array.from(deduped.values());
};

const ensureGridCompatibility = (words, gridSize) => {
  if (!Array.isArray(words) || words.length === 0) {
    return;
  }
  const longest = Math.max(...words.map(word => word.word.length));
  if (longest > gridSize) {
    throw new Error('تعداد حروف شبکه باید از طول بزرگ‌ترین کلمه بیشتر باشد');
  }
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
          { $group: { _id: null, totalSets: { $sum: 1 }, totalWords: { $sum: { $size: '$words' } } } },
        ],
        usage: [
          { $sort: { usageCount: -1 } },
          { $limit: 1 },
          { $project: { _id: 1, name: 1, usageCount: 1 } },
        ],
        categories: [
          { $unwind: '$words' },
          { $group: { _id: '$words.category', count: { $sum: 1 } } },
        ],
        difficulties: [
          { $unwind: '$words' },
          { $group: { _id: '$words.difficulty', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const totals = stats?.totals?.[0] ?? { totalSets: 0, totalWords: 0 };
  return {
    totalSets: totals.totalSets || 0,
    totalWords: totals.totalWords || 0,
    mostUsedSet: stats?.usage?.[0] || null,
    categoryBreakdown: stats?.categories || [],
    difficultyBreakdown: stats?.difficulties || [],
  };
};

exports.getAllWordSets = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);
    const { difficulty, search, status, word } = req.query;

    const filters = {};
    if (difficulty) {
      filters.difficulty = normalizeDifficulty(difficulty);
    }
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
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BattleWordSet.countDocuments(filters),
      buildWordStats(),
    ]);

    res.json({
      success: true,
      data: items,
      meta: buildPaginationMeta(total, page, limit),
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
      difficulty,
      words: rawWords,
      gridSize = 12,
      isActive = true,
    } = req.body || {};

    const words = prepareWordList(rawWords);
    ensureActivationRules(words, isActive);
    ensureGridCompatibility(words, gridSize);

    const created = await BattleWordSet.create({
      name,
      difficulty: normalizeDifficulty(difficulty),
      words,
      gridSize,
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
    if (payload.difficulty) set.difficulty = normalizeDifficulty(payload.difficulty);
    if (payload.gridSize) set.gridSize = Number(payload.gridSize);
    if (typeof payload.isActive === 'boolean') set.isActive = payload.isActive;

    if (Array.isArray(payload.words)) {
      const words = prepareWordList(payload.words);
      set.words = words;
    }

    ensureActivationRules(set.words, set.isActive);
    ensureGridCompatibility(set.words, set.gridSize);

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
    const wordPayload = transformWordPayload(req.body || {});
    if (set.words.some(item => item.word === wordPayload.word)) {
      return res.status(400).json({ success: false, message: 'این کلمه قبلاً به مجموعه اضافه شده است' });
    }
    set.words.push(wordPayload);
    ensureActivationRules(set.words, set.isActive);
    ensureGridCompatibility(set.words, set.gridSize);
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
    set.words = set.words.filter(word => word._id.toString() !== wordId);
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
    const words = prepareWordList(rawWords);
    const existingWords = new Set(set.words.map(word => word.word));
    const filtered = words.filter(word => !existingWords.has(word.word));
    if (!filtered.length) {
      return res.status(400).json({ success: false, message: 'همه کلمات وارد شده تکراری هستند' });
    }
    set.words.push(...filtered);
    ensureActivationRules(set.words, set.isActive);
    ensureGridCompatibility(set.words, set.gridSize);
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
