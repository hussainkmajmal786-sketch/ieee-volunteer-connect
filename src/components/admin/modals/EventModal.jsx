import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Clock, MapPin, Link2, Globe, Home, Film, Wand2, AlertTriangle } from 'lucide-react';
import MediaInput from '../MediaInput';
import { CATEGORY_NAMES, EVENT_MODES } from '../../../utils/events';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
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
  // Posters keep their own shape unless the admin picks one to crop to.
  const SHAPES = [
    { key: 'original', label: 'Original', aspect: null },
    { key: 'square', label: 'Square', aspect: 1 },
    { key: 'portrait', label: 'Portrait 4:5', aspect: 4 / 5 },
    { key: 'banner', label: 'Banner 16:9', aspect: 16 / 9 },
  ];
  // Remembered per file, so every newly chosen image starts as "Original".
  const [shapeFor, setShapeFor] = useState({ file: null, key: 'original' });
  const shape = shapeFor.file === imageFile ? shapeFor.key : 'original';
  const setShape = (key) => setShapeFor({ file: imageFile, key });
  const [imgEl, setImgEl] = useState(null);
  const aspect = SHAPES.find(s => s.key === shape)?.aspect ?? null;
  // Open "More details" when editing an event that already uses them.
  const moreOpen = ['fee', 'capacity', 'prize', 'teamSize', 'organizer', 'eligibility', 'contactName', 'contactPhone', 'mapUrl']
    .some(k => newEvent[k] !== undefined && newEvent[k] !== null && newEvent[k] !== '') || (Array.isArray(newEvent.tags) && newEvent.tags.length > 0);

  const applyShape = (key, el = imgEl) => {
    setShape(key);
    const a = SHAPES.find(s => s.key === key)?.aspect;
    if (!a || !el) { setCompletedCrop(null); return; }
    const w = el.width, h = el.height;
    const pct = centerCrop(makeAspectCrop({ unit: '%', width: 100 }, a, w, h), w, h);
    setCrop(pct);
    // Applied on save even if the admin doesn't drag the box.
    setCompletedCrop({ unit: 'px', x: (pct.x / 100) * w, y: (pct.y / 100) * h, width: (pct.width / 100) * w, height: (pct.height / 100) * h });
  };
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
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Event Poster / Banner</label>
                  {imageFile && (
                    <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg" role="radiogroup" aria-label="Poster shape">
                      {SHAPES.map(s => (
                        <button key={s.key} type="button" role="radio" aria-checked={shape === s.key} onClick={() => applyShape(s.key)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${shape === s.key ? 'bg-white dark:bg-gray-700 text-ieee-blue shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImageDrop}
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-ieee-blue dark:hover:border-cyan-500 transition-colors cursor-pointer overflow-hidden"
                >
                  {imagePreview ? (
                    <div className="relative">
                      {imageFile && aspect ? (
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={aspect}
                          className="w-full bg-black rounded-xl overflow-hidden"
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            onLoad={(e) => { setImageRef(e.currentTarget); setImgEl(e.currentTarget); applyShape(shape, e.currentTarget); }}
                            className="w-full max-h-80 object-contain"
                          />
                        </ReactCrop>
                      ) : (
                        // The whole poster, exactly as it will be saved.
                        <img src={imagePreview} alt="Preview" onLoad={(e) => { setImageRef(e.currentTarget); setImgEl(e.currentTarget); }}
                          className="w-full max-h-80 object-contain bg-gray-900 rounded-xl" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setCrop({ unit: '%', width: 100 });
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
                    aria-label="Category"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none"
                  >
                    {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
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
                <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mode</span>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Mode">
                  {EVENT_MODES.map(m => (
                    <button key={m} type="button" role="radio" aria-checked={(newEvent.mode || 'Offline') === m} onClick={() => setNewEvent({ ...newEvent, mode: m })}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition ${(newEvent.mode || 'Offline') === m ? 'border-ieee-blue bg-ieee-blue/10 text-ieee-blue' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-ieee-blue/50'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ends <span className="font-normal text-gray-400">(optional)</span></span>
                  <input type="datetime-local" value={newEvent.endDate || ''} min={newEvent.date || undefined}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })} className={FIELD} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Registration closes <span className="font-normal text-gray-400">(optional)</span></span>
                  <input type="datetime-local" value={newEvent.registrationDeadline || ''} max={newEvent.date || undefined}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationDeadline: e.target.value })} className={FIELD} />
                </label>
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
              <details className="group rounded-2xl border border-gray-200 dark:border-gray-700 p-4" open={moreOpen}>
                <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-bold text-gray-800 dark:text-gray-200">
                  More details <span className="text-xs font-normal text-gray-400 group-open:hidden">fee, seats, prizes, team size, contact…</span>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[
                    { key: 'fee', label: 'Fee (₹)', type: 'number', placeholder: '0 = Free', min: 0 },
                    { key: 'capacity', label: 'Seats', type: 'number', placeholder: 'No limit', min: 1, hint: 'Registration closes when full' },
                    { key: 'prize', label: 'Prize pool', placeholder: 'e.g. ₹50,000 + goodies' },
                    { key: 'teamSize', label: 'Team size', placeholder: 'e.g. 1–4 members' },
                    { key: 'organizer', label: 'Organised by', placeholder: 'e.g. IEEE SB CEK & CS Chapter' },
                    { key: 'eligibility', label: 'Who can join', placeholder: 'e.g. All B.Tech students' },
                    { key: 'contactName', label: 'Contact person', placeholder: 'Name' },
                    { key: 'contactPhone', label: 'Contact phone', type: 'tel', placeholder: '+91 98765 43210' },
                    { key: 'mapUrl', label: 'Map link', type: 'url', placeholder: 'https://maps.app.goo.gl/…' },
                    { key: 'tags', label: 'Tags', placeholder: 'AI, Python, Beginner', hint: 'Comma separated — shown on the event and searchable' },
                  ].map(f => (
                    <label key={f.key} className="block">
                      <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{f.label}</span>
                      <input type={f.type || 'text'} min={f.min} placeholder={f.placeholder}
                        value={Array.isArray(newEvent[f.key]) ? newEvent[f.key].join(', ') : (newEvent[f.key] ?? '')}
                        onChange={(e) => setNewEvent({ ...newEvent, [f.key]: e.target.value })}
                        className={`${FIELD} text-sm py-2.5`} />
                      {f.hint && <span className="block text-[11px] text-gray-400 mt-0.5">{f.hint}</span>}
                    </label>
                  ))}
                </div>
              </details>
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
