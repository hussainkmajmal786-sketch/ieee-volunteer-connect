import React from 'react';
import { Calendar, Search, Image, Clock, MapPin, Users, Eye, Bell, Timer, Edit2, Trash2 } from 'lucide-react';

const EventList = ({
  filteredEvents,
  searchEvents,
  setSearchEvents,
  viewRegistrations,
  setNotifyEvent,
  setShowNotifyModal,
  setCountdownEvent,
  setCountdownDate,
  setShowCountdownModal,
  openEditModal,
  handleDeleteEvent
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-ieee-blue" /> Manage Events
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchEvents}
            onChange={(e) => setSearchEvents(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none"
          />
        </div>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <p className="p-5 text-center text-gray-500">No events found. Create one above!</p>
        ) : (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition min-w-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-ieee-blue/20 to-cyan-500/20 flex items-center justify-center">
                {evt.imageUrl ? (
                  <img src={evt.imageUrl} alt={evt.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Image className="w-6 h-6 text-ieee-blue/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <span className="truncate">{evt.name}</span>
                  <span className="bg-ieee-blue/10 text-ieee-blue text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shrink-0">{evt.category || 'Event'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" /> {evt.date}</span>
                  <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{evt.venue}</span></span>
                  <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3" /> {evt.participants || 0}</span>
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button onClick={() => viewRegistrations(evt.id, evt.name)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 transition">
                    <Eye className="w-3 h-3" /> Registrations
                  </button>
                  <button onClick={() => { setNotifyEvent(evt); setShowNotifyModal(true); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 transition">
                    <Bell className="w-3 h-3" /> Notify
                  </button>
                  <button onClick={() => { setCountdownEvent(evt); setCountdownDate(evt.countdownDate || ''); setShowCountdownModal(true); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 transition">
                    <Timer className="w-3 h-3" /> Countdown
                  </button>
                  <button onClick={() => openEditModal(evt)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDeleteEvent(evt.id)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 transition">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default EventList;
