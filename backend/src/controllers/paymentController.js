const ZarinpalCheckout = require('zarinpal-checkout');
const CoinPack = require('../models/CoinPack');
const Purchase = require('../models/Purchase');

const merchantId = process.env.ZARINPAL_MERCHANT_ID || 'd97f7648-614f-4025-bee2-5f3cda6d8fcd';
const isSandbox = (process.env.ZARINPAL_SANDBOX || 'true').toLowerCase() !== 'false';

const zarinpal = ZarinpalCheckout.create(merchantId, isSandbox);

const buildCallbackUrl = () => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl.replace(/\/$/, '')}/payment/verify`;
};

// @desc    Create a ZarinPal payment request and return redirect URL
// @route   POST /api/payment/request
// @access  Private
const requestPayment = async (req, res) => {
  try {
    const { packId } = req.body;

    if (!packId) {
      return res.status(400).json({
        success: false,
        message: 'شناسه بسته الزامی است'
      });
    }

    const coinPack = await CoinPack.findById(packId);

    if (!coinPack || !coinPack.isActive) {
      return res.status(404).json({
        success: false,
        message: 'بسته سکه یافت نشد یا غیرفعال است'
      });
    }

    if (coinPack.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'امکان خرید بسته رایگان وجود ندارد'
      });
    }

    const callbackUrl = buildCallbackUrl();

    const response = await zarinpal.PaymentRequest({
      Amount: coinPack.price,
      CallbackURL: callbackUrl,
      Description: `خرید ${coinPack.totalCoins} سکه`,
      Email: req.user.email || undefined
    });

    if (!response || response.status !== 100 || !response.url || !response.authority) {
      return res.status(502).json({
        success: false,
        message: 'امکان ایجاد تراکنش وجود ندارد، لطفا مجددا تلاش کنید'
      });
    }

    const purchase = new Purchase({
      userId: req.user._id,
      packId: coinPack._id,
      amount: coinPack.totalCoins,
      price: coinPack.price,
      currency: coinPack.currency,
      status: 'pending',
      paymentMethod: 'zarinpal',
      gateway: 'zarinpal',
      gatewayAuthority: response.authority
    });

    await purchase.save();

    return res.json({
      success: true,
      message: 'در حال انتقال به صفحه پرداخت',
      data: {
        paymentUrl: response.url,
        authority: response.authority,
        purchaseId: purchase._id
      }
    });
  } catch (error) {
    console.error('ZarinPal payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد تراکنش پرداخت'
    });
  }
};

// @desc    Verify ZarinPal payment and deliver coins
// @route   GET /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { Authority: authority, Status: status } = req.query;

    if (!authority) {
      return res.status(400).json({
        success: false,
        message: 'شناسه تراکنش ارسال نشده است'
      });
    }

    const purchase = await Purchase.findOne({
      gatewayAuthority: authority,
      userId: req.user._id
    }).populate('packId');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'تراکنش معتبری یافت نشد'
      });
    }

    if (purchase.status === 'completed') {
      return res.json({
        success: true,
        message: 'پرداخت قبلا تایید شده است',
        data: {
          purchase: {
            id: purchase._id,
            status: purchase.status,
            transactionId: purchase.transactionId,
            refId: purchase.gatewayRefId,
            amount: purchase.amount,
            price: purchase.price,
            currency: purchase.currency
          },
          user: {
            coins: req.user.coins
          },
          coinsAwarded: purchase.amount,
          newBalance: req.user.coins
        }
      });
    }

    if (status !== 'OK') {
      purchase.status = 'failed';
      purchase.failureReason = `پرداخت توسط کاربر لغو شد (Status: ${status || 'unknown'})`;
      await purchase.save();

      return res.status(400).json({
        success: false,
        message: 'پرداخت توسط کاربر لغو شد',
        data: {
          status
        }
      });
    }

    const verification = await zarinpal.PaymentVerification({
      Amount: purchase.price,
      Authority: authority
    });

    if (!verification || (verification.status !== 100 && verification.status !== 101)) {
      purchase.status = 'failed';
      purchase.failureReason = `کد وضعیت نامعتبر از زرین‌پال (${verification?.status || 'بدون وضعیت'})`;
      await purchase.save();

      return res.status(400).json({
        success: false,
        message: 'تایید پرداخت با خطا مواجه شد',
        data: {
          status: verification?.status
        }
      });
    }

    const coinPack = purchase.packId || await CoinPack.findById(purchase.packId);

    if (!coinPack) {
      return res.status(500).json({
        success: false,
        message: 'بسته سکه مرتبط یافت نشد'
      });
    }

    const updatedUser = await req.user.addCoins(coinPack.totalCoins);
    req.user.coins = updatedUser.coins;

    purchase.status = 'completed';
    purchase.transactionId = verification.RefID?.toString() || purchase.transactionId;
    purchase.gatewayRefId = verification.RefID?.toString() || purchase.gatewayRefId;
    purchase.receipt = verification.RefID?.toString() || purchase.receipt;
    purchase.failureReason = undefined;
    purchase.gateway = 'zarinpal';
    await purchase.save();

    coinPack.timesPurchased += 1;
    coinPack.revenueGenerated += purchase.price;
    await coinPack.save();

    return res.json({
      success: true,
      message: verification.status === 101 ? 'پرداخت قبلا تایید شده است' : 'پرداخت با موفقیت تایید شد',
      data: {
        purchase: {
          id: purchase._id,
          status: purchase.status,
          transactionId: purchase.transactionId,
          refId: purchase.gatewayRefId,
          amount: purchase.amount,
          price: purchase.price,
          currency: purchase.currency
        },
        user: {
          coins: updatedUser.coins
        },
        coinsAwarded: coinPack.totalCoins,
        newBalance: updatedUser.coins
      }
    });
  } catch (error) {
    console.error('ZarinPal verification error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تایید پرداخت'
    });
  }
};

module.exports = {
  requestPayment,
  verifyPayment
};
