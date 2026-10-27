import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Feedback } from '../types';
import { Bot, User as UserIcon, ThumbsUp, ThumbsDown, Copy, Check, Clock, Cpu, RotateCw, AlertTriangle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  existingFeedback?: Feedback;
  onSubmitFeedback: (messageId: string, rating: 'positive' | 'negative', comment?: string) => void;
  onRetry?: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  existingFeedback,
  onSubmitFeedback,
  onRetry,
}) => {
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';
  const [copied, setCopied] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [currentRating, setCurrentRating] = useState<'positive' | 'negative' | null>(
    existingFeedback?.rating || null
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRating = (rating: 'positive' | 'negative') => {
    setCurrentRating(rating);
    setShowCommentBox(true);
    onSubmitFeedback(message._id, rating);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRating) {
      onSubmitFeedback(message._id, currentRating, commentInput);
      setShowCommentBox(false);
    }
  };

  // Determine provider label truthfulness
  const isFallback =
    message.metadata?.fallback_engine === true ||
    (message.model_name && (message.model_name.includes('Fallback') || message.model_name.includes('Deterministic')));

  const isOpenAI =
    message.metadata?.provider === 'openai' ||
    (message.model_name && message.model_name.startsWith('OpenAI'));

  let displayModelBadge = message.model_name || 'AI Assistant';
  if (isOpenAI) {
    displayModelBadge = message.model_name || 'OpenAI · gpt-4o-mini';
  } else if (isFallback) {
    displayModelBadge = 'Offline Fallback';
  }

  return (
    <div
      className={`py-5 px-6 flex gap-4 ${
        isAssistant
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/60'
          : isSystem
          ? 'bg-amber-500/5 border-y border-amber-500/20'
          : 'bg-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isOpenAI
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
            }`}
          >
            <Bot className="w-4 h-4" />
          </div>
        ) : isSystem ? (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content & Action Bar */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-xs ${
                isOpenAI
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isFallback
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {isAssistant ? displayModelBadge : isSystem ? 'System Notice' : 'You'}
            </span>
            <span className="text-[10px] text-slate-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Operational Metrics */}
          {isAssistant && message.response_time_ms && (
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-emerald-500" />
                {message.response_time_ms} ms
              </span>
              {message.token_usage && message.token_usage.total_tokens > 0 && (
                <span className="flex items-center gap-1 font-mono">
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  {message.token_usage.total_tokens} tokens
                </span>
              )}
            </div>
          )}
        </div>

        {/* Markdown Rendered Content */}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans space-y-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-3 mb-1 text-slate-900 dark:text-white" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-1 text-slate-900 dark:text-white" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 text-slate-900 dark:text-white" {...props} />,
              p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-2" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-emerald-500/60 bg-emerald-500/5 px-3 py-2 rounded text-xs text-slate-700 dark:text-slate-300 my-2" {...props} />
              ),
              code: ({ node, className, children, ...props }: any) => {
                const isInline = !className;
                return isInline ? (
                  <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="p-3 my-2 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-3">
                  <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => <th className="border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-100 dark:bg-slate-800 font-semibold" {...props} />,
              td: ({ node, ...props }) => <td className="border-b border-slate-200 dark:border-slate-800 p-2" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Action Controls for Assistant Messages */}
        {isAssistant && (
          <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-slate-200 transition"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRetry && (
              <button
                onClick={() => onRetry(message.content)}
                className="flex items-center gap-1 hover:text-slate-200 transition"
                title="Retry response generation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Retry</span>
              </button>
            )}

            {/* Thumbs Feedback */}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
              <button
                onClick={() => handleRating('positive')}
                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition ${
                  currentRating === 'positive' ? 'text-emerald-500 font-bold' : ''
                }`}
                title="Helpful response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRating('negative')}
                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition ${
                  currentRating === 'negative' ? 'text-rose-500 font-bold' : ''
                }`}
                title="Unhelpful response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Written Comment Modal/Inline Box */}
            {showCommentBox && (
              <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 ml-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Optional feedback details for analytics..."
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex-1 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                >
                  Save
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
