import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      toast.error('رمزها یکی نیستن! 🙈');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        username: data.username,
        password: data.password,
      });

      navigate('/game');
      toast.success('یِه‌هو! خوش اومدی! 🎉');
    } catch (error) {
      toast.error(error.message || 'یه مشکلی پیش اومد، دوباره امتحان کن!');
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
            <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">وردستان</span>
          </div>
          <p className="text-white/60">بیا یه اکانت بساز و بریم بازی! 🎮</p>
        </div>

        {/* Registration Form */}
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
                  placeholder="یه اسم باحال برای خودت انتخاب کن"
                  className="w-full pr-12 pl-4 py-3 bg-glass-hover border-2 border-accent-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-400 focus:shadow-lg focus:shadow-accent-500/50 transition-all"
                  {...register('username', {
                    required: 'اسم کاربری رو فراموش نکن!',
                    minLength: {
                      value: 3,
                      message: 'اسم کاربری باید حداقل ۳ حرف باشه'
                    },
                    maxLength: {
                      value: 20,
                      message: 'اسم کاربری نباید از ۲۰ حرف بیشتر باشه'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'فقط حروف انگلیسی، اعداد و _ استفاده کن'
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
                  placeholder="یه رمز قوی بساز"
                  className="w-full pr-12 pl-12 py-3 bg-glass-hover border-2 border-secondary-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-secondary-400 focus:shadow-lg focus:shadow-secondary-500/50 transition-all"
                  {...register('password', {
                    required: 'رمز عبور رو فراموش نکن!',
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

            {/* Confirm Password */}
            <div>
              <label className="block text-white font-medium mb-2">
                رمزت رو دوباره بنویس
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="رمزت رو یه بار دیگه بنویس"
                  className="w-full pr-12 pl-12 py-3 bg-glass-hover border-2 border-blue-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/50 transition-all"
                  {...register('confirmPassword', {
                    required: 'رمزت رو تایید کن!',
                    validate: value => value === password || 'رمزها یکی نیستن!'
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
                  <span>داریم اکانتت رو میسازیم...</span>
                </>
              ) : (
                <span>بزن بریم! 🚀</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-glass text-white/60">یا با اکانت آزمایشی امتحان کن</span>
            </div>
          </div>

          {/* Demo Account */}
          <div className="text-center">
            <p className="text-white/60 mb-4">اطلاعات اکانت آزمایشی:</p>
            <div className="bg-glass-hover rounded-lg p-4 text-sm text-white/80">
              <p><strong>اسم کاربری:</strong> admin</p>
              <p><strong>رمز:</strong> admin123</p>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-white/60">
            قبلاً اکانت ساختی؟{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              بیا تو!
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;