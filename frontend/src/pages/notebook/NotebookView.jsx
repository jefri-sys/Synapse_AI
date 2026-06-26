import React, { useState, useEffect, useRef } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Loader2, Sparkles, BrainCircuit,
  Download, FileType2, File, CheckCircle2, XCircle, Trash2, Archive
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import MarkdownText from '../../components/MarkdownText';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function NotebookView() {
  const { user, updateUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [notebook, setNotebook] = useState(null);
  const [subjectName, setSubjectName] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});

  const [subjects, setSubjects] = useState([]);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentSummaryText, setCurrentSummaryText] = useState('');
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSubjectId, setSaveSubjectId] = useState('');
  const [savingPdf, setSavingPdf] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchNotebook();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'summaries') {
      fetchSavedSummaries();
    }
  }, [activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [chats, isTyping, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchNotebook = async () => {
    try {
      const [nbRes, subRes] = await Promise.all([
        api.get(`/notebooks/${id}`),
        api.get('/subjects')
      ]);
      setNotebook(nbRes.data.notebook);
      setChats(nbRes.data.chats || []);
      
      if (nbRes.data.notebook.subjectId) {
        const sub = subRes.data.subjects.find(s => s._id === nbRes.data.notebook.subjectId);
        if (sub) setSubjectName(sub.name);
      }
      setSubjects(subRes.data.subjects);
      setSaveSubjectId(nbRes.data.notebook.subjectId || '');
    } catch (err) {
      console.error('Failed to load notebook', err);
      navigate('/notebook');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const question = inputValue.trim();
    setInputValue('');
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setChats(prev => [...prev, { _id: tempId, role: 'user', message: question }]);
    setIsTyping(true);

    try {
      const res = await api.post(`/notebooks/${id}/question`, { question });
      setChats(prev => [
        ...prev, 
        { _id: Date.now().toString() + '1', role: 'assistant', message: res.data.reply }
      ]);
      const userRes = await api.get('/auth/me');
      if (userRes.data?.user) updateUser(userRes.data.user);
    } catch (err) {
      console.error('Failed to ask question', err);
      setChats(prev => [
        ...prev, 
        { _id: Date.now().toString() + 'err', role: 'assistant', message: err.response?.data?.message || 'Sorry, I encountered an error answering that.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (isTyping || generatingSummary) return;
    setGeneratingSummary(true);
    setIsTyping(true);

    try {
      const res = await api.post(`/notebooks/${id}/summary`);
      setChats(prev => [...prev, { _id: Date.now().toString(), role: 'assistant', message: res.data.summary }]);
      const userRes = await api.get('/auth/me');
      if (userRes.data?.user) updateUser(userRes.data.user);
    } catch (err) {
      console.error('Failed to generate summary', err);
      alert(err.response?.data?.message || 'Failed to generate summary.');
    } finally {
      setGeneratingSummary(false);
      setIsTyping(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (isTyping || generatingQuiz) return;
    setGeneratingQuiz(true);
    setIsTyping(true);

    try {
      const res = await api.post(`/notebooks/${id}/quiz`);
      setChats(prev => [...prev, { 
        _id: res.data.chatId, 
        role: 'assistant', 
        message: 'Generated a quiz for you.', 
        quizData: res.data.quiz 
      }]);
      const userRes = await api.get('/auth/me');
      if (userRes.data?.user) updateUser(userRes.data.user);
    } catch (err) {
      console.error('Failed to generate quiz', err);
      alert(err.response?.data?.message || 'Failed to generate quiz.');
    } finally {
      setGeneratingQuiz(false);
      setIsTyping(false);
    }
  };

  const handleQuizOptionSelect = (chatId, qIndex, option) => {
    setQuizAnswers(prev => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId] || {}),
        [qIndex]: option
      }
    }));
  };

  const handleSubmitQuiz = async (chatId, quizData) => {
    const answers = quizAnswers[chatId] || {};
    
    // Check if all answered
    if (Object.keys(answers).length < quizData.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const payload = quizData.map((q, idx) => ({
      question: q.question,
      userAnswer: answers[idx],
      correct: q.correct,
      explanation: q.explanation
    }));

    try {
      const res = await api.post(`/notebooks/${id}/submit-quiz`, { answers: payload });
      setQuizResults(prev => ({
        ...prev,
        [chatId]: res.data
      }));
    } catch (err) {
      console.error('Failed to submit quiz', err);
    }
  };

  const fetchSavedSummaries = async () => {
    try {
      const res = await api.get(`/notebooks/${id}/summaries`);
      setSavedSummaries(res.data.summaries);
    } catch (err) {
      console.error('Failed to load saved summaries', err);
    }
  };

  const openSaveDialog = (summaryText) => {
    setCurrentSummaryText(summaryText);
    setSaveTitle(`${notebook.title} Summary - ${new Date().toLocaleDateString()}`);
    setShowSaveDialog(true);
  };

  const handleSavePdf = async () => {
    if (!saveSubjectId) {
      alert("Please select a subject to save under.");
      return;
    }
    setSavingPdf(true);
    try {
      const res = await api.post(`/notebooks/${id}/summaries`, {
        subjectId: saveSubjectId,
        title: saveTitle,
        summaryText: currentSummaryText
      });
      if (res.data.success) {
        setShowSaveDialog(false);
        // Trigger download
        const a = document.createElement('a');
        a.href = res.data.savedSummary.pdfUrl;
        a.target = '_blank';
        a.download = `${res.data.savedSummary.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Refresh summaries if tab is open
        if (activeTab === 'summaries') fetchSavedSummaries();
      }
    } catch (err) {
      console.error('Failed to save PDF', err);
      alert(err.response?.data?.message || 'Failed to save PDF.');
    } finally {
      setSavingPdf(false);
    }
  };

  const handleDeleteSummary = async (summaryId) => {
    if (!window.confirm("Are you sure you want to delete this saved summary?")) return;
    try {
      await api.delete(`/summaries/${summaryId}`);
      setSavedSummaries(prev => prev.filter(s => s._id !== summaryId));
    } catch (err) {
      console.error('Failed to delete summary', err);
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      </ProtectedPage>
    );
  }

  if (!notebook) return null;

  return (
    <ProtectedPage>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <button 
            onClick={() => navigate('/notebook')}
            className="flex items-center gap-2 text-text-secondary hover:text-brand-primary transition-colors w-fit font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Notebooks
          </button>
          
          <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-sm flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl shrink-0 ${notebook.fileType === 'pdf' ? 'bg-status-danger-subtle text-status-danger' : 'bg-brand-primary-subtle text-brand-primary'}`}>
                {notebook.fileType === 'pdf' ? <FileType2 className="w-8 h-8" /> : <File className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-text-primary leading-tight mb-1">{notebook.title}</h2>
                <p className="text-sm text-text-secondary font-medium">{subjectName || 'General Notes'}</p>
              </div>
            </div>

            <a 
              href={notebook.fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-text-secondary bg-surface-sunken hover:bg-surface-border p-3 rounded-xl border border-surface-border transition-colors mb-8"
            >
              <Download className="w-4 h-4 shrink-0 text-text-tertiary" />
              <span className="truncate flex-1 font-medium">{notebook.fileName}</span>
            </a>

            <div className="mt-auto space-y-3">
              <Button 
                variant="secondary"
                onClick={handleGenerateSummary}
                disabled={generatingSummary || isTyping}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
              >
                {generatingSummary ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Summary
              </Button>
              
              <Button 
                variant="secondary"
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz || isTyping}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl"
              >
                {generatingQuiz ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                Generate Quiz
              </Button>
              
              <div className="pt-4 mt-2 border-t border-surface-border">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-text-secondary flex items-center gap-1"><Sparkles className="w-3 h-3 text-ai-accent" /> AI Usage</span>
                  <span className="text-xs font-medium text-text-secondary">
                    {((user?.aiTokensUsed || 0) / 1000).toFixed(1)}k / {((user?.aiTokenLimit || 500000) / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="w-full bg-surface-sunken rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) > 0.8 ? 'bg-status-danger' : 'bg-brand-primary'}`} 
                    style={{ width: `${Math.min(100, ((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - TABS & CONTENT */}
        <div className="w-full lg:w-2/3 flex flex-col bg-surface-raised rounded-2xl border border-surface-border shadow-sm overflow-hidden h-full">
          <div className="flex items-center border-b border-surface-border px-4 pt-2 bg-surface-base">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-border'}`}
            >
              AI Tutor & Chat
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'summaries' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-border'}`}
            >
              <Archive className="w-4 h-4" /> Saved Summaries
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-base">
            {chats.length === 0 && !isTyping ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <Sparkles className="w-12 h-12 text-brand-primary-subtle mb-4" />
                <h3 className="text-lg font-bold text-text-primary">AI Tutor is Ready</h3>
                <p className="text-text-secondary max-w-sm mt-2">Ask questions about your document, or use the panel on the left to generate summaries and quizzes.</p>
              </div>
            ) : (
              chats.map((chat) => (
                <ChatBubble 
                  key={chat._id} 
                  role={chat.role}
                  headerRight={chat.role === 'assistant' && !chat.quizData && chat.message.length > 250 && !chat.message.includes('{"question"') ? (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => openSaveDialog(chat.message)} 
                      className="h-8 px-3 text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Save as PDF
                    </Button>
                  ) : null}
                >
                  {chat.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{chat.message}</div>
                  ) : (
                    <MarkdownText text={chat.message} className="text-text-primary" />
                  )}

                  {/* QUIZ RENDERING */}
                  {chat.quizData && (
                    <div className="mt-6 space-y-6">
                      {quizResults[chat._id] && (
                        <div className="bg-brand-primary-subtle border border-brand-primary/20 rounded-xl p-4 flex items-center justify-between mb-6">
                          <span className="font-bold text-brand-primary">Quiz Completed!</span>
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-raised rounded-lg font-bold text-brand-primary shadow-sm border border-brand-primary/10">
                            <span>Score:</span>
                            <span className="text-lg">{quizResults[chat._id].score}/{quizResults[chat._id].total}</span>
                          </div>
                        </div>
                      )}

                      {chat.quizData.map((q, idx) => {
                        const result = quizResults[chat._id]?.breakdown?.[idx];
                        const selectedAnswer = quizAnswers[chat._id]?.[idx];
                        const isSubmitted = !!quizResults[chat._id];

                        let boxClass = "border border-surface-border rounded-xl p-5 bg-surface-sunken";
                        if (isSubmitted) {
                          if (result.isCorrect) boxClass = "border-2 border-status-success rounded-xl p-5 bg-status-success-subtle/50";
                          else boxClass = "border-2 border-status-danger rounded-xl p-5 bg-status-danger-subtle/50";
                        }

                        return (
                          <div key={idx} className={boxClass}>
                            <div className="flex items-start gap-3 mb-4">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary-subtle text-brand-primary font-bold text-xs shrink-0 mt-0.5">{idx + 1}</span>
                              <p className="font-semibold text-text-primary">{q.question}</p>
                            </div>

                            <div className="space-y-2.5 ml-9">
                              {q.options.map((opt, oIdx) => {
                                const isSelected = selectedAnswer === opt;
                                
                                let optClass = "flex items-center w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ";
                                if (!isSubmitted) {
                                  optClass += isSelected ? "bg-brand-primary-subtle border-brand-primary text-brand-primary font-medium shadow-sm" : "bg-surface-raised border-surface-border hover:border-brand-primary/30 hover:bg-surface-sunken text-text-secondary";
                                } else {
                                  if (opt === q.correct) optClass += "bg-status-success-subtle border-status-success text-status-success font-bold shadow-sm";
                                  else if (isSelected && !result.isCorrect) optClass += "bg-status-danger-subtle border-status-danger text-status-danger font-medium";
                                  else optClass += "bg-surface-raised border-surface-border text-text-tertiary opacity-60";
                                }

                                return (
                                  <button 
                                    key={oIdx}
                                    disabled={isSubmitted}
                                    onClick={() => handleQuizOptionSelect(chat._id, idx, opt)}
                                    className={optClass}
                                  >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 shrink-0 ${isSelected ? (isSubmitted && !result?.isCorrect ? 'border-status-danger bg-status-danger' : 'border-brand-primary bg-brand-primary') : 'border-surface-border'}`}>
                                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {isSubmitted && (
                              <div className={`mt-4 ml-9 p-4 rounded-lg text-sm ${result.isCorrect ? 'bg-status-success-subtle text-status-success' : 'bg-status-danger-subtle text-status-danger'}`}>
                                <div className="flex items-center gap-2 font-bold mb-1">
                                  {result.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                  {result.isCorrect ? "Correct!" : "Incorrect"}
                                </div>
                                <p>{result.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!quizResults[chat._id] && (
                        <div className="flex justify-end pt-2">
                          <Button 
                            onClick={() => handleSubmitQuiz(chat._id, chat.quizData)}
                          >
                            Submit Answers
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </ChatBubble>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
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
                placeholder="Ask a question about your notes..."
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
            <p className="text-center text-xs text-text-tertiary mt-2">AI can make mistakes. Verify important information.</p>
          </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 bg-surface-base">
              {savedSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <Archive className="w-12 h-12 mb-4 text-surface-border" />
                  <p>No saved summaries yet.</p>
                  <p className="text-sm text-text-secondary">Generate a summary in the chat and click "Save as PDF" to save it here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedSummaries.map(s => (
                    <Card key={s._id} className="p-4 flex flex-col group hover:border-brand-primary transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-text-primary leading-tight">{s.title}</h4>
                        <button onClick={() => handleDeleteSummary(s._id)} className="p-1.5 text-text-tertiary hover:text-status-danger hover:bg-status-danger-subtle rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-text-secondary mb-4">
                        <Badge status="info">{s.subject?.name || 'Unknown Subject'}</Badge>
                        <span>•</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                      <a href={s.pdfUrl} target="_blank" rel="noreferrer" className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-brand-primary-subtle text-brand-primary hover:bg-brand-primary/20 rounded-lg font-semibold text-sm transition-colors">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Save Summary Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-surface-border">
            <div className="px-6 py-4 border-b border-surface-border flex justify-between items-center bg-surface-base">
              <h3 className="font-bold text-text-primary text-lg">Save Summary as PDF</h3>
              <button onClick={() => setShowSaveDialog(false)} className="text-text-tertiary hover:text-text-primary">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">PDF Title</label>
                <Input 
                  type="text" 
                  value={saveTitle} 
                  onChange={e => setSaveTitle(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">File under Subject</label>
                <select 
                  value={saveSubjectId} 
                  onChange={e => setSaveSubjectId(e.target.value)}
                  className="flex w-full rounded-sm border border-surface-border bg-surface-base px-3 py-3 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <option value="" disabled>Select a subject...</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-base border-t border-surface-border flex justify-end gap-3">
              <Button 
                variant="ghost"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSavePdf}
                disabled={savingPdf || !saveSubjectId || !saveTitle}
              >
                {savingPdf && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {savingPdf ? 'Generating PDF...' : 'Save & Download'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
