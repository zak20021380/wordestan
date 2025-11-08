import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, ShoppingCart, Coins, Star, Crown } from 'lucide-react';

const CoinPackManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Coin Pack Management</h2>
          <p className="text-white/60">Manage your store's coin packages</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Pack</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search coin packs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      </div>

      {/* Coin Packs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Starter Pack', amount: 100, price: 0.99, featured: false, popular: false },
          { title: 'Value Pack', amount: 250, price: 1.99, featured: false, popular: true },
          { title: 'Premium Pack', amount: 500, price: 3.99, featured: true, popular: false },
          { title: 'Mega Pack', amount: 1000, price: 7.99, featured: true, popular: true },
          { title: 'Daily Deal', amount: 200, price: 1.49, featured: false, popular: true },
          { title: 'Beginner Pack', amount: 50, price: 0.49, featured: false, popular: false }
        ].map((pack, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6 ${
              pack.featured ? 'ring-2 ring-yellow-400/50' : ''
            } hover:bg-glass-hover transition-all transform hover:scale-105`}
          >
            {/* Pack Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {pack.featured && <Crown className="w-6 h-6 text-yellow-400" />}
                {pack.popular && <Star className="w-6 h-6 text-orange-400" />}
                {!pack.featured && !pack.popular && <Coins className="w-6 h-6 text-yellow-400" />}
                <h3 className="text-xl font-bold text-white">{pack.title}</h3>
              </div>
              
              {pack.featured && (
                <span className="bg-yellow-400/20 text-yellow-400 text-xs font-medium px-2 py-1 rounded-full">
                  Featured
                </span>
              )}
              
              {pack.popular && !pack.featured && (
                <span className="bg-orange-400/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full">
                  Popular
                </span>
              )}
            </div>

            {/* Coin Amount */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Coins className="w-8 h-8 text-yellow-400" />
                <span className="text-3xl font-bold text-white">
                  {pack.amount.toLocaleString()}
                </span>
              </div>
              
              <div className="text-white/60 text-sm mt-1">
                Total coins
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white">
                ${pack.price.toFixed(2)}
              </div>
              <div className="text-white/60 text-sm">
                USD
              </div>
            </div>

            {/* Stats */}
            <div className="text-center mb-6">
              <div className="text-white/60 text-sm">
                Purchased 23 times
              </div>
              <div className="text-white/60 text-sm">
                Revenue: $22.77
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center space-x-2">
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

      {/* Add Pack Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-6">Add Coin Pack</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Pack Title</label>
                <input
                  type="text"
                  placeholder="Enter pack title"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Coin Amount</label>
                  <input
                    type="number"
                    placeholder="Amount of coins"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price in USD"
                    className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Bonus Coins</label>
                <input
                  type="number"
                  placeholder="Bonus coins (optional)"
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  placeholder="Pack description (optional)"
                  rows={3}
                  className="w-full px-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-glass-border text-primary-500 focus:ring-primary-500" />
                  <span className="text-white">Featured</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-glass-border text-primary-500 focus:ring-primary-500" />
                  <span className="text-white">Popular</span>
                </label>
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
                Add Pack
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CoinPackManagement;