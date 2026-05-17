import React from 'react';
import { Users, UsersRound, CheckSquare, TrendingUp } from 'lucide-react';

const AnalyticsGrid = ({ volunteers, teams, adminTasks, events, totalPoints }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volunteers</span>
        </div>
        <p className="text-3xl font-black text-gray-900 dark:text-white">{volunteers.length}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {volunteers.filter(v => (v.points || 0) >= 100).length} high performers ({'>'}100 pts)
        </p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
            <UsersRound className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teams</span>
        </div>
        <p className="text-3xl font-black text-gray-900 dark:text-white">{teams.length}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)} members across teams
        </p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task Completion</span>
        </div>
        <p className="text-3xl font-black text-gray-900 dark:text-white">
          {adminTasks.length > 0 ? Math.round((adminTasks.filter(t => {
            const evt = events.find(e => e.id === t.eventId);
            return evt && (evt.participants || 0) >= (t.target || 1);
          }).length / adminTasks.length) * 100) : 0}%
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          {adminTasks.filter(t => { const evt = events.find(e => e.id === t.eventId); return evt && (evt.participants || 0) >= (t.target || 1); }).length}/{adminTasks.length} tasks completed
        </p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Points</span>
        </div>
        <p className="text-3xl font-black text-gray-900 dark:text-white">
          {volunteers.length > 0 ? Math.round(totalPoints / volunteers.length) : 0}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">per volunteer average</p>
      </div>
    </div>
  );
};

export default AnalyticsGrid;
