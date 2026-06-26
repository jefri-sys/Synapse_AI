import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, PanelRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import QuickCapture from './QuickCapture';
import MessagesPopup from './MessagesPopup';
import { useFocusTimer } from '../context/FocusTimerContext';
import { Clock } from 'lucide-react';
import { Button } from './ui/button';

export default function SmartSidebar() {
 const [isOpen, setIsOpen] = useState(false);
 const [showQuickCapture, setShowQuickCapture] = useState(false);
 const [showMessages, setShowMessages] = useState(false);
 const [unreadCount, setUnreadCount] = useState(0);

 const { isActive, timeLeft } = useFocusTimer();

 const formatTime = (seconds) => {
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 return `${m}:${s}`;
 };

 const fetchUnread = async () => {
 try {
 const token = localStorage.getItem('token');
 if (token) {
 const { data } = await api.get('/users/unread-count');
 if (data && data.count !== undefined) {
 setUnreadCount(data.count);
 }
 }
 } catch (e) {
 console.error('Failed to fetch unread count', e);
 }
 };

 useEffect(() => {
 fetchUnread();
 }, []);

 useEffect(() => {
 const token = localStorage.getItem('token');
 if (token) {
 const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
 auth: { token },
 withCredentials: true
 });

 socket.on('newMessage', (msg) => {
 // If messages popup is not open, increment badge
 if (!showMessages) {
 setUnreadCount(prev => prev + 1);
 }
 });
 socket.on('message:receive', (msg) => {
 if (!showMessages) {
 setUnreadCount(prev => prev + 1);
 }
 });
 socket.on('friend:request', (msg) => {
 if (!showMessages) {
 setUnreadCount(prev => prev + 1);
 }
 });

 return () => socket.disconnect();
 }
 }, [showMessages]);

 const handleOpenMessages = () => {
 setShowMessages(true);
 setIsOpen(false);
 };

 return (
 <>
  <button
    onClick={() => setIsOpen(!isOpen)}
    className={`fixed top-1/2 -translate-y-1/2 z-[110] h-20 w-3 hover:w-4 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-md rounded-l-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border-y border-l border-brand-primary/30 transition-all duration-300 ease-out outline-none flex items-center justify-center group ${isOpen ? 'right-20 sm:right-24' : 'right-0'}`}
    aria-label="Toggle Sidebar"
  >
    <div className="w-[2px] h-8 bg-white/60 rounded-full group-hover:bg-white transition-colors" />
  </button>

 {/* Invisible backdrop to close on click outside */}
 {isOpen && (
 <div 
 className="fixed inset-0 z-[90] bg-black/5 backdrop-blur-[1px]"
 onClick={(e) => {
   e.preventDefault();
   e.stopPropagation();
   setIsOpen(false);
 }}
 />
 )}

 {/* Sidebar Panel */}
 <div 
 className={`fixed top-0 right-0 h-full w-20 sm:w-24 bg-surface-base/90 backdrop-blur-xl border-l border-surface-border shadow-2xl z-[100] transform transition-transform duration-300 ease-out flex flex-col items-center py-8 gap-6 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
 >
  <div className="flex flex-col gap-6 mt-10 w-full items-center">
 <Button 
 variant="ghost"
 shape="circular"
 onClick={() => { setShowQuickCapture(true); setIsOpen(false); }}
 className="w-14 h-14 bg-surface-base text-text-secondary border border-surface-border rounded-2xl flex items-center justify-center shadow-sm hover:text-brand-primary hover:border-brand-primary-hover hover:bg-brand-primary-subtle hover:scale-110 hover:shadow-md transition-all focus:outline-none"
 title="Quick Capture"
 >
 <Plus className="w-6 h-6" />
 </Button>
 
 <Button 
 variant="ghost"
 shape="circular"
 onClick={handleOpenMessages}
 className="w-14 h-14 bg-surface-base text-text-secondary border border-surface-border rounded-2xl flex items-center justify-center shadow-sm hover:text-brand-primary hover:border-brand-primary-hover hover:bg-brand-primary-subtle hover:scale-110 hover:shadow-md transition-all focus:outline-none relative"
 title="Messages"
 >
 <MessageSquare className="w-6 h-6" />
 {unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-status-danger border-2 border-surface-base text-[10px] font-bold text-white shadow-sm">
 {unreadCount > 99 ? '99+' : unreadCount}
 </span>
 )}
 </Button>

 {isActive && (
 <div 
 className="mt-4 flex flex-col items-center justify-center gap-1 w-14 py-2 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/30 animate-in fade-in zoom-in"
 title="Focus Mode Active"
 >
 <Clock className="w-5 h-5 animate-pulse" />
 <span className="text-[10px] font-bold font-mono tracking-tighter">{formatTime(timeLeft)}</span>
 </div>
 )}
 </div>
 </div>

 {/* Floating Popups */}
 {showQuickCapture && (
 <QuickCapture isOpen={showQuickCapture} onClose={() => setShowQuickCapture(false)} isPopupMode={true} />
 )}
 
 {showMessages && (
 <MessagesPopup 
 isOpen={showMessages} 
 onClose={() => {
 setShowMessages(false);
 fetchUnread();
 }} 
 />
 )}
 </>
 );
}
