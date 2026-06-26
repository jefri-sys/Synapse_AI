import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Users, Search, Plus, MessageSquare, X, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import GroupChat from './GroupChat';

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
    <Card className="flex h-[75vh] min-h-[500px] p-0 overflow-hidden border-surface-border shadow-sm">
      {/* Groups Sidebar */}
      <div className="w-1/3 bg-surface-sunken border-r border-surface-border flex flex-col h-full">
        <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-base shrink-0">
          <h2 className="text-lg font-bold text-text-primary flex items-center">
            <Users className="w-5 h-5 mr-2 text-brand-primary" /> My Groups
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleDiscover}
              className="p-1.5 bg-brand-primary-subtle text-brand-primary rounded-md hover:opacity-80 transition"
              title="Discover Groups"
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowCreate(true)}
              className="p-1.5 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover transition"
              title="Create Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center">
              <Users className="w-12 h-12 text-text-tertiary mb-4" />
              <p className="text-sm text-text-secondary mb-4">No study groups joined yet.</p>
              <Button onClick={handleDiscover} variant="primary">
                Find a Group
              </Button>
            </div>
          ) : (
            myGroups.map(group => (
              <div 
                key={group._id} 
                onClick={() => setActiveGroupId(group._id)}
                className={`p-4 border-b border-surface-border cursor-pointer transition ${activeGroupId === group._id ? 'bg-brand-primary-subtle border-l-4 border-l-brand-primary' : 'bg-surface-base hover:bg-surface-sunken'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-text-primary text-sm truncate">{group.name}</h3>
                  <span className="text-[10px] bg-surface-sunken text-text-secondary px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex items-center gap-1 border border-surface-border">
                    {group.members?.length || 1}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-text-secondary truncate">{group.course}</p>
                  {group.unreadCount > 0 && (
                    <div className="ml-2 bg-status-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
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
      <div className="flex-1 bg-surface-base flex flex-col h-full relative">
        {activeGroup ? (
          <GroupChat group={activeGroup} onLeave={() => { setActiveGroupId(null); fetchMyGroups(); }} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center bg-surface-base">
            <MessageSquare className="w-12 h-12 text-text-tertiary mb-4" />
            <p className="text-sm text-text-secondary">Select a study group to start chatting</p>
          </div>
        )}
      </div>

      {/* Discover Modal */}
      {showDiscover && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 max-h-full flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary flex items-center">
                <Search className="w-5 h-5 mr-2 text-brand-primary" /> Discover Groups
              </h3>
              <button onClick={() => setShowDiscover(false)} className="text-text-tertiary hover:text-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {discoverGroups.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldAlert className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">No groups found</p>
                  <p className="text-xs text-text-tertiary mt-1">There are no new groups for your course and college yet.</p>
                </div>
              ) : (
                discoverGroups.map(group => (
                  <div key={group._id} className="border border-surface-border rounded-lg p-4 flex justify-between items-center hover:border-brand-primary/30 transition bg-surface-sunken">
                    <div className="pr-4">
                      <h4 className="font-bold text-text-primary">{group.name}</h4>
                      {group.description && <p className="text-xs text-text-secondary mt-1">{group.description}</p>}
                      <p className="text-xs font-medium text-brand-primary mt-2 bg-brand-primary-subtle inline-block px-2 py-0.5 rounded-full">
                        {group.members?.length || 1} members
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleJoin(group._id)}
                      variant="outline"
                      className="shrink-0"
                    >
                      Join Group
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary flex items-center">
                <Plus className="w-5 h-5 mr-2 text-brand-primary" /> Create Group
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-text-tertiary hover:text-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Group Name</label>
                <Input 
                  type="text" 
                  required
                  placeholder="e.g. CS101 Study Buddies"
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-surface-border bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="What is this group about?"
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Privacy</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy" 
                      checked={newGroup.isPublic} 
                      onChange={() => setNewGroup({...newGroup, isPublic: true})}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-sm text-text-primary">Public (College-wide)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy" 
                      checked={!newGroup.isPublic} 
                      onChange={() => setNewGroup({...newGroup, isPublic: false})}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-sm text-text-primary">Private (Invite Link)</span>
                  </label>
                </div>
              </div>
              <div className="pt-2">
                <Button 
                  type="submit"
                  variant="primary"
                  className="w-full"
                >
                  Create & Join
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default StudyGroups;
