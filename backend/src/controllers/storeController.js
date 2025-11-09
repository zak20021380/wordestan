const CoinPack = require('../models/CoinPack');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @desc    Get all active coin packs
// @route   GET /api/store/packs
// @access  Public
const getCoinPacks = async (req, res) => {
  try {
    const coinPacks = await CoinPack.find({ isActive: true })
      .sort({ order: 1, price: 1 });

    res.json({
      success: true,
      data: coinPacks
    });
  } catch (error) {
    console.error('Get coin packs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin packs'
    });
  }
};

// @desc    Mock purchase coin pack
// @route   POST /api/store/purchase
// @access  Private
const mockPurchase = async (req, res) => {
  try {
    const { packId, paymentMethod = 'mock' } = req.body;
    const user = req.user;

    // Validate input
    if (!packId) {
      return res.status(400).json({
        success: false,
        message: 'Pack ID is required'
      });
    }

    // Find the coin pack
    const coinPack = await CoinPack.findById(packId);
    if (!coinPack || !coinPack.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Coin pack not found or inactive'
      });
    }

    // Generate mock transaction ID
    const transactionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create purchase record
    const purchase = new Purchase({
      userId: user._id,
      packId: coinPack._id,
      amount: coinPack.totalCoins,
      price: coinPack.price,
      currency: coinPack.currency,
      status: 'completed',
      paymentMethod,
      transactionId
    });

    await purchase.save();

    // Award coins to user
    await user.addCoins(coinPack.totalCoins);

    // Update coin pack stats
    coinPack.timesPurchased += 1;
    coinPack.revenueGenerated += coinPack.price;
    await coinPack.save();

    res.json({
      success: true,
      message: 'Purchase completed successfully',
      data: {
        purchase: {
          id: purchase._id,
          transactionId: purchase.transactionId,
          amount: purchase.amount,
          price: purchase.price,
          currency: purchase.currency,
          status: purchase.status,
          createdAt: purchase.createdAt
        },
        coinsAwarded: coinPack.totalCoins,
        newBalance: user.coins,
        pack: {
          name: coinPack.name,
          coins: coinPack.coins,
          bonusCoins: coinPack.bonusCoins
        }
      }
    });
  } catch (error) {
    console.error('Mock purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing purchase'
    });
  }
};

// @desc    Get user's purchase history
// @route   GET /api/store/purchases
// @access  Private
const getPurchaseHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const purchases = await Purchase.find({ userId: req.user._id })
      .populate('packId', 'name coins bonusCoins')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalCount = await Purchase.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching purchase history'
    });
  }
};

// @desc    Get store statistics
// @route   GET /api/store/stats
// @access  Admin
const getStoreStats = async (req, res) => {
  try {
    // Total revenue and purchases
    const totalRevenue = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const totalPurchases = await Purchase.countDocuments({ status: 'completed' });
    
    // Revenue by day for last 30 days
    const dailyRevenue = await Purchase.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$price' },
          purchases: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Most popular packs
    const popularPacks = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$packId',
          purchases: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { purchases: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'coinpacks',
          localField: '_id',
          foreignField: '_id',
          as: 'pack'
        }
      },
      { $unwind: '$pack' }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalPurchases,
          averageOrderValue: totalPurchases > 0 ? (totalRevenue[0]?.total || 0) / totalPurchases : 0
        },
        dailyRevenue,
        popularPacks
      }
    });
  } catch (error) {
    console.error('Get store stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching store statistics'
    });
  }
};

module.exports = {
  getCoinPacks,
  mockPurchase,
  getPurchaseHistory,
  getStoreStats
};