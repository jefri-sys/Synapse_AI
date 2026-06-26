import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Users, Search, Plus, MessageSquare, X, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import GroupChat from './GroupChat';

const renderLastMessagePreview = (msg) => {
  if (!msg) return null;
  if (msg.isDeleted || msg.message === 'This message was deleted') {
    return (
      <span className="flex items-center gap-1.5 italic text-text-secondary/70">
        <span className="text-xs">🚫</span> This message was deleted
      </span>
    );
  }
  
  const type = msg.messageType || msg.type || 'text';
  const text = msg.message || msg.content || '';
  
  switch (type) {
    case 'audio':
      return <span className="flex items-center gap-1.5"><span className="text-xs">🎤</span> Sent a voice message</span>;
    case 'image':
      return <span className="flex items-center gap-1.5"><span className="text-xs">📷</span> Sent a photo</span>;
    case 'video':
      return <span className="flex items-center gap-1.5"><span className="text-xs">🎥</span> Sent a video</span>;
    case 'document':
      return <span className="flex items-center gap-1.5"><span className="text-xs">📎</span> Sent an attachment</span>;
    case 'system':
      return <span className="italic">{text}</span>;
    case 'summary':
      return <span className="flex items-center gap-1.5"><span className="text-xs">🤖</span> AI Summary</span>;
    default:
      return <span>{text.length > 35 ? text.substring(0, 35) + '...' : text}</span>;
  }
};

