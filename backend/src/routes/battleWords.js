const express = require('express');
const { adminAuth } = require('../middleware/auth');
const battleWordsController = require('../controllers/battleWordsController');

const router = express.Router();

router.get('/admin/battle-words', adminAuth, battleWordsController.getAllWordSets);
router.get('/admin/battle-words/:id', adminAuth, battleWordsController.getWordSet);
router.post('/admin/battle-words', adminAuth, battleWordsController.createWordSet);
router.put('/admin/battle-words/:id', adminAuth, battleWordsController.updateWordSet);
router.delete('/admin/battle-words/:id', adminAuth, battleWordsController.deleteWordSet);
router.post('/admin/battle-words/:id/words', adminAuth, battleWordsController.addWordToSet);
router.delete('/admin/battle-words/:id/words/:wordId', adminAuth, battleWordsController.removeWordFromSet);
router.post('/admin/battle-words/import', adminAuth, battleWordsController.bulkImport);

router.get('/battle/random-words', battleWordsController.getRandomBattleWords);

module.exports = router;
