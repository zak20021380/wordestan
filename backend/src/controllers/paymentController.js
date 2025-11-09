const axios = require('axios');
const CoinPack = require('../models/CoinPack');
const Purchase = require('../models/Purchase');

const MERCHANT_ID = 'd97f7648-614f-4025-bee2-5f3cda6d8fcd';
const API_URL = 'https://api.zarinpal.com/pg/v4/payment';

// Request payment URL from ZarinPal and create a pending purchase record
const requestPayment = async (req, res) => {
  try {
    const { packId } = req.body;

    if (!packId) {
      return res.status(400).json({
        success: false,
        message: 'شناسه بسته سکه الزامی است.'
      });
    }

    const coinPack = await CoinPack.findById(packId);

    if (!coinPack || !coinPack.isActive) {
      return res.status(404).json({
        success: false,
        message: 'بسته سکه مورد نظر یافت نشد یا غیر فعال است.'
      });
    }

    const price = Number(coinPack.price);
    const coins = Number(coinPack.totalCoins);

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'قیمت بسته سکه نامعتبر است.'
      });
    }

    const amountInRial = Math.round(price * 10);

    const { data } = await axios.post(`${API_URL}/request.json`, {
      merchant_id: MERCHANT_ID,
      amount: amountInRial,
      callback_url: 'http://localhost:5173/payment/verify',
      description: `خرید ${coins} سکه`
    });

    const responseData = data?.data;

    if (!responseData || responseData.code !== 100 || !responseData.authority) {
      const errorMessage = data?.errors?.message || 'خطا در ایجاد تراکنش پرداخت';
      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: data?.errors || responseData
      });
    }

    const purchase = await Purchase.create({
      userId: req.user._id,
      packId: coinPack._id,
      amount: coins,
      price,
      currency: coinPack.currency || 'تومان',
      status: 'pending',
      paymentMethod: 'zarinpal',
      gateway: 'zarinpal',
      gatewayAuthority: responseData.authority
    });

    const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${responseData.authority}`;

    return res.json({
      success: true,
      message: 'لینک پرداخت با موفقیت ایجاد شد.',
      data: {
        paymentUrl,
        authority: responseData.authority,
        purchaseId: purchase._id,
        amount: price,
        coins
      }
    });
  } catch (error) {
    console.error('ZarinPal request error:', error.response?.data || error.message);

    const errorMessage =
      error.response?.data?.errors?.message ||
      error.response?.data?.data?.message ||
      'خطا در اتصال به درگاه پرداخت';

    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Verify payment with ZarinPal and finalize the purchase
const verifyPayment = async (req, res) => {
  try {
    const { Authority, Status } = req.query;

    if (!Authority || !Status) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات تایید پرداخت ناقص است.'
      });
    }

    const purchase = await Purchase.findOne({
      gatewayAuthority: Authority,
      userId: req.user._id
    }).populate('packId');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'تراکنش مورد نظر یافت نشد.'
      });
    }

    if (Status !== 'OK') {
      purchase.status = 'failed';
      purchase.failureReason = `Gateway status: ${Status}`;
      await purchase.save();

      return res.status(400).json({
        success: false,
        message: 'پرداخت توسط کاربر لغو شد یا ناموفق بود.',
        data: {
          status: Status
        }
      });
    }

    if (purchase.status === 'completed') {
      return res.json({
        success: true,
        message: 'پرداخت قبلاً تایید شده است.',
        data: {
          refId: purchase.gatewayRefId,
          authority: purchase.gatewayAuthority,
          coins: purchase.amount,
          newBalance: req.user.coins,
          purchaseId: purchase._id
        }
      });
    }

    const amountInRial = Math.round(Number(purchase.price) * 10);

    const { data: verifyData } = await axios.post(`${API_URL}/verify.json`, {
      merchant_id: MERCHANT_ID,
      amount: amountInRial,
      authority: Authority
    });

    const verification = verifyData?.data;

    if (verification && (verification.code === 100 || verification.code === 101)) {
      purchase.status = 'completed';
      purchase.gatewayRefId = verification.ref_id ? String(verification.ref_id) : purchase.gatewayRefId;
      purchase.transactionId = verification.ref_id ? `zarinpal_${verification.ref_id}` : purchase.transactionId;
      purchase.receipt = JSON.stringify(verification);
      purchase.failureReason = null;
      await purchase.save();

      const updatedUser = await req.user.addCoins(purchase.amount);

      const coinPackDoc = purchase.packId && purchase.packId._id
        ? purchase.packId
        : await CoinPack.findById(purchase.packId);

      if (coinPackDoc) {
        coinPackDoc.timesPurchased += 1;
        coinPackDoc.revenueGenerated += purchase.price;
        await coinPackDoc.save();
      }

      return res.json({
        success: true,
        message: verification.code === 101 ? 'پرداخت قبلاً تایید شده بود.' : 'پرداخت با موفقیت تایید شد.',
        data: {
          refId: purchase.gatewayRefId,
          authority: purchase.gatewayAuthority,
          coins: purchase.amount,
          newBalance: updatedUser.coins,
          purchaseId: purchase._id
        }
      });
    }

    purchase.status = 'failed';
    purchase.failureReason = verification?.errors
      ? JSON.stringify(verification.errors)
      : `کد خطا: ${verification?.code}`;
    await purchase.save();

    return res.status(400).json({
      success: false,
      message: verification?.message || 'تایید پرداخت ناموفق بود.',
      data: {
        code: verification?.code,
        errors: verification?.errors
      }
    });
  } catch (error) {
    console.error('ZarinPal verify error:', error.response?.data || error.message);

    const errorMessage =
      error.response?.data?.errors?.message ||
      error.response?.data?.data?.message ||
      'خطا در تایید پرداخت';

    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

module.exports = {
  requestPayment,
  verifyPayment
};
