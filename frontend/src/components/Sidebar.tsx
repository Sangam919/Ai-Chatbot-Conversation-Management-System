import React, { useState } from 'react';
import { Conversation } from '../types';
import { 
  Bot, Plus, Search, Archive, Trash2, Edit3, MessageSquare, 
  BarChart3, Database, User, LogOut, Moon, Sun, Check, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onArchiveConversation: (id: string, currentStatus: string) => void;
  onDeleteConversation: (id: string) => void;
  activeTab: 'chat' | 'analytics' | 'db-explorer' | 'settings';
  setActiveTab: (tab: 'chat' | 'analytics' | 'db-explorer' | 'settings') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onArchiveConversation,
  onDeleteConversation,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  const { user, logout, updateUserPreferences } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const toggleTheme = () => {
    const nextTheme = user?.preferences?.theme === 'dark' ? 'light' : 'dark';
    updateUserPreferences(nextTheme, user?.preferences?.language || 'en');
  };

  return (
    <aside className="w-80 h-screen bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm tracking-tight">ChatFlow NoSQL</h1>
            <p className="text-[10px] text-slate-500 font-medium">MongoDB AI Manager</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          {user?.preferences?.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="p-3 border-b border-slate-800/60 grid grid-cols-3 gap-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'chat'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'analytics'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('db-explorer')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'db-explorer'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Explorer
        </button>
      </div>

      {/* Action / Search Bar */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/60 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 text-[11px]">
          {['active', 'archived', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2 py-0.5 rounded capitalize ${
                statusFilter === filter
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-500">
            No conversations found.
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => {
                onSelectConversation(conv._id);
                setActiveTab('chat');
              }}
              className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition border ${
                activeConvId === conv._id && activeTab === 'chat'
                  ? 'bg-slate-800/90 text-white border-slate-700 font-medium'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                {editingId === conv._id ? (
                  <form onSubmit={(e) => saveRename(conv._id, e)} className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-slate-900 px-1.5 py-0.5 rounded text-xs text-white border border-emerald-500 w-full outline-none"
                    />
                    <button type="submit" className="text-emerald-400 hover:text-emerald-300">
                      <Check className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-slate-500">
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <span className="truncate">{conv.title}</span>
                )}
              </div>

              {/* Action Buttons on Hover */}
              {editingId !== conv._id && (
                <div className="hidden group-hover:flex items-center gap-1 text-slate-500">
                  <button
                    onClick={(e) => startRename(conv, e)}
                    title="Rename"
                    className="p-1 hover:text-slate-200 hover:bg-slate-700/50 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveConversation(conv._id, conv.status);
                    }}
                    title={conv.status === 'archived' ? 'Unarchive' : 'Archive'}
                    className="p-1 hover:text-slate-200 hover:bg-slate-700/50 rounded"
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv._id);
                    }}
                    title="Delete"
                    className="p-1 hover:text-rose-400 hover:bg-slate-700/50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role} Mode</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
