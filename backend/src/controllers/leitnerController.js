const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const LeitnerCard = require('../models/LeitnerCard');

const STAGE_INTERVALS_IN_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

const FAILURE_INTERVAL_IN_HOURS = 12;

const normalizeWord = (word) => {
  if (!word) {
    return '';
  }

  return String(word).trim().toUpperCase();
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const addHours = (date, hours) => {
  const result = new Date(date);
  result.setUTCHours(result.getUTCHours() + hours);
  return result;
};

const resolveNextReviewDate = (stage, wasSuccessful) => {
  const now = new Date();

  if (!wasSuccessful) {
    return addHours(now, FAILURE_INTERVAL_IN_HOURS);
  }

  const intervalInDays = STAGE_INTERVALS_IN_DAYS[stage] ?? STAGE_INTERVALS_IN_DAYS[1];
  return addDays(now, intervalInDays);
};

const parseObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

// @desc    Fetch Leitner cards for the authenticated user
// @route   GET /api/leitner/cards
// @access  Private
const getCards = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'داده‌های ارسالی نامعتبر هستند',
        errors: errors.array(),
      });
    }

    const cards = await LeitnerCard.find({ user: req.user._id })
      .sort({ nextReviewAt: 1, updatedAt: -1 })
      .lean();

    const now = new Date();
    const today = now.toDateString();

    const stageCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let dueCount = 0;
    let masteredCount = 0;
    let reviewedToday = 0;
    let newToday = 0;
    let lastReviewAt = null;

    cards.forEach((card) => {
      const stage = Math.min(Math.max(card.stage || 1, 1), LeitnerCard.MAX_STAGE || 5);
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;

      if (!card.nextReviewAt || new Date(card.nextReviewAt) <= now) {
        dueCount += 1;
      }

      if (stage >= (LeitnerCard.MAX_STAGE || 5)) {
        masteredCount += 1;
      }

      if (card.createdAt && new Date(card.createdAt).toDateString() === today) {
        newToday += 1;
      }

      if (card.lastReviewedAt) {
        const lastReviewDate = new Date(card.lastReviewedAt);
        if (lastReviewDate.toDateString() === today) {
          reviewedToday += 1;
        }
        if (!lastReviewAt || lastReviewDate > lastReviewAt) {
          lastReviewAt = lastReviewDate;
        }
      }
    });

    const total = cards.length;
    const upcomingCount = total - dueCount;
    const readyPercentage = total > 0 ? Math.round((dueCount / total) * 100) : 0;

    return res.json({
      success: true,
      data: {
        cards,
        summary: {
          total,
          dueCount,
          upcomingCount,
          masteredCount,
          reviewedToday,
          newToday,
          lastReviewAt,
          readyPercentage,
          stageCounts,
        },
      },
    });
  } catch (error) {
    console.error('Failed to load Leitner cards:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در دریافت جعبه لایتنر',
    });
  }
};

// @desc    Add a new word to the Leitner box
// @route   POST /api/leitner/cards
// @access  Private
const addCard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'داده‌های ارسالی نامعتبر هستند',
        errors: errors.array(),
      });
    }

    const {
      word,
      meaning = null,
      sourceWordId = null,
      sourceLevelId = null,
      notes = null,
    } = req.body ?? {};

    const normalizedWord = normalizeWord(word);

    if (!normalizedWord || normalizedWord.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'کلمه نامعتبر است',
      });
    }

    const existing = await LeitnerCard.findOne({
      user: req.user._id,
      word: normalizedWord,
    });

    if (existing) {
      existing.meaning = meaning ?? existing.meaning;
      existing.sourceWord = parseObjectId(sourceWordId) ?? existing.sourceWord;
      existing.sourceLevel = parseObjectId(sourceLevelId) ?? existing.sourceLevel;
      existing.notes = notes ?? existing.notes;

      if (!existing.nextReviewAt || existing.nextReviewAt > addHours(new Date(), FAILURE_INTERVAL_IN_HOURS)) {
        existing.nextReviewAt = new Date();
      }

      await existing.save();

      return res.json({
        success: true,
        message: 'این کلمه قبلاً در لایتنر ذخیره شده بود — اطلاعاتش به‌روز شد.',
        data: existing,
      });
    }

    const card = await LeitnerCard.create({
      user: req.user._id,
      word: normalizedWord,
      meaning: meaning || null,
      sourceWord: parseObjectId(sourceWordId),
      sourceLevel: parseObjectId(sourceLevelId),
      notes: notes || null,
      stage: 1,
      nextReviewAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'کلمه با موفقیت به جعبه لایتنر اضافه شد',
      data: card,
    });
  } catch (error) {
    console.error('Failed to add Leitner card:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ذخیره‌سازی کلمه در لایتنر',
    });
  }
};

// @desc    Review a Leitner card and schedule next repetition
// @route   POST /api/leitner/cards/:cardId/review
// @access  Private
const reviewCard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'داده‌های ارسالی نامعتبر هستند',
        errors: errors.array(),
      });
    }

    const { cardId } = req.params;
    const { result } = req.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({
        success: false,
        message: 'شناسه کارت نامعتبر است',
      });
    }

    if (!['success', 'fail'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'نتیجه مرور نامعتبر است',
      });
    }

    const card = await LeitnerCard.findOne({
      _id: cardId,
      user: req.user._id,
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت یافت نشد',
      });
    }

    const now = new Date();
    const wasSuccessful = result === 'success';

    card.stats.repetitions = (card.stats.repetitions || 0) + 1;

    if (wasSuccessful) {
      card.stats.successfulReviews = (card.stats.successfulReviews || 0) + 1;
      const nextStage = Math.min(card.stage + 1, LeitnerCard.MAX_STAGE || 5);
      card.stage = nextStage;
    } else {
      card.stats.failedReviews = (card.stats.failedReviews || 0) + 1;
      card.stage = 1;
    }

    card.nextReviewAt = resolveNextReviewDate(card.stage, wasSuccessful);
    card.lastReviewedAt = now;
    card.lastResult = result;

    await card.save();

    return res.json({
      success: true,
      message: wasSuccessful
        ? 'عالی! زمان مرور بعدی تنظیم شد.'
        : 'عیبی نداره، این کلمه رو زودتر دوباره مرور می‌کنی.',
      data: card,
    });
  } catch (error) {
    console.error('Failed to review Leitner card:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ثبت نتیجه مرور',
    });
  }
};

module.exports = {
  getCards,
  addCard,
  reviewCard,
};
