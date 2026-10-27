import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { MessageSquare, Clock, ThumbsUp, Users, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#6366f1', '#eab308'];

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics & Aggregations</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time metrics calculated via MongoDB <code className="text-emerald-500">$group</code>, <code className="text-emerald-500">$match</code>, and <code className="text-emerald-500">$avg</code> pipelines.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Pipeline
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Conversations</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{summary?.total_conversations || 0}</div>
          <p className="text-xs text-slate-400 mt-1">{summary?.active_conversations || 0} active</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Messages</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">{summary?.total_messages || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Stored in MongoDB</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Avg Response Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{summary?.avg_response_time_ms || 0} ms</div>
          <p className="text-xs text-slate-400 mt-1">Computed via $avg pipeline</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Positive Feedback</span>
            <ThumbsUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{summary?.positive_feedback_percentage || 0}%</div>
          <p className="text-xs text-slate-400 mt-1">{summary?.total_feedback_count || 0} total ratings</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Conversations Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-sm mb-4">Daily Conversation Creation (Past 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.daily_conversations || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="conversations" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Messages Volume Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-sm mb-4">Message Throughput History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.charts.daily_messages || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="messages" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Most Active Conversations Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-semibold text-sm mb-4">Top Active Conversations ($sort by message_count)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Messages Count</th>
                <th className="py-2.5 px-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data?.top_conversations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{c.title}</td>
                  <td className="py-2.5 px-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{c.message_count}</td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(c.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
