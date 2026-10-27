import React, { useState } from 'react';
import { Send, CornerDownLeft, Sparkles, Loader2 } from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
      <div className="max-w-4xl mx-auto relative bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm focus-within:border-emerald-500/60 transition">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message or prompt here... (Press Enter to send, Shift+Enter for new line)"
          className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none"
        />

        <div className="px-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>MongoDB Persisted Engine</span>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow transition"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
