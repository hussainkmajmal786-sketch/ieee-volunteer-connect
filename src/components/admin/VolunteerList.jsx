import React from 'react';
import { Users, PlusCircle, Search, Crown, X, CheckCircle, Trash2, RotateCcw, Shield, ShieldOff } from 'lucide-react';
import { getGrade, getEarnedBadges } from '../../utils/grades';
import { ROLES } from '../../utils/constants';

const VolunteerList = ({
  filteredVols,
  searchVol,
  setSearchVol,
  setShowVolunteerModal,
  handlePromoteToVolunteer,
  handleApproveVolunteer,
  handleRemoveVolunteer,
  // Super Admin exclusive props
  isSuperAdmin = false,
  handleDeleteUser,
  handleResetPoints,
  handlePromoteToAdmin,
  handleDemoteAdmin,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" /> User Management
          </h2>
          <button
            onClick={() => setShowVolunteerModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-ieee-blue hover:text-cyan-600 bg-ieee-blue/10 px-3 py-1.5 rounded-lg transition"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchVol}
            onChange={(e) => setSearchVol(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none"
          />
        </div>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
        {filteredVols.length === 0 ? (
          <p className="p-5 text-center text-gray-500">No volunteers found.</p>
        ) : (
          filteredVols.map((vol) => {
            const grade = getGrade(vol.points || 0);
            const badges = getEarnedBadges(vol);
            const isAdmin = vol.role === ROLES.ADMIN;
            const isSuperAdminUser = vol.role === ROLES.SUPER_ADMIN;
            return (
              <div key={vol.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white font-bold shadow-md`}>
                    {vol.name ? vol.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{vol.name}</p>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${grade.bgPill} ${grade.textClass}`}>
                        {grade.icon} {grade.name}
                      </span>
                      {/* Role badges */}
                      {isSuperAdminUser && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-tighter border border-amber-200/50 dark:border-amber-800/30">
                          🛡️ Super Admin
                        </span>
                      )}
                      {isAdmin && !isSuperAdminUser && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 uppercase tracking-tighter border border-violet-200/50 dark:border-violet-800/30">
                          🔑 Sub Admin
                        </span>
                      )}
                      {vol.approvalStatus === 'PENDING' && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-tighter shadow-sm border border-amber-200/50 dark:border-amber-800/30">Pending Approval</span>
                      )}
                      {vol.approvalStatus === 'APPROVED_PENDING_FORM' && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-tighter shadow-sm border border-blue-200/50 dark:border-blue-800/30">Form Required</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{vol.email}</p>
                    {(vol.college || vol.branch) && (
                      <p className="text-[10px] text-gray-400 font-medium">{vol.college || vol.branch}</p>
                    )}
                    {badges.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {badges.slice(0, 4).map(b => (
                          <span key={b.id} className="text-xs" title={b.name}>{b.icon}</span>
                        ))}
                        {badges.length > 4 && <span className="text-[10px] text-gray-400">+{badges.length - 4}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-black text-ieee-blue dark:text-cyan-400 text-sm">{vol.points || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Points</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {/* Standard actions */}
                    {vol.approvalStatus === 'PENDING' && (
                      <button onClick={() => handleApproveVolunteer(vol.id)} className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Approve Application">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {vol.role === 'STUDENT' && (
                      <button onClick={() => handlePromoteToVolunteer(vol.id)} className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Promote to Volunteer">
                        <Crown className="w-4 h-4" />
                      </button>
                    )}
                    {vol.role === ROLES.VOLUNTEER && (
                      <button onClick={() => handleRemoveVolunteer(vol.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Demote to Student">
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* ── Super Admin exclusive actions ── */}
                    {isSuperAdmin && !isSuperAdminUser && (
                      <>
                        {/* Promote to / Demote from Admin */}
                        {isAdmin ? (
                          <button onClick={() => handleDemoteAdmin(vol.id, vol.name)} className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition" title="Demote from Admin">
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        ) : vol.role === ROLES.VOLUNTEER ? (
                          <button onClick={() => handlePromoteToAdmin(vol.id, vol.name)} className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition" title="Promote to Sub Admin">
                            <Shield className="w-4 h-4" />
                          </button>
                        ) : null}

                        {/* Reset Points */}
                        {(vol.points || 0) > 0 && (
                          <button onClick={() => handleResetPoints(vol.id, vol.name)} className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition" title="Reset Points to 0">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete User */}
                        <button onClick={() => handleDeleteUser(vol.id, vol.name)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete User Permanently">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VolunteerList;
