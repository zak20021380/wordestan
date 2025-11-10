const mongoose = require('mongoose');

const rewardField = {
  type: Number,
  min: 0,
  default: 0,
};

const gameSettingSchema = new mongoose.Schema({
  skipLevelCoinsReward: rewardField,
  skipLevelPointsReward: rewardField,
  wordFoundCoinsReward: rewardField,
  wordFoundPointsReward: rewardField,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameSetting', gameSettingSchema);
