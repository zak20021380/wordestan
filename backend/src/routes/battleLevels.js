const express = require('express');
const { adminAuth } = require('../middleware/auth');
const battleLevelsController = require('../controllers/battleLevelsController');

const router = express.Router();

const adminRoutes = [
  { method: 'get', path: '/admin/battle-levels', handler: battleLevelsController.getAllLevels },
  { method: 'get', path: '/admin/battle-levels/:id', handler: battleLevelsController.getLevel },
  { method: 'post', path: '/admin/battle-levels', handler: battleLevelsController.createLevel },
  { method: 'put', path: '/admin/battle-levels/:id', handler: battleLevelsController.updateLevel },
  { method: 'delete', path: '/admin/battle-levels/:id', handler: battleLevelsController.deleteLevel },
  { method: 'post', path: '/admin/battle-levels/:id/words', handler: battleLevelsController.addWordToLevel },
  { method: 'delete', path: '/admin/battle-levels/:id/words/:wordId', handler: battleLevelsController.removeWordFromLevel },
  { method: 'post', path: '/admin/battle-levels/import', handler: battleLevelsController.bulkImport },
];

adminRoutes.forEach(({ method, path, handler }) => {
  router[method](path, adminAuth, handler);
  // Legacy aliases
  const legacyPath = path.replace('battle-levels', 'battle-words');
  router[method](legacyPath, adminAuth, handler);
});

router.get('/battle/random-words', battleLevelsController.getRandomBattleLevel);

module.exports = router;
