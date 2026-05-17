import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';

const ActivityChart = ({ events, maxParticipants, viewRegistrations }) => {
  const barGradients = [
    'from-blue-500 to-cyan-400',
    'from-violet-500 to-purple-400',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-pink-400',
    'from-indigo-500 to-blue-400'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-ieee-blue" /> Event Registrations
        </h2>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{events.length} Events</span>
      </div>
      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        <div className="flex items-end gap-3 h-40 min-w-[600px] sm:min-w-full px-2">
          {events.slice(0, 12).map((evt, i) => {
            const h = Math.max(8, ((evt.participants || 0) / maxParticipants) * 100);
            const gradient = barGradients[i % barGradients.length];
            return (
              <motion.div
                key={evt.id}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 100 }}
                className={`flex-1 min-w-[32px] rounded-t-lg bg-gradient-to-t ${gradient} relative group cursor-pointer hover:opacity-90 transition shadow-sm`}
                onClick={() => viewRegistrations(evt.id, evt.name)}
                title={`${evt.name}: ${evt.participants || 0} registrations`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none z-10">
                  {evt.participants || 0}
                </div>
              </motion.div>
            );
          })}
          {events.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">No events recorded yet</div>
          )}
        </div>
        <div className="flex gap-3 mt-6 min-w-[600px] sm:min-w-full px-2">
          {events.slice(0, 12).map((evt) => (
            <div key={evt.id} className="flex-1 min-w-[32px] text-center">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight block truncate rotate-[-25deg] origin-top-left translate-x-1 mt-1" title={evt.name}>
                {evt.name?.length > 10 ? evt.name.slice(0, 8) + '..' : evt.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityChart;
