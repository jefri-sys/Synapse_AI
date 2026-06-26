import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { Send, Share2, X, BookOpen, Clock, LogOut, Link as LinkIcon, Check, CheckCheck, Settings, Shield, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../hooks/useAuth';
import ChatInput from '../../components/messaging/ChatInput';
import VoiceNotePlayer from '../../components/messaging/VoiceNotePlayer';
import GroupInfoPanel from './GroupInfoPanel';

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

 return () => {
 socket.off('group:permissionsUpdated');
 socket.off('group:error');
 socket.off('group:memberKicked');
 socket.off('group:memberAdded');
 socket.off('group:messagesRead');
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
 setMessages(Array.isArray(data) ? data : []);
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
 case 'creator': return 'text-status-warning';
 case 'admin': return 'text-brand-primary';
 case 'moderator': return 'text-status-success';
 default: return 'text-text-tertiary';
 }
 };

 const renderMessageContent = (msg) => {
 const { messageType, message, fileUrl, fileName } = msg;
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
 if (messageType === 'audio') return <VoiceNotePlayer url={url} />;
 if (messageType === 'document') {
 let dlUrl = url;
 if (url.includes('/upload/') && !url.includes('fl_attachment')) dlUrl = url.replace('/upload/', '/upload/fl_attachment/');
 return (
 <a href={dlUrl} target="_blank" rel="noopener noreferrer" download={fileName} className="flex items-center p-2 bg-black/10 rounded-lg hover:bg-black/20 transition text-sm text-inherit no-underline">
 <BookOpen className="w-5 h-5 mr-2 shrink-0" />
 <span className="truncate max-w-[200px] font-medium">{fileName || url.split('/').pop()}</span>
 </a>
 );
 }
 
 return <div className="whitespace-pre-wrap text-sm leading-relaxed">{message}</div>;
 };

 return (
 <div className="flex flex-col h-full w-full">
 {/* Header */}
 <div className="bg-surface-base border-b border-surface-border p-4 flex justify-between items-center shadow-sm z-10 shrink-0">
 <div 
 className="cursor-pointer hover:bg-surface-sunken p-2 -ml-2 rounded-lg transition"
 onClick={() => setShowSettingsModal(true)}
 >
 <div className="flex items-center space-x-2">
 <h2 className="text-lg font-bold text-text-primary">{group.name}</h2>
 {!group.isPublic && (
 <span className="bg-surface-sunken text-text-secondary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Private</span>
 )}
 </div>
 <p className="text-xs text-text-secondary">{group.members?.length || 1} members • {group.course}</p>
 </div>
 <div className="flex space-x-2">
 <button 
 onClick={handleCopyLink}
 className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-md hover:bg-brand-primary/20 transition text-sm font-medium"
 title="Copy Invite Link"
 >
 {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
 <span className="hidden sm:inline">{copied ? 'Copied!' : 'Invite Link'}</span>
 </button>
 <button 
 onClick={fetchNotebooks}
 className="flex items-center space-x-1.5 px-3 py-1.5 bg-status-warning/10 text-status-warning-dark border border-status-warning/20 rounded-md hover:bg-status-warning/20 transition text-sm font-medium"
 title="Share a Note Summary"
 >
 <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share Summary</span>
 </button>
 <button 
 onClick={handleLeaveGroup}
 className="flex items-center px-2 py-1.5 bg-status-danger-subtle text-status-danger rounded-md hover:bg-status-danger/20 transition text-sm"
 title="Leave Group"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Messages Area */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-base flex flex-col">
 {messages.length === 0 ? (
 <div className="m-auto text-center text-text-tertiary">
 <p className="text-sm">No messages yet. Say hello!</p>
 </div>
 ) : (
 messages.map((msg, idx) => {
 const senderIdObj = msg.senderId?._id || msg.senderId;
 const isMine = senderIdObj === user?._id;
 const senderName = isMine ? 'You' : (msg.senderId?.name || msg.senderName || 'User');
 const senderMember = group.members?.find(m => {
 if (!m.userId) return false;
 return (m.userId._id || m.userId) === senderIdObj;
 });
 const senderRole = senderMember?.role || 'member';
 const isSummary = msg.messageType === 'summary';

 if (msg.messageType === 'system') {
 return (
 <div key={msg._id || idx} className="flex justify-center my-2">
 <div className="bg-surface-sunken text-text-secondary text-xs px-3 py-1 rounded-full text-center max-w-[80%] shadow-sm">
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
 <span className="flex items-center text-[10px] text-brand-primary-dark font-bold tracking-wide uppercase bg-brand-primary-subtle px-2 py-0.5 rounded-full">
 <Zap className="w-3 h-3 mr-1 text-brand-primary fill-current" /> Synapse AI
 </span>
 <span className="ml-2 text-[9px] uppercase font-bold tracking-wider text-text-tertiary">
 • {badge}
 </span>
 </div>
 <div className="max-w-[95%] sm:max-w-[85%] p-4 shadow-sm bg-brand-primary/5 border border-brand-primary/20 text-text-primary rounded-2xl rounded-tl-none prose prose-sm prose-indigo">
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

 return (
 <div key={msg._id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}>
 {!isMine && (
 <div className="flex items-center ml-1 mb-1">
 <span className="text-xs text-text-secondary font-medium">{senderName}</span>
 {senderRole !== 'member' && (
 <span className={`ml-1.5 text-[9px] uppercase font-bold tracking-wider ${getRoleColor(senderRole)}`}>
 • {senderRole}
 </span>
 )}
 </div>
 )}
 <div className="flex items-center">
 {!isMine && (
 <button 
 onClick={() => handleEvaluate(msg._id)}
 className={`opacity-0 group-hover:opacity-100 transition-opacity mr-2 p-1.5 rounded-full flex-shrink-0 ${evalQuestionId === msg._id ? 'bg-status-warning/20 text-status-warning-dark opacity-100' : 'bg-surface-sunken hover:bg-brand-primary-subtle text-text-tertiary hover:text-brand-primary'}`}
 title={evalQuestionId === msg._id ? "Question selected" : (evalQuestionId ? "Evaluate this answer" : "Select as question")}
 >
 <Zap className="w-3.5 h-3.5" />
 </button>
 )}
 <div 
 className={`max-w-full sm:max-w-[75%] p-3 shadow-sm ${
 isSummary 
 ? 'bg-status-warning/10 border border-status-warning/20 text-text-primary rounded-2xl rounded-tl-none font-serif relative overflow-hidden' 
 : isMine 
 ? 'bg-brand-primary text-white rounded-2xl rounded-tr-none' 
 : 'bg-surface-base text-text-primary border border-surface-border rounded-2xl rounded-tl-none'
 }`}
 >
 {renderMessageContent(msg)}
 <div className={`text-[10px] mt-2 flex items-center justify-end space-x-1 ${isMine && !isSummary ? 'text-white/70' : 'text-text-tertiary'}`}>
 <Clock className="w-3 h-3" />
 <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 {isMine && (
 <span className="ml-1">
 {isRead ? <CheckCheck className="w-3.5 h-3.5 text-brand-primary-subtle" /> : <Check className="w-3 h-3 text-white/50" />}
 </span>
 )}
 </div>
 </div>
 {isMine && (
 <button 
 onClick={() => handleEvaluate(msg._id)}
 className={`opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 rounded-full flex-shrink-0 ${evalQuestionId === msg._id ? 'bg-status-warning/20 text-status-warning-dark opacity-100' : 'bg-surface-sunken hover:bg-brand-primary-subtle text-text-tertiary hover:text-brand-primary'}`}
 title={evalQuestionId === msg._id ? "Question selected" : (evalQuestionId ? "Evaluate this answer" : "Select as question")}
 >
 <Zap className="w-3.5 h-3.5" />
 </button>
 )}
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
 <div className="absolute inset-0 bg-surface-base/50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface-base rounded-xl shadow-xl w-full max-w-sm p-5 max-h-[80%] flex flex-col">
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-lg font-bold text-text-primary">Share Summary</h3>
 <button onClick={() => setShowNotebookModal(false)} className="text-text-tertiary hover:text-text-primary">
 <X className="w-5 h-5" />
 </button>
 </div>
 <p className="text-xs text-text-secondary mb-4">Select a notebook. The latest AI summary from its chat will be shared with the group.</p>
 <div className="flex-1 overflow-y-auto space-y-2">
 {notebooks.length === 0 ? (
 <div className="text-center py-6 border border-dashed border-surface-border rounded-lg">
 <p className="text-sm text-text-secondary">No notebooks available.</p>
 </div>
 ) : (
 notebooks.map(notebook => (
 <button 
 key={notebook._id}
 onClick={() => shareSummary(notebook._id)}
 className="w-full text-left p-3 border border-surface-border rounded-lg hover:bg-brand-primary-subtle hover:border-brand-primary/20 transition group flex items-center"
 >
 <BookOpen className="w-5 h-5 text-text-tertiary group-hover:text-brand-primary mr-3 shrink-0" />
 <div className="overflow-hidden">
 <div className="font-semibold text-text-primary text-sm truncate">{notebook.title}</div>
 <div className="text-xs text-text-secondary truncate">{notebook.subjectId?.name || "No Subject"}</div>
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
