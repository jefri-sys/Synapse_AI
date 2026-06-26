import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ conversationId, replyTo, onUploadSuccess, uploadUrl }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const shouldUploadRef = useRef(true);

  const startRecording = async () => {
    if (isUploading || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      shouldUploadRef.current = true; // default to true

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        clearInterval(timerRef.current);
        
        if (!shouldUploadRef.current || recordingTimeRef.current < 1) {
          // Recording cancelled or too short
          setRecordingTime(0);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          recordingTimeRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldUploadRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const sendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldUploadRef.current = true;
      mediaRecorderRef.current.stop();
    }
  };

  const uploadAudio = async (blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'voicenote.webm');
      if (replyTo) formData.append('replyTo', replyTo);

      const token = localStorage.getItem('token') || '';
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = uploadUrl ? `${baseUrl}/api${uploadUrl}` : `${baseUrl}/api/conversations/${conversationId}/messages/media`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const message = await response.json();
      if (onUploadSuccess) onUploadSuccess(message);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload voice note');
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        shouldUploadRef.current = false;
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      {isRecording && (
        <div className="absolute inset-0 bg-surface-base z-50 flex items-center justify-between px-4 sm:px-6 rounded-b-xl overflow-hidden">
          {/* Left: Timer and Red dot */}
          <div className="flex items-center text-status-danger font-bold text-lg min-w-[100px]">
            <div className="w-3.5 h-3.5 bg-status-danger rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
            <span className="font-mono tracking-wider">{formatTime(recordingTime)}</span>
          </div>
          
          {/* Center: Recording indicator */}
          <div className="hidden sm:flex flex-1 justify-center items-center text-text-secondary text-sm font-medium animate-pulse gap-2">
            <svg className="w-4 h-4 text-status-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Recording voice message...
          </div>

          {/* Right: Web-based Actions (Click to Cancel / Send) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold text-text-tertiary hover:text-status-danger hover:bg-status-danger-subtle rounded-full transition-colors flex items-center justify-center"
              title="Cancel recording"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendRecording}
              className="px-5 py-2 sm:px-6 sm:py-2.5 text-sm font-semibold flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full transition-all shadow-[0_4px_14px_0_rgba(139,92,246,0.3)] transform hover:-translate-y-0.5 active:translate-y-0"
              title="Send voice note"
            >
              Send
              <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Default state button */}
      <button
        type="button"
        onClick={startRecording}
        disabled={isUploading}
        className={`p-2 rounded-full transition-colors flex shrink-0 items-center justify-center ${
          isUploading ? 'opacity-50 cursor-not-allowed text-text-tertiary' : 'text-text-tertiary hover:text-text-primary hover:bg-surface-raised cursor-pointer'
        }`}
        title="Record voice note"
      >
        {isUploading ? (
          <svg className="w-5 h-5 animate-spin text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </>
  );
};

export default VoiceRecorder;
