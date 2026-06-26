import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const MessagingLayout = ({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  friends, 
  requests, 
  searchQuery,
  setSearchQuery,
  searchResults,
  onAddFriend,
  onAcceptFriend,
  onRejectFriend,
  onUnfriend,
  onStartDM,
  currentUserId,
  centerContent,
  rightContent
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // chats, people
  const [peopleSubTab, setPeopleSubTab] = useState('friends'); // friends, requests

  const sortedConversations = [...(conversations || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  const getUnreadCount = (conv) => {
    // Dummy unread count logic or prop
    return conv.unreadCount || 0;
  };

  const getConvName = (conv) => {
    if (conv.type === 'group') return conv.groupName;
    const other = conv.participants?.find(p => p._id !== currentUserId);
    return other?.name || 'Unknown';
  };

  const getConvAvatar = (conv) => {
    if (conv.type === 'group') {
      const name = conv.groupName || 'Group';
      return conv.groupAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
    }
    const other = conv.participants?.find(p => p._id !== currentUserId);
    const name = other?.name || 'U';
    return other?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
  };

  const renderMessagePreview = (message) => {
    if (!message || !message.content) return 'No messages yet';
    
    if (message.isDeleted) return '🚫 This message was deleted';
    
    switch (message.type) {
      case 'audio':
        return '🎤 Voice message';
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'document':
        return '📎 Attachment';
      default:
        // Fallback for older messages that might not have a clean type set
        if (message.content.includes('http') && (message.content.includes('cloudinary.com') || message.content.includes('/upload/'))) {
          const lower = message.content.toLowerCase();
          if (lower.match(/\.(jpeg|jpg|gif|png)$/)) return '📷 Photo';
          if (lower.match(/\.(mp4|webm|mov)$/)) return '🎥 Video';
          if (lower.match(/\.(webm|mp3|wav)$/)) return '🎤 Voice message';
          return '📎 Attachment';
        }
        return message.content;
    }
  };

  return (
    <div className="flex h-full bg-surface-base w-full overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-surface-base border-r border-surface-border transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Tabs */}
        <div className="flex px-4 pt-6 pb-2 space-x-4 border-b border-surface-border">
          <button 
            onClick={() => setActiveTab('chats')} 
            className={`font-bold pb-2 border-b-2 transition-all duration-200 ${activeTab === 'chats' ? 'border-brand-primary text-text-primary drop-shadow-sm' : 'border-transparent text-text-tertiary opacity-60 hover:opacity-100 hover:text-text-primary'}`}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('people')} 
            className={`font-bold pb-2 border-b-2 transition-all duration-200 ${activeTab === 'people' ? 'border-brand-primary text-text-primary drop-shadow-sm' : 'border-transparent text-text-tertiary opacity-60 hover:opacity-100 hover:text-text-primary'}`}
          >
            People
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-2 text-text-tertiary z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <Input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-black/5 dark:bg-white/5 border-transparent focus:bg-transparent focus:border-brand-primary transition-colors rounded-lg"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'chats' && (
            <div className="space-y-1 p-2">
              {sortedConversations.map(conv => {
                const unread = getUnreadCount(conv);
                const isActive = conv._id === activeConversationId;
                return (
                  <div 
                    key={conv._id}
                    onClick={() => {
                      onSelectConversation(conv);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center py-3 px-2 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-brand-primary-subtle' : 'hover:bg-surface-sunken'}`}
                  >
                    <img src={getConvAvatar(conv)} alt="Avatar" className="w-12 h-12 rounded-full object-cover object-center flex-shrink-0 border border-surface-border" />
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className={`text-[15px] truncate ${isActive ? 'font-bold text-brand-primary' : 'font-bold text-text-primary'}`}>{getConvName(conv)}</h4>
                          <p className="text-[12px] font-medium text-text-tertiary opacity-80 truncate mt-0.5">
                            {renderMessagePreview(conv.lastMessage)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 space-y-1.5 mt-0.5">
                          <span className="text-[10px] font-medium text-text-tertiary opacity-70 tracking-tight">
                            {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {unread > 0 && (
                            <div className="bg-blue-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
                              {unread}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="flex flex-col h-full">
              <div className="flex px-4 py-2 space-x-2 bg-surface-sunken border-b border-surface-border text-xs font-medium">
                <button 
                  onClick={() => setPeopleSubTab('friends')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${peopleSubTab === 'friends' ? 'bg-surface-base text-text-primary shadow-sm border border-surface-border' : 'text-text-secondary hover:bg-surface-border'}`}
                >
                  Friends
                </button>
                <button 
                  onClick={() => setPeopleSubTab('requests')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${peopleSubTab === 'requests' ? 'bg-surface-base text-text-primary shadow-sm border border-surface-border' : 'text-text-secondary hover:bg-surface-border'}`}
                >
                  Requests
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                {searchQuery && activeTab === 'people' ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Search Results</h3>
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-text-tertiary text-center py-4">No users found</p>
                    ) : searchResults.map(user => (
                      <div key={user._id} className="flex items-center justify-between p-2 hover:bg-surface-sunken rounded-lg border border-transparent hover:border-surface-border transition-colors">
                        <div className="flex items-center min-w-0">
                          <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&bold=true`} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover object-center border border-surface-border" />
                          <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                            <p className="text-xs text-text-secondary truncate">@{user.username || user.name.toLowerCase().replace(' ', '')}</p>
                          </div>
                        </div>
                        <Button onClick={() => onAddFriend(user._id)} variant="outline" className="h-8 shrink-0 ml-2">Add</Button>
                      </div>
                    ))}
                  </div>
                ) : peopleSubTab === 'friends' ? (
                  <div className="space-y-2">
                    {friends.length === 0 ? (
                      <p className="text-sm text-text-tertiary text-center py-4">You have no friends yet.</p>
                    ) : friends.map(friendship => {
                      const friend = friendship.requester?._id === currentUserId ? friendship.recipient : friendship.requester;
                      if (!friend) return null;
                      return (
                        <div key={friendship._id} className="flex items-center justify-between p-2 hover:bg-surface-sunken rounded-lg group">
                          <div className="flex items-center min-w-0">
                            <img src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random&color=fff&bold=true`} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover object-center border border-surface-border" />
                            <div className="ml-3 min-w-0">
                              <p className="text-sm font-semibold text-text-primary truncate">{friend.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Button onClick={() => { onStartDM(friend._id); setActiveTab('chats'); }} variant="outline" className="px-2 h-8 shrink-0">Message</Button>
                            <Button onClick={() => onUnfriend(friend._id)} variant="outline" tone="danger" title="Unfriend" className="px-2 h-8 shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11" transform="rotate(45 19 11)"/></svg>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requests.length === 0 ? (
                      <p className="text-sm text-text-tertiary text-center py-4">No pending requests.</p>
                    ) : requests.map(req => {
                      if (!req.requester) return null;
                      return (
                      <div key={req._id} className="flex flex-col p-3 bg-surface-base border border-surface-border shadow-sm rounded-lg mb-2">
                        <div className="flex items-center min-w-0 mb-3">
                          <img src={req.requester.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requester.name)}&background=random&color=fff&bold=true`} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover object-center border border-surface-border" />
                          <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{req.requester.name}</p>
                            <p className="text-xs text-text-secondary">Sent you a request</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={() => onAcceptFriend(req._id)} variant="primary" className="flex-1 h-8">Accept</Button>
                          <Button onClick={() => onRejectFriend(req._id)} variant="outline" tone="danger" className="flex-1 h-8">Decline</Button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col h-full bg-surface-base relative min-w-0">
        <div className="md:hidden flex items-center p-4 border-b border-surface-border bg-surface-base">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 hover:bg-surface-sunken rounded-full">
            <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-semibold text-text-primary">Messages</span>
        </div>
        {centerContent}
      </div>

      {/* Right Panel (Optional) */}
      {rightContent && (
        <div className="hidden lg:block w-[260px] bg-surface-sunken border-l border-surface-border flex-shrink-0">
          {rightContent}
        </div>
      )}

    </div>
  );
};

export default MessagingLayout;
