import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Clock, MapPin, Link2, Globe, Home, Film, Wand2, AlertTriangle } from 'lucide-react';
import MediaInput from '../MediaInput';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Button from '../../Button';

const EventModal = ({
  isSuperAdmin = false,
  showModal,
  closeModal,
  isEditing,
  handleCreateOrUpdateEvent,
  newEvent,
  setNewEvent,
  imagePreview,
  setImagePreview,
  imageFile,
  setImageFile,
  crop,
  setCrop,
  setCompletedCrop,
  setImageRef,
  handleImageDrop,
  handleImageSelect,
  uploading,
  importInfo = null
}) => {
  const FIELD = 'w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none';
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateEvent} className="p-6 space-y-4">
              {importInfo && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm space-y-1.5" role="status">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4" /> {importInfo.aiUsed ? 'Filled in from the post — please check every field.' : 'Filled in from the post text — please check every field.'}
                  </p>
                  {importInfo.warnings.map(w => (
                    <p key={w} className="text-xs text-amber-700 dark:text-amber-400 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w}</p>
                  ))}
                  {importInfo.registrationUrl && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 break-all">
                      Registration link in the post: <a href={importInfo.registrationUrl} target="_blank" rel="noopener noreferrer" className="underline">{importInfo.registrationUrl}</a>.
                      {' '}People will register on this site{isSuperAdmin ? ' unless you choose “Main website” below' : ''}.
                    </p>
                  )}
                </div>
              )}
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Event Banner Image</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImageDrop}
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-ieee-blue dark:hover:border-cyan-500 transition-colors cursor-pointer overflow-hidden"
                >
                  {imagePreview ? (
                    <div className="relative">
                      {imageFile ? (
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={16 / 9}
                          className="w-full bg-black rounded-xl overflow-hidden"
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            onLoad={(e) => setImageRef(e.currentTarget)}
                            className="w-full max-h-64 object-contain"
                          />
                        </ReactCrop>
                      ) : (
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setCrop({ unit: '%', width: 100, aspect: 16 / 9 });
                          setCompletedCrop(null);
                          setImageRef(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition z-10 hover:scale-110"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Drop image here or click to upload</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. AI Bootcamp 2026"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Date & Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none appearance-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Competition">Competition</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Meetup">Meetup</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Venue</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Main Hall"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  placeholder="Describe the event..."
                  rows={importInfo ? 6 : 3}
                  value={newEvent.desc}
                  onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none resize-none"
                />
              </div>
              {/* Promo video: upload, or a YouTube / Instagram reel link */}
              <div>
                <MediaInput label="Promo video (optional)" folder="event-media" accept="video/mp4,video/webm,video/quicktime"
                  value={newEvent.videoUrl?.startsWith('/files/') ? newEvent.videoUrl : ''}
                  onChange={(url) => setNewEvent({ ...newEvent, videoUrl: url })}
                  hint="MP4/WebM under 25MB — or paste a YouTube link below" />
                <div className="relative -mt-2">
                  <Film className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="url" aria-label="Video link" placeholder="https://youtu.be/…"
                    value={newEvent.videoUrl?.startsWith('/files/') ? '' : (newEvent.videoUrl || '')}
                    onChange={(e) => setNewEvent({ ...newEvent, videoUrl: e.target.value })}
                    className={`${FIELD} pl-9 text-sm`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Original post <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="url" placeholder="https://www.instagram.com/p/…" value={newEvent.sourceUrl || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, sourceUrl: e.target.value })} className={`${FIELD} text-sm`} />
              </div>
              {/* Where ambassador links send people — super admin only */}
              {isSuperAdmin && (
                <div className="rounded-2xl border border-ieee-blue/20 bg-ieee-blue/5 dark:bg-cyan-900/10 p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-ieee-blue" /> Where should shared links go?
                  </p>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Shared link destination">
                    {[
                      { value: 'site', label: 'This website', hint: 'Register here — fully tracked', icon: Home },
                      { value: 'external', label: 'Main website', hint: 'Clicks tracked, then redirected', icon: Globe },
                    ].map(opt => {
                      const active = (newEvent.linkMode || 'site') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setNewEvent({ ...newEvent, linkMode: opt.value })}
                          className={`text-left p-3 rounded-xl border transition ${active ? 'border-ieee-blue bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-ieee-blue/50'}`}
                        >
                          <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white"><opt.icon className="w-4 h-4 text-ieee-blue" /> {opt.label}</span>
                          <span className="block text-[11px] text-gray-500 mt-0.5">{opt.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  {newEvent.linkMode === 'external' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Registration page on the main website</label>
                      <input
                        type="url"
                        placeholder="https://ieee.cek.ac.in/events/..."
                        value={newEvent.externalUrl || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, externalUrl: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none"
                        required
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Registrations happen on that site, so only clicks and unique visitors are counted here.</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                <Button type="submit" isLoading={uploading} className="flex-1">{isEditing ? 'Save Changes' : 'Create Event'}</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
