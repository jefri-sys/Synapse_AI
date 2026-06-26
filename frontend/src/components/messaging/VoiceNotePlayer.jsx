import React, { useState, useEffect, useRef } from 'react';

const VoiceNotePlayer = ({ audioUrl }) => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    const loadAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        setAudioBuffer(decoded);
        setDuration(decoded.duration);
        setIsLoading(false);
        // Wait for next render so canvas exists
        setTimeout(() => drawWaveform(decoded, 0), 0);
      } catch (err) {
        console.error('Failed to load audio:', err);
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [audioUrl]);

  const drawWaveform = (buffer, currentProgress) => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const rawData = buffer.getChannelData(0);
    const barWidth = 3;
    const gap = 2;
    const step = barWidth + gap;
    const samples = Math.floor(width / step); 
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

    const playheadX = currentProgress * width;

    for (let i = 0; i < samples; i++) {
      const normalized = filteredData[i] * multiplier;
      const barHeight = Math.max(normalized * height, 2);
      
      const x = i * step;
      const y = (height - barHeight) / 2;

      if (x < playheadX) {
        ctx.fillStyle = '#4f46e5';
      } else {
        ctx.fillStyle = '#4B5563';
      }

      ctx.fillRect(x, y, barWidth, barHeight);
    }
  };

  const playAudio = async () => {
    if (!audioBuffer || !audioCtxRef.current) return;
    
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    let offset = pausedAtRef.current;
    if (offset >= duration) {
      offset = 0;
      pausedAtRef.current = 0;
    }

    source.start(0, offset);
    sourceNodeRef.current = source;
    startTimeRef.current = audioCtxRef.current.currentTime - offset;
    setIsPlaying(true);

    source.onended = () => {
      if (audioCtxRef.current && (audioCtxRef.current.currentTime - startTimeRef.current) >= duration - 0.1) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        setProgress(0);
        drawWaveform(audioBuffer, 0);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };

    const updatePlayhead = () => {
      if (sourceNodeRef.current !== source) return;
      
      const currentTime = audioCtxRef.current.currentTime - startTimeRef.current;
      if (currentTime <= duration) {
        const currProgress = currentTime / duration;
        setProgress(currProgress);
        drawWaveform(audioBuffer, currProgress);
        animationRef.current = requestAnimationFrame(updatePlayhead);
      }
    };
    
    animationRef.current = requestAnimationFrame(updatePlayhead);
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    
    if (audioCtxRef.current) {
      pausedAtRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
    }
    
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSeek = (e) => {
    if (!audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedProgress = x / rect.width;
    
    pausedAtRef.current = clickedProgress * duration;
    setProgress(clickedProgress);
    drawWaveform(audioBuffer, clickedProgress);

    if (isPlaying) {
      pauseAudio();
      playAudio(); 
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-white p-2 rounded-lg min-w-[250px] shadow-sm">
      <button 
        onClick={togglePlayPause} 
        disabled={!audioBuffer}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-brand-primary text-white rounded-full hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      {isLoading ? (
        <div className="flex-grow flex items-center h-[30px] w-[150px]">
          <div className="w-full h-3 bg-surface-sunken rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-center cursor-pointer" onClick={handleSeek}>
          <canvas 
            ref={canvasRef} 
            width={150} 
            height={30} 
            className="w-full h-[30px]"
          />
        </div>
      )}

      <div className="text-xs text-text-tertiary font-medium min-w-[75px] text-right">
        {isPlaying || progress > 0 ? `${formatTime(progress * duration)} / ${formatTime(duration)}` : formatTime(duration)}
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
