import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ conversationId, replyTo, onUploadSuccess, uploadUrl }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingTimeRef = useRef(0);

  const startRecording = async () => {
    if (isUploading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimeRef.current < 1) {
          // Recording too short, ignore
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
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
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
    <div className="flex items-center space-x-2">
      {isRecording && (
        <div className="flex items-center text-status-danger animate-pulse text-sm">
          <div className="w-2 h-2 bg-status-danger rounded-full mr-2"></div>
          {formatTime(recordingTime)}
        </div>
      )}
      <button
        type="button"
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={isUploading}
        className={`p-2 rounded-full transition-colors ${
          isRecording ? 'bg-status-danger text-white shadow-lg scale-110' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Hold to record"
      >
        {isUploading ? (
          <span className="text-xs">...</span>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default VoiceRecorder;
