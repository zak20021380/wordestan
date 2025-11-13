const mongoose = require('mongoose');

const botUserSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update last interaction
botUserSchema.methods.updateLastInteraction = function() {
  this.lastInteraction = new Date();
  return this.save();
};

module.exports = mongoose.model('BotUser', botUserSchema);
