import React, { useState, useRef, useEffect } from 'react';
import VoiceRecorder from './VoiceRecorder';
import api from '../../services/api';

const ChatInput = ({ conversationId, socket, replyTo, setReplyTo, onSendText, onUploadSuccess, uploadUrl, allowMedia = true, allowVoice = true, allowText = true }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [examContext, setExamContext] = useState('');
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    };
  }, [filePreview]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (socket && conversationId) {
      socket.emit('typing:start', { conversationId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId });
      }, 2000);
    }
  };

  const handleFocus = () => {
    if (socket && conversationId && inputText.length > 0) {
      socket.emit('typing:start', { conversationId });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isGeneratingAI) return;

    if (inputText.startsWith('/ask ')) {
      setIsGeneratingAI(true);
      const question = inputText.substring(5).trim();
      try {
        await api.post(`/groups/${conversationId}/ai/ask`, { question });
        setInputText('');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to ask AI');
      } finally {
        setIsGeneratingAI(false);
      }
      return;
    }

    if (inputText.startsWith('/plan-exam')) return; // handled by mini-form
    
    onSendText(inputText, replyTo?.messageId);
    
    setInputText('');
    setReplyTo(null);

    if (socket && conversationId) {
      socket.emit('typing:stop', { conversationId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setFilePreview({ url, type: file.type.startsWith('image/') ? 'image' : 'video' });
    } else {
      setFilePreview({ name: file.name, type: 'document' });
    }
    
    e.target.value = '';
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (replyTo?.messageId) {
      formData.append('replyTo', replyTo.messageId);
    }

    try {
      const endpoint = uploadUrl || `/conversations/${conversationId}/messages/media`;
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess(data);
      setReplyTo(null);
      clearFileSelection();
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  };

  const handleExamPlanSubmit = async (e) => {
    e.preventDefault();
    if (!examDate) return;
    setIsGeneratingAI(true);
    try {
      await api.post(`/groups/${conversationId}/ai/exam-plan`, { examDate, additionalContext: examContext });
      setInputText('');
      setExamDate('');
      setExamContext('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate plan');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="flex flex-col bg-surface-base border-t relative">
      {replyTo && (
        <div className="flex items-center justify-between p-2 bg-surface-sunken border-b border-surface-border">
          <div className="flex flex-col pl-2 border-l-4 border-brand-primary">
            <span className="text-xs font-semibold text-brand-primary">{replyTo.senderName}</span>
            <span className="text-sm text-text-secondary truncate max-w-xs">{replyTo.contentPreview}</span>
          </div>
          <button type="button" onClick={() => setReplyTo(null)} className="p-1 text-text-tertiary hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {selectedFile ? (
        <div className="p-4 bg-surface-base flex flex-col items-center relative">
          <button 
            onClick={clearFileSelection} 
            className="absolute top-2 right-2 p-1.5 bg-surface-raised hover:bg-surface-border rounded-full text-text-secondary transition-colors"
            disabled={isUploading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="mt-2 mb-4 w-full flex justify-center">
            {filePreview?.type === 'image' && (
              <img src={filePreview.url} alt="Preview" className="max-h-48 rounded-lg shadow-sm object-contain" />
            )}
            {filePreview?.type === 'video' && (
              <video src={filePreview.url} controls className="max-h-48 rounded-lg shadow-sm object-contain" />
            )}
            {filePreview?.type === 'document' && (
              <div className="flex items-center space-x-3 bg-surface-base px-6 py-4 rounded-xl shadow-sm border border-surface-border">
                <div className="p-3 bg-brand-primary-subtle rounded-full text-brand-primary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="font-semibold text-text-primary truncate max-w-[200px]">{filePreview.name}</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={uploadSelectedFile}
            disabled={isUploading}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-primary transition-colors flex items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            {isUploading ? 'Sending...' : 'Send File'}
            {!isUploading && <svg className="w-5 h-5 ml-2 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
          </button>
        </div>
      ) : (
        <>
          {inputText.startsWith('/') && !inputText.startsWith('/plan-exam') && !inputText.startsWith('/ask ') && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-surface-base border border-surface-border rounded-xl shadow-lg overflow-hidden z-50">
              <button type="button" onClick={() => setInputText('/ask ')} className="w-full text-left px-4 py-3 hover:bg-surface-base text-sm border-b border-surface-border transition-colors">
                <span className="font-bold text-brand-primary mr-2">/ask</span> <span className="text-text-tertiary">[question]</span>
              </button>
              <button type="button" onClick={() => setInputText('/plan-exam ')} className="w-full text-left px-4 py-3 hover:bg-surface-base text-sm transition-colors">
                <span className="font-bold text-brand-primary mr-2">/plan-exam</span> <span className="text-text-tertiary">Plan your exams</span>
              </button>
            </div>
          )}

          {inputText.startsWith('/plan-exam') && (
            <form onSubmit={handleExamPlanSubmit} className="p-4 bg-brand-primary-subtle/50 border-b border-brand-primary/20 flex flex-col space-y-3 z-10 relative">
              <div className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Generate Exam Plan
              </div>
              <input 
                type="date" 
                required
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full p-2.5 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-surface-base"
              />
              <input 
                type="text" 
                placeholder="Any specific topics or concerns? (optional)"
                value={examContext}
                onChange={e => setExamContext(e.target.value)}
                className="w-full p-2.5 border border-brand-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-surface-base"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setInputText('')} className="px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary-subtle rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isGeneratingAI} className="px-4 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary disabled:opacity-50 shadow-sm transition-colors flex items-center">
                  {isGeneratingAI ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </form>
          )}

        <form onSubmit={handleSend} className="p-3 flex items-center space-x-2 z-10 relative">
          <label className={`p-2 shrink-0 rounded-full transition-colors ${allowMedia ? 'text-text-tertiary hover:text-text-primary cursor-pointer hover:bg-surface-raised' : 'text-gray-300 cursor-not-allowed'}`} title={allowMedia ? "Attach File" : "Media restricted"}>
            <input type="file" className="hidden" onChange={handleFileSelect} disabled={!allowMedia} />
            <svg className="w-5 h-5 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>
          <input 
            type="text" 
            value={inputText}
            onChange={handleInputChange}
            onFocus={handleFocus}
            disabled={!allowText}
            className={`flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary bg-surface-sunken ${!allowText ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={allowText ? "Type a message..." : "Text messages are restricted"}
          />
          {(inputText.trim() || isGeneratingAI) ? (
            <button 
              type="submit" 
              disabled={isGeneratingAI}
              className={`p-2 rounded-full transition-colors shrink-0 ${isGeneratingAI ? 'bg-surface-border text-text-tertiary cursor-not-allowed' : 'bg-brand-primary text-white hover:bg-brand-primary/90'}`}
            >
              <svg className={`w-5 h-5 transform rotate-90 ${isGeneratingAI ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          ) : (
            <div className={!allowVoice ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} title={!allowVoice ? "Voice restricted" : "Record voice"}>
              <VoiceRecorder 
                conversationId={conversationId} 
                replyTo={replyTo?.messageId} 
                onUploadSuccess={(msg) => {
                  setReplyTo(null);
                  onUploadSuccess(msg);
                }} 
                uploadUrl={uploadUrl}
              />
            </div>
          )}
        </form>
        </>
      )}
    </div>
  );
};

export default ChatInput;
