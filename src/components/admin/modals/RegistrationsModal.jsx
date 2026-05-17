import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, User } from 'lucide-react';
import Button from '../../Button';

const RegistrationsModal = ({
  showRegistrationsModal,
  setShowRegistrationsModal,
  regEventName,
  registrations,
  loadingRegs,
  exportRegistrations
}) => {
  return (
    <AnimatePresence>
      {showRegistrationsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowRegistrationsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Registrations</h3>
                <p className="text-sm text-gray-500 mt-0.5">{regEventName} — {registrations.length} registration{registrations.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportRegistrations}
                  disabled={registrations.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-ieee-blue text-white rounded-xl text-sm font-bold hover:bg-ieee-blue/90 transition shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={() => setShowRegistrationsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              {loadingRegs ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">Loading participants...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <User className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No registrations yet</p>
                  <p className="text-sm">When students register, they will appear here.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Participant</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Institution</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{reg.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">{reg.year || 'Student'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{reg.email}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{reg.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-tight">{reg.college}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                            {reg.registeredAt?.toDate ? reg.registeredAt.toDate().toLocaleDateString() : new Date(reg.registeredAt).toLocaleDateString()}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 shrink-0">
              <Button onClick={() => setShowRegistrationsModal(false)} variant="outline" className="w-full">Close View</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationsModal;
