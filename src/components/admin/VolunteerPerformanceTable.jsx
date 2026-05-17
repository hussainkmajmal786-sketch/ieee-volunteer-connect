import React from 'react';
import { Activity } from 'lucide-react';
import { getGrade, getEarnedBadges } from '../../utils/grades';

const VolunteerPerformanceTable = ({ volunteers, adminTasks, teams, totalPoints }) => {
  const sortedVolunteers = [...volunteers].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-500" /> Volunteer Performance Tracking
        </h2>
        <p className="text-xs text-gray-400 mt-1">Detailed breakdown of each volunteer&apos;s contributions and activity</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Volunteer</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Tasks Done</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Teams</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Badges</th>
              <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {sortedVolunteers.map((vol, i) => {
              const grade = getGrade(vol.points || 0);
              const badges = getEarnedBadges(vol);
              const tasksCompleted = adminTasks.filter(t => t.completedBy?.includes(vol.id)).length;
              const teamsIn = teams.filter(t => t.memberIds?.includes(vol.id)).length;
              const performancePct = volunteers.length > 0 && totalPoints > 0 ? Math.round(((vol.points || 0) / (totalPoints / volunteers.length)) * 50) : 0;
              const cappedPct = Math.min(100, performancePct);
              return (
                <tr key={vol.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                  <td className="px-5 py-3">
                    <span className={`text-sm font-black ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>#{i + 1}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-xs font-bold`}>
                        {vol.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{vol.name}</p>
                        <p className="text-[10px] text-gray-400">{vol.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${grade.bgPill} ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-black text-ieee-blue dark:text-cyan-400">{vol.points || 0}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{tasksCompleted}/{adminTasks.length}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{teamsIn}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-0.5">
                      {badges.length > 0 ? badges.slice(0, 4).map(b => (
                        <span key={b.id} className="text-sm" title={b.name}>{b.icon}</span>
                      )) : <span className="text-xs text-gray-300">—</span>}
                      {badges.length > 4 && <span className="text-[10px] text-gray-400 ml-1">+{badges.length - 4}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cappedPct >= 80 ? 'bg-green-500' : cappedPct >= 50 ? 'bg-ieee-blue' : cappedPct >= 25 ? 'bg-amber-500' : 'bg-gray-400'}`}
                          style={{ width: `${cappedPct}%` }} />
                      </div>
                      <span className={`text-[10px] font-black ${cappedPct >= 80 ? 'text-green-500' : cappedPct >= 50 ? 'text-ieee-blue' : cappedPct >= 25 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {cappedPct >= 80 ? 'Excellent' : cappedPct >= 50 ? 'Good' : cappedPct >= 25 ? 'Average' : 'Low'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {volunteers.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No volunteer data to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerPerformanceTable;
