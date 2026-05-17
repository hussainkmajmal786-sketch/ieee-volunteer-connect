import React from 'react';
import { UsersRound, PlusCircle, Trash2, Crown } from 'lucide-react';
import { getGrade } from '../../utils/grades';

const TeamList = ({
  teams,
  volunteers,
  setShowTeamModal,
  setSelectedMembers,
  setNewTeamName,
  handleDeleteTeam
}) => {
  return (
    <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UsersRound className="w-5 h-5 text-rose-500" /> Volunteer Teams
        </h2>
        <button
          onClick={() => { setShowTeamModal(true); setSelectedMembers([]); setNewTeamName(''); }}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl transition shadow-md"
        >
          <PlusCircle className="w-4 h-4" /> Make Team
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
        {teams.length === 0 ? (
          <div className="p-8 text-center">
            <UsersRound className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No teams created yet.</p>
            <p className="text-sm text-gray-400 mt-1">Create teams to organize your volunteers.</p>
          </div>
        ) : (
          teams.map((team) => {
            const teamPoints = (team.memberIds || []).reduce((acc, uid) => {
              const vol = volunteers.find(v => v.id === uid);
              return acc + (vol?.points || 0);
            }, 0);
            return (
              <div key={team.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {team.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        {team.name}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                          {team.members?.length || 0} members
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="font-bold text-ieee-blue">{teamPoints} pts</span> • Created {new Date(team.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete Team">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(team.members || []).map((member, i) => {
                    const vol = volunteers.find(v => v.id === member.uid);
                    const grade = getGrade(vol?.points || 0);
                    return (
                      <div key={member.uid} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{member.name}</span>
                        {i === 0 && <Crown className="w-3 h-3 text-amber-500" title="Team Lead" />}
                        <span className={`text-[9px] font-black px-1 py-0.5 rounded ${grade.bgPill} ${grade.textClass}`}>{grade.icon}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeamList;
