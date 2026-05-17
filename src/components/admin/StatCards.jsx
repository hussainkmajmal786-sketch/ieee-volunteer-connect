import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ name, value, icon: Icon, color, bg, accent, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
  >
    <div className={`relative overflow-hidden rounded-2xl p-5 border border-gray-100 dark:border-gray-800 transition-colors ${bg}`}>
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-xl`} />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-gray-900/50 shadow-sm">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white relative z-10">{value}</p>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1 relative z-10">{name}</p>
    </div>
  </motion.div>
);

const StatCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      {stats.map((s, i) => (
        <StatCard key={s.name} {...s} index={i} />
      ))}
    </div>
  );
};

export default StatCards;
