import React, { useState, useEffect, useRef } from 'react';
import { Bell, BookOpen, AlertCircle, Calendar, MessageSquare, CheckCircle, TrendingDown, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Card } from './ui/card';
import { Button } from './ui/button';

const NotificationBell = () => {
 const [notifications, setNotifications] = useState([]);
 const [unreadCount, setUnreadCount] = useState(0);
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef(null);

 const fetchNotifications = async () => {
 try {
 // Assuming frontend proxy handles /api/ requests or axios interceptor sets base URL
 const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications?limit=5`, {
 withCredentials: true,
 });
 if (response.data.success) {
 setNotifications(response.data.notifications);
 setUnreadCount(response.data.unreadCount);
 }
 } catch (error) {
 console.error('Failed to fetch notifications:', error);
 }
 };

 useEffect(() => {
 fetchNotifications();
 const interval = setInterval(fetchNotifications, 30000); // 30 seconds
 return () => clearInterval(interval);
 }, []);

 useEffect(() => {
 const handleClickOutside = (event) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const markAllAsRead = async () => {
 try {
 await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/read-all`, {}, { withCredentials: true });
 setUnreadCount(0);
 setNotifications(notifications.map(n => ({ ...n, read: true })));
 } catch (error) {
 console.error('Failed to mark all as read:', error);
 }
 };

 const getIcon = (type) => {
 switch (type) {
 case 'EXAM_ALERT': return <AlertCircle className="w-5 h-5 text-status-danger" />;
 case 'ASSIGNMENT_DUE': return <BookOpen className="w-5 h-5 text-status-warning" />;
 case 'BUDGET_WARNING': return <TrendingDown className="w-5 h-5 text-status-warning" />;
 case 'HABIT_REMINDER': return <CheckCircle className="w-5 h-5 text-status-success" />;
 case 'GROUP_MESSAGE': return <MessageSquare className="w-5 h-5 text-brand-primary" />;
 case 'AI_BRIEFING': return <Clock className="w-5 h-5 text-accent-primary" />;
 default: return <Bell className="w-5 h-5 text-text-secondary" />;
 }
 };

 return (
 <div className="relative" ref={dropdownRef}>
    <Button 
      variant="ghost"
      shape="circular"
      onClick={() => setIsOpen(!isOpen)}
      className="relative p-2 hover:bg-surface-sunken transition-colors focus:outline-none text-text-secondary hover:text-text-primary"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3.5 h-3.5 text-[9px] font-black text-white bg-status-danger border-[1.5px] border-surface-raised rounded-full shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>

 {isOpen && (
 <Card className="absolute right-0 mt-2 w-80 bg-surface-base rounded-lg shadow-xl border border-surface-border z-50 overflow-hidden transform origin-top-right transition-all">
 <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-raised ">
 <h3 className="font-semibold text-text-primary dark:text-white">Notifications</h3>
 {unreadCount > 0 && (
 <Button 
 onClick={markAllAsRead}
 variant="ghost"
 size="sm"
 className="text-xs text-brand-primary hover:text-brand-primary-hover transition-colors font-medium"
 >
 Mark all read
 </Button>
 )}
 </div>
 
 <div className="max-h-[400px] overflow-y-auto">
 {notifications.length > 0 ? (
 notifications.map((notification) => (
 <div 
 key={notification._id} 
 className={`p-4 border-b border-surface-border hover:bg-surface-raised transition-colors flex gap-3 ${!notification.read ? 'bg-brand-primary-subtle ' : ''}`}
 >
 <div className="flex-shrink-0 mt-1">
 {getIcon(notification.type)}
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-sm font-medium ${!notification.read ? 'text-text-primary dark:text-white' : 'text-text-primary '} truncate`}>
 {notification.title}
 </p>
 <p className="text-sm text-text-secondary dark:text-text-tertiary line-clamp-2 mt-0.5">
 {notification.message}
 </p>
 <p className="text-xs text-text-tertiary dark:text-text-secondary mt-1">
 {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
 </p>
 </div>
 </div>
 ))
 ) : (
 <div className="p-8 text-center text-text-secondary dark:text-text-tertiary flex flex-col items-center">
 <Bell className="w-8 h-8 mb-2 opacity-20" />
 <p>No notifications yet</p>
 </div>
 )}
 </div>
 
 <div className="p-3 border-t border-surface-border bg-surface-raised text-center">
 <Link 
 to="/notifications" 
 onClick={() => setIsOpen(false)}
 className="text-sm text-brand-primary hover:text-brand-primary-hover font-medium block"
 >
 See all notifications
 </Link>
 </div>
 </Card>
 )}
 </div>
 );
};

export default NotificationBell;
