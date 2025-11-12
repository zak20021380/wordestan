const LeitnerBox = require('../models/LeitnerBox');
const Word = require('../models/Word');
const User = require('../models/User');

/**
 * Add a word to user's Leitner box
 * POST /api/leitner/add
 */
exports.addWord = async (req, res) => {
  try {
    console.log('🔵 [Leitner Add] Request received');
    console.log('📦 Request body:', JSON.stringify(req.body));
    console.log('👤 User ID:', req.user?.id);

    const { wordId, levelId, notes } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!wordId) {
      console.log('❌ [Leitner Add] Missing wordId');
      return res.status(400).json({
        success: false,
        message: 'شناسه کلمه الزامی است'
      });
    }

    // Validate wordId format (MongoDB ObjectId)
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(wordId)) {
      console.log('❌ [Leitner Add] Invalid wordId format:', wordId);
      return res.status(400).json({
        success: false,
        message: 'شناسه کلمه نامعتبر است'
      });
    }

    console.log('🔍 [Leitner Add] Searching for word:', wordId);

    // Validate word exists
    const word = await Word.findById(wordId);
    if (!word) {
      console.log('❌ [Leitner Add] Word not found:', wordId);
      return res.status(404).json({
        success: false,
        message: 'کلمه مورد نظر یافت نشد'
      });
    }

    console.log('✅ [Leitner Add] Word found:', word.word);

    // Check if word already exists in user's Leitner box
    console.log('🔍 [Leitner Add] Checking for existing card...');
    let leitnerCard = await LeitnerBox.findOne({ userId, wordId });

    if (leitnerCard) {
      console.log('📌 [Leitner Add] Card already exists, isArchived:', leitnerCard.isArchived);

      // If archived, unarchive it
      if (leitnerCard.isArchived) {
        console.log('📤 [Leitner Add] Unarchiving card...');
        await leitnerCard.unarchive();
        leitnerCard.nextReviewDate = leitnerCard.calculateNextReviewDate();
        await leitnerCard.save();

        console.log('✅ [Leitner Add] Card unarchived successfully');
        return res.status(200).json({
          success: true,
          message: 'کلمه از آرشیو خارج شد و به جعبه لایتنر بازگشت',
          data: await leitnerCard.populate('wordId')
        });
      }

      console.log('⚠️ [Leitner Add] Card already exists and is not archived');
      return res.status(400).json({
        success: false,
        message: 'این کلمه قبلاً به جعبه لایتنر اضافه شده است'
      });
    }

    console.log('➕ [Leitner Add] Creating new Leitner card...');

    // Create new Leitner card
    leitnerCard = new LeitnerBox({
      userId,
      wordId,
      levelId: levelId || null,
      notes: notes || '',
      box: 1, // Start in box 1
      nextReviewDate: new Date() // Available for review immediately
    });

    // Calculate next review date
    leitnerCard.nextReviewDate = leitnerCard.calculateNextReviewDate();
    console.log('📅 [Leitner Add] Next review date:', leitnerCard.nextReviewDate);

    await leitnerCard.save();
    console.log('💾 [Leitner Add] Card saved successfully');

    // Populate word details
    await leitnerCard.populate('wordId');

    console.log('✅ [Leitner Add] Word added successfully to Leitner box');
    res.status(201).json({
      success: true,
      message: 'کلمه با موفقیت به جعبه لایتنر اضافه شد',
      data: leitnerCard
    });
  } catch (error) {
    console.error('❌ [Leitner Add] Error:', error);
    console.error('Stack trace:', error.stack);

    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'خطای اعتبارسنجی',
        error: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'شناسه نامعتبر',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطا در افزودن کلمه به جعبه لایتنر',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطای سرور'
    });
  }
};

/**
 * Get all words in user's Leitner box
 * GET /api/leitner/words
 */
exports.getWords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { box, archived, dueOnly } = req.query;

    // Build query
    const query = { userId };

    if (box) {
      query.box = parseInt(box);
    }

    if (archived !== undefined) {
      query.isArchived = archived === 'true';
    } else {
      query.isArchived = false; // Default: only active cards
    }

    let cards = await LeitnerBox.find(query)
      .populate('wordId')
      .populate('levelId', 'order')
      .sort({ nextReviewDate: 1, box: 1 });

    // Filter for due cards only if requested
    if (dueOnly === 'true') {
      cards = cards.filter(card => card.isDueForReview());
    }

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching Leitner words:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کلمات جعبه لایتنر',
      error: error.message
    });
  }
};

/**
 * Get words due for review
 * GET /api/leitner/review
 */
exports.getDueWords = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const cards = await LeitnerBox.getDueForReview(userId, limit);

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching due words:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کلمات آماده برای مرور',
      error: error.message
    });
  }
};

/**
 * Review a word (mark as correct/incorrect/skipped)
 * POST /api/leitner/review/:id
 */
exports.reviewWord = async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = req.body; // 'correct', 'incorrect', 'skipped'
    const userId = req.user.id;

    // Validate result
    if (!['correct', 'incorrect', 'skipped'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'نتیجه مرور معتبر نیست'
      });
    }

    // Find card
    const card = await LeitnerBox.findOne({ _id: id, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت مورد نظر یافت نشد'
      });
    }

    // Process review based on result
    let updatedCard;
    if (result === 'correct') {
      updatedCard = await card.reviewCorrect();
    } else if (result === 'incorrect') {
      updatedCard = await card.reviewIncorrect();
    } else if (result === 'skipped') {
      updatedCard = await card.reviewSkipped();
    }

    // Populate word details
    await updatedCard.populate('wordId');

    res.status(200).json({
      success: true,
      message: 'مرور با موفقیت ثبت شد',
      data: updatedCard
    });
  } catch (error) {
    console.error('Error reviewing word:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت نتیجه مرور',
      error: error.message
    });
  }
};

