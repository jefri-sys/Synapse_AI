import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, CalendarCheck, MessageCircle, Calendar as CalendarIcon, Grid } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import MoreMenu from './MoreMenu';

export default function BottomNavBar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();

  const fetchUnread = async () => {
    try {
      const { data } = await api.get(`/users/unread-messages-count?t=${Date.now()}`);
      if (data && data.count !== undefined) {
        setUnreadCount(data.count);
      }
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('synapse_token');
    const socket = io(import.meta.env.VITE_API_URL || 'https://synapse-ai-4dcd.onrender.com', {
      auth: { token },
      withCredentials: true
    });

    const handleNewActivity = () => {
      setUnreadCount(prev => prev + 1);
    };

    socket.on('newMessage', handleNewActivity);
    socket.on('message:receive', handleNewActivity);

    const handleMessagesRead = () => {
      fetchUnread();
    };
    window.addEventListener('synapse:messages-read', handleMessagesRead);

    return () => {
      socket.disconnect();
      window.removeEventListener('synapse:messages-read', handleMessagesRead);
    };
  }, [location.pathname]);
  
  return (
    <div className="mobile-shell block sm:hidden">
      <div 
        className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around w-full shadow-[0px_-4px_16px_rgba(43,37,32,0.05)]"
        style={{
          backgroundColor: 'var(--mobile-nav-bg)',
          borderTop: '1px solid var(--mobile-nav-border)',
          height: 'calc(64px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <NavItem to="/dashboard" icon={Home} label="Today" isActive={location.pathname === '/dashboard'} />
        <NavItem to="/academics" icon={BookOpen} label="Academics" isActive={location.pathname === '/academics'} />
        
        <div className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer">
          <NavLink to="/planner" className="flex flex-col items-center justify-center w-full h-full">
            {({ isActive }) => (
              <>
                <div 
                  className="flex items-center justify-center rounded-[999px] transition-colors mb-[2px]"
                  style={{
                    width: '56px',
                    height: '32px',
                    backgroundColor: isActive ? 'rgba(255,122,89,0.15)' : 'transparent',
                    color: isActive ? 'var(--mobile-primary)' : 'var(--mobile-text-tertiary)'
                  }}
                >
                  <CalendarCheck size={28} />
                </div>
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    letterSpacing: '0.02em',
                    color: isActive ? 'var(--mobile-primary)' : 'var(--mobile-text-tertiary)'
                  }}
                >
                  Planner
                </span>
              </>
            )}
          </NavLink>
        </div>

        <NavItem 
          to="/messages" 
          icon={MessageCircle} 
          label="Messages" 
          isActive={location.pathname === '/messages'}
          badge={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null}
        />
        
        <NavItem to="/calendar" icon={CalendarIcon} label="Calendar" isActive={location.pathname === '/calendar'} />

        
        <button 
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
          style={{ color: 'var(--mobile-text-tertiary)' }}
        >
          <Grid size={24} />
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em' }}>More</span>
        </button>
      </div>

      <MoreMenu isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
}

function NavItem({ to, icon: Icon, label, isActive, badge }) {
  return (
    <NavLink to={to} className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors">
      <div className="relative flex flex-col items-center justify-center">
        <Icon 
          size={24} 
          style={{ color: isActive ? 'var(--mobile-primary)' : 'var(--mobile-text-tertiary)' }} 
        />
        {badge && (
          <span 
            className="absolute flex items-center justify-center rounded-full text-[10px] font-bold z-10"
            style={{
              top: '-4px',
              right: '-8px',
              backgroundColor: 'var(--mobile-danger, #ef4444)',
              color: '#ffffff',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              border: '1.5px solid var(--mobile-nav-bg, #ffffff)'
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <span 
        style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          letterSpacing: '0.02em',
          color: isActive ? 'var(--mobile-primary)' : 'var(--mobile-text-tertiary)'
        }}
      >
        {label}
      </span>
    </NavLink>
  );
}
