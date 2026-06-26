import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MediaViewer = ({ url, type, onClose }) => {
  const [zoom, setZoom] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/90 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-text-tertiary z-10 bg-black/50 p-2 rounded-full transition-colors"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {type === 'image' && (
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setZoom(!zoom);
            }}
            className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/70 transition-colors"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {zoom ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              )}
            </svg>
          </button>
          <img 
            src={url} 
            alt="Media" 
            className={`max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-300 ${zoom ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
            style={{ touchAction: 'manipulation' }}
            onClick={(e) => {
              e.stopPropagation();
              setZoom(!zoom);
            }}
          />
        </div>
      )}

      {type === 'video' && (
        <video 
          src={url} 
          controls 
          autoPlay 
          className="max-w-[90vw] max-h-[90vh] rounded shadow-2xl outline-none"
        />
      )}
    </div>,
    document.body
  );
};

export default MediaViewer;
