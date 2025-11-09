const requestPayment = async (req, res) => {
  console.warn('Payment request attempted but payment gateway integration is disabled.');

  return res.status(503).json({
    success: false,
    message: 'درگاه پرداخت در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.'
  });
};

const verifyPayment = async (req, res) => {
  console.warn('Payment verification attempted but payment gateway integration is disabled.');

  return res.status(503).json({
    success: false,
    message: 'تایید پرداخت در حال حاضر امکان‌پذیر نیست.'
  });
};

module.exports = {
  requestPayment,
  verifyPayment
};
