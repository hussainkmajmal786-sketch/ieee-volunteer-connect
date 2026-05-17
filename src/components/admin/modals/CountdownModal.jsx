import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Calendar } from 'lucide-react';
import Button from '../../Button';

const CountdownModal = ({
  showCountdownModal,
  setShowCountdownModal,
  countdownEvent,
  countdownDate,
  setCountdownDate,
  handleSetCountdown
}) => {
  return (
    <AnimatePresence>
      {showCountdownModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowCountdownModal(false)}
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
                <Timer className="w-5 h-5 text-violet-500" /> Set Event Countdown
              </h3>
              <button onClick={() => setShowCountdownModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 border border-violet-100 dark:border-violet-800/30">
                <p className="text-sm text-violet-700 dark:text-violet-300 font-medium font-bold">
                  ⏱️ Setting a countdown for <strong>{countdownEvent?.name}</strong>.
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-medium">This will show a live timer on the event list for all students.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Countdown End Date &amp; Time</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={countdownDate}
                    onChange={(e) => setCountdownDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCountdownModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSetCountdown} disabled={!countdownDate} className="flex-1 bg-violet-600 hover:bg-violet-700 border-none text-white shadow-lg shadow-violet-500/20">
                  Set Countdown
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CountdownModal;
