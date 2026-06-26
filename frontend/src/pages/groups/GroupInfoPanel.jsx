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

  const getRoleColor = (role) => {
    switch (role) {
      case 'creator': return 'text-amber-500';
      case 'admin': return 'text-blue-500';
      case 'moderator': return 'text-green-500';
      default: return 'text-text-tertiary';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-base rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90%] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-border">
          <h3 className="text-xl font-bold text-text-primary flex items-center">
            Group Info
          </h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Info Section */}
          <div className="bg-surface-sunken p-4 rounded-lg border border-surface-border">
            {isEditingInfo ? (
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full p-2 text-sm border border-surface-border rounded" 
                />
                <textarea 
                  value={editDesc} 
                  onChange={e => setEditDesc(e.target.value)} 
                  className="w-full p-2 text-sm border border-surface-border rounded" 
                  rows="2"
                  placeholder="Group Rules / Description"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={saveGroupInfo}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingInfo(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-text-primary">{group.name}</h4>
                  {hasPermission('editGroupInfo') && (
                    <button onClick={() => setIsEditingInfo(true)} className="text-text-tertiary hover:text-brand-primary">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-2">{group.description || 'No description provided.'}</p>
                
                {myRole === 'creator' && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowPermissions(true)}
                    className="mt-4 w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" /> Group Settings
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <h4 className="font-semibold text-text-primary mb-3">Members ({group.members?.length || 0})</h4>
            <div className="space-y-2">
              {group.members?.map(m => {
                const u = m.userId;
                if (!u) return null;
                const isMe = u._id === user?._id;
                const isMutedNow = new Date(m.mutedUntil) > new Date();
                return (
                  <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-surface-base border border-surface-border rounded-lg hover:border-surface-border transition">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full mr-3" alt="avatar" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary flex items-center">
                          {u.name} {isMe && <span className="text-text-tertiary font-normal ml-1">(You)</span>}
                        </p>
                        <div className="flex items-center mt-0.5 space-x-2">
                          <p className={`text-[10px] uppercase font-bold tracking-wide ${getRoleColor(m.role)}`}>{m.role}</p>
                          {isMutedNow && <span className="text-[10px] bg-status-danger-subtle text-status-danger px-1.5 rounded">Muted</span>}
                        </div>
                      </div>
                    </div>
                    
                    {!isMe && m.role !== 'creator' && (
                      <div className="flex items-center space-x-2">
                        {canManageRole(m.role) && hasPermission('editGroupInfo') && myRole === 'creator' && (
                           <select 
                             value={m.role}
                             onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                             className="text-xs border-surface-border rounded p-1"
                           >
                             <option value="member">Member</option>
                             <option value="moderator">Moderator</option>
                             <option value="admin">Admin</option>
                           </select>
                        )}
                        {hasPermission('muteMember') && canManageRole(m.role) && (
                          <button onClick={() => handleMute(u._id, 60)} title="Mute for 1 hour" className="p-1.5 text-status-warning hover:bg-status-warning-subtle rounded">
                            <MicOff className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('removeMembers') && canManageRole(m.role) && (
                          <button onClick={() => handleKick(u._id)} title="Kick Member" className="p-1.5 text-status-danger hover:bg-status-danger-subtle rounded">
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
              <h4 className="font-semibold text-text-primary mb-3 flex items-center">
                <UserPlus className="w-4 h-4 mr-2" /> Add from Friends
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-surface-border rounded-lg p-2 bg-surface-sunken">
                {friends.length === 0 ? (
                  <p className="text-xs text-text-secondary p-2">No friends to add.</p>
                ) : (
                  friends.filter(f => f.status === 'accepted').map(friend => {
                    const friendUser = friend.requester._id === user?._id ? friend.recipient : friend.requester;
                    const isAlreadyMember = group.members?.some(m => (m.userId._id || m.userId) === friendUser._id);
                    if (isAlreadyMember) return null;

                    return (
                      <div key={friend._id} className="flex items-center justify-between bg-surface-base p-2 border border-surface-border rounded-lg">
                        <div className="flex items-center">
                          <img src={friendUser.avatar || `https://ui-avatars.com/api/?name=${friendUser.name}`} className="w-6 h-6 rounded-full mr-2" alt="avatar" />
                          <span className="text-sm font-medium text-text-primary">{friendUser.name}</span>
                        </div>
                        <Button 
                          size="sm"
                          variant="ghost"
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
