import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X } from 'lucide-react';
import Button from '../../Button';
import { getGrade } from '../../../utils/grades';

const GiveRewardModal = ({
  showGiveRewardModal,
  setShowGiveRewardModal,
  selectedVolunteerForReward,
  setSelectedVolunteerForReward,
  selectedRewardToGive,
  setSelectedRewardToGive,
  volunteers,
  rewards,
  handleGiveReward
}) => {
  return (
    <AnimatePresence>
      {showGiveRewardModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowGiveRewardModal(false)}
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
                <Award className="w-5 h-5 text-ieee-blue" /> Give Reward
              </h3>
              <button onClick={() => setShowGiveRewardModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGiveReward} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Volunteer</label>
                <select
                  value={selectedVolunteerForReward}
                  onChange={(e) => setSelectedVolunteerForReward(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none"
                  required
                >
                  <option value="">Select a volunteer...</option>
                  {[...volunteers]
                    .filter(v => v.role === 'VOLUNTEER')
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((vol) => {
                      const grade = getGrade(vol.points || 0);
                      return (
                        <option key={vol.id} value={vol.id}>
                          {vol.name} ({vol.points || 0} pts - {grade.name})
                        </option>
                      );
                    })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Reward to Give</label>
                <select
                  value={selectedRewardToGive}
                  onChange={(e) => setSelectedRewardToGive(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none"
                  required
                >
                  <option value="">Select a reward...</option>
                  {rewards.map((reward) => (
                    <option key={reward.id} value={reward.id} disabled={(reward.quantity || 0) < 1}>
                      {reward.icon} {reward.name} — {reward.points} pts {(reward.quantity || 0) < 1 ? '(out of stock)' : `(${reward.quantity} in stock)`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedVolunteerForReward && selectedRewardToGive && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium pb-1 flex items-center gap-2">
                    🎁 Granting <strong>{rewards.find(r => r.id === selectedRewardToGive)?.name}</strong>
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    to volunteer <strong>{volunteers.find(v => v.id === selectedVolunteerForReward)?.name}</strong>.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowGiveRewardModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={!selectedVolunteerForReward || !selectedRewardToGive} className="flex-1 bg-ieee-blue hover:bg-ieee-blue/90 disabled:opacity-50 border-none text-white">Give Reward</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiveRewardModal;
