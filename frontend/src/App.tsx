import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { Conversation, Message, Feedback } from './types';
import { Bot, Sparkles, MessageSquare, Terminal, Database, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'db-explorer' | 'settings'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations when user or statusFilter changes
  const loadConversations = async () => {
    if (!token) return;
    try {
      const list = await api.getConversations(statusFilter, searchQuery);
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token, statusFilter, searchQuery]);

  // Load messages when activeConvId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConvId || !token) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const msgs = await api.getMessages(activeConvId);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [activeConvId, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new conversation
  const handleNewChat = async () => {
    try {
      const newConv = await api.createConversation('New Conversation');
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv._id);
      setActiveTab('chat');
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!activeConvId) {
      // Auto-create conversation first
      try {
        const newConv = await api.createConversation(content.slice(0, 30));
        setConversations([newConv, ...conversations]);
        setActiveConvId(newConv._id);
        await postMessage(newConv._id, content);
      } catch (err) {
        console.error(err);
      }
    } else {
      await postMessage(activeConvId, content);
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');

  const postMessage = async (convId: string, content: string) => {
    setIsSending(true);
    setErrorMessage(null);
    setLastUserPrompt(content);

    // Optimistic user message
    const tempUserMsg: Message = {
      _id: `temp-${Date.now()}`,
      conversation_id: convId,
      user_id: user?._id || '',
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      await api.sendMessage(convId, content);
      // Refresh messages list to get exact IDs and timestamps
      const updatedList = await api.getMessages(convId);
      setMessages(updatedList);
      // Reload conversations to update title & message counts
      loadConversations();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate assistant response.');
      // Refresh messages in case user message was saved
      try {
        const currentList = await api.getMessages(convId);
        setMessages(currentList);
      } catch {
        // ignore
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryLast = () => {
    if (activeConvId && lastUserPrompt) {
      postMessage(activeConvId, lastUserPrompt);
    }
  };

  // Rename conversation
  const handleRename = async (id: string, newTitle: string) => {
    try {
      const updated = await api.updateConversation(id, { title: newTitle });
      setConversations(conversations.map((c) => (c._id === id ? updated : c)));
    } catch (err) {
      console.error(err);
    }
  };

  // Archive / Unarchive conversation
  const handleArchive = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await api.updateConversation(id, { status: nextStatus });
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete conversation
  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this conversation and its message history from MongoDB?')) {
      try {
        await api.deleteConversation(id, true);
        const remaining = conversations.filter((c) => c._id !== id);
        setConversations(remaining);
        if (activeConvId === id) {
          setActiveConvId(remaining.length > 0 ? remaining[0]._id : null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Feedback submit
  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative', comment?: string) => {
    if (!activeConvId) return;
    try {
      const fb = await api.submitFeedback({
        message_id: messageId,
        conversation_id: activeConvId,
        rating,
        comment,
      });
      setFeedbacks((prev) => ({ ...prev, [messageId]: fb }));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-emerald-500 animate-pulse" />
          <span className="font-semibold text-sm">Loading ChatFlow System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {!user && <AuthModal />}

      {/* Reactive Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={setActiveConvId}
        onNewChat={handleNewChat}
        onRenameConversation={handleRename}
        onArchiveConversation={handleArchive}
        onDeleteConversation={handleDelete}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
        {activeTab === 'chat' && (
          <>
            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto space-y-6">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl shadow-inner">
                    <Bot className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      AI Conversation Management System
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Fully powered by MongoDB NoSQL database. Every prompt, assistant reply, latency metric, and feedback rating is persisted and indexed in real-time.
                    </p>
                  </div>

                  {/* Academic Suggested Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                    <button
                      onClick={() => handleSendMessage('Explain how MongoDB aggregation pipeline handles $group and $match.')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/20 text-xs text-slate-700 dark:text-slate-300 transition"
                    >
                      <span className="font-semibold block text-slate-900 dark:text-white mb-1">Explain Aggregation Query</span>
                      How $match and $group operate sequentially in MongoDB.
                    </button>
                    <button
                      onClick={() => handleSendMessage('Why is referencing preferred over embedding for conversation messages?')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/20 text-xs text-slate-700 dark:text-slate-300 transition"
                    >
                      <span className="font-semibold block text-slate-900 dark:text-white mb-1">Embedding vs Referencing</span>
                      BSON document limits and growth considerations.
                    </button>
                    <button
                      onClick={() => handleSendMessage('Help me write Python code with PyMongo to query documents.')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/20 text-xs text-slate-700 dark:text-slate-300 transition"
                    >
                      <span className="font-semibold block text-slate-900 dark:text-white mb-1">PyMongo Integration</span>
                      Python connection pooling and CRUD operations.
                    </button>
                    <button
                      onClick={() => handleSendMessage('Summarize CAP Theorem trade-offs in distributed NoSQL databases.')}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/20 text-xs text-slate-700 dark:text-slate-300 transition"
                    >
                      <span className="font-semibold block text-slate-900 dark:text-white mb-1">CAP Theorem</span>
                      Consistency, Availability, and Partition Tolerance in MongoDB.
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pb-8">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg._id}
                      message={msg}
                      existingFeedback={feedbacks[msg._id]}
                      onSubmitFeedback={handleFeedback}
                      onRetry={msg.role === 'assistant' ? handleRetryLast : undefined}
                    />
                  ))}
                  {isSending && (
                    <div className="py-4 px-6 flex items-center gap-3 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
                      <Bot className="w-5 h-5 text-emerald-500 animate-pulse" />
                      <span>Generating response...</span>
                    </div>
                  )}
                  {errorMessage && (
                    <div className="mx-6 my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Error:</span>
                        <span>{errorMessage}</span>
                      </div>
                      <button
                        onClick={handleRetryLast}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-medium transition"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Composer */}
            <ChatComposer onSendMessage={handleSendMessage} isLoading={isSending} />
          </>
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'db-explorer' && <DatabaseExplorer />}
      </main>
    </div>
  );
};
export default App;
