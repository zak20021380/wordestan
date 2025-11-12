const express = require('express');
const router = express.Router();
const leitnerController = require('../controllers/leitnerController');
const { auth } = require('../middleware/auth');

// All Leitner routes require authentication
router.use(auth);

/**
 * @route   POST /api/leitner/add
 * @desc    Add a word to Leitner box
 * @access  Private
 */
router.post('/add', leitnerController.addWord);

/**
 * @route   POST /api/leitner/batch-add
 * @desc    Batch add words to Leitner box
 * @access  Private
 */
router.post('/batch-add', leitnerController.batchAddWords);

/**
 * @route   GET /api/leitner/words
 * @desc    Get all words in Leitner box
 * @query   box - Filter by box number (1-5)
 * @query   archived - Show archived cards (true/false)
 * @query   dueOnly - Show only due cards (true/false)
 * @access  Private
 */
router.get('/words', leitnerController.getWords);

/**
 * @route   GET /api/leitner/review
 * @desc    Get words due for review
 * @query   limit - Max number of words to return (default: 20)
 * @access  Private
 */
router.get('/review', leitnerController.getDueWords);

/**
 * @route   POST /api/leitner/review/:id
 * @desc    Review a word (mark as correct/incorrect/skipped)
 * @body    result - 'correct', 'incorrect', or 'skipped'
 * @access  Private
 */
router.post('/review/:id', leitnerController.reviewWord);

/**
 * @route   GET /api/leitner/stats
 * @desc    Get statistics for user's Leitner box
 * @access  Private
 */
router.get('/stats', leitnerController.getStats);

/**
 * @route   GET /api/leitner/box/:boxNumber
 * @desc    Get words by box number (1-5)
 * @access  Private
 */
router.get('/box/:boxNumber', leitnerController.getWordsByBox);

/**
 * @route   PUT /api/leitner/:id/notes
 * @desc    Update card notes
 * @body    notes - Note text
 * @access  Private
 */
router.put('/:id/notes', leitnerController.updateNotes);

/**
 * @route   POST /api/leitner/:id/archive
 * @desc    Archive a card (remove from active learning)
 * @access  Private
 */
router.post('/:id/archive', leitnerController.archiveCard);

/**
 * @route   POST /api/leitner/:id/unarchive
 * @desc    Unarchive a card
 * @access  Private
 */
router.post('/:id/unarchive', leitnerController.unarchiveCard);

/**
 * @route   POST /api/leitner/:id/reset
 * @desc    Reset a card to box 1 (start over)
 * @access  Private
 */
router.post('/:id/reset', leitnerController.resetCard);

/**
 * @route   DELETE /api/leitner/:id
 * @desc    Delete a card from Leitner box
 * @access  Private
 */
router.delete('/:id', leitnerController.deleteCard);

module.exports = router;
