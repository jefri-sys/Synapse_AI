import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useVoiceCall from '../../hooks/useVoiceCall';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { PhoneOff } from 'lucide-react';

const CallOverlayContent = ({ callStatus, callType, remoteUserId, callerInfo, acceptCall, endCall, rejectCall, mediaRef, micError, streamRef, remoteStream }) => {
 const [isMinimized, setIsMinimized] = useState(false);
 const [timer, setTimer] = useState(0);
 const [isMuted, setIsMuted] = useState(false);
 const [isVideoMuted, setIsVideoMuted] = useState(false);
 const localVideoRef = React.useRef(null);

 useEffect(() => {
 let interval;
 if (callStatus === 'connected') {
 interval = setInterval(() => setTimer(t => t + 1), 1000);
 } else {
 setTimer(0);
 }
 return () => clearInterval(interval);
 }, [callStatus]);

 useEffect(() => {
 if (callStatus === 'rejected' || callStatus === 'timeout') {
 const t = setTimeout(() => {
 endCall();
 }, 2500);
 return () => clearTimeout(t);
 }
 }, [callStatus, endCall]);

 useEffect(() => {
 if (callType === 'video' && callStatus === 'connected' && localVideoRef.current && streamRef?.current) {
 localVideoRef.current.srcObject = streamRef.current;
 }
 }, [callType, callStatus, streamRef]);

 useEffect(() => {
 if (callStatus === 'connected' && mediaRef.current && remoteStream) {
 mediaRef.current.srcObject = remoteStream;
 }
 }, [callStatus, remoteStream, mediaRef]);

 const formatTime = (seconds) => {
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 return `${m}:${s}`;
 };

 if (micError) {
 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
 <div className="bg-surface-base rounded-2xl shadow-xl p-6 flex flex-col items-center border border-surface-border">
 <svg className="w-12 h-12 text-status-danger mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 <h2 className="text-xl font-bold text-text-primary mb-2">Microphone/Camera Access Denied</h2>
 <p className="text-text-secondary mb-6 text-center max-w-xs">Please allow media access in your browser settings to make calls.</p>
 <Button onClick={endCall} variant="primary">
 Close
 </Button>
 </div>
 </div>
 );
 }

 if (callStatus === 'idle') return null;

 if (callStatus === 'rejected' || callStatus === 'timeout') {
 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
 <div className="bg-surface-base rounded-2xl shadow-xl p-6 flex flex-col items-center border border-surface-border">
 <PhoneOff className="w-12 h-12 text-status-danger mb-4" />
 <h2 className="text-xl font-bold text-text-primary mb-2">
 {callStatus === 'rejected' ? 'Call Declined' : 'No Answer'}
 </h2>
 <p className="text-text-secondary mb-6 text-center max-w-xs">
 {callerInfo?.name || 'User'}
 </p>
 </div>
 </div>
 );
 }

 const toggleMute = () => {
 if (streamRef?.current) {
 const audioTrack = streamRef.current.getAudioTracks()[0];
 if (audioTrack) {
 audioTrack.enabled = !audioTrack.enabled;
 setIsMuted(!audioTrack.enabled);
 }
 }
 };

 const toggleVideo = () => {
 if (streamRef?.current) {
 const videoTrack = streamRef.current.getVideoTracks()[0];
 if (videoTrack) {
 videoTrack.enabled = !videoTrack.enabled;
 setIsVideoMuted(!videoTrack.enabled);
 }
 }
 };

 const isVideoConnected = callType === 'video' && callStatus === 'connected';

 if (isMinimized && callStatus === 'connected') {
 return (
 <div className="fixed bottom-6 right-6 w-[200px] backdrop-blur-md bg-surface-overlay shadow-xl rounded-2xl p-3 flex items-center justify-between z-[100] border border-surface-border transition-all duration-300">
 {callType === 'voice' && <audio ref={mediaRef} autoPlay className="hidden" />}
 <div className="flex items-center space-x-2 overflow-hidden">
 <div className="relative flex-shrink-0">
 <img 
 src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
 alt="Avatar" 
 className="w-8 h-8 rounded-full object-cover border border-surface-border/50"
 />
 <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-status-success rounded-full border border-surface"></div>
 </div>
 <div className="flex flex-col min-w-0">
 <span className="font-semibold text-text-primary text-sm truncate">{callerInfo?.name || 'Unknown'}</span>
 <span className="text-xs text-brand-primary font-mono">{formatTime(timer)}</span>
 </div>
 </div>
 <div className="flex items-center space-x-1 flex-shrink-0">
 <button onClick={() => setIsMinimized(false)} className="p-1.5 bg-surface-sunken hover:bg-surface-border rounded-full text-text-secondary transition-colors">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
 </button>
 <button onClick={endCall} className="p-1.5 bg-status-danger hover:bg-status-danger/90 rounded-full text-white transition-colors">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
 </button>
 </div>
 </div>
 );
 }

 return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${callStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Backdrop ONLY for connected state, not for banner states */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${(isMinimized || (callStatus === 'calling' || callStatus === 'receiving')) ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isVideoConnected ? 'bg-black/90' : ''}`} />

      <div className={`
        ${(callStatus === 'calling' || callStatus === 'receiving')
          ? 'fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-2xl shadow-xl flex flex-row items-center justify-between p-4 pointer-events-auto bg-surface-base border border-surface-border animate-in slide-in-from-top-4' 
          : 'relative flex flex-col items-center overflow-hidden shadow-2xl pointer-events-auto bg-surface-base rounded-3xl p-8 w-80'
        }
        ${isVideoConnected ? '!w-full !max-w-4xl !h-[80vh] !p-0 !rounded-none md:!rounded-3xl bg-black' : ''}
        ${isMinimized ? 'fixed !bottom-24 !right-4 !w-48 !p-4 !top-auto !left-auto scale-100 translate-y-0' : ''}
        ${callStatus === 'idle' ? 'scale-95 translate-y-4 opacity-0 pointer-events-none' : 'opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] scale-100 translate-y-0'}
      `}>
 
 {callType === 'voice' && <audio ref={mediaRef} autoPlay className="hidden" />}

 {isVideoConnected && (
 <div className="relative w-full h-full bg-black">
 {/* Remote Video */}
 <video ref={mediaRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
 
 {/* Local Video */}
 <video ref={localVideoRef} autoPlay playsInline muted className={`absolute bottom-28 right-6 w-32 h-44 md:w-48 md:h-64 object-cover rounded-xl border-2 border-white/20 shadow-2xl bg-surface-base transition-opacity duration-300 ${isVideoMuted ? 'opacity-0' : 'opacity-100'}`} />
 
 {/* Dark overlay at bottom for controls visibility */}
 <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
 </div>
 )}

 {callStatus === 'connected' && (
 <button onClick={() => setIsMinimized(true)} className={`absolute top-4 right-4 text-text-tertiary hover:text-text-secondary transition-colors z-10 ${callType === 'video' ? 'text-white hover:text-white bg-black/40 p-2 rounded-full' : ''}`}>
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </button>
 )}

 {callStatus === 'calling' && (
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
              <img 
                src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full relative z-10 object-cover border border-surface-border shadow-sm"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-text-primary text-[15px]">{callerInfo?.name || 'User'}</span>
              <span className="text-sm text-text-secondary animate-pulse">Calling...</span>
            </div>
          </div>
          <button onClick={endCall} className="w-10 h-10 rounded-full bg-status-danger hover:bg-status-danger/90 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 ml-4 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" /></svg>
          </button>
        </div>
      )}

 {callStatus === 'receiving' && (
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-status-success/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
              <img 
                src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full relative z-10 object-cover border border-surface-border shadow-sm"
              />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-semibold text-text-primary text-[15px] truncate max-w-[120px]">{callerInfo?.name || 'Unknown'}</span>
              <span className="text-sm text-text-secondary animate-pulse">Incoming call</span>
            </div>
          </div>
          <div className="flex space-x-2 ml-4 flex-shrink-0">
            <button onClick={rejectCall} className="w-10 h-10 rounded-full bg-status-danger hover:bg-status-danger/90 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button onClick={acceptCall} className="w-10 h-10 rounded-full bg-status-success hover:bg-status-success/90 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 animate-bounce" style={{ animationDuration: '2s' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      )}

 {callStatus === 'connected' && (
 <>
 {callType === 'voice' && (
 <div className="mb-6 relative mt-4">
 <img 
 src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
 alt="Avatar" 
 className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary shadow-lg"
 />
 <div className="absolute bottom-1 right-1 w-4 h-4 bg-status-success rounded-full border-2 border-surface"></div>
 </div>
 )}
 
 {callType === 'voice' && <h2 className="text-xl font-bold mb-1 text-text-primary">{callerInfo?.name || 'User'}</h2>}
 
 <p className={`font-mono mb-8 text-lg ${callType === 'video' ? 'absolute top-6 left-6 text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full z-10' : 'text-brand-primary'}`}>{formatTime(timer)}</p>
 
 <div className={`flex space-x-6 ${callType === 'video' ? 'absolute bottom-8 left-1/2 -translate-x-1/2 z-10' : ''}`}>
 <Button onClick={toggleMute} variant="secondary" shape="circular" className={`w-14 h-14 shadow-lg transition-colors border-none ${isMuted ? 'bg-surface-border hover:bg-surface-border text-white' : 'bg-surface-sunken hover:bg-surface-border text-text-primary'}`}>
 {isMuted ? (
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
 ) : (
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
 )}
 </Button>
 
 {callType === 'video' && (
 <Button onClick={toggleVideo} variant="secondary" shape="circular" className={`w-14 h-14 shadow-lg transition-colors border-none ${isVideoMuted ? 'bg-surface-border hover:bg-surface-border text-white' : 'bg-surface-sunken hover:bg-surface-border text-text-primary'}`}>
 {isVideoMuted ? (
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
 <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
 </svg>
 ) : (
 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
 </svg>
 )}
 </Button>
 )}

 <Button onClick={endCall} variant="danger" shape="circular" className="w-14 h-14 shadow-lg transition-transform hover:scale-105">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
 </Button>
 </div>
 </>
 )}

 </div>
 </div>
 );
};

const CallOverlay = () => {
 const { user } = useAuth();
 const [socket, setSocket] = useState(null);

 useEffect(() => {
 if (user) {
 const token = localStorage.getItem('synapse_token');
 const newSocket = io(import.meta.env.VITE_API_URL || 'https://synapse-ai-4dcd.onrender.com', {
 auth: { token },
 withCredentials: true
 });
 setSocket(newSocket);
 return () => newSocket.disconnect();
 }
 }, [user]);

 const callProps = useVoiceCall(socket, user?._id || user?.id);

 useEffect(() => {
 const handleCallEvent = (e) => {
 if (callProps && callProps.initiateCall) {
 callProps.initiateCall(
 e.detail.recipientId, 
 { name: e.detail.recipientName, avatar: e.detail.recipientAvatar }, 
 { name: user.name, avatar: user.avatar },
 e.detail.type,
 e.detail.conversationId,
 e.detail.stream
 );
 }
 };
 window.addEventListener('synapse:call', handleCallEvent);
 return () => window.removeEventListener('synapse:call', handleCallEvent);
 }, [callProps, user]);

 if (!user || !socket) return null;

 return <CallOverlayContent {...callProps} />;
};

export default CallOverlay;
