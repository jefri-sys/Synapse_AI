import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone;

    // Desktop / Android Chrome logic
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissedState = localStorage.getItem('synapse_install_prompt_dismissed');
      if (dismissedState) {
        const { timestamp } = JSON.parse(dismissedState);
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
          return;
        }
      }
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari logic
    if (isIosDevice && !isStandalone) {
      const iosDismissedState = localStorage.getItem('synapse_ios_install_prompt_dismissed');
      if (iosDismissedState) {
        const { timestamp } = JSON.parse(iosDismissedState);
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss >= 7) {
          setIsIOS(true);
          setShowPrompt(true);
        }
      } else {
        setIsIOS(true);
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const stateToSave = JSON.stringify({ timestamp: Date.now() });
    if (isIOS) {
      localStorage.setItem('synapse_ios_install_prompt_dismissed', stateToSave);
    } else {
      localStorage.setItem('synapse_install_prompt_dismissed', stateToSave);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <div className="relative flex items-center gap-4 p-4 max-w-md w-full rounded-2xl border border-white/10 bg-[#050505]/80 backdrop-blur-xl shadow-2xl pointer-events-auto group">
        {/* Electric Violet Subtle Glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-[#8B5CF6]/20 transition-all duration-500"></div>

        {isIOS ? (
          <div className="flex-1 text-[15px] font-medium text-slate-200 leading-snug z-10">
            To install: tap the <Share className="inline w-4 h-4 mx-1 text-slate-400" /> icon, then <strong className="text-white">Add to Home Screen</strong>
          </div>
        ) : (
          <>
            <div className="flex-1 text-[15px] font-medium text-slate-200 leading-snug z-10">
              Install <strong className="text-white">Synapse</strong> for the full experience
            </div>
            <button 
              onClick={handleInstallClick} 
              className="relative px-5 py-2 text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7c4dff] rounded-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-200 active:scale-95 flex-shrink-0 z-10 overflow-hidden group/btn"
            >
              <span className="relative z-10">Install</span>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 shadow-[0_0_15px_rgba(139,92,246,0.6)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            </button>
          </>
        )}
        <button 
          onClick={handleDismiss} 
          className="p-1.5 text-slate-400 hover:text-white transition-colors flex-shrink-0 rounded-full hover:bg-white/10 active:scale-95 z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
