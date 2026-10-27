import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Sparkles, Shield, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (type: 'student' | 'admin') => {
    if (type === 'student') {
      setEmail('student@demo.com');
      setPassword('Student@123456');
    } else {
      setEmail('admin@demo.com');
      setPassword('Admin@123456');
    }
    setIsRegister(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isRegister ? 'Create an Account' : 'Welcome to ChatFlow NoSQL'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI Conversation Management with MongoDB
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-2 px-3 text-sm font-medium rounded-xl border text-center transition ${
                      role === 'user'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Student / User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 text-sm font-medium rounded-xl border text-center transition ${
                      role === 'admin'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Faculty / Admin
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Demo Logins (Auto-Seeded Accounts):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('student')}
                className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition text-left"
              >
                🎓 Student Demo
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                className="text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition text-left"
              >
                🛡️ Admin / Faculty
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
