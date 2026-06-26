import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Button } from '../ui/button';
import api from '../../services/api';

const ChatWindow = ({ conversation, initialMessages, socket, currentUserId, currentUser }) => {
  const [messages, setMessages] = useState(initialMessages || []);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [replyTo, setReplyTo] = useState(null);
  const [showNewMsgBadge, setShowNewMsgBadge] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const conversationId = conversation?._id;

  const fetchFriendStatus = async () => {
    if (conversation?.type !== 'dm') return;
    const otherUser = conversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    if (!otherUser) return;
    try {
      const { data } = await api.get(`/friends/${otherUser._id || otherUser}/status`);
      setFriendStatus(data.status);
    } catch (err) { console.error('Failed to fetch friend status', err); }
  };

  useEffect(() => {
    if (showProfile) {
      fetchFriendStatus();
    }
  }, [showProfile, conversationId]);

  useEffect(() => {
    setMessages(initialMessages || []);
    setIsInitialLoad(true);
  }, [initialMessages]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join:conversation', conversationId);

    const handleTypingStart = ({ userId, conversationId: cId }) => {
      if (String(cId) === String(conversationId) && String(userId) !== String(currentUserId)) {
        setTypingUsers(prev => new Set(prev).add(String(userId)));
      }
    };

    const handleTypingStop = ({ userId, conversationId: cId }) => {
      if (String(cId) === String(conversationId)) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(String(userId));
          return next;
        });
      }
    };

    const handleMessagesSeenUpdate = ({ messageIds, seenBy }) => {
      setMessages(prev => prev.map(m => {
        if (messageIds.includes(String(m._id)) && !m.seenBy.map(String).includes(String(seenBy))) {
          return { ...m, seenBy: [...m.seenBy, seenBy] };
        }
        return m;
      }));
    };

    const handleMessageReceive = (newMessage) => {
      if (String(newMessage.conversationId) === String(conversationId)) {
        setMessages(prev => {
          if (prev.find(m => String(m._id) === String(newMessage._id))) return prev;
          return [...prev, newMessage];
        });
        if (String(newMessage.senderId?._id || newMessage.senderId) !== String(currentUserId)) {
          socket.emit('messages:seen', { conversationId, messageIds: [newMessage._id] });
        }
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => {
        if (String(m._id) === String(messageId)) {
          return { ...m, isDeleted: true, content: 'This message was deleted' };
        }
        return m;
      }));
    };

    const handleUserOnline = (uid) => {
      const otherParticipant = conversation?.participants?.find(p => String(p._id || p) !== String(currentUserId));
      if (otherParticipant && String(otherParticipant._id || otherParticipant) === String(uid)) setIsOtherUserOnline(true);
    };

    const handleUserOffline = (uid) => {
      const otherParticipant = conversation?.participants?.find(p => String(p._id || p) !== String(currentUserId));
      if (otherParticipant && String(otherParticipant._id || otherParticipant) === String(uid)) setIsOtherUserOnline(false);
    };

    const handleOnlineUsers = (users) => {
      const otherParticipant = conversation?.participants?.find(p => String(p._id || p) !== String(currentUserId));
      if (otherParticipant && users.map(String).includes(String(otherParticipant._id || otherParticipant))) setIsOtherUserOnline(true);
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('messages:seen:update', handleMessagesSeenUpdate);
    socket.on('message:receive', handleMessageReceive);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('online_users', handleOnlineUsers);

    socket.emit('get:online_users');

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('messages:seen:update', handleMessagesSeenUpdate);
      socket.off('message:receive', handleMessageReceive);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('online_users', handleOnlineUsers);
      socket.emit('leave:conversation', conversationId);
      setTypingUsers(new Set());
    };
  }, [socket, conversationId, currentUserId, conversation]);

  useEffect(() => {
    if (!socket || !conversationId || messages.length === 0) return;

    const unseenIds = messages
      .filter(m => String(m.senderId?._id || m.senderId) !== String(currentUserId) && !m.seenBy.map(String).includes(String(currentUserId)))
      .map(m => String(m._id));

    if (unseenIds.length > 0) {
      socket.emit('messages:seen', { conversationId, messageIds: unseenIds });

      setMessages(prev => prev.map(m => {
        if (unseenIds.includes(String(m._id))) {
          return { ...m, seenBy: [...m.seenBy, currentUserId] };
        }
        return m;
      }));
    }
  }, [messages, socket, conversationId, currentUserId]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && conversationId) {
      socket.emit('typing:start', { conversationId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId });
      }, 2000);
    }
  };

  const handleFocus = () => {
    if (socket && conversationId && inputText.length > 0) {
      socket.emit('typing:start', { conversationId });
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      setShowNewMsgBadge(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMsgBadge(false);
  };

  const prevMessagesLengthRef = React.useRef(messages.length);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isInitialLoad && messages.length > 0) {
      // Force scroll to bottom on initial load of messages
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setIsInitialLoad(false);
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      if (isAtBottom) {
        scrollToBottom();
      } else {
        setShowNewMsgBadge(true);
      }
    } else if (isAtBottom) {
      // Just keep it scrolled to bottom if we were already there
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isInitialLoad]);

  // Handle typing indicator scroll without triggering the badge
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      scrollToBottom();
    }
  }, [typingUsers]);

  const handleSendText = async (text, replyToId) => {
    try {
      const { data: newMessage } = await api.post(`/conversations/${conversationId}/messages`, {
        content: text,
        replyTo: replyToId
      });
      setMessages(prev => {
        if (prev.find(m => String(m._id) === String(newMessage._id))) return prev;
        return [...prev, newMessage];
      });
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = (replyData) => {
    setReplyTo(replyData);
  };

  const handleCall = (type) => {
    if (conversation.type === 'group') {
      alert("Group calls coming soon!");
      return;
    }
    const otherUser = conversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    if (!otherUser) return;

    window.dispatchEvent(new CustomEvent('synapse:call', {
      detail: {
        conversationId: conversation._id,
        recipientId: String(otherUser._id || otherUser),
        recipientName: otherUser.name || 'User',
        recipientAvatar: otherUser.avatar,
        type
      }
    }));
  };



  const getConvName = () => {
    if (conversation.type === 'group') return conversation.groupName;
    const other = conversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    return other?.name || 'Unknown';
  };

  const getConvAvatar = () => {
    if (conversation.type === 'group') return conversation.groupAvatar || `https://ui-avatars.com/api/?name=${conversation.groupName || 'G'}`;
    const other = conversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    return other?.avatar || `https://ui-avatars.com/api/?name=${other?.name || 'U'}`;
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear this chat? This action cannot be undone.")) return;
    try {
      await api.delete(`/conversations/${conversationId}/clear`);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat', err);
    }
  };

  const handleBlockToggle = async () => {
    const otherUser = conversation.participants?.find(p => String(p._id || p) !== String(currentUserId));
    if (!otherUser) return;
    try {
      if (friendStatus === 'blocked') {
        await api.patch(`/friends/${otherUser._id || otherUser}/unblock`);
        setFriendStatus('none');
      } else {
        if (!window.confirm("Are you sure you want to block this user?")) return;
        await api.patch(`/friends/${otherUser._id || otherUser}/block`);
        setFriendStatus('blocked');
      }
    } catch (err) {
      console.error('Block toggle failed', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await api.delete(`/conversations/messages/${messageId}`);
      setMessages(prev => prev.map(m => {
        if (String(m._id) === String(messageId)) {
          return { ...m, isDeleted: true, content: 'This message was deleted' };
        }
        return m;
      }));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const recentFiles = messages.filter(m => ['image', 'video', 'document'].includes(m.type)).slice(-10);

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-[#fafafa] dark:bg-[#000000]">
      <div className="flex flex-col flex-grow h-full min-w-0 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-surface-border z-30 shrink-0 shadow-sm cursor-pointer hover:bg-surface-sunken transition-colors" onClick={() => setShowProfile(!showProfile)}>
          <div className="flex items-center">
            <img src={getConvAvatar()} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-surface-border" />
            <div className="ml-3 min-w-0">
              <h2 className="text-sm font-bold text-text-primary truncate">{getConvName()}</h2>
              {typingUsers.size > 0 ? (
                <p className="text-xs text-brand-primary font-medium italic animate-pulse">typing...</p>
              ) : isOtherUserOnline ? (
                <p className="text-xs text-status-success font-medium">Online</p>
              ) : null}
            </div>
          </div>
          <div className="flex space-x-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); handleCall('voice'); }} className="p-2 text-brand-primary hover:bg-brand-primary-subtle rounded-full transition-colors" title="Voice Call">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleCall('video'); }} className="p-2 text-brand-primary hover:bg-brand-primary-subtle rounded-full transition-colors" title="Video Call">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto p-4 pt-6 space-y-4 relative z-20"
        >
          {/* Subtle Ambient Background Glow */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.15] z-0 overflow-hidden">
            <div className="absolute top-1/4 right-[-10%] w-[600px] h-[600px] bg-brand-primary blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-1/4 left-[-10%] w-[600px] h-[600px] bg-blue-500 blur-[120px] rounded-full mix-blend-screen" />
          </div>
          
          <div className="relative z-10 flex flex-col space-y-4 min-h-full justify-end pb-4">
          {messages.map(msg => {
            const senderIdStr = typeof msg.senderId === 'object' && msg.senderId !== null ? msg.senderId._id : msg.senderId;
            const isOwn = String(senderIdStr) === String(currentUserId);
            return (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwnMessage={isOwn}
                currentUserId={currentUserId}
                socket={socket}
                onReply={handleReply}
                onDelete={handleDeleteMessage}
              />
            );
          })}
          </div>
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {showNewMsgBadge && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-brand-primary hover:bg-brand-primary-hover transition-colors text-white px-4 py-1.5 rounded-full shadow-lg flex items-center space-x-2 animate-bounce z-10 text-sm font-medium"
          >
            <span>↓ New message</span>
          </button>
        )}

        <ChatInput
          conversationId={conversationId}
          socket={socket}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          onSendText={handleSendText}
          onUploadSuccess={(newMessage) => {
            setMessages(prev => {
              if (prev.find(m => m._id === newMessage._id)) return prev;
              return [...prev, newMessage];
            });
            setTimeout(() => scrollToBottom(), 100);
          }}
        />
      </div>

      {showProfile && (
        <div className="w-80 bg-surface-base border-l border-surface-border flex flex-col shrink-0 overflow-y-auto z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="p-6 flex flex-col items-center border-b border-surface-border">
            <img src={getConvAvatar()} className="w-24 h-24 rounded-full object-cover mb-4 border border-surface-border shadow-sm" alt="Profile" />
            <h2 className="text-xl font-bold text-text-primary text-center">{getConvName()}</h2>
            <p className="text-sm text-text-secondary mt-1">{isOtherUserOnline ? 'Online' : 'Offline'}</p>
          </div>
          
          <div className="p-5 border-b border-surface-border">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Recent Files</h3>
            <div className="space-y-3">
              {recentFiles.length > 0 ? recentFiles.map(file => {
                let downloadUrl = file.content;
                if (file.type === 'document') {
                  const lowerExt = (file.fileName || file.content).split('.').pop().toLowerCase();
                  if (!['pdf', 'txt', 'png', 'jpg', 'jpeg'].includes(lowerExt)) {
                    if (downloadUrl.includes('/upload/') && !downloadUrl.includes('fl_attachment')) {
                      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                    }
                  }
                }
                
                return (
                  <a key={file._id} href={downloadUrl} target="_blank" rel="noopener noreferrer" download={file.fileName} className="flex items-center text-sm group cursor-pointer hover:bg-surface-sunken p-2 -mx-2 rounded-lg transition-colors no-underline">
                    <div className="w-8 h-8 rounded bg-brand-primary-subtle flex items-center justify-center mr-3 shrink-0">
                      {file.type === 'image' || file.type === 'video' ? (
                        <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate flex-1 font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                      {file.fileName || file.content.split('/').pop() || 'Attachment'}
                    </span>
                  </a>
                );
              }) : <p className="text-sm text-text-secondary text-center py-2">No recent files</p>}
            </div>
          </div>

          <div className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Chat Actions</h3>
            <Button onClick={handleClearChat} variant="outline" tone="danger" className="w-full flex justify-center items-center h-10">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear Chat
            </Button>
            {conversation.type === 'dm' && (
              <Button onClick={handleBlockToggle} variant="outline" tone="danger" className="w-full flex justify-center items-center h-10">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                {friendStatus === 'blocked' ? 'Unblock User' : 'Block User'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
