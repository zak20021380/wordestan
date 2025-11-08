import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Layers, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

const LevelManagement = () => {
  const [levels, setLevels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [letters, setLetters] = useState('');
  const [words, setWords] = useState('');

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLevels({ limit: 100 });
      setLevels(response.data.levels);
    } catch (err) {
      setError(err.message || 'Failed to fetch levels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLevel = async (e) => {
    e.preventDefault();

    if (!letters.trim() || !words.trim()) {
      setError('لطفاً همه فیلدها رو پر کن!');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await adminService.createLevel({
        letters: letters.trim(),
        words: words.trim()
      });

      setSuccess('مرحله جدید با موفقیت ساخته شد! 🎉');
      setLetters('');
      setWords('');
      setShowModal(false);

      // Refresh levels list
      await fetchLevels();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create level');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLevel = async (id) => {
    if (!window.confirm('آیا مطمئن هستی که می‌خوای این مرحله رو پاک کنی؟')) {
      return;
    }

    try {
      setLoading(true);
      await adminService.deleteLevel(id);
      setSuccess('مرحله با موفقیت حذف شد!');
      await fetchLevels();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete level');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">مدیریت مراحل</h2>
          <p className="text-white/60">ساخت و مدیریت مراحل بازی - فقط با حروف و کلمات!</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="w-5 h-5" />
          <span>مرحله جدید</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 text-center font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-danger/20 border border-danger rounded-lg p-4">
          <p className="text-danger text-center font-medium">{error}</p>
        </div>
      )}

      {/* Levels Grid */}
      <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
        {loading && levels.length === 0 ? (
          <div className="text-center text-white/60 py-8">در حال بارگذاری...</div>
        ) : levels.length === 0 ? (
          <div className="text-center text-white/60 py-8">هنوز مرحله‌ای نساخته شده!</div>
        ) : (
          <div className="grid gap-4">
            {levels.map((level, index) => (
              <motion.div
                key={level._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-glass-hover rounded-lg p-4 hover:bg-glass transition-colors"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">
                      مرحله {level.order}: {level.letters}
                    </div>
                    <div className="text-white/60 text-sm">
                      {level.words.length} کلمه
                      {level.isPublished && (
                        <span className="mr-2 text-green-400">• منتشر شده</span>
                      )}
                    </div>
                    <div className="text-white/40 text-xs mt-1">
                      کلمات: {level.words.map(w => w.text).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  {level.isPublished && (
                    <div className="p-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteLevel(level._id)}
                    className="p-2 text-white/60 hover:text-danger hover:bg-glass rounded-lg transition-colors"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Level Modal - SUPER SIMPLE! */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8 max-w-2xl w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-6">مرحله جدید</h3>

            <form onSubmit={handleCreateLevel} className="space-y-4">
              {/* Letters Input */}
              <div>
                <label className="block text-white font-medium mb-2">
                  حروف (مثلاً: AWET)
                </label>
                <input
                  type="text"
                  placeholder="حروف رو بنویس..."
                  value={letters}
                  onChange={(e) => setLetters(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 text-2xl font-bold text-center tracking-widest"
                  disabled={loading}
                />
                <p className="text-white/40 text-sm mt-1">
                  حروفی که بازیکن باید ازشون کلمه بسازه
                </p>
              </div>

              {/* Words Input */}
              <div>
                <label className="block text-white font-medium mb-2">
                  کلمات (هر کدوم تو یه خط یا با کاما جدا کن)
                </label>
                <textarea
                  placeholder="WET, TEA, ATE یا هر کدوم تو یه خط"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 resize-none font-mono"
                  disabled={loading}
                />
                <p className="text-white/40 text-sm mt-1">
                  کلماتی که باید پیدا بشن - سیستم خودکار اونا رو ایجاد می‌کنه!
                </p>
              </div>

              <div className="flex space-x-4 space-x-reverse mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setLetters('');
                    setWords('');
                    setError('');
                  }}
                  className="flex-1 bg-glass-hover hover:bg-glass text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  disabled={loading}
                >
                  لغو
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'در حال ساخت...' : 'ساخت مرحله'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LevelManagement;
