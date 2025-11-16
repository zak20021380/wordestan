const jwt = require('jsonwebtoken');
const Battle = require('../models/Battle');
const User = require('../models/User');

exports.battleAuth = async (req, res, next) => {
  try {
    const battleId = req.params.battleId || req.body.battleId;
    if (!battleId) {
      return res.status(400).json({ success: false, message: 'شناسه نبرد الزامی است' });
    }

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, message: 'نبرد یافت نشد' });
    }

    const participates = battle.players.some(player =>
      player.userId.toString() === req.user._id.toString()
    );
    if (!participates) {
      return res.status(403).json({ success: false, message: 'دسترسی به نبرد ندارید' });
    }

    req.battle = battle;
    next();
  } catch (error) {
    console.error('battleAuth error', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی دسترسی نبرد' });
  }
};

exports.authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('احراز هویت انجام نشد'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('کاربر یافت نشد'));
    }

    socket.data.user = user;
    return next();
  } catch (error) {
    console.error('Socket auth error', error);
    next(new Error('احراز هویت سوکت نامعتبر است'));
  }
};
