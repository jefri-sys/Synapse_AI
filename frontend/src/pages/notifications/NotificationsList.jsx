import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, AlertCircle, BookOpen, TrendingDown, 
  CheckCircle, MessageSquare, Clock, PhoneMissed, 
  Calendar as CalendarIcon, Trash2, CheckCircle2, Users, UserPlus
} from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../components/ui/Button';

export default function NotificationsList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const fetchNotifications = async (pageNum, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/notifications/all?page=${pageNum}&limit=20`);
      if (res.data?.success) {
        if (append) {
          setNotifications(prev => [...prev, ...res.data.notifications]);
        } else {
          setNotifications(res.data.notifications);
        }
        setTotalPages(res.data.totalPages || 1);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchNotifications(page + 1, true);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'EXAM_ALERT': return <AlertCircle className="w-5 h-5 text-status-danger" />;
      case 'ASSIGNMENT_DUE': return <BookOpen className="w-5 h-5 text-status-warning" />;
      case 'BUDGET_WARNING': return <TrendingDown className="w-5 h-5 text-status-warning" />;
      case 'HABIT_REMINDER': return <CheckCircle className="w-5 h-5 text-status-success" />;
      case 'GROUP_MESSAGE': return <Users className="w-5 h-5 text-brand-primary" />;
      case 'NEW_MESSAGE': return <MessageSquare className="w-5 h-5 text-brand-primary" />;
      case 'MISSED_CALL': return <PhoneMissed className="w-5 h-5 text-brand-primary" />;
      case 'CALENDAR_REMINDER': return <CalendarIcon className="w-5 h-5 text-brand-primary" />;
      case 'AI_BRIEFING': return <Clock className="w-5 h-5 text-brand-primary" />;
      case 'FRIEND_REQUEST': return <UserPlus className="w-5 h-5 text-brand-primary" />;
      default: return <Bell className="w-5 h-5 text-text-tertiary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex justify-center items-center">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-surface-base hover:bg-surface-sunken transition rounded-full shadow-sm border border-surface-border text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Bell className="w-8 h-8 text-brand-primary" /> 
              Notification History
            </h1>
          </div>
          
          {notifications.some(n => !n.read) && (
            <Button 
              onClick={markAllAsRead}
              variant="ghost"
              className="gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="bg-surface-base rounded-2xl shadow-sm border border-surface-border overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-surface-sunken rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-text-tertiary" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No notifications yet</h3>
              <p className="text-text-secondary max-w-sm">
                When you get notifications for messages, calls, or study reminders, they'll show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  onClick={() => {
                    if (!notif.read) markAsRead(notif._id);
                    if (notif.type === 'FRIEND_REQUEST') {
                      navigate('/messages');
                    }
                  }}
                  className={`p-5 flex gap-4 transition-all hover:bg-surface-sunken ${notif.type === 'FRIEND_REQUEST' ? 'cursor-pointer' : ''} ${
                    !notif.read ? 'bg-brand-primary-subtle' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    !notif.read ? 'bg-brand-primary/20' : 'bg-surface-sunken'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <p className={`text-base font-semibold ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary flex-shrink-0"></span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => deleteNotification(notif._id, e)}
                        className="p-2 text-text-tertiary hover:text-status-danger hover:bg-status-danger-subtle rounded-lg transition"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-text-secondary mt-1 mr-8">
                      {notif.message}
                    </p>
                    
                    <p className="text-xs text-text-tertiary mt-3 font-medium">
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page < totalPages && (
            <div className="p-4 border-t border-surface-border bg-surface-sunken flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="gap-2"
              >
                {loadingMore && <div className="w-4 h-4 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin"></div>}
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
