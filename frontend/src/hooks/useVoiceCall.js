import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const useVoiceCall = (socket, currentUserId) => {
  const [callStatus, setCallStatus] = useState('idle'); 
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [micError, setMicError] = useState(false);
  const [callType, setCallType] = useState('voice');
  const [activeConvId, setActiveConvId] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRef = useRef(null); 
  const pendingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (String(data.recipientId) !== String(currentUserId)) return;
      const { callerId, callerInfo, type } = data;
      if (callStatus !== 'idle') return; 
      setCallStatus('receiving');
      setRemoteUserId(callerId);
      setCallerInfo(callerInfo);
      setCallType(type || 'voice');
      setMicError(false);
    };

    const handleOffer = async (data) => {
      if (String(data.recipientId) !== String(currentUserId)) return;
      const { offer } = data;
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        } catch (e) { console.error('Error setting remote desc (offer)', e); }
      } else {
        pendingOfferRef.current = offer;
      }
    };

    const handleAnswer = async (data) => {
      if (String(data.recipientId) !== String(currentUserId)) return;
      const { answer } = data;
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) { console.error('Error setting remote desc (answer)', e); }
      }
    };

    const handleIceCandidate = async (data) => {
      if (String(data.recipientId) !== String(currentUserId)) return;
      const { candidate } = data;
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleEnded = (data) => {
      if (String(data.recipientId) !== String(currentUserId)) return;
      logCallHistory(activeConvId, isCaller, callType, callStatus);
      cleanup();
    };

    socket.on('call:incoming:global', handleIncoming);
    socket.on('call:offer:global', handleOffer);
    socket.on('call:answer:global', handleAnswer);
    socket.on('call:ice-candidate:global', handleIceCandidate);
    socket.on('call:ended:global', handleEnded);

    return () => {
      socket.off('call:incoming:global', handleIncoming);
      socket.off('call:offer:global', handleOffer);
      socket.off('call:answer:global', handleAnswer);
      socket.off('call:ice-candidate:global', handleIceCandidate);
      socket.off('call:ended:global', handleEnded);
    };
  }, [socket, callStatus]);

  const fetchTurnCredentials = async () => {
    try {
      const { data } = await api.get('/calls/turn-credentials');
      return data;
    } catch (err) {
      console.error(err);
      return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    }
  };

  const createPeerConnection = (turnConfig, targetUserId) => {
    const pc = new RTCPeerConnection(turnConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', { recipientId: targetUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setCallStatus('connected');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (mediaRef.current) {
          mediaRef.current.srcObject = event.streams[0];
        }
      }
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current);
      });
    }

    return pc;
  };

  const initiateCall = async (recipientId, recipientData, callerData, type = 'voice', conversationId = null) => {
    try {
      setCallType(type);
      setActiveConvId(conversationId);
      setIsCaller(true);
      setCallerInfo(recipientData); // So the local UI shows who we are calling
      setMicError(false);
      const turnConfig = await fetchTurnCredentials();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      streamRef.current = stream;
      setCallStatus('calling');
      setRemoteUserId(recipientId);

      // We send OUR callerData to the recipient
      socket.emit('call:initiate', { recipientId, callerInfo: callerData, type, conversationId });

      const pc = createPeerConnection(turnConfig, recipientId);
      peerRef.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('call:offer', { recipientId, offer });

    } catch (err) {
      console.error('Failed to initiate call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        setMicError(true);
      } else {
        cleanup();
      }
    }
  };

  const acceptCall = async () => {
    try {
      setMicError(false);
      const turnConfig = await fetchTurnCredentials();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      streamRef.current = stream;

      const pc = createPeerConnection(turnConfig, remoteUserId);
      peerRef.current = pc;

      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        pendingOfferRef.current = null;
        
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', { callerId: remoteUserId, answer });

    } catch (err) {
      console.error('Failed to accept call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        setMicError(true);
      } else {
        cleanup();
      }
    }
  };

  const endCall = () => {
    if (socket && remoteUserId) {
      socket.emit('call:end', { recipientId: remoteUserId });
      logCallHistory(activeConvId, isCaller, callType, callStatus);
    }
    cleanup();
  };

  const logCallHistory = async (convId, callerFlag, typeVal, statusVal) => {
    if (callerFlag && convId) {
      try {
        await api.post(`/conversations/${convId}/messages`, {
          content: statusVal === 'connected' ? `${typeVal === 'video' ? '📹 Video' : '📞 Voice'} Call ended` : `Missed ${typeVal === 'video' ? '📹 Video' : '📞 Voice'} Call`,
          type: 'call'
        });
      } catch (err) {
        console.error('Failed to log call history', err);
      }
    }
  };

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCallStatus('idle');
    setRemoteUserId(null);
    setCallerInfo(null);
    setActiveConvId(null);
    setIsCaller(false);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
  };

  return {
    callStatus,
    callType,
    remoteUserId,
    callerInfo,
    initiateCall,
    acceptCall,
    endCall,
    mediaRef,
    micError,
    streamRef,
    remoteStream
  };
};

export default useVoiceCall;
