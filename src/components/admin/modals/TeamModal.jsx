import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersRound, X, CheckSquare } from 'lucide-react';
import Button from '../../Button';
import { getGrade } from '../../../utils/grades';

const TeamModal = ({
  showTeamModal,
  setShowTeamModal,
  newTeamName,
  setNewTeamName,
  volunteers,
  selectedMembers,
  toggleMember,
  handleCreateTeam
}) => {
  return (
    <AnimatePresence>
      {showTeamModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowTeamModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UsersRound className="w-5 h-5 text-rose-500" /> Make Team
              </h3>
              <button onClick={() => setShowTeamModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Web Dev Warriors"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Members ({selectedMembers.length} selected)</label>
                <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
                  {volunteers.map((vol) => {
                    const isSelected = selectedMembers.includes(vol.id);
                    const grade = getGrade(vol.points || 0);
                    return (
                      <button
                        type="button"
                        key={vol.id}
                        onClick={() => toggleMember(vol.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${isSelected ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${isSelected ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                          {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {vol.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{vol.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{vol.email || 'No email'}</p>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${grade.bgPill} ${grade.textClass} shrink-0`}>{grade.icon} {grade.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedMembers.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 border border-rose-100 dark:border-rose-800/30">
                  <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                    👥 Team &quot;{newTeamName || '...'}&quot; will have {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowTeamModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={!newTeamName.trim() || selectedMembers.length === 0} className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50">Create Team</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamModal;
