import { useState } from 'react';
import { motion } from 'framer-motion';
import QuickMatchButton from '../components/Battle/QuickMatchButton';
import FriendChallenge from '../components/Battle/FriendChallenge';
import WaitingRoom from '../components/Battle/WaitingRoom';
import { useBattle } from '../contexts/BattleContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const BattleLobby = () => {
  const [tab, setTab] = useState('quick');
  const navigate = useNavigate();
  const {
    state,
    stats,
    startQuickMatch,
    cancelQuickMatch,
    createChallengeLink,
    joinWithCode,
    challengeByUsername,
    acceptChallenge,
    declineChallenge,
  } = useBattle();

  return (
    <div className="space-y-8">
      <div className="bg-glass backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-glass flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">نبردهای ۱ به ۱</h1>
          <div className="text-white/80">
            <p>بردها: {stats?.wins ?? 0}</p>
            <p>باخت‌ها: {stats?.losses ?? 0}</p>
            <p>نرخ برد: {stats?.winRate ?? 0}%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`flex-1 py-3 rounded-2xl font-bold ${tab === 'quick' ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/70'}`}
            onClick={() => setTab('quick')}
          >
            نبرد سریع
          </button>
          <button
            className={`flex-1 py-3 rounded-2xl font-bold ${tab === 'friend' ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/70'}`}
            onClick={() => setTab('friend')}
          >
            چالش دوستان
          </button>
        </div>
      </div>

      {tab === 'quick' && (
        <QuickMatchButton
          status={state.queueStatus}
          onlineCount={state.onlineCount}
          onStart={startQuickMatch}
          onCancel={cancelQuickMatch}
        />
      )}

      {tab === 'friend' && (
        <FriendChallenge
          onCreateCode={createChallengeLink}
          onJoinCode={joinWithCode}
          onChallengeUser={challengeByUsername}
          challengeCode={state.challengeCode}
        />
      )}

      {state.queueStatus === 'searching' && (
        <WaitingRoom message={state.waitingMessage} onCancel={cancelQuickMatch} />
      )}

      {state.incomingChallenge && (
        <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-3xl p-5 text-white space-y-3">
          <p className="text-lg font-bold">{state.incomingChallenge.from?.username || 'یک بازیکن'} تو رو به نبرد دعوت کرده!</p>
          <div className="flex gap-3">
            <button
              onClick={() => acceptChallenge(state.incomingChallenge.challengeId)}
              className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-bold"
            >
              قبول
            </button>
            <button
              onClick={() => declineChallenge(state.incomingChallenge.challengeId)}
              className="flex-1 bg-white/10 text-white py-3 rounded-2xl font-bold"
            >
              رد
            </button>
          </div>
        </div>
      )}

      {state.results && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold"
          onClick={() => navigate('/battle/results')}
        >
          نتایج آخرین نبرد
        </motion.button>
      )}

      <motion.div className="bg-white/5 rounded-3xl border border-white/10 p-6 flex items-center gap-3 text-white/80">
        <ShieldCheck className="w-6 h-6 text-emerald-300" />
        <p>تمام کلمات روی سرور تایید می‌شوند و تقلب به صورت خودکار تشخیص داده می‌شود.</p>
      </motion.div>
    </div>
  );
};

export default BattleLobby;
