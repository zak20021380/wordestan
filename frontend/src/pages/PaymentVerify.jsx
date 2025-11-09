import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { storeService } from '../services/storeService';
import { useAuth } from '../contexts/AuthContext';

const PaymentVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const timeoutRef = useRef();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const authority = searchParams.get('Authority');
  const status = searchParams.get('Status');

  const verificationMutation = useMutation(
    () => storeService.verifyPayment({ authority, status }),
    {
      onSuccess: (response) => {
        if (response?.success) {
          const userCoins = response?.data?.user?.coins;
          if (typeof userCoins === 'number') {
            updateUser({ coins: userCoins });
          }
          queryClient.invalidateQueries(['purchaseHistory']);
          queryClient.invalidateQueries(['coinPacks']);
          toast.success(response.message || 'پرداخت با موفقیت تایید شد');
          timeoutRef.current = setTimeout(() => {
            navigate('/store', { replace: true });
          }, 3000);
        } else {
          toast.error(response?.message || 'تایید پرداخت ناموفق بود');
          timeoutRef.current = setTimeout(() => {
            navigate('/store', { replace: true });
          }, 4000);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'خطا در تایید پرداخت');
        timeoutRef.current = setTimeout(() => {
          navigate('/store', { replace: true });
        }, 4000);
      }
    }
  );

  useEffect(() => {
    if (!authority) {
      toast.error('شناسه تراکنش یافت نشد');
      navigate('/store', { replace: true });
      return () => {};
    }

    verificationMutation.mutate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority, status]);

  const renderStatusIcon = () => {
    if (verificationMutation.isLoading) {
      return <Loader2 className="w-14 h-14 text-primary-400 animate-spin" />;
    }

    if (verificationMutation.data?.success) {
      return <CheckCircle className="w-16 h-16 text-green-400" />;
    }

    return <XCircle className="w-16 h-16 text-red-400" />;
  };

  const renderMessage = () => {
    if (verificationMutation.isLoading) {
      return {
        title: 'در حال تایید پرداخت...',
        description: 'چند لحظه صبر کنید، در حال بررسی وضعیت تراکنش هستیم.'
      };
    }

    if (verificationMutation.data?.success) {
      return {
        title: verificationMutation.data.message || 'پرداخت تایید شد',
        description: `با موفقیت ${verificationMutation.data?.data?.coinsAwarded || 0} سکه به حساب شما افزوده شد.`
      };
    }

    if (verificationMutation.isError) {
      return {
        title: verificationMutation.error?.message || 'پرداخت ناموفق بود',
        description: 'در صورت کسر وجه، لطفا با پشتیبانی تماس بگیرید یا مجددا تلاش کنید.'
      };
    }

    return {
      title: verificationMutation.data?.message || 'پرداخت ناموفق بود',
      description: 'در صورت کسر وجه، لطفا با پشتیبانی تماس بگیرید یا مجددا تلاش کنید.'
    };
  };

  const message = renderMessage();
  const coinsAwarded = verificationMutation.data?.data?.coinsAwarded;
  const newBalance = verificationMutation.data?.data?.newBalance;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-glass backdrop-blur-lg rounded-3xl border border-glass-border p-10 text-center text-white"
      >
        <div className="flex flex-col items-center space-y-4">
          {renderStatusIcon()}
          <h1 className="text-3xl font-bold">{message.title}</h1>
          <p className="text-white/70 max-w-xl">{message.description}</p>

          {verificationMutation.data?.success && (
            <div className="w-full mt-6 grid md:grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-2xl border border-white/10 p-4">
                <div className="text-sm text-white/60">سکه‌های دریافت‌شده</div>
                <div className="text-2xl font-semibold text-accent-300">
                  +{(coinsAwarded ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl border border-white/10 p-4">
                <div className="text-sm text-white/60">موجودی جدید شما</div>
                <div className="text-2xl font-semibold text-primary-300">
                  {(newBalance ?? 0).toLocaleString()} سکه
                </div>
              </div>
            </div>
          )}

          {verificationMutation.isError && (
            <div className="text-sm text-red-300">
              {verificationMutation.error?.message}
            </div>
          )}

          <button
            onClick={() => navigate('/store')}
            className="mt-8 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-primary-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-primary-500/40 transition-all"
          >
            <span>بازگشت به فروشگاه</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentVerify;
