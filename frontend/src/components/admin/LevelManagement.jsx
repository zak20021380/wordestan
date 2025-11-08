import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Layers, Play, Eye } from 'lucide-react';

const LevelManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Level Management</h2>
          <p className="text-white/60">Create and manage game levels</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Level</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search levels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      </div>

      {/* Levels Grid */}
      <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((levelNum) => (
            <motion.div
              key={levelNum}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: levelNum * 0.1 }}
              className="flex items-center justify-between bg-glass-hover rounded-lg p-4 hover:bg-glass transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">Level {levelNum}: Animal Kingdom</div>
                  <div className="text-white/60 text-sm">
                    5 words • Easy • Published • 127 completions
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-white/60 hover:text-white hover:bg-glass rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-white/60 hover:text-white hover:bg-glass rounded-lg transition-colors">
                  <Play className="w-4 h-4" />
                </button>
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
      </div>

      {/* Create Level Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white mb-6">Create New Level</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Level Name</label>
                <input
                  type="text"
                  placeholder="Enter level name"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Order</label>
                  <input
                    type="number"
                    placeholder="Level order"
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
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  placeholder="Enter level description"
                  rows={3}
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Letters</label>
                  <input
                    type="text"
                    placeholder="Enter letters (e.g., CATDOG)"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Center Letter</label>
                  <input
                    type="text"
                    placeholder="Center letter"
                    maxLength={1}
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Words</label>
                <select multiple className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white focus:outline-none focus:border-primary-400" size={6}>
                  <option value="">CAT</option>
                  <option value="">DOG</option>
                  <option value="">ACT</option>
                  <option value="">COT</option>
                  <option value="">DOT</option>
                  <option value="">GOD</option>
                </select>
                <p className="text-white/60 text-sm mt-1">Hold Ctrl/Cmd to select multiple words</p>
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
                Create Level
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LevelManagement;