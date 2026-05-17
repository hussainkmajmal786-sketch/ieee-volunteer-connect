import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Users } from 'lucide-react';
import { getGrade } from '../../utils/grades';

const TopVolunteers = ({ volunteers }) => {
  const sortedVolunteers = [...volunteers].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
        <Crown className="w-5 h-5 text-amber-500" /> Top Volunteers
      </h2>
      {volunteers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No volunteers yet</p>
        </div>
      ) : (
        <div>
          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-4 mb-6 h-44">
            {[1, 0, 2].map((rank) => {
              const vol = sortedVolunteers[rank];
              if (!vol) return <div key={rank} className="flex-1" />;
              const grade = getGrade(vol.points || 0);
              const heights = ['h-36', 'h-24', 'h-20'];
              const medals = ['🥇', '🥈', '🥉'];
              const sizes = ['w-14 h-14 text-lg', 'w-11 h-11 text-sm', 'w-10 h-10 text-sm'];
              return (
                <motion.div
                  key={vol.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + rank * 0.1 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="relative mb-2">
                    <div className={`${sizes[rank]} rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {vol.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="absolute -top-1 -right-1 text-sm">{medals[rank]}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white text-center truncate w-full">{vol.name?.split(' ')[0]}</p>
                  <p className="text-[10px] font-black text-ieee-blue dark:text-cyan-400">{vol.points || 0} pts</p>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded mt-1 ${grade.bgPill} ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                  <div className={`w-full ${heights[rank]} bg-gradient-to-t from-ieee-blue/20 to-transparent rounded-t-xl mt-2 relative`}>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-ieee-blue to-cyan-400 rounded-full" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Remaining top volunteers */}
          <div className="space-y-2">
            {sortedVolunteers.slice(3, 8).map((vol, i) => {
              const grade = getGrade(vol.points || 0);
              return (
                <div key={vol.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <span className="text-xs font-black text-gray-400 w-5 text-center">#{i + 4}</span>
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {vol.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{vol.name}</p>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${grade.bgPill} ${grade.textClass}`}>{grade.icon}</span>
                  <span className="text-xs font-black text-ieee-blue dark:text-cyan-400">{vol.points || 0} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopVolunteers;
