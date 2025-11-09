import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { storeService } from '../services/storeService';
import { useAuth } from '../contexts/AuthContext';

const PaymentVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('در حال بررسی پرداخت...');
  const [details, setDetails] = useState(null);
  const timeoutRef = useRef(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const scheduleRedirect = useCallback((path) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      navigate(path, { replace: true });
    }, 3000);
  }, [navigate]);

  useEffect(() => {
    const authority = searchParams.get('Authority');
    const statusParam = searchParams.get('Status');

    if (!authority) {
      setStatus('failed');
      setMessage('شناسه تراکنش یافت نشد.');
      setDetails(null);
      scheduleRedirect('/store');
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    if (statusParam !== 'OK') {
      setStatus('failed');
      setMessage('پرداخت توسط کاربر لغو شد.');
      setDetails(null);
      scheduleRedirect('/store');
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    const verifyPayment = async () => {
      try {
        setStatus('loading');
        setMessage('در حال بررسی پرداخت...');

        const response = await storeService.verifyPayment({ authority, status: statusParam });
        const { success, message: responseMessage, data } = response || {};

        if (success) {
          const coinsAwarded = data?.coins ?? data?.coinsAwarded ?? data?.amount ?? 0;
          const newBalance = data?.newBalance ?? data?.user?.coins;
          const refId = data?.refId ?? data?.transactionId;

          const successMessage = responseMessage
            || (coinsAwarded
              ? `پرداخت موفق بود! ${Number(coinsAwarded).toLocaleString()} سکه به حساب شما اضافه شد.`
              : 'پرداخت با موفقیت تایید شد.');

          setStatus('success');
          setMessage(successMessage);
          setDetails({
            coins: coinsAwarded,
            newBalance,
            refId,
          });

          if (typeof newBalance === 'number') {
            updateUser({ coins: newBalance });
          } else if (typeof data?.user?.coins === 'number') {
            updateUser({ coins: data.user.coins });
          }

          queryClient.invalidateQueries(['purchaseHistory']);
          queryClient.invalidateQueries(['coinPacks']);

          scheduleRedirect('/');
        } else {
          setStatus('failed');
          setMessage(responseMessage || 'تایید پرداخت ناموفق بود.');
          setDetails(null);
          scheduleRedirect('/store');
        }
      } catch (error) {
        setStatus('failed');
        setMessage(error.message || 'خطا در تایید پرداخت');
        setDetails(null);
        scheduleRedirect('/store');
      }
    };

    verifyPayment();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [queryClient, scheduleRedirect, searchParams, updateUser]);

  const renderIcon = () => {
    if (status === 'loading') {
      return <Loader2 className="w-20 h-20 text-purple-300 animate-spin" />;
    }

    if (status === 'success') {
      return <CheckCircle className="w-20 h-20 text-emerald-300 drop-shadow-[0_0_20px_rgba(110,231,183,0.6)]" />;
    }

    return <XCircle className="w-20 h-20 text-rose-300 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]" />;
  };

  const renderSubtitle = () => {
    if (status === 'loading') {
      return 'لطفا چند لحظه صبر کنید تا وضعیت تراکنش مشخص شود.';
    }

    if (status === 'success') {
      return 'پرداخت با موفقیت انجام شد و به زودی به صفحه اصلی هدایت می‌شوید.';
    }

    return 'در صورت کسر وجه، با پشتیبانی تماس بگیرید یا مجددا تلاش کنید.';
  };

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-[1px] shadow-[0_25px_70px_rgba(76,29,149,0.45)]">
        <div className="relative rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-purple-950/95 via-purple-900/90 to-indigo-950/90 p-6 sm:p-10">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -top-20 -left-24 h-56 w-56 rounded-full bg-fuchsia-500/40 blur-3xl" />
            <div className="absolute -bottom-24 -right-10 h-60 w-60 rounded-full bg-indigo-500/40 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            <div className="animate-fade-in">{renderIcon()}</div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
                {status === 'success'
                  ? 'پرداخت با موفقیت تایید شد 🎉'
                  : status === 'failed'
                    ? 'پرداخت ناموفق بود'
                    : 'در حال بررسی پرداخت...'}
              </h1>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed">
                {message}
              </p>
              <p className="text-white/60 text-sm sm:text-base">
                {renderSubtitle()}
              </p>
            </div>

            {status === 'success' && details && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left sm:text-center backdrop-blur-xl">
                  <p className="text-xs sm:text-sm text-white/60 mb-1">سکه‌های دریافت‌شده</p>
                  <p className="text-xl sm:text-2xl font-semibold text-emerald-300">
                    +{Number(details.coins ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left sm:text-center backdrop-blur-xl">
                  <p className="text-xs sm:text-sm text-white/60 mb-1">موجودی جدید</p>
                  <p className="text-xl sm:text-2xl font-semibold text-primary-200">
                    {typeof details.newBalance === 'number'
                      ? `${Number(details.newBalance).toLocaleString()} سکه`
                      : '---'}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left sm:text-center backdrop-blur-xl">
                  <p className="text-xs sm:text-sm text-white/60 mb-1">شماره پیگیری</p>
                  <p className="text-base sm:text-lg font-semibold text-white/80 truncate">
                    {details.refId || 'ثبت نشده'}
                  </p>
                </div>
              </div>
            )}

            {status === 'failed' && (
              <button
                type="button"
                onClick={() => navigate('/store', { replace: true })}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-white/10 px-6 py-3 text-sm sm:text-base font-semibold text-white transition-all hover:bg-white/20 hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                تلاش مجدد یا بازگشت به فروشگاه
              </button>
            )}

            <p className="text-xs text-white/50 sm:text-sm pt-2">
              {status === 'success' ? 'در حال انتقال به صفحه اصلی...' : status === 'failed' ? 'به زودی به فروشگاه بازمی‌گردید.' : 'لطفا صفحه را نبندید.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerify;
