import { useState } from 'react';
import { Copy, Share2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const FriendChallenge = ({ onCreateCode, onJoinCode, onChallengeUser, challengeCode }) => {
  const [codeInput, setCodeInput] = useState('');
  const [username, setUsername] = useState('');

  const handleCopy = () => {
    if (!challengeCode?.code) return;
    navigator.clipboard.writeText(challengeCode.code);
    toast.success('کد کپی شد');
  };

  const shareLink = challengeCode?.code ? `https://game.king-ofiq.ir/battle/${challengeCode.code}` : '';

  return (
    <div className="bg-glass backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-glass flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">روش اول: لینک دعوت</h3>
        <p className="text-white/70 text-sm mb-4">کد نبرد پنج دقیقه معتبره.</p>
        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-2xl font-bold"
            onClick={onCreateCode}
          >
            ساخت لینک نبرد
          </motion.button>
          {challengeCode?.code && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-2xl font-black tracking-[0.3rem]">{challengeCode.code}</span>
                <button className="text-primary-300" onClick={handleCopy}>
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-transparent text-white/80 text-sm"
                />
                <button className="text-secondary-300" onClick={() => window.open(`https://t.me/share/url?url=${shareLink}`, '_blank')}>
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">روش دوم: جستجوی نام کاربری</h3>
        <div className="flex flex-col gap-3">
          <div className="bg-white/5 rounded-2xl border border-white/10 flex items-center px-4">
            <Search className="w-5 h-5 text-white/40" />
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="نام کاربری حریف"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 py-3"
            />
          </div>
          <button
            onClick={() => username.trim() && onChallengeUser(username.trim())}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-2xl font-bold"
          >
            ارسال چالش
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">ورود با کد</h3>
        <div className="flex flex-col gap-3">
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder="کد ۶ رقمی"
            className="bg-white/5 rounded-2xl border border-white/10 text-center text-2xl tracking-[0.5rem] text-white py-3"
          />
          <button
            onClick={() => codeInput && onJoinCode(codeInput)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-2xl font-bold"
          >
            ورود به نبرد
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendChallenge;
