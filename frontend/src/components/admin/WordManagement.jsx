import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Type } from 'lucide-react';
import { adminService } from '../../services/adminService';

const WordManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchWords = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getWords({ limit: 200 });
        if (isMounted) {
          setWords(response.data.words || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch words');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWords();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.state?.openCreate) {
      setShowModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) {
      return words;
    }

    const term = searchTerm.trim().toLowerCase();
    return words.filter((word) =>
      [word.text, word.category, word.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [searchTerm, words]);

  const difficultyLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Word Management</h2>
          <p className="text-white/60">Manage your game words and vocabulary</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Word</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-danger/20 border border-danger rounded-lg p-4">
          <p className="text-danger text-center font-medium">{error}</p>
        </div>
      )}

      {/* Word Grid */}
      <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
        {loading ? (
          <div className="text-center text-white/60 py-10">Loading words...</div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center text-white/60 py-10">
            {searchTerm ? 'No words match your search yet.' : 'No words have been added by the admin yet.'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredWords.map((word, index) => (
              <motion.div
                key={word._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-glass-hover rounded-lg p-4 hover:bg-glass transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                    <Type className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{word.text}</div>
                    <div className="text-white/60 text-sm">
                      {difficultyLabels[word.difficulty] || word.difficulty}
                      <span className="mx-2">•</span>
                      {word.category || 'Uncategorized'}
                      <span className="mx-2">•</span>
                      {word.length} letters
                    </div>
                    {word.meaning && (
                      <div className="text-primary-200 text-sm mt-1">
                        <span className="font-semibold">💡 معنی:</span> {word.meaning}
                      </div>
                    )}
                    {word.description && (
                      <div className="text-white/40 text-xs mt-1">{word.description}</div>
                    )}
                    {!word.isActive && (
                      <div className="text-warning text-xs mt-1">Inactive</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-white/40 text-xs mr-3 hidden sm:block">
                    {word.points} pts
                  </div>
                  <button className="p-2 text-white/60 hover:text-white hover:bg-glass rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-white/60 hover:text-danger hover:bg-glass rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Word Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-6">Add New Word</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Word</label>
                <input
                  type="text"
                  placeholder="Enter word"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Difficulty</label>
                <select className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white focus:outline-none focus:border-primary-400">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <input
                  type="text"
                  placeholder="Enter category"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-glass-hover hover:bg-glass text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Add Word
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WordManagement;