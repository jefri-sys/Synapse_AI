import React, { useState, useEffect, useRef } from 'react';
import VoiceNotePlayer from './VoiceNotePlayer';
import MediaViewer from './MediaViewer';

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

const MessageBubble = ({ message, isOwnMessage, currentUserId, socket, onReply, onDelete }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || {});
  let touchTimer = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handleReactionUpdate = (data) => {
      if (data.messageId === message._id) {
        setReactions(data.reactions);
      }
    };
    socket.on('reaction:update', handleReactionUpdate);
    return () => {
      socket.off('reaction:update', handleReactionUpdate);
    };
  }, [socket, message._id]);

  const handleReaction = (emoji) => {
    if (socket) {
      socket.emit('reaction:add', { messageId: message._id, emoji });
    }
    setShowPicker(false);
  };

  const handleTouchStart = () => {
    touchTimer.current = setTimeout(() => setShowPicker(true), 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(touchTimer.current);
  };

  const handleReplyClick = () => {
    if (onReply) {
      let preview = message.type === 'text' ? message.content : `[${message.type}]`;
      onReply({
        messageId: message._id,
        senderName: message.senderId?.name || 'User',
        contentPreview: preview
      });
      setShowPicker(false);
    }
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return <p className="italic text-text-tertiary flex items-center"><svg className="w-4 h-4 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> This message was deleted</p>;
    }
    switch (message.type) {
      case 'audio':
        return <VoiceNotePlayer audioUrl={message.content} sender={message.senderId} isOwnMessage={isOwnMessage} />;
      case 'image': {
        let thumbnailUrl = message.content;
        if (thumbnailUrl.includes('/upload/')) {
          thumbnailUrl = thumbnailUrl.replace('/upload/', '/upload/w_200,c_fill/');
        }
        return (
          <>
            <img 
              src={thumbnailUrl} 
              alt="Sent image" 
              className="rounded cursor-pointer object-cover w-48 h-auto"
              onClick={() => setIsFullScreen(true)}
            />
            {isFullScreen && (
              <MediaViewer url={message.content} type="image" onClose={() => setIsFullScreen(false)} />
            )}
          </>
        );
      }
      case 'video':
        return (
          <>
            <video 
              src={message.content} 
              className="max-w-xs rounded cursor-pointer" 
              style={{ maxHeight: '300px' }} 
              onClick={(e) => {
                e.preventDefault();
                setIsFullScreen(true);
              }}
            />
            {isFullScreen && (
              <MediaViewer url={message.content} type="video" onClose={() => setIsFullScreen(false)} />
            )}
          </>
        );
      case 'document': {
        const fileName = message.fileName || message.content.split('/').pop() || 'document';
        const fileExt = fileName.split('.').pop().toUpperCase() || 'FILE';
        
        let formattedSize = '';
        if (message.fileSize) {
          if (message.fileSize < 1024) formattedSize = `${message.fileSize} B`;
          else if (message.fileSize < 1024 * 1024) formattedSize = `${Math.round(message.fileSize / 1024)} kB`;
          else formattedSize = `${(message.fileSize / (1024 * 1024)).toFixed(1)} MB`;
        }

        let thumbnailUrl = null;
        if (message.content.toLowerCase().endsWith('.pdf')) {
          thumbnailUrl = message.content.replace(/\.pdf$/i, '.jpg');
          if (thumbnailUrl.includes('/upload/')) {
            thumbnailUrl = thumbnailUrl.replace('/upload/', '/upload/w_400,h_250,c_fill,pg_1/');
          }
        }

        let downloadUrl = message.content;
        const lowerExt = fileExt.toLowerCase();
        if (!['pdf', 'txt', 'png', 'jpg', 'jpeg'].includes(lowerExt)) {
          if (downloadUrl.includes('/upload/') && !downloadUrl.includes('fl_attachment')) {
            downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
          }
        }

        const isOwn = isOwnMessage;

        return (
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download={fileName} className={`flex flex-col rounded-xl overflow-hidden transition-all duration-200 w-64 max-w-[80vw] no-underline shadow-sm ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white border border-white/10' : 'bg-surface-raised hover:bg-surface-sunken text-text-primary border border-surface-border'}`}>
            {thumbnailUrl ? (
              <div className={`w-full h-36 relative border-b ${isOwn ? 'border-white/10 bg-white/5' : 'border-surface-border bg-surface-base'}`}>
                <img src={thumbnailUrl} alt="Document Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-full h-24 flex items-center justify-center border-b ${isOwn ? 'border-white/10 bg-white/5' : 'bg-surface-overlay-dark border-surface-border/20'}`}>
                <svg className={`w-12 h-12 ${isOwn ? 'text-white/80' : 'text-text-tertiary'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            <div className="p-3 flex flex-col">
              <span className={`font-semibold truncate block w-full mb-1 text-sm ${isOwn ? 'text-white' : 'text-text-primary'}`}>{fileName}</span>
              <span className={`text-xs flex items-center ${isOwn ? 'text-white/70' : 'text-text-tertiary'}`}>
                {formattedSize ? `${formattedSize} • ` : ''}{fileExt}
              </span>
            </div>
          </a>
        );
      }
      case 'text':
      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  const reactionEntries = Object.entries(reactions || {});

  const scrollToOriginal = () => {
    if (message.replyTo?._id) {
      const el = document.getElementById(`msg-${message.replyTo._id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (message.type === 'call') {
    const isMissed = message.content.toLowerCase().includes('missed');
    return (
      <div id={`msg-${message._id}`} className="flex w-full justify-center my-4">
        <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm border ${
          isMissed 
            ? 'bg-status-danger-subtle text-status-danger border-status-danger/20' 
            : 'bg-surface-sunken text-text-secondary border-surface-border'
        }`}>
          <span>{message.content}</span>
          <span className={`text-[10px] sm:text-xs ml-2 ${isMissed ? 'text-status-danger/70' : 'text-text-tertiary'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div id={`msg-${message._id}`} className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} my-2`}>
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-2 mt-auto mb-5 hidden sm:block">
           {message.senderId?.avatar ? (
             <img src={message.senderId.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover object-center shadow-sm" />
           ) : (
             <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-sm font-semibold text-white shadow-sm">
               {message.senderId?.name?.charAt(0).toUpperCase() || 'U'}
             </div>
           )}
        </div>
      )}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative group max-w-[85%] sm:max-w-[75%]`}>
      {message.replyTo && (
        <div 
          onClick={scrollToOriginal}
          className="mb-1 text-xs bg-surface-sunken p-2 rounded cursor-pointer border-l-2 border-brand-primary opacity-80 max-w-[70%] truncate hover:opacity-100"
        >
          <span className="font-semibold">{message.replyTo.senderId?.name || 'User'}</span>
          <br/>
          {message.replyTo.content}
        </div>
      )}

      <div 
        className="relative"
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        {showPicker && !message.isDeleted && (
          <div className={`absolute z-50 bottom-full mb-1 bg-surface-base border border-surface-border shadow-lg rounded-full px-2 py-1 flex space-x-1 items-center w-max ${isOwnMessage ? 'right-0' : 'left-0'}`}>
            {EMOJIS.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => handleReaction(emoji)} 
                className="hover:scale-125 transition-transform text-lg"
              >
                {emoji}
              </button>
            ))}
            <button onClick={handleReplyClick} className="ml-2 text-text-tertiary hover:text-brand-primary p-1" title="Reply">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            {isOwnMessage && onDelete && (
              <button onClick={() => { setShowPicker(false); onDelete(message._id); }} className="ml-1 text-text-tertiary hover:text-status-danger p-1" title="Delete for everyone">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        )}
        
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`rounded-2xl p-3 px-4 relative max-w-full overflow-hidden leading-relaxed ${
            message.isDeleted ? 'bg-surface-sunken border border-surface-border text-text-tertiary' :
            isOwnMessage 
              ? 'bg-gradient-to-tr from-brand-primary to-blue-500 text-white rounded-br-[4px] shadow-[0_4px_14px_0_rgba(139,92,246,0.25)]' 
              : 'bg-white/80 dark:bg-[#1c1e26]/95 text-text-primary border border-surface-border/40 shadow-sm rounded-bl-[4px] backdrop-blur-md'
          } ${['image', 'video'].includes(message.type) && !message.isDeleted ? '!p-1 bg-transparent border-none shadow-none' : ''}`}
        >
          {renderContent()}
        </div>
      </div>

      {reactionEntries.length > 0 && (
        <div className="flex items-center space-x-1 mt-1 z-10 -translate-y-3 px-2">
          {reactionEntries.map(([emoji, users]) => {
            if (!users || users.length === 0) return null;
            const userReacted = users.includes(currentUserId);
            return (
              <button 
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`text-xs px-1.5 py-0.5 rounded-full border shadow-sm flex items-center space-x-1 bg-surface-base
                  ${userReacted ? 'border-brand-primary bg-brand-primary-subtle' : 'border-surface-border'}
                `}
              >
                <span>{emoji}</span>
                <span className="text-text-secondary font-medium">{users.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={`flex items-center space-x-1 justify-end ${reactionEntries.length > 0 ? '-mt-2' : 'mt-1'}`}>
        <span className="text-xs text-text-tertiary">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOwnMessage && (
          <span className="ml-1 flex items-center">
            {message.seenBy && message.seenBy.length > 0 ? (
              <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12l5 5M15 7l-5 5" />
              </svg>
            ) : message._id ? (
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12l5 5M15 7l-5 5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        )}
      </div>
    </div>
    </div>
  );
};

export default MessageBubble;
