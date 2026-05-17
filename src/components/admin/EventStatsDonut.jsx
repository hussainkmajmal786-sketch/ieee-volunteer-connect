import React from 'react';
import { BarChart2 } from 'lucide-react';

const EventStatsDonut = ({ events }) => {
  const cats = {};
  events.forEach(e => {
    const cat = e.category || 'Other';
    if (!cats[cat]) cats[cat] = { count: 0, participants: 0 };
    cats[cat].count++;
    cats[cat].participants += (e.participants || 0);
  });
  const catEntries = Object.entries(cats);
  const catColors = ['from-blue-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-violet-500 to-purple-400', 'from-amber-500 to-orange-400', 'from-rose-500 to-pink-400', 'from-indigo-500 to-blue-400'];
  const catBgs = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
        <BarChart2 className="w-5 h-5 text-cyan-500" /> Event Statistics
      </h2>
      <div className="flex items-center gap-6 mb-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {(() => {
              let offset = 0;
              const total = events.length || 1;
              const strokeColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#6366f1'];
              return catEntries.map(([cat, data], i) => {
                const pct = (data.count / total) * 100;
                const dash = `${pct} ${100 - pct}`;
                const el = (
                  <circle key={cat} cx="18" cy="18" r="15.915" fill="transparent" stroke={strokeColors[i % strokeColors.length]}
                    strokeWidth="3.5" strokeDasharray={dash} strokeDashoffset={-offset} strokeLinecap="round" />
                );
                offset += pct;
                return el;
              });
            })()}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-white">{events.length}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Events</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {catEntries.map(([cat, data], i) => (
            <div key={cat} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${catBgs[i % catBgs.length]} shrink-0`} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{cat}</span>
              <span className="text-xs font-bold text-gray-500">{data.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {catEntries.map(([cat, data], i) => (
          <div key={cat} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat}</span>
              <span className="text-xs font-bold text-gray-500">{data.participants} registrations</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${catColors[i % catColors.length]}`}
                style={{ width: `${(events.length > 0 ? (data.count / events.length) * 100 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventStatsDonut;
