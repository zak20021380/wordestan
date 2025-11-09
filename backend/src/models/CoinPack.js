const mongoose = require('mongoose');

const coinPackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  coins: {
    type: Number,
    required: true,
    min: 10,
    max: 10000
  },
  price: {
    type: Number,
    required: true,
    min: 0.99,
    max: 99.99
  },
  currency: {
    type: String,
    default: 'USD'
  },
  bonusCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCoins: {
    type: Number,
    required: true,
    default: function() {
      const coins = Number(this.coins) || 0;
      const bonusCoins = Number(this.bonusCoins) || 0;
      return coins + bonusCoins;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  popular: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    trim: true
  },
  timesPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  revenueGenerated: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total coins
coinPackSchema.pre('save', function(next) {
  const coins = Number(this.coins) || 0;
  const bonusCoins = Number(this.bonusCoins) || 0;
  this.totalCoins = coins + bonusCoins;
  next();
});

// Index for efficient querying
coinPackSchema.index({ isActive: 1, order: 1 });
coinPackSchema.index({ featured: 1 });
coinPackSchema.index({ popular: 1 });

module.exports = mongoose.model('CoinPack', coinPackSchema);