import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, UserPlus, UserMinus, MicOff, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import GroupPermissionsPanel from './GroupPermissionsPanel';
import { useAuth } from '../../hooks/useAuth';

const GroupInfoPanel = ({ group, onClose, onUpdateGroup }) => {
  const { user } = useAuth();
  const [showPermissions, setShowPermissions] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description || '');

  useEffect(() => {
    api.get('/friends').then(res => setFriends(Array.isArray(res.data) ? res.data : [])).catch(console.error);
  }, []);

  const me = group.members?.find(m => {
    if (!m.userId) return false;
    return (m.userId._id || m.userId) === user?._id;
  });
  const myRole = me?.role || 'member';

  const hasPermission = (action) => {
    const perm = group.permissions?.[action];
    if (!perm || !perm.allowedRoles) return false;
    return perm.allowedRoles.includes(myRole);
  };

  const canManageRole = (targetRole) => {
    if (myRole === 'creator') return true;
    if (myRole === 'admin') return targetRole === 'moderator' || targetRole === 'member';
    if (myRole === 'moderator') return targetRole === 'member';
    return false;
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/groups/${group._id}/role/${userId}`, { role: newRole });
      onUpdateGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating role');
    }
  };

  const handleKick = async (userId) => {
    if (!window.confirm("Kick this member?")) return;
    try {
      await api.delete(`/groups/${group._id}/members/${userId}`);
      onUpdateGroup();
    } catch (err) {
      alert('Error kicking member');
    }
  };

  const handleMute = async (userId, duration) => {
    try {
      await api.patch(`/groups/${group._id}/members/${userId}/mute`, { durationMinutes: duration });
      onUpdateGroup();
      alert('Member muted');
    } catch (err) {
      alert('Error muting member');
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      await api.post(`/groups/${group._id}/members`, { userId: friendId });
      onUpdateGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding member');
    }
  };

  const saveGroupInfo = async () => {
    try {
      await api.patch(`/groups/${group._id}/info`, { name: editName, description: editDesc });
      setIsEditingInfo(false);
      onUpdateGroup();
    } catch (err) {
      alert('Error updating group info');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this group? This action cannot be undone and will remove all members and messages.")) return;
    
    try {
      await api.delete(`/groups/${group._id}`);
      // The socket event 'group:deleted' will handle the redirect for the creator and all members
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete group');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'creator': return 'text-yellow-600';
      case 'admin': return 'text-brand-primary';
      case 'moderator': return 'text-green-600';
      default: return 'text-text-tertiary';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface-base border border-surface-border rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90%] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-border">
          <h3 className="text-xl font-bold text-text-primary flex items-center tracking-tight">
            Group Info
          </h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary bg-surface-sunken hover:bg-surface-raised p-2 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {/* Info Section */}
          <div className="bg-surface-sunken/50 p-5 rounded-2xl border border-surface-border shadow-sm">
            {isEditingInfo ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full px-4 py-3 text-sm bg-surface-base border border-surface-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50" 
                />
                <textarea 
                  value={editDesc} 
                  onChange={e => setEditDesc(e.target.value)} 
                  className="w-full px-4 py-3 text-sm bg-surface-base border border-surface-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 min-h-[80px] resize-none" 
                  rows="2"
                  placeholder="Group Rules / Description"
                />
                <div className="flex space-x-3 pt-2">
                  <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl px-6 border-none" size="sm" onClick={saveGroupInfo}>Save</Button>
                  <Button className="bg-surface-sunken hover:bg-surface-raised text-text-primary border border-surface-border rounded-xl px-6" size="sm" variant="outline" onClick={() => setIsEditingInfo(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xl text-text-primary tracking-tight">{group.name}</h4>
                  {hasPermission('editGroupInfo') && (
                    <button onClick={() => setIsEditingInfo(true)} className="text-text-tertiary hover:text-brand-primary transition-colors p-1.5 bg-surface-sunken hover:bg-surface-raised rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-3 leading-relaxed">{group.description || 'No description provided.'}</p>
                
                {myRole === 'creator' && (
                  <div className="mt-6 space-y-3">
                    <Button 
                      className="w-full bg-surface-sunken hover:bg-surface-raised text-text-primary border border-surface-border rounded-xl py-5"
                      onClick={() => setShowPermissions(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" /> Group Settings
                    </Button>
                    <Button 
                      onClick={handleDeleteGroup}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-5"
                    >
                      Permanently Delete Group
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Members <span className="text-text-tertiary font-normal">({group.members?.length || 0})</span></h4>
            <div className="space-y-2">
              {group.members?.map(m => {
                const u = m.userId;
                if (!u) return null;
                const isMe = u._id === user?._id;
                const isMutedNow = new Date(m.mutedUntil) > new Date();
                return (
                  <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-base border border-surface-border rounded-xl hover:bg-surface-sunken transition-all shadow-sm">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-10 h-10 rounded-full mr-4 border border-white" alt="avatar" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary flex items-center">
                          {u.name} {isMe && <span className="text-text-tertiary font-normal ml-2 text-xs">(You)</span>}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <p className={`text-[10px] uppercase font-bold tracking-wider ${getRoleColor(m.role)}`}>{m.role}</p>
                          {isMutedNow && <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-1.5 py-0.5 rounded-full">Muted</span>}
                        </div>
                      </div>
                    </div>
                    
                    {!isMe && m.role !== 'creator' && (
                      <div className="flex items-center space-x-2">
                        {canManageRole(m.role) && hasPermission('editGroupInfo') && myRole === 'creator' && (
                           <select 
                             value={m.role}
                             onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                             className="text-xs bg-surface-base border border-surface-border text-text-primary rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                           >
                             <option value="member">Member</option>
                             <option value="moderator">Moderator</option>
                             <option value="admin">Admin</option>
                           </select>
                        )}
                        {hasPermission('muteMember') && canManageRole(m.role) && (
                          <button onClick={() => handleMute(u._id, 60)} title="Mute for 1 hour" className="p-2 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 bg-surface-base rounded-lg transition-colors border border-transparent hover:border-yellow-200">
                            <MicOff className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('removeMembers') && canManageRole(m.role) && (
                          <button onClick={() => handleKick(u._id)} title="Kick Member" className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 bg-surface-base rounded-lg transition-colors border border-transparent hover:border-red-200">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Members */}
          {hasPermission('addMembers') && (
            <div>
              <h4 className="font-semibold text-text-primary mb-4 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-brand-primary" /> Add from Friends
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-surface-border rounded-xl p-3 bg-surface-sunken custom-scrollbar shadow-inner">
                {friends.length === 0 ? (
                  <p className="text-xs text-text-tertiary p-4 text-center">No friends to add.</p>
                ) : (
                  friends.filter(f => f.status === 'accepted').map(friend => {
                    const friendUser = friend.requester?._id === user?._id ? friend.recipient : friend.requester;
                    if (!friendUser) return null;
                    const isAlreadyMember = group.members?.some(m => (m.userId?._id || m.userId) === friendUser._id);
                    if (isAlreadyMember) return null;

                    return (
                      <div key={friend._id} className="flex items-center justify-between bg-surface-base p-3 border border-surface-border hover:border-brand-primary/30 transition-all rounded-xl shadow-sm">
                        <div className="flex items-center">
                          <img src={friendUser.avatar || `https://ui-avatars.com/api/?name=${friendUser.name}`} className="w-8 h-8 rounded-full mr-3 border border-white" alt="avatar" />
                          <span className="text-sm font-medium text-text-primary">{friendUser.name}</span>
                        </div>
                        <Button 
                          className="bg-brand-primary-subtle hover:bg-brand-primary/20 text-brand-primary-dark border-none rounded-lg text-xs px-4"
                          size="sm"
                          onClick={() => handleAddMember(friendUser._id)}
                        >
                          Add
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showPermissions && (
        <GroupPermissionsPanel 
          group={group} 
          onClose={() => setShowPermissions(false)} 
          onUpdate={(newPerms) => {
            onUpdateGroup();
          }} 
        />
      )}
    </div>
  );
};

export default GroupInfoPanel;
