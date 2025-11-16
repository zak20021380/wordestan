const EMOJIS = ['🔥', '👏', '😮', '💪', '🎯', '⚡'];

const QuickChat = ({ onSend }) => (
  <div className="flex flex-wrap gap-2 bg-white/5 rounded-2xl border border-white/10 p-3 justify-center">
    {EMOJIS.map((emoji) => (
      <button
        key={emoji}
        onClick={() => onSend(emoji)}
        className="text-2xl hover:scale-110 transition-transform"
      >
        {emoji}
      </button>
    ))}
  </div>
);

export default QuickChat;
