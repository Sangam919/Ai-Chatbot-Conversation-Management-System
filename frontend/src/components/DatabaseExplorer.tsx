import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DatabaseOverview } from '../types';
import { Database, Table, Key, Terminal, HelpCircle, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

export const DatabaseExplorer: React.FC = () => {
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [predefined, setPredefined] = useState<any[]>([]);
  const [explainPlan, setExplainPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [ov, pd, ep] = await Promise.all([
          api.getDatabaseOverview(),
          api.getPredefinedQueries(),
          api.getExplainPlan(),
        ]);
        setOverview(ov);
        setPredefined(pd);
        setExplainPlan(ep);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">MongoDB Database Explorer</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Academic demonstration environment showcasing Collections, Indexes, Explain Plans, and NoSQL Architecture.
        </p>
      </div>

      {/* Syllabus Unit III: Architecture & Schema Design Notes */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
          <Layers className="w-4 h-4" />
          <span>Syllabus Unit III — Schema Design: Embedding vs. Referencing</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">When We Used Embedding:</h4>
            <p>
              User preferences (theme, language, notification toggles) are stored directly inside the <code className="text-emerald-500">users</code> document.
              This represents bounded 1:1 nested data that is always accessed together with the user profile, eliminating redundant collection lookups.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">When We Used Referencing:</h4>
            <p>
              Conversation messages are stored as independent documents in the <code className="text-emerald-500">messages</code> collection referencing <code className="text-emerald-500">conversation_id</code>.
              This prevents violation of MongoDB's <strong>16MB document size limit</strong> and avoids document growth fragmentation.
            </p>
          </div>
        </div>
      </div>

      {/* Collections & Indexes Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-500" />
          Active MongoDB Collections & Index Definitions (Unit II & IV)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview?.collections.map((col) => (
            <div key={col.name} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-emerald-500">{col.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {col.document_count} documents
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Indexes:
                </span>
                <div className="space-y-1">
                  {col.indexes.map((idx) => (
                    <div key={idx.name} className="text-xs flex items-center justify-between font-mono p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                      <span>{idx.name}</span>
                      {idx.unique && <span className="text-[10px] text-amber-500 font-sans font-medium">UNIQUE</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Query Optimization: Explain Plan (Unit IV) */}
      {explainPlan && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Key className="w-4 h-4" />
            <span>Unit IV: Query Optimization & MongoDB Explain Plan</span>
          </div>
          <p className="text-xs text-slate-400">{explainPlan.academic_explanation}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Stage</span>
              <div className="font-mono font-bold text-sm text-emerald-500">{explainPlan.winning_stage}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Execution Time</span>
              <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{explainPlan.execution_summary?.executionTimeMillis} ms</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Docs Examined</span>
              <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{explainPlan.execution_summary?.totalDocsExamined}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Keys Examined</span>
              <div className="font-mono font-bold text-sm text-indigo-400">{explainPlan.execution_summary?.totalKeysExamined}</div>
            </div>
          </div>
        </div>
      )}

      {/* Predefined Query Demonstrations */}
      <div className="space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" />
          Predefined Live Query Executions
        </h3>
        <div className="space-y-4">
          {predefined.map((q, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">{q.unit}</span>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{q.title}</h4>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800">
                {q.mongo_shell}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Live Results from MongoDB:
                </span>
                <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-800">
                  {JSON.stringify(q.results, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
