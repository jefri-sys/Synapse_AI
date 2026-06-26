import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import MessagingLayout from '../../components/messaging/MessagingLayout.jsx';
import ChatWindow from '../../components/messaging/ChatWindow.jsx';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { io } from 'socket.io-client';
import doodleBg from '../../../images/chatapplication doodle.png';

function Messages({ isPopupMode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        withCredentials: true
      });
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    fetchFriends();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      markAsRead(activeConversation._id);
    }
  }, [activeConversation]);

  const markAsRead = async (convId) => {
    try {
      await api.post(`/conversations/${convId}/read`);
      // Update local unreadCount
      setConversations(prev => prev.map(c => 
        c._id === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) { console.error('Error marking as read', err); }
  };

  const fetchMessages = async (convId) => {
    try {
      const { data } = await api.get(`/conversations/${convId}/messages`);
      setMessages(data);
    } catch (err) { console.error('Error fetching messages', err); }
  };

  const fetchFriends = async () => {
    try {
      const { data } = await api.get('/friends');
      setFriends(data);
    } catch (err) { console.error('Error fetching friends', err); }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/friends/requests');
      setRequests(data);
    } catch (err) { console.error('Error fetching requests', err); }
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(data);
      } catch (err) { console.error('Error searching users', err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddFriend = async (userId) => {
    try {
      await api.post('/friends/request', { recipientId: userId });
      setSearchResults(prev => prev.filter(u => u._id !== userId));
    } catch (err) { console.error('Error adding friend', err); }
  };

  const handleAccept = async (reqId) => {
    try {
      await api.patch(`/friends/request/${reqId}/accept`);
      fetchFriends();
      fetchRequests();
    } catch (err) { console.error('Error accepting friend', err); }
  };

  const handleReject = async (reqId) => {
    try {
      await api.patch(`/friends/request/${reqId}/reject`);
      fetchRequests();
    } catch (err) { console.error('Error rejecting friend', err); }
  };

  const handleStartDM = async (friendId) => {
    try {
      const { data } = await api.post('/conversations/dm', { friendId });
      fetchConversations();
      setActiveConversation(data);
    } catch (err) { console.error('Error starting DM', err); }
  };

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations', err);
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      // If message belongs to active conversation, mark as read immediately
      if (activeConversation && msg.conversationId === activeConversation._id) {
        markAsRead(activeConversation._id);
      } else {
        // Increment unread count for the conversation
        setConversations(prev => prev.map(c => 
          c._id === msg.conversationId 
            ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: msg, updatedAt: new Date() } 
            : c
        ));
      }
    };

    socket.on('message:receive', handleNewMessage);
    return () => socket.off('message:receive', handleNewMessage);
  }, [socket, activeConversation]);

  const handleUnfriend = async (friendId) => {
    try {
      await api.delete(`/friends/${friendId}`);
      fetchFriends();
    } catch (err) { console.error('Error unfriending', err); }
  };

  const centerContent = activeConversation ? (
    <ChatWindow 
      conversation={activeConversation}
      initialMessages={messages}
      socket={socket}
      currentUserId={user?._id || user?.id}
      currentUser={user}
    />
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary bg-surface-base p-8 text-center relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.15] dark:opacity-[0.08]"
        style={{
          backgroundImage: `url('${doodleBg}')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-surface-sunken flex items-center justify-center shadow-sm">
          <svg className="w-12 h-12 text-brand-primary opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Your Messages</h3>
        <p className="text-sm text-text-secondary max-w-sm">Select an existing conversation from the sidebar or find a friend to start chatting.</p>
      </div>
    </div>
  );

  const content = (
    <Card className="h-[calc(100vh-2.5rem)] sm:h-[calc(100vh-4rem)] p-0 overflow-hidden shadow-sm border-surface-border flex flex-col">
      <MessagingLayout 
        conversations={conversations}
        activeConversationId={activeConversation?._id}
        onSelectConversation={setActiveConversation}
        friends={friends}
        requests={requests}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onAddFriend={handleAddFriend}
        onAcceptFriend={handleAccept}
        onRejectFriend={handleReject}
        onUnfriend={handleUnfriend}
        onStartDM={handleStartDM}
        currentUserId={user?._id || user?.id}
        centerContent={centerContent}
      />
    </Card>
  );

  if (isPopupMode) {
    return content;
  }

  return (
    <ProtectedPage>
      {content}
    </ProtectedPage>
  );
}

export default Messages;