const StudyGroups = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPublic: true });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyGroups();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const joinId = params.get('join');
    if (joinId) {
      handleJoin(joinId).then(() => {
        navigate('/dashboard/groups', { replace: true });
      });
    }
  }, [location.search]);

  const fetchMyGroups = async () => {
    try {
      const { data } = await api.get('/groups/mine');
      setMyGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching my groups:', err);
      setMyGroups([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      withCredentials: true
    });

    const handleNewMessage = (msg) => {
      // If we are currently viewing this group, mark as read immediately
      if (activeGroupId === msg.groupId) {
        markAsRead(activeGroupId);
      } else {
        setMyGroups(prev => prev.map(g => 
          g._id === msg.groupId ? { ...g, unreadCount: (g.unreadCount || 0) + 1 } : g
        ));
      }
    };

    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.disconnect();
    };
  }, [activeGroupId]);

  const handleDiscover = async () => {
    try {
      const { data } = await api.get('/groups/discover');
      setDiscoverGroups(Array.isArray(data) ? data : []);
      setShowDiscover(true);
    } catch (err) {
      console.error('Error fetching discover groups:', err);
      setDiscoverGroups([]);
    }
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/groups/${id}/join`);
      setShowDiscover(false);
      fetchMyGroups();
      setActiveGroupId(id);
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  useEffect(() => {
    if (activeGroupId) {
      markAsRead(activeGroupId);
    }
  }, [activeGroupId]);

  const markAsRead = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/read`);
      setMyGroups(prev => prev.map(g => 
        g._id === groupId ? { ...g, unreadCount: 0 } : g
      ));
    } catch (err) {
      console.error('Error marking group as read:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/groups', newGroup);
      setShowCreate(false);
      setNewGroup({ name: '', description: '', isPublic: true });
      fetchMyGroups();
      setActiveGroupId(data._id);
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const activeGroup = Array.isArray(myGroups) ? myGroups.find(g => g._id === activeGroupId) : undefined;

  return (
    <div className="flex h-[80vh] min-h-[600px] w-full overflow-hidden border border-surface-border shadow-2xl bg-surface-base/80 backdrop-blur-xl rounded-2xl relative">
      {/* Groups Sidebar */}
      <div className="w-1/3 bg-surface-sunken/50 border-r border-surface-border flex flex-col h-full z-10">
        <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface-base shrink-0 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary flex items-center tracking-tight">
            <Users className="w-5 h-5 mr-2 text-brand-primary" /> Groups
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleDiscover}
              className="p-2 bg-surface-sunken text-text-secondary rounded-xl hover:bg-surface-raised hover:text-text-primary transition-all border border-surface-border"
              title="Discover Groups"
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowCreate(true)}
              className="p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover transition-all shadow-md shadow-brand-primary/20"
              title="Create Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center">
              <Users className="w-12 h-12 text-text-tertiary mb-4" />
              <p className="text-sm text-text-secondary mb-4">No study groups joined yet.</p>
              <Button onClick={handleDiscover} className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl shadow-md">
                Find a Group
              </Button>
            </div>
          ) : (
            myGroups.map(group => (
              <div 
                key={group._id} 
                onClick={() => setActiveGroupId(group._id)}
                className={`p-4 mb-2 rounded-xl cursor-pointer transition-all ${activeGroupId === group._id ? 'bg-brand-primary-subtle border border-brand-primary/20 shadow-sm' : 'bg-surface-base hover:bg-surface-raised border border-transparent'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-semibold text-sm truncate ${activeGroupId === group._id ? 'text-brand-primary-dark' : 'text-text-primary'}`}>{group.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex items-center gap-1 border ${activeGroupId === group._id ? 'bg-white/50 border-brand-primary/20 text-brand-primary' : 'bg-surface-sunken border-surface-border text-text-secondary'}`}>
                    {group.members?.length || 1}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className={`text-xs truncate max-w-[85%] flex items-center ${activeGroupId === group._id ? 'text-brand-primary/80' : 'text-text-secondary'}`}>
                    {group.lastMessage ? renderLastMessagePreview(group.lastMessage) : group.course}
                  </div>
                  {group.unreadCount > 0 && (
                    <div className="ml-2 bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center shadow-sm shadow-brand-primary/30">
                      {group.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-surface-base flex flex-col h-full relative z-10">
        {activeGroup ? (
          <GroupChat group={activeGroup} onLeave={() => { setActiveGroupId(null); fetchMyGroups(); }} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-surface-sunken/30">
            <div className="w-24 h-24 rounded-full bg-surface-base flex items-center justify-center mb-6 border border-surface-border shadow-sm">
              <MessageSquare className="w-10 h-10 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">Your Workspace</h3>
            <p className="text-sm text-text-secondary max-w-sm">Select a study group from the sidebar to join the conversation, or create a new one to get started.</p>
          </div>
        )}
      </div>

      {/* Discover Modal */}
      {showDiscover && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 max-h-[80%] flex flex-col shadow-2xl bg-surface-base rounded-2xl border border-surface-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-primary flex items-center tracking-tight">
                <Search className="w-5 h-5 mr-3 text-brand-primary" /> Discover Groups
              </h3>
              <button onClick={() => setShowDiscover(false)} className="text-text-tertiary hover:text-text-primary transition-colors bg-surface-sunken p-2 rounded-xl hover:bg-surface-raised">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {discoverGroups.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldAlert className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">No groups found</p>
                  <p className="text-xs text-text-tertiary mt-1">There are no new groups for your course and college yet.</p>
                </div>
              ) : (
                discoverGroups.map(group => (
                  <div key={group._id} className="border border-surface-border rounded-xl p-4 flex justify-between items-center hover:border-brand-primary/30 hover:bg-brand-primary-subtle/50 transition-all bg-surface-base shadow-sm">
                    <div className="pr-4">
                      <h4 className="font-bold text-text-primary">{group.name}</h4>
                      {group.description && <p className="text-xs text-text-secondary mt-1">{group.description}</p>}
                      <p className="text-[10px] font-bold text-brand-primary-dark mt-3 bg-brand-primary-subtle inline-block px-2 py-0.5 rounded-full border border-brand-primary/20">
                        {group.members?.length || 1} members
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleJoin(group._id)}
                      className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs shadow-sm"
                    >
                      Join Group
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 shadow-2xl bg-surface-base rounded-2xl border border-surface-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-primary flex items-center tracking-tight">
                <Plus className="w-5 h-5 mr-3 text-brand-primary" /> Create Group
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-text-tertiary hover:text-text-primary transition-colors bg-surface-sunken p-2 rounded-xl hover:bg-surface-raised">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Group Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. CS101 Study Buddies"
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea 
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-sm min-h-[100px] resize-none"
                  placeholder="What is this group about?"
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Privacy</label>
                <div className="flex space-x-3">
                  <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-xl border transition-all ${newGroup.isPublic ? 'bg-brand-primary-subtle border-brand-primary text-brand-primary-dark shadow-sm' : 'bg-surface-base border-surface-border hover:bg-surface-sunken text-text-secondary'}`}>
                    <input 
                      type="radio" 
                      name="privacy" 
                      checked={newGroup.isPublic} 
                      onChange={() => setNewGroup({...newGroup, isPublic: true})}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">Public</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-xl border transition-all ${!newGroup.isPublic ? 'bg-brand-primary-subtle border-brand-primary text-brand-primary-dark shadow-sm' : 'bg-surface-base border-surface-border hover:bg-surface-sunken text-text-secondary'}`}>
                    <input 
                      type="radio" 
                      name="privacy" 
                      checked={!newGroup.isPublic} 
                      onChange={() => setNewGroup({...newGroup, isPublic: false})}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">Private</span>
                  </label>
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  type="submit"
                  className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl py-6 text-sm font-bold shadow-md shadow-brand-primary/20"
                >
                  Create & Join
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroups;
