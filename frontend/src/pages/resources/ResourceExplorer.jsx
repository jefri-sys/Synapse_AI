import React, { useState, useEffect, useRef } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { Search, Compass, BookOpen, Video, FileText, CheckCircle, ExternalLink, Clock, Save, Plus, Sparkles, X, Trash2, Maximize2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ExplorerChat from './ExplorerChat.jsx';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

function ResourceExplorer() {
 const { user } = useAuth();
 const [topic, setTopic] = useState('');
 const [experienceLevel, setExperienceLevel] = useState('Beginner');
 const [timeframe, setTimeframe] = useState('');
 const [loading, setLoading] = useState(false);
 const [roadmap, setRoadmap] = useState(null);
 const [session, setSession] = useState(null);
 const [history, setHistory] = useState([]);
 const [isChatOpen, setIsChatOpen] = useState(true);
 const [splitWidth, setSplitWidth] = useState(50);
 const [isResizing, setIsResizing] = useState(false);
 const containerRef = useRef(null);

 useEffect(() => {
 fetchHistory();
 }, []);

 useEffect(() => {
   if (!isResizing) return;
   const handleMouseMove = (e) => {
     if (!containerRef.current) return;
     const rect = containerRef.current.getBoundingClientRect();
     const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
     if (newWidth >= 25 && newWidth <= 75) {
       setSplitWidth(newWidth);
     }
   };
   const handleMouseUp = () => setIsResizing(false);
   document.addEventListener('mousemove', handleMouseMove);
   document.addEventListener('mouseup', handleMouseUp);
   return () => {
     document.removeEventListener('mousemove', handleMouseMove);
     document.removeEventListener('mouseup', handleMouseUp);
   };
 }, [isResizing]);

 const fetchHistory = async () => {
 try {
 const res = await api.get('/resources/history');
 if (res.data.success) {
 setHistory(res.data.history);
 }
 } catch (err) {
 console.error('Failed to fetch history', err);
 }
 };

 const handleSearch = async (e, overrideTopic = null) => {
 e?.preventDefault();
 const searchTopic = overrideTopic || topic;
 if (!searchTopic.trim()) return;

 setLoading(true);
 setRoadmap(null);
 setSession(null);
 setIsChatOpen(true);
 try {
 const res = await api.post('/resources/explore', { 
 topic: searchTopic,
 experienceLevel,
 timeframe
 });
 if (res.data.success) {
 setRoadmap(res.data.data);
 setSession(res.data.session);
 fetchHistory(); // refresh history
 }
 } catch (err) {
 console.error('Explore error', err);
 } finally {
 setLoading(false);
 }
 };

 const selectHistory = async (sessionId) => {
 setLoading(true);
 setRoadmap(null);
 setSession(null);
 setIsChatOpen(true);
 try {
 const res = await api.get(`/resources/sessions/${sessionId}`);
 if (res.data.success) {
 setTopic(res.data.session.topic);
 setRoadmap(res.data.session.roadmap);
 setSession(res.data.session);
 }
 } catch(err) {
 console.error('Fetch session error', err);
 } finally {
 setLoading(false);
 }
 };

 const handleDeleteHistory = async (e, sessionId) => {
 e.stopPropagation();
 try {
 const res = await api.delete(`/resources/sessions/${sessionId}`);
 if (res.data.success) {
 setHistory(prev => prev.filter(h => h._id !== sessionId));
 if (session && session._id === sessionId) {
 setSession(null);
 setRoadmap(null);
 setTopic('');
 }
 }
 } catch (error) {
 console.error('Failed to delete history', error);
 }
 };

 const handleNewResources = (newResources) => {
 setSession(prev => prev ? { ...prev, resources: newResources } : prev);
 };

 const getIconForType = (type) => {
 const t = type.toLowerCase();
 if (t.includes('video')) return <Video className="w-4 h-4 text-status-danger" />;
 if (t.includes('doc') || t.includes('tutorial')) return <FileText className="w-4 h-4 text-brand-primary" />;
 if (t.includes('practice')) return <CheckCircle className="w-4 h-4 text-status-success" />;
 return <BookOpen className="w-4 h-4 text-brand-primary" />;
 };

 const handleSaveToNotebook = (resource) => {
 alert(`Saved "${resource.title}" to Notebook (Coming soon!)`);
 };

 const handleAddStudyTask = (resource) => {
 alert(`Added "${resource.title}" to Planner (Coming soon!)`);
 };

  return (
    <ProtectedPage
      title="Resource Explorer"
      description="AI-curated learning roadmaps for any topic."
    >
      <div 
        ref={containerRef}
        className={`flex flex-col lg:flex-row mt-6 h-[calc(100vh-140px)] relative ${isResizing ? 'select-none pointer-events-none' : ''}`}
        style={{ gap: '1.5rem' }}
      >
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-brand-primary-subtle/20 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Left Content */}
        <div 
          className="flex flex-col bg-surface-base/80 backdrop-blur-2xl border border-surface-border rounded-2xl shadow-sm relative z-10 transition-all duration-75"
          style={ (session && isChatOpen) ? { width: `calc(${splitWidth}% - 0.75rem)`, pointerEvents: isResizing ? 'none' : 'auto' } : { flex: 1 } }
        >
          <div className="p-6 border-b border-surface-border bg-surface-raised/50 relative rounded-t-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none rounded-t-2xl" />
            <form onSubmit={handleSearch} className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3 relative">
                <div className="relative flex-1 group">
                  <Search className="w-5 h-5 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" />
                  <Input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Learn React, DBMS, Python..."
                    className="pl-12 w-full h-12 bg-surface-base border-surface-border text-text-primary focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all rounded-xl shadow-sm"
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!topic.trim() || loading}
                  className="px-6 h-12 shrink-0 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-md hover:shadow-lg transition-all border-none font-medium tracking-wide"
                >
                  <Compass className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Curating...' : 'Explore'}
                </Button>
              </div>

              {!roadmap && !loading && (
                <div className="flex flex-col sm:flex-row gap-5 mt-2">
                  <div className="flex-1 relative">
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-1.5 ml-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={e => setExperienceLevel(e.target.value)}
                      className="appearance-none flex w-full h-10 rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-brand-primary/50 focus:text-text-primary transition-all cursor-pointer shadow-sm"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <div className="absolute bottom-3 right-3 pointer-events-none text-text-tertiary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-1.5 ml-1">Timeframe (Optional)</label>
                    <Input
                      type="text"
                      value={timeframe}
                      onChange={e => setTimeframe(e.target.value)}
                      placeholder="e.g. 1 month, 2 weeks..."
                      className="h-10 bg-surface-base border-surface-border text-text-secondary focus:text-text-primary focus:border-brand-primary/50 transition-all rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse" />
                  <Compass className="w-14 h-14 animate-spin text-brand-primary relative z-10" />
                </div>
                <div className="flex flex-col items-center">
                  <p className="font-medium text-text-primary">Synthesizing Learning Roadmap</p>
                  <p className="text-sm mt-1 opacity-70">Querying neural networks for optimal paths...</p>
                </div>
              </div>
            ) : roadmap ? (
              <div className="max-w-3xl mx-auto pb-12 relative">
                {session && !isChatOpen && (
                  <div className="flex justify-end mb-6 sticky top-0 z-20 pt-2">
                    <Button 
                      variant="secondary"
                      onClick={() => setIsChatOpen(true)}
                      size="sm"
                      className="font-bold shadow-md bg-surface-raised/90 backdrop-blur-md border-surface-border hover:border-brand-primary/50 text-brand-primary"
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Ask AI Assistant
                    </Button>
                  </div>
                )}
                <div className="mb-12 ml-12 text-left">
                  <h2 className="text-3xl font-display font-bold text-text-primary mb-3 tracking-tight">{roadmap.topic}</h2>
                  <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
                    <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full capitalize">
                      {roadmap.level} Level
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-raised border border-surface-border rounded-full">
                      <Clock className="w-4 h-4 text-text-tertiary" />
                      {roadmap.totalEstimatedTime}
                    </span>
                  </div>
                </div>

                <div className="space-y-8 relative before:absolute before:top-4 before:bottom-0 before:left-[1.3rem] before:-translate-x-[1px] before:w-[2px] before:bg-surface-border">
                  {roadmap.roadmap.map((step, idx) => (
                    <div key={idx} className="relative flex items-start group">
                      <div className="absolute left-[1.3rem] -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-surface-base border-2 border-brand-primary shadow-[0_0_10px_rgba(139,92,246,0.3)] shrink-0 z-10 top-6">
                        <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                      </div>
                      <Card className="w-full ml-12 p-5 bg-surface-base/90 backdrop-blur-sm border border-surface-border hover:border-brand-primary/40 transition-all duration-300 rounded-2xl hover:shadow-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/30 to-transparent opacity-50" />
                        <h3 className="font-bold text-text-primary text-xl mb-2 flex items-center gap-3">
                           <span className="text-brand-primary font-mono text-sm border border-brand-primary/20 bg-brand-primary/5 px-1.5 py-0.5 rounded">{(idx + 1).toString().padStart(2, '0')}</span> 
                           {step.title}
                        </h3>
                        <p className="text-text-secondary text-sm mb-5 leading-relaxed">{step.description}</p>
                        
                        <div className="space-y-3">
                          {step.resources.map((res, rIdx) => (
                            <div key={rIdx} className="bg-surface-raised border border-surface-border p-3 rounded-xl flex flex-col gap-3 group/card hover:border-brand-primary/30 transition-all duration-300">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0 bg-surface-base p-2 rounded-lg shadow-sm border border-surface-border">
                                  {getIconForType(res.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href={res.url} target="_blank" rel="noreferrer" className="font-semibold text-text-primary text-sm hover:text-brand-primary flex items-center gap-1.5 transition-colors">
                                    {res.title}
                                    <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                                  </a>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary font-medium capitalize font-mono tracking-tight">
                                    <span className="bg-surface-base border border-surface-border px-2 py-0.5 rounded">{res.type}</span>
                                    <span className="flex items-center gap-1 opacity-80"><Clock className="w-3 h-3" /> {res.estimatedTime}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2 border-t border-surface-border opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <Button variant="outline" size="sm" onClick={() => handleSaveToNotebook(res)} className="flex-1 h-8 text-xs bg-surface-base">
                                  <Save className="w-3.5 h-3.5 mr-1.5 opacity-70" /> Save to Notebook
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleAddStudyTask(res)} className="flex-1 h-8 text-xs bg-brand-primary-subtle text-brand-primary border-brand-primary-subtle hover:bg-brand-primary/20">
                                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>

                {session && session.resources && session.resources.some(r => !r.fromInitialSearch) && (
                  <div className="mt-12 pt-8 border-t border-surface-border relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-surface-base border border-surface-border rounded-full shadow-sm">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center justify-center gap-2">
                      Discovered in Chat
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {session.resources.filter(r => !r.fromInitialSearch).map((res, rIdx) => (
                        <Card key={rIdx} className="p-4 flex flex-col gap-3 bg-surface-base/90 border border-surface-border hover:border-brand-primary/40 transition-all rounded-xl group/card shadow-sm hover:shadow-md">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 bg-surface-raised p-2 rounded-lg border border-surface-border">
                              {getIconForType(res.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <a href={res.url} target="_blank" rel="noreferrer" className="font-semibold text-text-primary text-sm hover:text-brand-primary flex items-center gap-1.5 transition-colors">
                                {res.title}
                                <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                              </a>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary font-medium capitalize font-mono">
                                <span className="bg-surface-raised px-1.5 py-0.5 rounded border border-surface-border">{res.type}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {res.estimatedTime}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-surface-border opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm" onClick={() => handleSaveToNotebook(res)} className="flex-1 h-8 text-xs bg-surface-raised">
                              <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => handleAddStudyTask(res)} className="flex-1 h-8 text-xs bg-brand-primary-subtle text-brand-primary border-transparent hover:bg-brand-primary/20">
                              <Plus className="w-3.5 h-3.5 mr-1.5" /> Task
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary space-y-5">
                <div className="w-20 h-20 bg-surface-raised border border-surface-border rounded-full flex items-center justify-center shadow-inner relative">
                  <Compass className="w-8 h-8 text-text-tertiary/50" />
                </div>
                <p className="font-medium tracking-wide">Enter a topic to generate a cinematic learning path.</p>
              </div>
            )}
          </div>
        </div>

        {session && isChatOpen ? (
          <>
            {/* Resizer */}
            <div 
              className="hidden lg:flex items-center justify-center w-6 -mx-3 z-30 cursor-col-resize group"
              onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
            >
              <div className={`h-16 w-1.5 rounded-full transition-colors ${isResizing ? 'bg-brand-primary' : 'bg-surface-border group-hover:bg-brand-primary/50'}`}></div>
            </div>

            <div 
              className="shrink-0 h-full relative z-20 transition-all duration-75"
              style={{ width: `calc(${100 - splitWidth}% - 0.75rem)`, pointerEvents: isResizing ? 'none' : 'auto' }}
            >
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button 
                  onClick={() => setSplitWidth(50)}
                  className="p-2 bg-surface-base/90 backdrop-blur-md rounded-full shadow-md border border-surface-border text-text-secondary hover:text-text-primary transition-colors"
                  title="Reset Size"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 bg-surface-base/90 backdrop-blur-md rounded-full shadow-md border border-surface-border text-text-secondary hover:text-text-primary transition-colors"
                  title="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="h-full rounded-2xl overflow-hidden shadow-lg border border-surface-border bg-surface-base">
                <ExplorerChat 
                  sessionId={session._id} 
                  initialMessages={session.messages} 
                  onNewResources={handleNewResources} 
                />
              </div>
            </div>
          </>
        ) : !session ? (
          <div className="w-full lg:w-72 flex flex-col bg-surface-base/80 backdrop-blur-2xl border border-surface-border rounded-2xl shadow-sm overflow-hidden shrink-0 relative z-10">
            <div className="p-5 border-b border-surface-border bg-surface-raised/50 relative">
              <h3 className="font-semibold text-text-primary flex items-center gap-2 relative z-10">
                <Clock className="w-4 h-4 text-brand-primary" />
                Recent Explorations
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-surface-border scrollbar-track-transparent">
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <div key={item._id} className="w-full relative group flex items-center">
                    <button
                      onClick={() => selectHistory(item._id)}
                      className="flex-1 text-left px-4 py-3 rounded-xl hover:bg-surface-raised border border-transparent hover:border-surface-border text-sm text-text-secondary hover:text-text-primary transition-all flex items-center justify-between"
                    >
                      <span className="truncate pr-8 font-medium">{item.query}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteHistory(e, item._id)}
                      className="absolute right-3 p-1.5 text-text-tertiary hover:text-status-danger hover:bg-status-danger-subtle rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center flex flex-col items-center gap-3 text-text-tertiary">
                  <Clock className="w-6 h-6 opacity-40" />
                  <span className="text-sm">No recent searches.</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedPage>
  );
}

export default ResourceExplorer;
