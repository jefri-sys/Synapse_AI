import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Send, Share2, X, BookOpen, Clock, LogOut, Link as LinkIcon, Check, CheckCheck, Settings, Shield, Zap, Smile, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../hooks/useAuth';
import ChatInput from '../../components/messaging/ChatInput';
import VoiceNotePlayer from '../../components/messaging/VoiceNotePlayer';
import GroupInfoPanel from './GroupInfoPanel';

const getSenderColor = (nameStr) => {
  if (!nameStr) return 'text-white/80';
  const colors = [
    'text-red-400', 'text-blue-400', 'text-green-400', 'text-purple-400', 
    'text-pink-400', 'text-yellow-500', 'text-indigo-400', 'text-teal-400', 'text-orange-400'
  ];
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

const GroupChat = ({ group, onLeave }) => {
 const { user } = useAuth();
 const [messages, setMessages] = useState([]);
 const [newMessage, setNewMessage] = useState('');
 const [socket, setSocket] = useState(null);
 const [typingUsers, setTypingUsers] = useState([]);
 const [showNotebookModal, setShowNotebookModal] = useState(false);
 const [showSettingsModal, setShowSettingsModal] = useState(false);
 const [notebooks, setNotebooks] = useState([]);
 const [friends, setFriends] = useState([]);
 const [copied, setCopied] = useState(false);
 const [replyTo, setReplyTo] = useState(null);
 const [evalQuestionId, setEvalQuestionId] = useState(null);
 const [isEvaluating, setIsEvaluating] = useState(false);
 
 const messagesEndRef = useRef(null);
 const typingTimeoutRef = useRef(null);

 useEffect(() => {
 fetchMessages();
 
 const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
 withCredentials: true
 });
 
 setSocket(newSocket);

 newSocket.on('connect', () => {
 newSocket.emit('joinGroup', { groupId: group._id });
 });

 newSocket.on('newMessage', (msg) => {
 setMessages(prev => [...prev, msg]);
 });

 newSocket.on('userTyping', ({ userName, isTyping }) => {
 setTypingUsers(prev => {
 if (isTyping) {
 if (!prev.includes(userName)) return [...prev, userName];
 return prev;
 } else {
 return prev.filter(name => name !== userName);
 }
 });
 });

 return () => {
 newSocket.emit('leaveGroup', { groupId: group._id });
 newSocket.disconnect();
 };
 }, [group._id]);

 useEffect(() => {
 if (showSettingsModal) {
 api.get('/friends').then(res => {
 setFriends(Array.isArray(res.data) ? res.data : []);
 }).catch(console.error);
 }
 }, [showSettingsModal]);

 useEffect(() => {
 if (!socket) return;
 
 socket.on('group:permissionsUpdated', (newPerms) => {
 // For now just fetch again
 if (onLeave) onLeave(); 
 });
 
 socket.on('group:error', ({ message }) => {
 alert(message);
 });

 socket.on('group:memberKicked', ({ userId: kickedId }) => {
 if (kickedId === user?._id) {
 alert('You were removed from the group.');
 window.location.href = '/dashboard/groups';
 } else {
 if (onLeave) onLeave();
 }
 });

 socket.on('group:memberAdded', () => {
 if (onLeave) onLeave();
 });

 socket.on('group:messagesRead', ({ messageIds, userId: readUserId }) => {
 setMessages(prev => prev.map(m => {
 if (messageIds.includes(m._id) && !m.readBy?.includes(readUserId)) {
 return { ...m, readBy: [...(m.readBy || []), readUserId] };
 }
 return m;
 }));
 });

 socket.on('group:deleted', ({ message }) => {
 alert(message);
 window.location.href = '/dashboard/groups';
 });

 socket.on('messageDeleted', ({ messageId }) => {
 setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, message: 'This message was deleted', messageType: 'text', fileUrl: null, fileName: null } : m));
 });

 socket.on('messageReacted', ({ messageId, reactions }) => {
 setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
 });

 return () => {
 socket.off('group:permissionsUpdated');
 socket.off('group:error');
 socket.off('group:memberKicked');
 socket.off('group:memberAdded');
 socket.off('group:messagesRead');
 socket.off('group:deleted');
 socket.off('messageDeleted');
 socket.off('messageReacted');
 };
 }, [socket, user, onLeave]);

 useEffect(() => {
 if (socket && messages.length > 0) {
 const hasUnread = messages.some(m => !m.readBy?.includes(user?._id) && (m.senderId?._id || m.senderId) !== user?._id);
 if (hasUnread) {
 socket.emit('group:markRead', { groupId: group._id });
 }
 }
 }, [messages, socket, user, group._id]);

 useEffect(() => {
 scrollToBottom();
 }, [messages, typingUsers]);

 const fetchMessages = async () => {
 try {
 const { data } = await api.get(`/groups/${group._id}/messages?limit=50`);
 const clearedAt = localStorage.getItem(`clearedAt_${group._id}`);
 if (clearedAt && Array.isArray(data)) {
 const threshold = parseInt(clearedAt, 10);
 setMessages(data.filter(m => new Date(m.createdAt).getTime() > threshold));
 } else {
 setMessages(Array.isArray(data) ? data : []);
 }
 } catch (err) {
 console.error('Error fetching messages:', err);
 setMessages([]);
 }
 };

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 const handleSendText = (text, replyToId) => {
 if (!text.trim() || !socket) return;
 socket.emit('sendMessage', { groupId: group._id, message: text });
 };

 const handleTyping = (e) => {
 setNewMessage(e.target.value);
 
 if (socket) {
 socket.emit('typing', { groupId: group._id, isTyping: true });
 
 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
 
 typingTimeoutRef.current = setTimeout(() => {
 socket.emit('typing', { groupId: group._id, isTyping: false });
 }, 2000);
 }
 };

 const handleEvaluate = async (messageId) => {
 if (isEvaluating) return;
 if (!evalQuestionId) {
 setEvalQuestionId(messageId);
 alert('Now tap the answer you want to evaluate.');
 return;
 }
 
 setIsEvaluating(true);
 try {
 await api.post(`/groups/${group._id}/ai/evaluate`, {
 questionMessageId: evalQuestionId,
 answerMessageId: messageId
 });
 setEvalQuestionId(null);
 } catch (err) {
 alert(err.response?.data?.error || 'Failed to evaluate answer');
 setEvalQuestionId(null);
 } finally {
 setIsEvaluating(false);
 }
 };

 const fetchNotebooks = async () => {
 try {
 const { data } = await api.get('/notebooks');
 setNotebooks(Array.isArray(data) ? data : []);
 setShowNotebookModal(true);
 } catch (err) {
 console.error('Error fetching notebooks:', err);
 setNotebooks([]);
 }
 };

 const shareSummary = async (notebookId) => {
 try {
 await api.post(`/groups/${group._id}/share-summary`, { notebookId });
 setShowNotebookModal(false);
 } catch (err) {
 console.error('Error sharing summary:', err);
 alert('Could not share summary. Ensure you have asked the AI to summarize this notebook first.');
 }
 };

 const handleCopyLink = () => {
 const link = `${window.location.origin}/dashboard/groups?join=${group._id}`;
 navigator.clipboard.writeText(link);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const handleLeaveGroup = async () => {
 if (!window.confirm("Are you sure you want to leave this group?")) return;
 try {
 await api.post(`/groups/${group._id}/leave`);
 if (onLeave) onLeave();
 } catch (err) {
 console.error("Error leaving group:", err);
 }
 };

 const handleClearChat = () => {
 if (window.confirm("Are you sure you want to clear this chat? Messages will be removed for you only.")) {
 localStorage.setItem(`clearedAt_${group._id}`, Date.now().toString());
 setMessages([]);
 }
 };

 const handleDeleteMessage = async (messageId) => {
   if (!window.confirm("Are you sure you want to delete this message?")) return;
   try {
     await api.delete(`/groups/${group._id}/messages/${messageId}`);
   } catch (err) {
     console.error("Error deleting message:", err);
     alert(err.response?.data?.error || "Failed to delete message");
   }
 };

 const handleReactMessage = async (messageId, emoji) => {
   try {
     await api.post(`/groups/${group._id}/messages/${messageId}/react`, { emoji });
   } catch (err) {
     console.error("Error reacting to message:", err);
     alert(err.response?.data?.error || "Failed to react");
   }
 };

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

 const canSendMedia = hasPermission('sendMedia');
 const canSendVoice = hasPermission('sendVoice');
 const canSendText = hasPermission('sendText');

 const getRoleColor = (role) => {
 switch (role) {
 case 'creator': return 'text-yellow-500';
 case 'admin': return 'text-purple-400';
 case 'moderator': return 'text-green-400';
 default: return 'text-white/40';
 }
 };

 const renderMessageContent = (msg) => {
 const { messageType, message, fileUrl, fileName, isDeleted } = msg;
 
 if (isDeleted || message === 'This message was deleted') {
   return (
     <span className="flex items-center gap-1.5 italic text-sm opacity-60">
       <span className="text-xs">🚫</span> This message was deleted
     </span>
   );
 }

 const url = fileUrl || message;
 
 if (messageType === 'summary') {
 return (
 <>
 <div className="flex items-center text-status-warning-dark mb-2 border-b border-status-warning/30 pb-2 text-xs font-sans font-bold tracking-wide uppercase">
 <BookOpen className="w-3.5 h-3.5 mr-1.5" /> AI Note Summary
 </div>
 <div className="whitespace-pre-wrap text-sm leading-relaxed">{message}</div>
 </>
 );
 }
 
 if (messageType === 'image') return <img src={url} alt="Attached" className="max-w-full h-auto rounded-lg" />;
 if (messageType === 'video') return <video src={url} controls className="max-w-full rounded-lg" />;
 if (messageType === 'audio') {
  const senderIdObj = msg.senderId?._id || msg.senderId;
  const isMine = senderIdObj === user?._id;
  return <VoiceNotePlayer audioUrl={url} sender={msg.senderId} isOwnMessage={isMine} />;
 }
 if (messageType === 'document') {
 let dlUrl = url;
 if (url.includes('/upload/') && !url.includes('fl_attachment')) dlUrl = url.replace('/upload/', '/upload/fl_attachment/');
 return (
 <a href={dlUrl} target="_blank" rel="noopener noreferrer" download={fileName} className="flex items-center p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm text-inherit no-underline border border-white/5">
 <BookOpen className="w-5 h-5 mr-2 shrink-0 text-purple-300" />
 <span className="truncate max-w-[200px] font-medium text-white/90">{fileName || url.split('/').pop()}</span>
 </a>
 );
 }
 
 return <div className="whitespace-pre-wrap text-sm leading-relaxed">{message}</div>;
 };

 return (
 <div className="flex flex-col h-full w-full">
 {/* Header */}
 <div className="bg-surface-base border-b border-surface-border p-4 flex justify-between items-center z-10 shrink-0 shadow-sm">
 <div 
 className="cursor-pointer hover:bg-surface-sunken p-2 -ml-2 rounded-xl transition-all"
 onClick={() => setShowSettingsModal(true)}
 >
 <div className="flex items-center space-x-2">
 <h2 className="text-lg font-bold text-text-primary tracking-tight">{group.name}</h2>
 {!group.isPublic && (
 <span className="bg-surface-sunken text-text-secondary border border-surface-border text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Private</span>
 )}
 </div>
 <div className="flex items-center mt-1 space-x-2">
   <div className="flex -space-x-1.5">
     {(group.members || []).slice(0, 3).map((m, i) => {
       const u = m.userId || {};
       return (
         <img 
           key={i} 
           src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random&color=fff`} 
           className="w-5 h-5 rounded-full border border-white object-cover object-center shrink-0 shadow-sm" 
           alt="Member"
         />
       );
     })}
   </div>
   <p className="text-xs text-text-secondary">{group.members?.length || 1} members • {group.course}</p>
 </div>
 </div>
 <div className="flex space-x-2">
 <button 
 onClick={handleCopyLink}
 className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-sunken hover:bg-surface-raised text-text-primary rounded-lg transition-colors text-sm font-medium border border-surface-border"
 title="Copy Invite Link"
 >
 {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4 text-brand-primary" />}
 <span className="hidden sm:inline">{copied ? 'Copied!' : 'Invite'}</span>
 </button>
 <button 
 onClick={handleClearChat}
 className="flex items-center justify-center w-8 h-8 text-text-tertiary hover:text-orange-500 bg-transparent hover:bg-orange-50 rounded-lg transition-colors"
 title="Clear Chat"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 <button 
 onClick={handleLeaveGroup}
 className="flex items-center justify-center w-8 h-8 text-text-tertiary hover:text-red-500 bg-transparent hover:bg-red-50 rounded-lg transition-colors"
 title="Leave Group"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Messages Area */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-surface-sunken/30 flex flex-col relative z-0">
 {messages.length === 0 ? (
 <div className="m-auto text-center text-text-tertiary">
 <p className="text-sm">No messages yet. Say hello!</p>
 </div>
 ) : (
 messages.map((msg, idx) => {
 const prevMsg = idx > 0 ? messages[idx - 1] : null;
 const senderIdObj = msg.senderId?._id || msg.senderId;
 const isMine = senderIdObj === user?._id;
 const senderName = isMine ? 'You' : (msg.senderId?.name || msg.senderName || 'User');
 
 let isRepeatingSender = false;
 if (prevMsg && !msg.isAIMessage && !msg.messageType?.includes('system') && !prevMsg.isAIMessage && !prevMsg.messageType?.includes('system')) {
   const prevSenderIdObj = prevMsg.senderId?._id || prevMsg.senderId;
   const timeDiff = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
   if (senderIdObj === prevSenderIdObj && timeDiff < 300000) { // 5 minutes
     isRepeatingSender = true;
   }
 }

 const senderMember = group.members?.find(m => {
 if (!m.userId) return false;
 return (m.userId._id || m.userId) === senderIdObj;
 });
 const senderRole = senderMember?.role || 'member';
 const isSummary = msg.messageType === 'summary';

 if (msg.messageType === 'system') {
 return (
 <div key={msg._id || idx} className="flex justify-center my-2">
 <div className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full text-center shadow-sm">
 {msg.message}
 </div>
 </div>
 );
 }

 if (msg.isAIMessage) {
 const badgeLabels = {
 'event_planner': 'Event Planner',
 'exam_planner': 'Exam Planner',
 'qa_answer': 'Q&A',
 'answer_eval': 'Answer Evaluator'
 };
 const badge = badgeLabels[msg.aiFeature] || 'AI Assistant';

 return (
 <div key={msg._id || idx} className="flex flex-col items-start mb-2">
 <div className="flex items-center ml-1 mb-1">
 <span className="flex items-center text-[10px] text-brand-primary-dark font-bold tracking-wide uppercase bg-brand-primary-subtle border border-brand-primary/20 px-2 py-0.5 rounded-full">
 <Zap className="w-3 h-3 mr-1 text-brand-primary fill-current" /> Synapse AI
 </span>
 <span className="ml-2 text-[9px] uppercase font-bold tracking-wider text-text-tertiary">
 • {badge}
 </span>
 </div>
 <div className="max-w-[95%] sm:max-w-[85%] p-4 shadow-sm bg-brand-primary-subtle/30 border border-brand-primary/20 text-text-primary rounded-2xl rounded-tl-none prose prose-sm">
 <ReactMarkdown>{msg.message}</ReactMarkdown>
 <div className="text-[10px] mt-2 flex items-center justify-end text-text-tertiary font-sans">
 <Clock className="w-3 h-3 mr-1" />
 <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 </div>
 </div>
 );
 }

 const isRead = msg.readBy && msg.readBy.length > 0 && msg.readBy.some(id => id !== user?._id);
 const nameColorClass = getSenderColor(senderIdObj);

 return (
 <div key={msg._id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group mb-1`}>
 {!isMine && !isRepeatingSender && (
 <div className="flex items-center ml-10 mb-1">
 <span className={`text-xs font-bold ${nameColorClass}`}>{senderName}</span>
 {senderRole !== 'member' && (
 <span className={`ml-1.5 text-[9px] uppercase font-bold tracking-wider ${getRoleColor(senderRole)}`}>
 • {senderRole}
 </span>
 )}
 </div>
 )}
 <div className="flex items-start max-w-[85%] sm:max-w-[75%]">
 {!isMine && !isRepeatingSender && (
 <img 
   src={msg.senderId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random&color=fff`} 
   className="w-7 h-7 rounded-full border border-white object-cover object-center mr-2 shrink-0 shadow-sm mt-1" 
   alt=""
 />
 )}
 {!isMine && isRepeatingSender && (
 <div className="w-7 h-7 mr-2 shrink-0"></div>
 )}
 {isMine && !msg.isDeleted && (
 <div className="flex items-center mr-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1 self-center shrink-0">
 <button 
 onClick={() => handleEvaluate(msg._id)}
 className={`p-1.5 rounded-full ${evalQuestionId === msg._id ? 'bg-yellow-100 text-yellow-600' : 'bg-surface-sunken hover:bg-surface-raised text-text-tertiary hover:text-text-secondary'}`}
 title={evalQuestionId === msg._id ? "Question selected" : (evalQuestionId ? "Evaluate this answer" : "Select as question")}
 >
 <Zap className="w-3.5 h-3.5" />
 </button>
 </div>
 )}
 <div className={`relative group/bubble ${msg.reactions && Object.keys(msg.reactions).length > 0 ? 'mb-3' : ''}`}>
 {!msg.isDeleted && (
 <div className={`hidden group-hover/bubble:flex absolute z-50 bottom-full mb-1 bg-surface-base border border-surface-border shadow-lg rounded-full px-2 py-1 space-x-1 items-center w-max ${isMine ? 'right-0' : 'left-0'}`}>
 {canSendText && EMOJIS.map(emoji => (
 <button 
 key={emoji} 
 onClick={() => handleReactMessage(msg._id, emoji)} 
 className="hover:scale-125 transition-transform text-lg"
 >
 {emoji}
 </button>
 ))}
 {(isMine || hasPermission('deleteAnyMessage')) && (
 <button 
 onClick={() => handleDeleteMessage(msg._id)}
 className="ml-1 p-1 text-text-tertiary hover:text-status-danger transition-colors"
 title="Delete message"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 )}
 <div 
 className={`w-fit min-w-[60px] px-4 py-2.5 transition-all ${
 isSummary 
 ? 'bg-yellow-50 text-[#854D0E] rounded-[22px] rounded-tl-[4px] font-serif relative overflow-hidden border border-yellow-200/50' 
 : isMine 
 ? `bg-gradient-to-br from-[#4F46E5] to-[#9333EA] text-white shadow-none border-none ${isRepeatingSender ? 'rounded-[22px] rounded-tr-[5px]' : 'rounded-[22px] rounded-br-[5px]'}` 
 : `bg-[#E4E6EB] text-[#050505] shadow-none border-none ${isRepeatingSender ? 'rounded-[22px] rounded-tl-[5px]' : 'rounded-[22px] rounded-bl-[5px]'}`
 }`}
 >
 {renderMessageContent(msg)}
 <div className={`text-[10px] mt-1 flex items-center justify-end space-x-1 ${isMine && !isSummary ? 'text-white/70' : 'text-[#65676B]'}`}>
 <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 {isMine && (
 <span className="ml-1">
 {isRead ? <CheckCheck className="w-3.5 h-3.5 text-white" /> : <Check className="w-3 h-3 text-white/50" />}
 </span>
 )}
 </div>
 </div>
 {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
 <div className={`absolute -bottom-3.5 ${isMine ? 'right-2' : 'left-2'} z-10 flex flex-wrap gap-1`}>
 {Object.entries(msg.reactions).map(([emoji, users]) => {
 const userReacted = users.includes(user?._id);
 return (
 <button 
 key={emoji} 
 onClick={() => handleReactMessage(msg._id, emoji)} 
 className={`flex items-center text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer transition-colors font-sans border shadow-sm ${userReacted ? 'border-brand-primary bg-brand-primary-subtle text-brand-primary-dark' : 'bg-surface-base border-surface-border text-text-secondary hover:bg-surface-raised'}`}
 >
 <span>{emoji}</span> <span className="ml-1 opacity-80 font-medium">{users.length}</span>
 </button>
 );
 })}
 </div>
 )}
 {!isMine && !msg.isDeleted && (
 <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1 self-center shrink-0">
 <button 
 onClick={() => handleEvaluate(msg._id)}
 className={`p-1.5 rounded-full ${evalQuestionId === msg._id ? 'bg-yellow-100 text-yellow-600' : 'bg-surface-sunken hover:bg-surface-raised text-text-tertiary hover:text-text-secondary'}`}
 title={evalQuestionId === msg._id ? "Question selected" : (evalQuestionId ? "Evaluate this answer" : "Select as question")}
 >
 <Zap className="w-3.5 h-3.5" />
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 
 {typingUsers.length > 0 && (
 <div className="text-xs text-text-tertiary italic px-2 py-1">
 {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
 </div>
 )}
 <div ref={messagesEndRef} className="h-1" />
 </div>

 <ChatInput
 conversationId={group._id}
 socket={socket}
 replyTo={replyTo}
 setReplyTo={setReplyTo}
 onSendText={handleSendText}
 onUploadSuccess={() => {}} // Rely on socket emission
 uploadUrl={`/groups/${group._id}/messages/media`}
 allowMedia={canSendMedia}
 allowVoice={canSendVoice}
 allowText={canSendText}
 />

 {/* Settings Modal */}
 {showSettingsModal && (
 <GroupInfoPanel 
 group={group} 
 onClose={() => setShowSettingsModal(false)} 
 onUpdateGroup={() => { if(onLeave) onLeave() }} 
 />
 )}

 {/* Notebook Modal */}
 {showNotebookModal && (
 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xl">
 <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[80%] flex flex-col">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-lg font-bold text-white">Share Summary</h3>
 <button onClick={() => setShowNotebookModal(false)} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
 <X className="w-5 h-5" />
 </button>
 </div>
 <p className="text-xs text-white/50 mb-6 leading-relaxed">Select a notebook. The latest AI summary from its chat will be shared with the group.</p>
 <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
 {notebooks.length === 0 ? (
 <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
 <p className="text-sm text-white/50">No notebooks available.</p>
 </div>
 ) : (
 notebooks.map(notebook => (
 <button 
 key={notebook._id}
 onClick={() => shareSummary(notebook._id)}
 className="w-full text-left p-4 border border-white/5 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all group flex items-center bg-white/[0.02]"
 >
 <BookOpen className="w-5 h-5 text-white/30 group-hover:text-purple-400 mr-3 shrink-0 transition-colors" />
 <div className="overflow-hidden">
 <div className="font-semibold text-white/90 text-sm truncate">{notebook.title}</div>
 <div className="text-xs text-white/50 truncate mt-0.5">{notebook.subjectId?.name || "No Subject"}</div>
 </div>
 </button>
 ))
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default GroupChat;
