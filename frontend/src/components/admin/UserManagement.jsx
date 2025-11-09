import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, ShieldCheck, UserPlus } from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const quickTips = useMemo(() => ([
    {
      title: 'Invite New Admins',
      description: 'Ensure new administrators have two-factor authentication enabled before granting access.',
      icon: ShieldCheck,
      color: 'text-green-400'
    },
    {
      title: 'Grow the Community',
      description: 'Use referral campaigns to encourage players to invite their friends and boost engagement.',
      icon: UserPlus,
      color: 'text-primary-400'
    }
  ]), []);

  const filteredTips = useMemo(() => {
    if (!searchTerm.trim()) {
      return quickTips;
    }

    const term = searchTerm.trim().toLowerCase();
    return quickTips.filter((tip) =>
      [tip.title, tip.description].some((value) => value.toLowerCase().includes(term))
    );
  }, [quickTips, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
          <p className="text-white/60">Monitor user activity and plan how to expand your player base.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-glass backdrop-blur-lg rounded-xl border border-glass-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search tips or actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-glass-hover border border-glass-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-400 transition-colors"
          />
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-glass backdrop-blur-lg rounded-2xl border border-glass-border p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-primary-500/20 rounded-xl mr-4">
            <Users className="w-7 h-7 text-primary-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Quick Administration Tips</h3>
            <p className="text-white/60 text-sm">Use these recommendations while the full user management tools are being built.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-glass-hover rounded-xl border border-transparent hover:border-glass-border p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-black/20 rounded-lg">
                    <Icon className={`w-5 h-5 ${tip.color}`} />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">{tip.title}</div>
                    <p className="text-white/60 text-sm leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTips.length === 0 && (
          <div className="text-center text-white/60 py-8">
            No tips found. Try searching with a different keyword.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
