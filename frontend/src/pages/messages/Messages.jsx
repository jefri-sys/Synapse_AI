import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import MessagingLayout from '../../components/messaging/MessagingLayout.jsx';
import ChatWindow from '../../components/messaging/ChatWindow.jsx';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { io } from 'socket.io-client';

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
    <div className="flex-1 flex items-center justify-center text-text-tertiary bg-surface-base">
      <p>Select a conversation to start chatting</p>
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