/**
 * Get statistics for user's Leitner box
 * GET /api/leitner/stats
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await LeitnerBox.getUserStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching Leitner stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار جعبه لایتنر',
      error: error.message
    });
  }
};

/**
 * Get words by box number
 * GET /api/leitner/box/:boxNumber
 */
exports.getWordsByBox = async (req, res) => {
  try {
    const userId = req.user.id;
    const boxNumber = parseInt(req.params.boxNumber);

    if (boxNumber < 1 || boxNumber > 5) {
      return res.status(400).json({
        success: false,
        message: 'شماره جعبه باید بین 1 تا 5 باشد'
      });
    }

    const cards = await LeitnerBox.getWordsByBox(userId, boxNumber);

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards
    });
  } catch (error) {
    console.error('Error fetching words by box:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت کلمات جعبه',
      error: error.message
    });
  }
};

/**
 * Update card notes
 * PUT /api/leitner/:id/notes
 */
exports.updateNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const card = await LeitnerBox.findOne({ _id: id, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت مورد نظر یافت نشد'
      });
    }

    card.notes = notes || '';
    await card.save();

    await card.populate('wordId');

    res.status(200).json({
      success: true,
      message: 'یادداشت با موفقیت به‌روزرسانی شد',
      data: card
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی یادداشت',
      error: error.message
    });
  }
};

/**
 * Archive a card (remove from active learning)
 * POST /api/leitner/:id/archive
 */
exports.archiveCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const card = await LeitnerBox.findOne({ _id: id, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت مورد نظر یافت نشد'
      });
    }

    await card.archive();
    await card.populate('wordId');

    res.status(200).json({
      success: true,
      message: 'کارت با موفقیت آرشیو شد',
      data: card
    });
  } catch (error) {
    console.error('Error archiving card:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در آرشیو کردن کارت',
      error: error.message
    });
  }
};

/**
 * Unarchive a card
 * POST /api/leitner/:id/unarchive
 */
exports.unarchiveCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const card = await LeitnerBox.findOne({ _id: id, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت مورد نظر یافت نشد'
      });
    }

    await card.unarchive();
    card.nextReviewDate = card.calculateNextReviewDate();
    await card.save();
    await card.populate('wordId');

    res.status(200).json({
      success: true,
      message: 'کارت از آرشیو خارج شد',
      data: card
    });
  } catch (error) {
    console.error('Error unarchiving card:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در خروج از آرشیو',
      error: error.message
    });
  }
};

/**
 * Delete a card from Leitner box
 * DELETE /api/leitner/:id
 */
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const card = await LeitnerBox.findOneAndDelete({ _id: id, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت مورد نظر یافت نشد'
      });
    }

    res.status(200).json({
      success: true,
      message: 'کارت با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف کارت',
      error: error.message
    });
  }
};

/**
 * Batch add words to Leitner box
 * POST /api/leitner/batch-add
 */
exports.batchAddWords = async (req, res) => {
  try {
    const { wordIds, levelId } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لیست کلمات معتبر نیست'
      });
    }

    const results = {
      added: [],
      existed: [],
      failed: []
    };

    for (const wordId of wordIds) {
      try {
        // Check if word exists
        const word = await Word.findById(wordId);
        if (!word) {
          results.failed.push({ wordId, reason: 'کلمه یافت نشد' });
          continue;
        }

        // Check if already in Leitner box
        const existing = await LeitnerBox.findOne({ userId, wordId });
        if (existing && !existing.isArchived) {
          results.existed.push(wordId);
          continue;
        }

        if (existing && existing.isArchived) {
          // Unarchive
          await existing.unarchive();
          existing.nextReviewDate = existing.calculateNextReviewDate();
          await existing.save();
          results.added.push(wordId);
          continue;
        }

        // Create new card
        const card = new LeitnerBox({
          userId,
          wordId,
          levelId: levelId || null,
          box: 1
        });
        card.nextReviewDate = card.calculateNextReviewDate();
        await card.save();

        results.added.push(wordId);
      } catch (error) {
        results.failed.push({ wordId, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `${results.added.length} کلمه با موفقیت اضافه شد`,
      data: results
    });
  } catch (error) {
    console.error('Error batch adding words:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در افزودن دسته‌ای کلمات',
      error: error.message
    });
  }
};

/**
 * Reset a card to box 1 (start over)
 * POST /api/leitner/:id/reset
 */
exports.resetCard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const card = await LeitnerBox.findOne({ _id: id, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'کارت مورد نظر یافت نشد'
      });
    }

    // Reset to box 1
    card.box = 1;
    card.correctStreak = 0;
    card.nextReviewDate = card.calculateNextReviewDate();
    await card.save();

    await card.populate('wordId');

    res.status(200).json({
      success: true,
      message: 'کارت به جعبه اول بازگشت',
      data: card
    });
  } catch (error) {
    console.error('Error resetting card:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بازنشانی کارت',
      error: error.message
    });
  }
};
