import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Gamepad2,
  Loader2
} from 'lucide-react';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('رمزهای عبور مطابقت ندارند');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });

      navigate('/game');
      toast.success('ثبت‌نام با موفقیت انجام شد! خوش آمدید!');
    } catch (error) {
      toast.error(error.message || 'ثبت‌نام ناموفق بود');
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
            <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">کلمات متصل</span>
          </div>
          <p className="text-white/60">حساب کاربری خود را بسازید و شروع به بازی کنید</p>
        </div>

        {/* Registration Form */}
        <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-white font-medium mb-2">
                نام کاربری
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="نام کاربری خود را انتخاب کنید"
                  className="w-full pr-12 pl-4 py-3 bg-glass-hover border-2 border-accent-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-400 focus:shadow-lg focus:shadow-accent-500/50 transition-all"
                  {...register('username', {
                    required: 'نام کاربری الزامی است',
                    minLength: {
                      value: 3,
                      message: 'نام کاربری باید حداقل 3 کاراکتر باشد'
                    },
                    maxLength: {
                      value: 20,
                      message: 'نام کاربری باید کمتر از 20 کاراکتر باشد'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'نام کاربری فقط می‌تواند شامل حروف، اعداد و خط تیره باشد'
                    }
                  })}
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-danger">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-medium mb-2">
                آدرس ایمیل
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  placeholder="ایمیل خود را وارد کنید"
                  className="w-full pr-12 pl-4 py-3 bg-glass-hover border-2 border-primary-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 focus:shadow-lg focus:shadow-primary-500/50 transition-all"
                  {...register('email', {
                    required: 'ایمیل الزامی است',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'آدرس ایمیل نامعتبر است'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-medium mb-2">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="رمز عبور ایجاد کنید"
                  className="w-full pr-12 pl-12 py-3 bg-glass-hover border-2 border-secondary-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-secondary-400 focus:shadow-lg focus:shadow-secondary-500/50 transition-all"
                  {...register('password', {
                    required: 'رمز عبور الزامی است',
                    minLength: {
                      value: 6,
                      message: 'رمز عبور باید حداقل 6 کاراکتر باشد'
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

            {/* Confirm Password */}
            <div>
              <label className="block text-white font-medium mb-2">
                تکرار رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="رمز عبور خود را تکرار کنید"
                  className="w-full pr-12 pl-12 py-3 bg-glass-hover border-2 border-blue-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/50 transition-all"
                  {...register('confirmPassword', {
                    required: 'لطفا رمز عبور را تأیید کنید',
                    validate: value => value === password || 'رمزهای عبور مطابقت ندارند'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-danger">{errors.confirmPassword.message}</p>
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
                  <span>در حال ساخت حساب...</span>
                </>
              ) : (
                <span>ساخت حساب کاربری</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-glass text-white/60">یا امتحان با حساب نمایشی</span>
            </div>
          </div>

          {/* Demo Account */}
          <div className="text-center">
            <p className="text-white/60 mb-4">اطلاعات حساب نمایشی:</p>
            <div className="bg-glass-hover rounded-lg p-4 text-sm text-white/80">
              <p><strong>ایمیل:</strong> admin@wordconnect.com</p>
              <p><strong>رمز عبور:</strong> admin123</p>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-white/60">
            حساب کاربری دارید؟{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              وارد شوید
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;