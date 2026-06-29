import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, Phone, Video, Paperclip, Send, Mic } from 'lucide-react';
import MessageBubble from '../../messaging/MessageBubble.jsx';
import api from '../../../services/api';

import VoiceRecorder from '../../messaging/VoiceRecorder.jsx';

export default function MobileMessages({
  user,
  conversations = [],
  activeConversation,
  setActiveConversation,
  messages: initialMessages = [],
  socket,
  friends = [],
  requests = [],
  searchQuery,
  setSearchQuery,
  searchResults = [],
  onAddFriend,
  onAcceptFriend,
  onRejectFriend,
  onUnfriend,
  onStartDM
}) {
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('chats');
  const [peopleSubTab, setPeopleSubTab] = useState('friends');
  const [localMessages, setLocalMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [localConversations, setLocalConversations] = useState([]);

  useEffect(() => {
    setLocalConversations(prev => {
      if (prev.length === 0) return conversations;
      return conversations.map(c => {
         const prevC = prev.find(p => String(p._id) === String(c._id));
         if (prevC && prevC.lastMessage && new Date(prevC.updatedAt || 0) > new Date(c.updatedAt || 0)) {
             return prevC;
         }
         return c;
      });
    });
  }, [conversations]);

  useEffect(() => {
    setLocalMessages(initialMessages);
    setTimeout(scrollToBottom, 100);
  }, [initialMessages]);

  useEffect(() => {
    if (!socket) return;
    const handleReceive = (msg) => {
      // 1. Update chat window only if it belongs to active chat
      if (activeConversation && String(msg.conversationId) === String(activeConversation._id)) {
        setLocalMessages(prev => {
          if (prev.find(m => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
        socket.emit('messages:seen', { conversationId: activeConversation._id, messageIds: [msg._id] });
        window.dispatchEvent(new CustomEvent('synapse:messages-read'));
      }

      // 2. Update local conversation list for real-time sync
      setLocalConversations(prev => prev.map(c => {
        if (String(c._id) === String(msg.conversationId)) {
          return {
            ...c,
            lastMessage: msg,
            updatedAt: new Date(),
            unreadCount: (activeConversation && String(activeConversation._id) === String(c._id)) ? 0 : (c.unreadCount || 0) + 1
          };
        }
        return c;
      }));
    };

    const handleTyping = ({ userId, isTyping, conversationId: cId }) => {
      if (userId === user?._id) return;
      if (activeConversation && String(activeConversation._id) === String(cId)) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (isTyping) next.add(userId);
          else next.delete(userId);
          return next;
        });
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setLocalMessages(prev => prev.map(m => {
        if (String(m._id) === String(messageId)) {
          return { ...m, isDeleted: true, content: 'This message was deleted', type: 'text' };
        }
        return m;
      }));
    };

    const handleUserOnline = (uid) => {
      setLocalConversations(prev => prev.map(c => {
        if (c.type === 'dm') {
          const newParts = c.participants?.map(p => {
            if (String(p._id || p) === String(uid)) return { ...p, status: 'online' };
            return p;
          });
          return { ...c, participants: newParts };
        }
        return c;
      }));
    };

    const handleUserOffline = (uid) => {
      setLocalConversations(prev => prev.map(c => {
        if (c.type === 'dm') {
          const newParts = c.participants?.map(p => {
            if (String(p._id || p) === String(uid)) return { ...p, status: 'offline' };
            return p;
          });
          return { ...c, participants: newParts };
        }
        return c;
      }));
    };

    const handleOnlineUsers = (users) => {
      const uids = users.map(String);
      setLocalConversations(prev => prev.map(c => {
        if (c.type === 'dm') {
          const newParts = c.participants?.map(p => {
            if (uids.includes(String(p._id || p))) return { ...p, status: 'online' };
            return p;
          });
          return { ...c, participants: newParts };
        }
        return c;
      }));
    };

    socket.on('receive_message', handleReceive);
    socket.on('message:receive', handleReceive);
    socket.on('user_typing', handleTyping);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('online_users', handleOnlineUsers);
    
    socket.emit('get:online_users');

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message:receive', handleReceive);
      socket.off('user_typing', handleTyping);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket, user, activeConversation]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversation) return;
    try {
      const { data: newMessage } = await api.post(`/conversations/${activeConversation._id}/messages`, {
        content: inputText
      });
      setLocalMessages(prev => {
        if (prev.find(m => String(m._id) === String(newMessage._id))) return prev;
        return [...prev, newMessage];
      });
      setLocalConversations(prev => prev.map(c => String(c._id) === String(activeConversation._id) ? { ...c, lastMessage: newMessage, updatedAt: new Date() } : c));
      setInputText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConversation) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data: newMessage } = await api.post(`/conversations/${activeConversation._id}/messages/media`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setLocalMessages(prev => {
        if (prev.find(m => String(m._id) === String(newMessage._id))) return prev;
        return [...prev, newMessage];
      });
      setLocalConversations(prev => prev.map(c => String(c._id) === String(activeConversation._id) ? { ...c, lastMessage: newMessage, updatedAt: new Date() } : c));
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('File upload failed', err);
    }
  };

  const handleCall = async (type) => {
    if (!activeConversation) return;
    if (activeConversation.type === 'group') {
      alert("Group calls coming soon!");
      return;
    }
    const currentUserId = user?._id || user?.id;
    const otherUser = activeConversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    if (!otherUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      window.dispatchEvent(new CustomEvent('synapse:call', {
        detail: {
          conversationId: activeConversation._id,
          recipientId: String(otherUser._id || otherUser),
          recipientName: otherUser.name || 'User',
          recipientAvatar: otherUser.avatar,
          type,
          stream
        }
      }));
    } catch (err) {
      console.error('Failed to get media devices:', err);
      alert('Could not access microphone or camera. Please check your permissions.');
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Clear this chat?")) return;
    try {
      await api.delete(`/conversations/${activeConversation._id}/clear`);
      setLocalMessages([]);
      setShowProfile(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await api.delete(`/conversations/messages/${messageId}`);
      setLocalMessages(prev => prev.map(m => {
        if (String(m._id) === String(messageId)) {
          return { ...m, isDeleted: true, content: 'This message was deleted', type: 'text' };
        }
        return m;
      }));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const handleBlockToggle = async () => {
    const currentUserId = user?._id || user?.id;
    const otherUser = activeConversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    if (!otherUser) return;
    if (!window.confirm("Block this user?")) return;
    try {
      await api.patch(`/friends/${otherUser._id || otherUser}/block`);
      setShowProfile(false);
    } catch (err) {
      console.error(err);
    }
  };

  const currentUserId = user?._id || user?.id;

  if (viewMode === 'chat' && activeConversation) {
    const isGroup = activeConversation.type === 'group';
    const otherUser = activeConversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    const name = isGroup ? activeConversation.groupName : (otherUser?.name || 'Unknown');
    const avatar = isGroup ? (activeConversation.groupAvatar || `https://ui-avatars.com/api/?name=${name}`) : (otherUser?.avatar || `https://ui-avatars.com/api/?name=${name}`);
    const isOnline = !isGroup && otherUser?.status === 'online';
    const recentFiles = localMessages.filter(m => ['image', 'video', 'document'].includes(m.type)).slice(-10);

    return (
      <div className="mobile-shell" style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'var(--mobile-bg)', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {/* HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', paddingTop: 'max(16px, env(safe-area-inset-top))', background: 'var(--mobile-surface)', borderBottom: '1px solid var(--mobile-border)' }}>
          <ChevronLeft size={24} color="var(--mobile-text-primary)" onClick={() => { setViewMode('list'); setActiveConversation(null); }} />
          <div onClick={() => setShowProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
            <img src={avatar} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{name}</div>
              <div style={{ fontSize: '12px', color: isOnline ? 'var(--mobile-success)' : 'var(--mobile-text-tertiary)' }}>{isOnline ? 'Online' : 'Offline'}</div>
            </div>
          </div>
          <button onClick={() => handleCall('voice')} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <Phone size={18} color="var(--mobile-primary)" />
          </button>
          <button onClick={() => handleCall('video')} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
            <Video size={18} color="var(--mobile-primary)" />
          </button>
        </div>

        {/* MESSAGE THREAD */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'var(--mobile-bg)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {localMessages.map((msg, i) => {
            const senderIdStr = typeof msg.senderId === 'object' && msg.senderId !== null ? msg.senderId._id : msg.senderId;
            const isOwn = String(senderIdStr) === String(currentUserId);
            
            return (
              <MessageBubble
                key={msg._id || i}
                message={msg}
                isOwnMessage={isOwn}
                currentUserId={currentUserId}
                socket={socket}
                onDelete={handleDeleteMessage}
              />
            );
          })}
          {typingUsers.size > 0 && <div style={{ fontSize: '13px', color: 'var(--mobile-primary)', fontStyle: 'italic', marginTop: '8px' }}>typing...</div>}
          <div ref={messagesEndRef} style={{ height: '4px' }} />
        </div>

        {/* INPUT BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', background: 'var(--mobile-surface)', borderTop: '1px solid var(--mobile-border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', position: 'relative' }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', flexShrink: 0 }}>
            <Paperclip size={18} color="var(--mobile-text-secondary)" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            style={{ flex: 1, background: 'var(--mobile-bg)', borderRadius: '16px', padding: '12px 16px', fontSize: '15px', border: '1.5px solid var(--mobile-border)', color: 'var(--mobile-text-primary)' }}
          />
          {inputText.trim() ? (
            <button 
              onClick={handleSendMessage}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', flexShrink: 0 }}
            >
              <Send size={18} color="#fff" />
            </button>
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <VoiceRecorder 
                 conversationId={activeConversation._id}
                 onUploadSuccess={(newMessage) => {
                   setLocalMessages(prev => {
                     if (prev.find(m => String(m._id) === String(newMessage._id))) return prev;
                     return [...prev, newMessage];
                   });
                   setLocalConversations(prev => prev.map(c => String(c._id) === String(activeConversation._id) ? { ...c, lastMessage: newMessage, updatedAt: new Date() } : c));
                   setTimeout(scrollToBottom, 100);
                 }}
               />
            </div>
          )}
        </div>

        {/* PROFILE SHEET (Clear Chat, Block, Medias) */}
        {showProfile && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.5)' }}>
             <div style={{ flex: 1 }} onClick={() => setShowProfile(false)} />
             <div style={{ background: 'var(--mobile-surface)', padding: '24px 20px calc(32px + env(safe-area-inset-bottom)) 20px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--mobile-text-primary)' }}>Chat Details</h3>
                  <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: 'var(--mobile-text-secondary)', fontSize: '16px', cursor: 'pointer' }}>Close</button>
                </div>
                <button onClick={handleClearChat} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--mobile-bg)', color: 'var(--mobile-danger)', border: '1px solid var(--mobile-danger-subtle)', fontWeight: 600, marginBottom: '12px' }}>Clear Chat</button>
                {!isGroup && (
                  <button onClick={handleBlockToggle} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--mobile-danger-subtle)', color: 'var(--mobile-danger)', border: 'none', fontWeight: 600, marginBottom: '20px' }}>Block User</button>
                )}
                
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Recent Files</h4>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {recentFiles.length > 0 ? recentFiles.map(file => (
                     <a key={file._id} href={file.content} target="_blank" rel="noopener noreferrer" style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--mobile-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none', overflow: 'hidden' }}>
                        {file.type === 'image' ? <img src={file.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Paperclip size={24} color="var(--mobile-text-secondary)" />}
                     </a>
                  )) : (
                     <div style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)' }}>No recent media</div>
                  )}
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  const renderMessagePreview = (message) => {
    if (!message || !message.content) return 'No messages yet';
    if (message.isDeleted) return '🚫 This message was deleted';
    
    switch (message.type) {
      case 'audio': return '🎤 Voice message';
      case 'image': return '📷 Photo';
      case 'video': return '🎥 Video';
      case 'document': return '📎 Attachment';
      default:
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

  // LIST VIEW
  const sortedConversations = [...(localConversations || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* 1. HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 20px 0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Messages</h1>
          <button 
            onClick={() => setActiveTab('people')}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: 'var(--mobile-shadow-card)' }}
          >
            <Search size={18} color="var(--mobile-text-secondary)" />
          </button>
        </div>
        {activeTab === 'people' && (
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={18} color="var(--mobile-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid var(--mobile-border)', background: 'var(--mobile-surface)', color: 'var(--mobile-text-primary)', fontSize: '15px' }}
            />
          </div>
        )}
      </div>

      {/* 2. TAB PILLS */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 20px', marginTop: '16px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveTab('chats')}
          style={{
            padding: '12px 20px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, flexShrink: 0,
            background: activeTab === 'chats' ? 'var(--mobile-primary)' : 'var(--mobile-surface)',
            color: activeTab === 'chats' ? '#fff' : 'var(--mobile-text-secondary)',
            border: activeTab === 'chats' ? 'none' : '1px solid var(--mobile-border)'
          }}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('people')}
          style={{
            padding: '12px 20px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, flexShrink: 0,
            background: activeTab === 'people' ? 'var(--mobile-primary)' : 'var(--mobile-surface)',
            color: activeTab === 'people' ? '#fff' : 'var(--mobile-text-secondary)',
            border: activeTab === 'people' ? 'none' : '1px solid var(--mobile-border)'
          }}
        >
          People
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {activeTab === 'chats' && (
          <>
            {sortedConversations.map(conv => {
          const isGroup = conv.type === 'group';
          const otherUser = conv.participants?.find(p => String(p._id || p) !== String(currentUserId));
          const name = isGroup ? conv.groupName : (otherUser?.name || 'Unknown');
          const avatar = isGroup ? (conv.groupAvatar || `https://ui-avatars.com/api/?name=${name}`) : (otherUser?.avatar || `https://ui-avatars.com/api/?name=${name}`);
          const isOnline = !isGroup && otherUser?.status === 'online'; 
          
          return (
            <div 
              key={conv._id}
              onClick={() => {
                setActiveConversation(conv);
                setViewMode('chat');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--mobile-border)' }}
            >
              <div style={{ position: 'relative' }}>
                <img src={avatar} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                {isOnline && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: '#4CAF82', border: '2px solid #fff' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 400, color: 'var(--mobile-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {renderMessagePreview(conv.lastMessage)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--mobile-text-tertiary)' }}>
                  {conv.lastMessage?.createdAt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date(conv.lastMessage.createdAt)) : ''}
                </div>
                {conv.unreadCount > 0 && (
                  <div style={{ background: 'var(--mobile-danger)', color: '#fff', fontSize: '11px', fontWeight: 700, minHeight: '20px', padding: '0 8px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sortedConversations.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mobile-text-secondary)', fontSize: '14px' }}>
            No conversations found.
          </div>
        )}
        </>
        )}

        {activeTab === 'people' && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setPeopleSubTab('friends')} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: peopleSubTab === 'friends' ? 'var(--mobile-surface)' : 'transparent', color: peopleSubTab === 'friends' ? 'var(--mobile-text-primary)' : 'var(--mobile-text-secondary)', border: 'none', boxShadow: peopleSubTab === 'friends' ? 'var(--mobile-shadow-card)' : 'none' }}>Friends</button>
              <button onClick={() => setPeopleSubTab('requests')} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: peopleSubTab === 'requests' ? 'var(--mobile-surface)' : 'transparent', color: peopleSubTab === 'requests' ? 'var(--mobile-text-primary)' : 'var(--mobile-text-secondary)', border: 'none', boxShadow: peopleSubTab === 'requests' ? 'var(--mobile-shadow-card)' : 'none' }}>Requests</button>
            </div>

            {searchQuery ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mobile-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Search Results</h3>
                {searchResults.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--mobile-text-tertiary)', textAlign: 'center' }}>No users found.</p>
                ) : searchResults.map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--mobile-surface)', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, marginLeft: '12px', minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mobile-text-secondary)' }}>@{u.username || u.name.toLowerCase().replace(' ', '')}</div>
                    </div>
                    <button onClick={() => onAddFriend(u._id)} style={{ padding: '8px 12px', borderRadius: '99px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none' }}>Add</button>
                  </div>
                ))}
              </div>
            ) : peopleSubTab === 'friends' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {friends.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--mobile-text-tertiary)', textAlign: 'center' }}>You have no friends yet.</p>
                ) : friends.map(f => {
                  const friend = f.requester?._id === currentUserId ? f.recipient : f.requester;
                  if (!friend) return null;
                  return (
                    <div key={f._id} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--mobile-surface)', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
                      <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1, marginLeft: '12px', minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{friend.name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { onStartDM(friend._id); setActiveTab('chats'); }} style={{ padding: '8px 12px', borderRadius: '99px', background: 'var(--mobile-bg)', border: '1px solid var(--mobile-primary)', color: 'var(--mobile-primary)', fontSize: '13px', fontWeight: 600 }}>Message</button>
                        <button onClick={() => onUnfriend(friend._id)} style={{ padding: '8px', borderRadius: '50%', background: 'var(--mobile-danger-subtle)', border: 'none', color: 'var(--mobile-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11" transform="rotate(45 19 11)"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {requests.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--mobile-text-tertiary)', textAlign: 'center' }}>No pending requests.</p>
                ) : requests.map(req => {
                  if (!req.requester) return null;
                  return (
                    <div key={req._id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'var(--mobile-surface)', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <img src={req.requester.avatar || `https://ui-avatars.com/api/?name=${req.requester.name}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1, marginLeft: '12px', minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{req.requester.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--mobile-text-secondary)' }}>Sent you a request</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => onAcceptFriend(req._id)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--mobile-primary)', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none' }}>Accept</button>
                        <button onClick={() => onRejectFriend(req._id)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'var(--mobile-danger-subtle)', color: 'var(--mobile-danger)', fontSize: '13px', fontWeight: 600, border: 'none' }}>Decline</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
