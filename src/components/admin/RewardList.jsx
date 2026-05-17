import React from 'react';
import { Gift, Award, PlusCircle, Trash2 } from 'lucide-react';

const RewardList = ({
  rewards,
  setShowGiveRewardModal,
  setSelectedVolunteerForReward,
  setSelectedRewardToGive,
  setShowRewardModal,
  handleDeleteReward
}) => {
  return (
    <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-500" /> Reward Store
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowGiveRewardModal(true); setSelectedVolunteerForReward(''); setSelectedRewardToGive(''); }}
            className="flex items-center gap-1.5 text-xs font-bold text-ieee-blue bg-ieee-blue/10 hover:bg-ieee-blue hover:text-white px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Award className="w-4 h-4" /> Give Reward
          </button>
          <button
            onClick={() => setShowRewardModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-xl transition shadow-md"
          >
            <PlusCircle className="w-4 h-4" /> Create Reward
          </button>
        </div>
      </div>
      <div className="p-5 overflow-x-auto">
        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No rewards created yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add rewards that volunteers can earn or you can give.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(reward => (
              <div key={reward.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-gray-800 shrink-0">
                    {reward.icon || '🎁'}
                  </div>
                  <button onClick={() => handleDeleteReward(reward.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition hover:bg-white dark:hover:bg-gray-900 rounded-md shrink-0 border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{reward.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{reward.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-black text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-2 py-1 rounded-md">
                    {reward.points} pts
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 items-center justify-center">
                    {reward.quantity} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardList;
