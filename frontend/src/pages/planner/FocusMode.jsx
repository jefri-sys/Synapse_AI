import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Play, Pause, RefreshCw, Coffee, BookOpen } from 'lucide-react';
import { useFocusTimer } from '../../context/FocusTimerContext';

export default function FocusMode() {
  const [subjects, setSubjects] = useState([]);
  
  const {
    timeLeft,
    isActive,
    isBreak,
    sessionCount,
    totalHoursToday,
    selectedSubject,
    setSelectedSubject,
    toggleTimer,
    resetTimer,
    WORK_TIME,
    SHORT_BREAK,
    LONG_BREAK
  } = useFocusTimer();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  // Circular progress calculations
  const totalTime = isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Focus Mode</h2>
          <p className="mt-1 text-sm text-text-secondary">Pomodoro timer to maximize your productivity.</p>
        </div>
      </div>

      <div className="bg-surface-base rounded-2xl shadow-sm border border-surface-border overflow-hidden">
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center">
          
          {/* Subject Selector */}
          <div className="w-full max-w-xs mb-8">
            <label className="block text-sm font-medium text-text-primary mb-2 text-center">Focusing on</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-surface-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-lg border bg-surface-raised disabled:opacity-50 transition-colors"
            >
              <option value="">General Study</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Status Indicator */}
          <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-sunken font-medium text-text-primary">
            {isBreak ? <Coffee className="w-4 h-4 text-status-warning" /> : <BookOpen className="w-4 h-4 text-brand-primary" />}
            {isBreak ? (sessionCount > 0 && sessionCount % 4 === 0 ? 'Long Break' : 'Short Break') : 'Focus Session'}
          </div>

          {/* Circular Timer */}
          <div className="relative flex items-center justify-center mb-10">
            <svg className="transform -rotate-90 w-[280px] h-[280px]">
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-surface-sunken"
              />
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-1000 ease-linear ${isBreak ? 'text-status-warning' : 'text-brand-primary'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-6xl font-extrabold tracking-tighter text-text-primary font-display">
                {formatTime(timeLeft)}
              </span>
              <span className="mt-2 text-sm font-medium text-text-tertiary uppercase tracking-widest">
                Session {(sessionCount % 4) + 1}/4
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-status-warning hover:bg-status-warning/90 shadow-status-warning/30' : 'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30'}`}
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetTimer}
              className="p-4 rounded-2xl bg-surface-sunken text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
              title="Reset Timer"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 px-6 py-4 bg-brand-primary-subtle rounded-xl border border-brand-primary/20 flex flex-col items-center">
            <p className="text-sm font-medium text-brand-primary uppercase tracking-wide mb-1">Total Study Time Today</p>
            <p className="text-3xl font-bold text-brand-primary">{totalHoursToday} <span className="text-lg font-medium text-brand-primary">hours</span></p>
          </div>

        </div>
      </div>
    </div>
  );
}
