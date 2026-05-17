import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const ParticipantAnalytics = ({ events, totalParticipants, maxParticipants }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-emerald-500" /> Participant Analytics
      </h2>
      <div className="space-y-3">
        {events.slice().sort((a, b) => (b.participants || 0) - (a.participants || 0)).slice(0, 8).map((evt, i) => {
          const pct = maxParticipants > 0 ? ((evt.participants || 0) / maxParticipants) * 100 : 0;
          return (
            <div key={evt.id} className="group">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[10px] font-black w-5 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{evt.name}</span>
                    <span className="text-xs font-black text-ieee-blue dark:text-cyan-400 ml-2 shrink-0">{evt.participants || 0}</span>
                  </div>
                </div>
              </div>
              <div className="ml-8 w-[calc(100%-2rem)] h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                  className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-ieee-blue to-cyan-400'}`}
                />
              </div>
            </div>
          );
        })}
        {events.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No events to analyze</p>}
      </div>
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-black text-gray-900 dark:text-white">{totalParticipants}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
        </div>
        <div>
          <p className="text-lg font-black text-gray-900 dark:text-white">{events.length > 0 ? Math.round(totalParticipants / events.length) : 0}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Avg / Event</p>
        </div>
        <div>
          <p className="text-lg font-black text-gray-900 dark:text-white">{events.length > 0 ? Math.max(...events.map(e => e.participants || 0)) : 0}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Peak</p>
        </div>
      </div>
    </div>
  );
};

export default ParticipantAnalytics;
