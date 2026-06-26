import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Send, Loader2, Sparkles, Globe } from 'lucide-react';
import MarkdownText from '../../components/MarkdownText';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ChatBubble } from '../../components/ui/ChatBubble';

export default function ExplorerChat({ sessionId, initialMessages = [], onNewResources }) {
  const [chats, setChats] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setChats(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [chats, isTyping]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const question = inputValue.trim();
    setInputValue('');
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setChats(prev => [...prev, { _id: tempId, role: 'user', content: question }]);
    setIsTyping(true);

    try {
      const res = await api.post(`/resources/sessions/${sessionId}/messages`, { message: question });
      
      if (res.data.success) {
        setChats(prev => [
          ...prev, 
          { 
            _id: Date.now().toString() + '1', 
            role: 'assistant', 
            content: res.data.reply.content,
            searchPerformed: res.data.reply.searchPerformed
          }
        ]);
        
        if (res.data.newResources && onNewResources) {
          onNewResources(res.data.newResources);
        }
      }
    } catch (err) {
      console.error('Failed to ask question', err);
      setChats(prev => [
        ...prev, 
        { _id: Date.now().toString() + 'err', role: 'assistant', content: err.response?.data?.message || 'Sorry, I encountered an error.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-surface-raised rounded-2xl border border-surface-border shadow-sm overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-6 bg-surface-base">
        {chats.length === 0 && !isTyping ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Sparkles className="w-12 h-12 text-brand-primary-subtle mb-4" />
            <h3 className="text-lg font-bold text-text-primary">AI Tutor is Ready</h3>
            <p className="text-text-secondary max-w-sm mt-2">Ask follow-up questions about this roadmap. I can find alternative courses, exercises, or clarify concepts.</p>
          </div>
        ) : (
          chats.map((chat, idx) => (
            <ChatBubble 
              key={chat._id || idx} 
              role={chat.role}
              searchPerformed={chat.searchPerformed}
            >
              {chat.role === 'user' ? (
                <div className="whitespace-pre-wrap">{chat.content}</div>
              ) : (
                <MarkdownText text={chat.content} className="text-text-primary" />
              )}
            </ChatBubble>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start mb-6">
            <div className="bg-surface-raised border border-surface-border rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-2 text-ai-accent">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-surface-raised border-t border-surface-border">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask a question about these resources..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button 
            type="submit"
            variant="primary"
            disabled={!inputValue.trim() || isTyping}
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-center text-xs text-text-tertiary mt-2">AI can search the web dynamically if needed.</p>
      </div>
    </div>
  );
}
