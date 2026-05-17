import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Mail } from 'lucide-react';
import Button from '../../Button';

const NotifyModal = ({
  showNotifyModal,
  setShowNotifyModal,
  notifyEvent,
  notifyMessage,
  setNotifyMessage,
  handleNotify
}) => {
  return (
    <AnimatePresence>
      {showNotifyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowNotifyModal(false)}
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
                <Bell className="w-5 h-5 text-amber-500" /> Notify Registrants
              </h3>
              <button onClick={() => setShowNotifyModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/30">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  📢 Send a notification to all <strong>{notifyEvent?.participants || 0}</strong> students registered for <strong>{notifyEvent?.name}</strong>.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notification Message</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    placeholder="Type your message here... (e.g. Venue changed to Seminar Hall 2)"
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 outline-none resize-none h-32 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowNotifyModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleNotify} disabled={!notifyMessage.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 border-none text-white shadow-lg shadow-amber-500/20">
                  Send Notification
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotifyModal;
