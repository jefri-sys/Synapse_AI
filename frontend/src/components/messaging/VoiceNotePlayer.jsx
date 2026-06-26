import React, { useState, useEffect, useRef } from 'react';

const VoiceNotePlayer = ({ audioUrl, sender, isOwnMessage }) => {
  const [audioData, setAudioData] = useState(null); // the normalized waveform data
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasPlayed, setHasPlayed] = useState(false);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  // Load and decode audio data for waveform visualization
  useEffect(() => {
    let isCancelled = false;
    const loadAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (isCancelled) return;
        
        setDuration(decoded.duration);
        
        // Generate waveform data
        const rawData = decoded.getChannelData(0);
        // We want about 40 bars
        const samples = 40;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        const normalizedData = filteredData.map(n => n * multiplier);
        
        setAudioData(normalizedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load audio waveform:', err);
      }
    };
    
    loadAudio();
    return () => { isCancelled = true; };
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !audioData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = 3;
    const gap = 2;
    const step = barWidth + gap;
    // Calculate total width and center the drawing if needed, but we match it to samples
    const totalBars = audioData.length;
    
    // The played portion color: WhatsApp green or Synapse blue
    const playedColor = isOwnMessage ? '#ffffff' : '#4f46e5'; 
    const unplayedColor = isOwnMessage ? 'rgba(255,255,255,0.4)' : '#d1d5db'; // Grey
    
    const playheadX = progress * width;
    
    for (let i = 0; i < totalBars; i++) {
      const normalized = audioData[i];
      // Min height 2px, max height 100% of canvas
      const barHeight = Math.max(normalized * height, 2);
      
      const x = i * step;
      // Center vertically
      const y = (height - barHeight) / 2;
      
      // WhatsApp style: bars have rounded caps
      ctx.beginPath();
      ctx.moveTo(x + barWidth / 2, y);
      ctx.lineTo(x + barWidth / 2, y + barHeight);
      ctx.lineWidth = barWidth;
      ctx.lineCap = 'round';
      
      if (x < playheadX) {
        ctx.strokeStyle = playedColor;
      } else {
        ctx.strokeStyle = unplayedColor;
      }
      
      ctx.stroke();
    }
  }, [audioData, progress, isOwnMessage]);

  const updateProgress = () => {
    if (!audioRef.current) return;
    const currentProgress = audioRef.current.currentTime / (audioRef.current.duration || 1);
    setProgress(currentProgress);
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      setHasPlayed(true);
      audioRef.current.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !audioData) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedProgress = Math.max(0, Math.min(1, x / rect.width));
    
    const newTime = clickedProgress * (audioRef.current.duration || duration);
    audioRef.current.currentTime = newTime;
    setProgress(clickedProgress);
  };

  const handleSpeedToggle = () => {
    if (!audioRef.current) return;
    const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getAvatar = () => {
    if (sender?.avatar) return sender.avatar;
    const name = sender?.name || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
  };

  // Determine colors based on own message
  const bgColor = isOwnMessage ? 'bg-transparent' : 'bg-transparent';
  const textColor = isOwnMessage ? 'text-white/80' : 'text-text-secondary';
  
  return (
    <div className={`flex items-center space-x-3 w-[280px] p-1 rounded-2xl ${bgColor}`}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          cancelAnimationFrame(animationRef.current);
        }} 
      />
      
      {/* Sender Profile Pic */}
      {!isOwnMessage && (
        <img 
          src={getAvatar()} 
          alt="Sender" 
          className="w-10 h-10 rounded-full object-cover object-center shadow-sm flex-shrink-0"
        />
      )}

      {/* Play Button - Minimal transparent */}
      <button 
        onClick={handlePlayPause} 
        disabled={isLoading}
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
          isOwnMessage 
            ? 'text-white hover:bg-white/10' 
            : 'text-brand-primary hover:bg-brand-primary-subtle'
        }`}
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-grow flex flex-col justify-center min-w-0">
        {isLoading ? (
          <div className="w-full h-[30px] flex items-center">
            <div className={`w-full h-1.5 rounded-full animate-pulse ${isOwnMessage ? 'bg-white/20' : 'bg-surface-sunken'}`}></div>
          </div>
        ) : (
          <div className="cursor-pointer py-1" onClick={handleSeek}>
            <canvas 
              ref={canvasRef} 
              width={200} // 40 samples * 5 (bar + gap) = 200px
              height={30} 
              className="w-full h-[30px]"
            />
          </div>
        )}
        
        {/* Timestamp and Speed Toggle underneath */}
        <div className={`flex justify-between items-center text-[11px] font-medium mt-1 ${textColor}`}>
          <span>
            {isPlaying || progress > 0 ? formatTime(progress * duration) : formatTime(duration)}
          </span>
          
          {(hasPlayed || isPlaying) && (
            <button 
              onClick={handleSpeedToggle}
              className={`px-1.5 py-0.5 rounded-full transition-colors ${
                isOwnMessage ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-surface-sunken hover:bg-surface-border text-text-primary'
              }`}
            >
              {playbackRate}x
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
