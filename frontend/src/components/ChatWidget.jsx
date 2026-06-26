import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, RotateCcw, Sparkles } from 'lucide-react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import api from '../services/api';

const QUICK_PROMPTS = [
  "How am I doing?",
  "Plan my day",
  "Explain my marks",
  "Where is my money going?"
];

const DEFAULT_DIMENSIONS = { width: 380, height: 600 };

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS);
  const dragControls = useDragControls();
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isLoading]);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    const newHistory = [...conversationHistory, userMessage];
    
    setConversationHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      // Keep only last 10 messages for the API request context
      const historyForApi = conversationHistory.slice(-10);

      const res = await api.post('/ai/chat', { 
        message: text, 
        conversationHistory: historyForApi 
      });

      if (res.data && res.data.success) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        if (res.data && res.data.limitHit) {
          setConversationHistory(prev => [...prev, { 
            role: 'assistant', 
            content: "⚠️ AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow." 
          }]);
        } else {
          setConversationHistory(prev => [...prev, { 
            role: 'assistant', 
            content: "I'm having trouble connecting right now. Please try again later." 
          }]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      if (err.response?.status === 429 || err.response?.data?.limitHit) {
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "⚠️ AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow." 
        }]);
      } else {
        setConversationHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm having trouble connecting right now. Please try again later." 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setConversationHistory([]);
  };

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = dimensions.width;

    const onMouseMove = (moveEvent) => {
      setDimensions(prev => ({
        ...prev,
        width: Math.max(300, Math.min(800, startWidth + (startX - moveEvent.clientX)))
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-8 bottom-8 z-[100]"
          >
            <Button
              variant="primary"
              shape="circular"
              onClick={toggleOpen}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] border border-white/20 hover:scale-110 transition-all duration-300 focus:outline-none group"
              aria-label="Open AI Assistant"
            >
              <div className="relative flex items-center justify-center">
                <Brain className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1.5 text-white animate-pulse" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{ width: dimensions.width, height: dimensions.height }}
            className="fixed right-6 bottom-6 z-50 bg-[#FDFBFB] dark:bg-[#1E1E1E] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-[#E8E8E8] dark:border-white/10 flex flex-col origin-bottom-right overflow-hidden"
          >
            {/* Left Edge Resize Handle */}
            <div 
              onMouseDown={startResize}
              className="absolute top-0 left-0 w-2 h-full cursor-ew-resize z-50 hover:bg-[#212121]/10 dark:hover:bg-white/10 transition-colors"
              title="Drag to resize width"
            />
            
            {/* Header (Drag Handle) */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: 'none' }}
          className="flex items-center justify-between px-5 py-4 bg-white/70 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-[#E8E8E8] dark:border-white/10 shrink-0 z-10 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F5F5F5] dark:bg-[#2A2A2A] flex items-center justify-center border border-[#E8E8E8] dark:border-white/10">
              <Brain className="w-4 h-4 text-[#212121] dark:text-[#ECECEC]" />
            </div>
            <div>
              <h2 className="font-semibold text-[15px] text-[#212121] dark:text-[#ECECEC] tracking-tight leading-none">Synapse AI</h2>
              <span className="text-[11px] text-[#888888] dark:text-[#A3A3A3] font-medium mt-1 block">Contextually Aware</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-2 rounded-lg text-[#888888] dark:text-[#A3A3A3] hover:text-[#212121] dark:hover:text-[#ECECEC] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors" title="Clear chat">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={toggleOpen} className="p-2 rounded-lg text-[#888888] dark:text-[#A3A3A3] hover:text-[#212121] dark:hover:text-[#ECECEC] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#D9D9D9] dark:[&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#C4C4C4] dark:hover:[&::-webkit-scrollbar-thumb]:bg-[#555] [&::-webkit-scrollbar-track]:bg-transparent">
          {conversationHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#2A2A2A] shadow-sm border border-[#E8E8E8] dark:border-white/10 flex items-center justify-center mb-5 relative">
                <Sparkles className="w-6 h-6 text-[#212121] dark:text-[#ECECEC]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212121] dark:text-[#ECECEC] mb-2 tracking-tight">How can I help?</h3>
              <p className="text-[14px] text-[#666666] dark:text-[#A3A3A3] leading-relaxed mb-8">I have access to your full academic context.</p>
              
              <div className="w-full grid grid-cols-2 gap-2.5 mt-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="relative p-3.5 min-h-[72px] bg-white dark:bg-[#262626] border border-[#E8E8E8] dark:border-white/10 rounded-[14px] text-left hover:border-[#D4D4D4] dark:hover:border-white/20 hover:bg-[#FAFAFA] dark:hover:bg-[#2E2E2E] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 group flex flex-col justify-center overflow-hidden"
                    >
                      <span className="text-[12.5px] font-medium text-[#555555] dark:text-[#A3A3A3] group-hover:text-[#111111] dark:group-hover:text-[#ECECEC] leading-snug pr-4 transition-colors">
                        {prompt}
                      </span>
                      <div className="absolute right-2.5 bottom-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <div className="w-5 h-5 rounded-full bg-white dark:bg-[#333] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-[#E8E8E8] dark:border-white/10 flex items-center justify-center">
                          <Send className="w-2.5 h-2.5 text-[#111111] dark:text-[#ECECEC] ml-[-1px]" />
                        </div>
                      </div>
                    </button>
                ))}
              </div>
            </div>
          ) : (
            conversationHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] px-4 py-3 bg-[#F5F5F5] dark:bg-[#2A2A2A] text-[#212121] dark:text-[#ECECEC] rounded-2xl rounded-tr-[4px] text-[14px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#E8E8E8] dark:border-white/5">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[90%] text-[#212121] dark:text-[#ECECEC] text-[14px] leading-relaxed flex gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-[#2A2A2A] border border-[#E8E8E8] dark:border-white/10 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="w-3.5 h-3.5 text-[#212121] dark:text-[#ECECEC]" />
                    </div>
                    <div className="pt-1 whitespace-pre-wrap text-[#333333] dark:text-[#D4D4D4] leading-[1.6]">
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] text-[#212121] dark:text-[#ECECEC] text-[14px] flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-[#2A2A2A] border border-[#E8E8E8] dark:border-white/10 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-3.5 h-3.5 text-[#212121] dark:text-[#ECECEC]" />
                </div>
                <div className="pt-2.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#888888] dark:bg-[#A3A3A3] animate-[bounce_1.4s_infinite_ease-in-out]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#888888] dark:bg-[#A3A3A3] animate-[bounce_1.4s_infinite_ease-in-out] delay-[0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#888888] dark:bg-[#A3A3A3] animate-[bounce_1.4s_infinite_ease-in-out] delay-[0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 dark:bg-[#1E1E1E]/90 backdrop-blur-xl border-t border-[#E8E8E8] dark:border-white/10 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(message); }}
            className="relative flex items-end shadow-sm bg-white dark:bg-[#2A2A2A] border border-[#E8E8E8] dark:border-white/10 rounded-[22px] focus-within:border-[#BDBDBD] dark:focus-within:border-white/20 focus-within:ring-4 focus-within:ring-[#F5F5F5] dark:focus-within:ring-[#333333] transition-all duration-300 p-1.5"
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(message);
                }
              }}
              placeholder="Ask Synapse AI..."
              className="flex-1 max-h-32 min-h-[38px] bg-transparent outline-none border-none resize-none focus:ring-0 py-2 pl-3 pr-2 text-[14px] text-[#212121] dark:text-[#ECECEC] placeholder:text-[#999999] dark:placeholder:text-[#666666] leading-relaxed"
              rows={1}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="w-8 h-8 shrink-0 rounded-full bg-[#212121] dark:bg-[#ECECEC] text-white dark:text-[#212121] flex items-center justify-center hover:bg-[#000000] dark:hover:bg-white disabled:opacity-40 disabled:hover:bg-[#212121] dark:disabled:hover:bg-[#ECECEC] transition-all ml-1 mb-[1px] mr-[1px]"
            >
              <Send className="w-3.5 h-3.5 ml-[-1px]" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-[#A3A3A3] dark:text-[#777777] font-medium tracking-wide">Synapse AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
