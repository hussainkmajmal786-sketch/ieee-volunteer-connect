import React from 'react';
import { ListChecks, PlusCircle, Target, Calendar, Trash2 } from 'lucide-react';

const TaskList = ({
  adminTasks,
  events,
  setShowTaskModal,
  handleDeleteTask
}) => {
  return (
    <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-violet-500" /> Volunteer Tasks
        </h2>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-500 hover:bg-violet-600 px-4 py-2 rounded-xl transition shadow-md"
        >
          <PlusCircle className="w-4 h-4" /> Create Task
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
        {adminTasks.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No tasks created yet.</p>
            <p className="text-sm text-gray-400 mt-1">Create tasks with targets for volunteers to auto-complete.</p>
          </div>
        ) : (
          adminTasks.map((task) => {
            const linkedEvent = events.find(e => e.id === task.eventId);
            const currentProgress = linkedEvent?.participants || 0;
            const targetMet = currentProgress >= (task.target || 1);
            const progressPct = Math.min(100, Math.round((currentProgress / (task.target || 1)) * 100));
            return (
              <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hidden sm:block">
                  {linkedEvent?.imageUrl ? (
                    <img src={linkedEvent.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ieee-blue/40 bg-ieee-blue/5">
                      <Target className="w-4 h-4 mb-1" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{task.title}</h3>
                    {targetMet ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 shrink-0">✓ Target Met</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">In Progress</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.event || 'General'}</span>
                    <span className="flex items-center gap-1 font-bold text-ieee-blue">+{task.points} pts</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {currentProgress}/{task.target} {task.targetType}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${targetMet ? 'bg-green-500' : 'bg-gradient-to-r from-ieee-blue to-cyan-400'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs font-bold text-gray-400">{task.completedBy?.length || 0} completed</span>
                  <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete Task">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskList;
