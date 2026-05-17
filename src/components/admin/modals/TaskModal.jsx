import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Target, Calendar } from 'lucide-react';
import Button from '../../Button';

const TaskModal = ({
  showTaskModal,
  setShowTaskModal,
  newTask,
  setNewTask,
  events,
  volunteers,
  selectedTaskVolunteers,
  setSelectedTaskVolunteers,
  handleCreateTask
}) => {
  return (
    <AnimatePresence>
      {showTaskModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowTaskModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Volunteer Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Get 10 registrations for AI Bootcamp"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Link to Event</label>
                <select
                  value={newTask.eventId}
                  onChange={(e) => {
                    const selectedEvt = events.find((ev) => ev.id === e.target.value);
                    setNewTask({ ...newTask, eventId: e.target.value, event: selectedEvt?.name || '' });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  required
                >
                  <option value="">Select an event...</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.name} ({evt.participants || 0} registrations)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Points</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={newTask.points}
                      onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Target</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={newTask.target}
                      onChange={(e) => setNewTask({ ...newTask, target: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select
                    value={newTask.targetType}
                    onChange={(e) => setNewTask({ ...newTask, targetType: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="registrations">Registrations</option>
                    <option value="shares">Shares</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Deadline (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mar 15, 2026"
                  value={newTask.date}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => {
                    setNewTask({ ...newTask, assignedTo: e.target.value });
                    if (e.target.value === 'all') setSelectedTaskVolunteers([]);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="all">All Volunteers</option>
                  <option value="specific">Specific Volunteers</option>
                </select>
                {newTask.assignedTo === 'specific' && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
                    {volunteers.filter((v) => v.role === 'VOLUNTEER' || v.role === 'STUDENT').length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-2">No volunteers found</p>
                    ) : (
                      volunteers
                        .filter((v) => v.role === 'VOLUNTEER' || v.role === 'STUDENT')
                        .map((vol) => (
                          <label
                            key={vol.id}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition ${selectedTaskVolunteers.includes(vol.id) ? 'bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTaskVolunteers.includes(vol.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTaskVolunteers([...selectedTaskVolunteers, vol.id]);
                                } else {
                                  setSelectedTaskVolunteers(selectedTaskVolunteers.filter((id) => id !== vol.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block truncate">{vol.name || vol.email}</span>
                              <span className="text-[10px] text-gray-400">{vol.branch || 'IEEE Branch'} • {vol.points || 0} pts</span>
                            </div>
                          </label>
                        ))
                    )}
                    {selectedTaskVolunteers.length > 0 && (
                      <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold px-3 pt-1">
                        {selectedTaskVolunteers.length} volunteer(s) selected
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                <p className="text-sm text-violet-700 dark:text-violet-300 font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" /> Task will <strong>auto-complete</strong> when each volunteer reaches {newTask.target || '?'} {newTask.targetType} via their personal referral link
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-violet-500 hover:bg-violet-600">Create Task</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;
