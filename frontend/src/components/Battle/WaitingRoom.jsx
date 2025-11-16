import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const WaitingRoom = ({ message = 'جستجوی حریف...', onCancel, battleCode }) => (
  <div className="bg-glass backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center space-y-4">
    <Loader2 className="w-12 h-12 text-primary-300 animate-spin mx-auto" />
    <p className="text-white text-xl font-bold">{message}</p>
    {battleCode && (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
        <p className="text-white/70 text-sm">کد نبرد</p>
        <p className="text-white text-3xl tracking-[0.5rem] font-black">{battleCode}</p>
      </div>
    )}
    {onCancel && (
      <button onClick={onCancel} className="text-white/70 hover:text-white">
        لغو
      </button>
    )}
  </div>
);

export default WaitingRoom;
