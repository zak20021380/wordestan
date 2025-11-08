const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoinPack',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'mock'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  receipt: {
    type: String
  },
  failureReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
purchaseSchema.index({ userId: 1, createdAt: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);