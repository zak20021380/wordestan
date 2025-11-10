import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Gamepad2,
  Loader2
} from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      setAuthError('');
      await login(data.username, data.password);

      // Redirect to original page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });

      toast.success('ورود موفقیت‌آمیز بود!');
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        setAuthError('چنین حسابی پیدا نشد! اگر هنوز ثبت‌نام نکردی، از لینک پایین یه اکانت بساز.');
        toast.error('نام کاربری یا رمز عبور اشتباهه.');
      } else {
        setAuthError('ورود ناموفق بود. لطفاً دوباره تلاش کن.');
        toast.error(error.message || 'یه مشکلی پیش اومد!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 space-x-reverse mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">حرف‌لند</span>
          </div>
          <p className="text-white/60">به حساب کاربری خود وارد شوید</p>
        </div>

        {/* Login Form */}
        <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-white font-medium mb-2">
                اسم کاربری تو
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="اسم کاربریت رو بنویس"
                  className="w-full pr-12 pl-4 py-3 bg-glass-hover border-2 border-primary-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/50 transition-all"
                  {...register('username', {
                    required: 'اسم کاربری رو فراموش نکن!',
                    minLength: {
                      value: 3,
                      message: 'اسم کاربری باید حداقل ۳ کاراکتر باشه'
                    }
                  })}
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-danger">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-medium mb-2">
                رمز عبورت
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="رمزت رو بنویس"
                  className="w-full pr-12 pl-12 py-3 bg-glass-hover border-2 border-secondary-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-secondary-400 focus:shadow-lg focus:shadow-secondary-500/50 transition-all"
                  {...register('password', {
                    required: 'رمز رو فراموش نکن!',
                    minLength: {
                      value: 6,
                      message: 'رمز باید حداقل ۶ کاراکتر باشه'
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 hover:from-primary-600 hover:via-secondary-600 hover:to-primary-600 disabled:bg-glass-hover disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-secondary-500/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>صبر کن، داریم وارد میشیم...</span>
                </>
              ) : (
                <span>بزن بریم! 🚀</span>
              )}
            </button>
            {authError && (
              <p className="text-sm text-danger text-center">{authError}</p>
            )}
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-white/60">
            هنوز اکانت نساختی؟{' '}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              بیا بسازیم!
            </Link>
          </p>
        </div>

        {/* Skip Login Link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-white/50 hover:text-white/80 text-sm font-medium transition-colors underline decoration-dotted"
          >
            رد شدن از ورود و ادامه به عنوان مهمان
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;