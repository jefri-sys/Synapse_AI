import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { useVault } from './CareerVaultLayout.jsx';
import { Loader2, Plus, Briefcase, AlertTriangle, Sparkles, Check, X, MonitorPlay } from 'lucide-react';
import CareerVaultNav from './CareerVaultNav.jsx';

export default function ResumeIntelligence() {
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  
  const [resume, setResume] = useState(null);
  const [fetchingResume, setFetchingResume] = useState(false);

  // Recruiter Analysis State
  const [runningRecruiterAnalysis, setRunningRecruiterAnalysis] = useState(false);
  const [showAddJdForm, setShowAddJdForm] = useState(false);
  const [newJdData, setNewJdData] = useState({ title: '', companyName: '', text: '' });
  const [newJdFile, setNewJdFile] = useState(null);
  const [addingJd, setAddingJd] = useState(false);

  // Rewrite Suggestions State
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);

  // Simulation State
  const [runningSimulation, setRunningSimulation] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      fetchResumeData(selectedResumeId);
    } else {
      setResume(null);
    }
  }, [selectedResumeId]);

  const fetchInitialData = async () => {
    try {
      const [resumesRes, jdRes] = await Promise.all([
        api.get('/career-vault/resumes'),
        api.get('/career-vault/job-descriptions')
      ]);
      setResumes(resumesRes.data.resumes || []);
      setJobDescriptions(jdRes.data.jobDescriptions || []);
      
      if (resumesRes.data.resumes?.length > 0) {
        setSelectedResumeId(resumesRes.data.resumes[0]._id);
      }
      if (jdRes.data.jobDescriptions?.length > 0) {
        setSelectedJdId(jdRes.data.jobDescriptions[0]._id);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Fetch initial data error', err);
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchResumeData = async (id) => {
    setFetchingResume(true);
    try {
      const res = await api.get(`/career-vault/resumes/${id}`);
      setResume(res.data.resume);
    } catch (err) {
      console.error('Fetch resume error', err);
    } finally {
      setFetchingResume(false);
    }
  };

  const handleAddJobDescription = async (e) => {
    e.preventDefault();
    setAddingJd(true);
    try {
      let payload;
      let headers = {};
      
      if (newJdFile) {
        payload = new FormData();
        payload.append('title', newJdData.title);
        if (newJdData.companyName) payload.append('companyName', newJdData.companyName);
        payload.append('file', newJdFile);
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = { ...newJdData };
      }
      
      const res = await api.post('/career-vault/job-descriptions', payload, { headers });
      const addedJd = res.data.jobDescription;
      setJobDescriptions([addedJd, ...jobDescriptions]);
      setSelectedJdId(addedJd._id);
      setShowAddJdForm(false);
      setNewJdData({ title: '', companyName: '', text: '' });
      setNewJdFile(null);
    } catch (err) {
      console.error('Add JD error', err);
      alert(err.response?.data?.message || 'Failed to add job description.');
    } finally {
      setAddingJd(false);
    }
  };

  const handleRunRecruiterAnalysis = async () => {
    if (!selectedJdId || !selectedResumeId) return;
    setRunningRecruiterAnalysis(true);
    try {
      const res = await api.post(`/career-vault/resumes/${selectedResumeId}/recruiter-analysis`, { jobDescriptionId: selectedJdId });
      setResume({
        ...resume,
        recruiterAnalysis: {
          jobDescriptionId: selectedJdId,
          analysis: res.data.analysis,
          analyzedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Recruiter analysis error', err);
      alert(err.response?.data?.message || 'Failed to run recruiter analysis.');
    } finally {
      setRunningRecruiterAnalysis(false);
    }
  };

  const handleGenerateRewriteSuggestions = async () => {
    if (!selectedResumeId) return;
    setGeneratingSuggestions(true);
    try {
      const res = await api.post(`/career-vault/resumes/${selectedResumeId}/rewrite-suggestions`);
      setResume({
        ...resume,
        pendingRewriteSuggestions: res.data.suggestions
      });
    } catch (err) {
      console.error('Rewrite suggestions error', err);
      alert(err.response?.data?.message || 'Failed to generate suggestions.');
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleApplyRewrite = async (section, entryIndex, action) => {
    if (!selectedResumeId) return;
    setApplyingSuggestion(true);
    try {
      const res = await api.post(`/career-vault/resumes/${selectedResumeId}/apply-rewrite`, { section, entryIndex, action });
      setResume(res.data.resume);
    } catch (err) {
      console.error('Apply rewrite error', err);
      alert(err.response?.data?.message || 'Failed to apply suggestion.');
    } finally {
      setApplyingSuggestion(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedJdId || !selectedResumeId) return;
    setRunningSimulation(true);
    try {
      const res = await api.post(`/career-vault/resumes/${selectedResumeId}/simulate-review`, { jobDescriptionId: selectedJdId });
      setResume({
        ...resume,
        atsValidation: res.data.atsValidation,
        hiringManagerSimulation: res.data.hiringManagerSimulation
      });
    } catch (err) {
      console.error('Simulate review error', err);
      alert(err.response?.data?.message || 'Failed to run simulation.');
    } finally {
      setRunningSimulation(false);
    }
  };

  const renderRewrittenText = (text) => {
    if (!text) return null;
    
    let processText = text;
    if (Array.isArray(text)) {
      processText = text.join('\n');
    } else if (typeof text !== 'string') {
      processText = String(text);
    }
    
    const parts = processText.split(/(\[FILL IN\])/g);
    return parts.map((part, i) => 
      part === '[FILL IN]' ? <span key={i} className="bg-status-warning-subtle text-status-warning font-bold px-1.5 py-0.5 rounded mx-0.5 border border-status-warning/20 text-xs">[FILL IN]</span> : part
    );
  };

  const getPendingSuggestionCount = () => {
    if (!resume || !resume.pendingRewriteSuggestions) return 0;
    const exp = resume.pendingRewriteSuggestions.experience?.length || 0;
    const proj = resume.pendingRewriteSuggestions.projects?.length || 0;
    const int = resume.pendingRewriteSuggestions.internships?.length || 0;
    return exp + proj + int;
  };

  if (loadingInitial) {
    return (
      <ProtectedPage title="Resume Intelligence">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
      </ProtectedPage>
    );
  }

  if (resumes.length === 0) {
    return (
      <ProtectedPage title="Resume Intelligence">
        <CareerVaultNav activeTab="intelligence" />
        <div className="bg-surface-base border border-surface-border rounded-xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-8">
          <h3 className="text-lg font-bold text-text-primary mb-2">No Resumes Found</h3>
          <p className="text-text-secondary mb-6">You need to create a resume before you can use Resume Intelligence.</p>
          <button onClick={() => navigate('/career/resumes')} className="px-6 py-2 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary-hover">
            Go to Resume Builder
          </button>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage title="Resume Intelligence">
      <CareerVaultNav activeTab="intelligence" />

      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Selectors */}
        <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm flex flex-col gap-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Target Resume</label>
              <select 
                value={selectedResumeId} 
                onChange={e => setSelectedResumeId(e.target.value)} 
                className="w-full border border-surface-border rounded-md p-2 text-sm focus:ring-brand-primary bg-surface-base"
              >
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.title} {r.targetRole ? `(${r.targetRole.replace('_', ' ')})` : ''}</option>
                ))}
              </select>
            </div>
            {jobDescriptions.length > 0 && !showAddJdForm && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Target Job Description</label>
                <select 
                  value={selectedJdId} 
                  onChange={e => setSelectedJdId(e.target.value)} 
                  className="w-full border border-surface-border rounded-md p-2 text-sm focus:ring-brand-primary bg-surface-base"
                >
                  {jobDescriptions.map(jd => (
                    <option key={jd._id} value={jd._id}>{jd.title} {jd.companyName ? `at ${jd.companyName}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Job Description handling if none or if adding */}
          {jobDescriptions.length === 0 && !showAddJdForm ? (
            <div className="bg-brand-primary-subtle border border-brand-primary/20 rounded-lg p-4 text-sm text-brand-primary flex justify-between items-center">
              <p>You don't have any saved Job Descriptions yet. Add one to run the analysis.</p>
              <button onClick={() => setShowAddJdForm(true)} className="px-4 py-2 bg-brand-primary text-white rounded font-bold hover:bg-brand-primary whitespace-nowrap ml-4">Add Job Description</button>
            </div>
          ) : showAddJdForm ? (
            <form onSubmit={handleAddJobDescription} className="bg-surface-raised p-4 rounded-lg border border-surface-border space-y-3 mt-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-text-primary text-sm">Add New Job Description</h4>
                {jobDescriptions.length > 0 && (
                  <button type="button" onClick={() => setShowAddJdForm(false)} className="text-text-tertiary hover:text-text-secondary"><X size={16}/></button>
                )}
              </div>
              <input type="text" placeholder="Job Title *" required value={newJdData.title} onChange={e => setNewJdData({...newJdData, title: e.target.value})} className="w-full border rounded p-2 text-sm" />
              <input type="text" placeholder="Company Name" value={newJdData.companyName} onChange={e => setNewJdData({...newJdData, companyName: e.target.value})} className="w-full border rounded p-2 text-sm" />
              
              <div className="text-sm font-semibold text-text-secondary mt-2">Source (Choose One)</div>
              <textarea placeholder="Paste job description text here..." value={newJdData.text} onChange={e => setNewJdData({...newJdData, text: e.target.value})} className="w-full border rounded p-2 text-sm" rows={4} disabled={!!newJdFile} />
              <div className="text-center text-xs text-text-tertiary font-bold uppercase">OR</div>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setNewJdFile(e.target.files[0])} disabled={!!newJdData.text} className="w-full text-sm border p-2 rounded bg-surface-base" />
              
              <div className="flex justify-end gap-2 mt-2">
                {jobDescriptions.length > 0 && (
                  <button type="button" onClick={() => setShowAddJdForm(false)} className="px-3 py-1.5 text-sm font-bold text-text-secondary hover:text-text-primary">Cancel</button>
                )}
                <button type="submit" disabled={addingJd || (!newJdData.text && !newJdFile) || !newJdData.title} className="px-4 py-1.5 bg-brand-primary text-white text-sm font-bold rounded disabled:opacity-50">
                  {addingJd ? 'Adding...' : 'Save Job Description'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button onClick={() => setShowAddJdForm(true)} className="text-sm font-bold text-brand-primary hover:text-brand-primary flex items-center gap-1">
                <Plus size={16}/> Add another job description
              </button>
            </div>
          )}
        </div>

        {fetchingResume ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-primary" /></div>
        ) : resume && selectedJdId && jobDescriptions.length > 0 ? (
          <div className="flex flex-col gap-6">
            
            {/* 1. Recruiter Analysis Block */}
            <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                <div>
                  <h3 className="font-bold text-text-primary mb-1 flex items-center gap-2">
                    <Briefcase size={18} className="text-brand-primary" />
                    Recruiter Analysis
                  </h3>
                  <p className="text-sm text-text-secondary">Run a brutally honest, role-specific review against the selected job description.</p>
                </div>
                <button 
                  onClick={handleRunRecruiterAnalysis} 
                  disabled={runningRecruiterAnalysis || !selectedJdId}
                  className="px-5 py-2 h-9 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary-hover disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {runningRecruiterAnalysis ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
                  {runningRecruiterAnalysis ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>

              {resume.recruiterAnalysis && (
                <div className="flex flex-col gap-6 mt-4">
                  {/* Match Score & Summary */}
                  <div className="bg-surface-raised p-6 rounded-xl border border-surface-border flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-surface-base shadow-sm">
                        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="44" fill="none" stroke={
                            resume.recruiterAnalysis?.analysis?.matchScore >= 80 ? 'var(--status-success)' :
                            resume.recruiterAnalysis?.analysis?.matchScore >= 60 ? 'var(--status-warning)' : 'var(--status-danger)'
                          } strokeWidth="8" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * resume.recruiterAnalysis?.analysis?.matchScore) / 100} className="transition-all duration-1000 ease-out" />
                        </svg>
                        <span className="text-3xl font-display font-bold text-text-primary">{resume.recruiterAnalysis?.analysis?.matchScore}</span>
                      </div>
                      <span className="text-xs font-bold text-text-tertiary uppercase mt-2 text-center">Match<br/>Score</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-text-primary mb-2">Comparison to Strong Candidate</h4>
                      <p className="text-sm text-text-secondary leading-relaxed">{resume.recruiterAnalysis?.analysis?.comparisonToStrongCandidate}</p>
                    </div>
                  </div>

                  {/* Red Flags */}
                  {Array.isArray(resume.recruiterAnalysis?.analysis?.redFlags) && resume.recruiterAnalysis.analysis.redFlags.length > 0 && (
                    <div className="bg-status-danger-subtle border border-status-danger/20 p-5 rounded-xl">
                      <h4 className="font-bold text-status-danger mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-status-danger" />
                        Red Flags
                      </h4>
                      <ul className="space-y-2">
                        {resume.recruiterAnalysis.analysis.redFlags.map((flag, idx) => {
                          const flagStr = typeof flag === 'string' ? flag : flag.issue || flag.message || flag.flag || JSON.stringify(flag);
                          return (
                            <li key={idx} className="text-sm text-status-danger bg-surface-base/60 px-3 py-2 rounded border border-status-danger/10 shadow-sm">{flagStr}</li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {Array.isArray(resume.recruiterAnalysis?.analysis?.missingKeywords) && resume.recruiterAnalysis.analysis.missingKeywords.length > 0 && (() => {
                    const kws = resume.recruiterAnalysis.analysis.missingKeywords;
                    const critical = [];
                    const company = [];
                    const nice = [];
                    
                    kws.forEach(kw => {
                      const isObj = typeof kw === 'object' && kw !== null;
                      const cat = isObj ? kw.category : '';
                      const pri = isObj ? kw.priority : '';
                      
                      if (cat === 'role_specific_term') company.push(kw);
                      else if (pri === 'nice_to_have') nice.push(kw);
                      else critical.push(kw); // Default everything else to critical
                    });

                    const renderTag = (kw, baseColor, isLarge = false) => {
                      const isObj = typeof kw === 'object' && kw !== null;
                      const keywordStr = isObj ? (kw.term || kw.keyword || JSON.stringify(kw)) : kw;
                      const tooltip = [
                        isObj && kw.category ? `Category: ${kw.category.replace(/_/g, ' ')}` : '',
                        isObj && kw.priority ? `Priority: ${kw.priority.replace(/_/g, ' ')}` : '',
                        isObj && kw.explanation ? `Explanation: ${kw.explanation}` : ''
                      ].filter(Boolean).join(' | ');
                      
                      const sizeClass = isLarge ? 'text-[13px] px-3.5 py-2' : 'text-xs px-3 py-1.5';
                      return (
                        <span key={typeof keywordStr === 'string' ? keywordStr : Math.random()} title={tooltip} className={`${sizeClass} border rounded-md font-bold capitalize ${baseColor}`}>
                          {keywordStr}
                        </span>
                      );
                    };

                    return (
                      <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm flex flex-col gap-6">
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">Missing Required Keywords</h4>
                          <p className="text-sm text-text-secondary">Based on a deterministic extraction from the job description, categorized by AI.</p>
                        </div>
                        
                        {critical.length > 0 && (
                          <div>
                            <h5 className="text-sm font-bold text-status-danger mb-2 border-b border-status-danger/20 pb-1 inline-block">Critical Skills to Add</h5>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {critical.map(kw => renderTag(kw, "bg-status-danger-subtle text-status-danger border-status-danger/20", true))}
                            </div>
                          </div>
                        )}
                        
                        {company.length > 0 && (
                          <div>
                            <h5 className="text-sm font-bold text-status-warning mb-1 border-b border-status-warning/20 pb-1 inline-block">Company-Specific Terms</h5>
                            <p className="text-xs text-text-tertiary mb-2 max-w-3xl">These terms appear in this specific job posting and may be internal company language — consider mentioning them if you have any related experience, but don't worry if they seem unusual.</p>
                            <div className="flex flex-wrap gap-2">
                              {company.map(kw => renderTag(kw, "bg-status-warning-subtle text-status-warning border-status-warning/20"))}
                            </div>
                          </div>
                        )}
                        
                        {nice.length > 0 && (
                          <div>
                            <h5 className="text-sm font-bold text-status-info mb-2 border-b border-status-info/20 pb-1 inline-block">Nice to Have</h5>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {nice.map(kw => renderTag(kw, "bg-status-info-subtle text-status-info border-status-info/20"))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm">
                      <h4 className="font-bold text-status-success mb-4 border-b border-surface-border pb-2">Strong Sections</h4>
                      {Array.isArray(resume.recruiterAnalysis?.analysis?.strongSections) && resume.recruiterAnalysis.analysis.strongSections.length > 0 ? (
                        <div className="space-y-3">
                          {resume.recruiterAnalysis?.analysis?.strongSections.map((sec, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="block font-bold text-text-primary capitalize mb-0.5">{sec.section}</span>
                              <span className="text-text-secondary leading-snug">{sec.reason}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-text-tertiary italic">No particularly strong sections identified.</p>}
                    </div>
                    
                    <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm">
                      <h4 className="font-bold text-status-warning mb-4 border-b border-surface-border pb-2">Weak Sections</h4>
                      {Array.isArray(resume.recruiterAnalysis?.analysis?.weakSections) && resume.recruiterAnalysis.analysis.weakSections.length > 0 ? (
                        <div className="space-y-3">
                          {resume.recruiterAnalysis?.analysis?.weakSections.map((sec, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="block font-bold text-text-primary capitalize mb-0.5">{sec.section}</span>
                              <span className="text-text-secondary leading-snug">{sec.reason}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-text-tertiary italic">No weak sections identified.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Rewrite Suggestions Block */}
            {resume.recruiterAnalysis && (
              <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm">
                <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-text-primary flex items-center gap-2">
                      <Sparkles size={18} className="text-brand-primary" />
                      AI Rewrite Suggestions
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">Get targeted rewrites to incorporate missing keywords and impact metrics.</p>
                  </div>
                  <button
                    onClick={handleGenerateRewriteSuggestions}
                    disabled={generatingSuggestions}
                    className="px-4 py-2 bg-brand-primary-subtle text-brand-primary font-bold rounded-lg text-sm hover:bg-surface-sunken disabled:opacity-50 flex items-center gap-2 border border-brand-primary-subtle whitespace-nowrap"
                  >
                    {generatingSuggestions ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {generatingSuggestions ? 'Generating...' : 'Get Suggestions'}
                  </button>
                </div>

                {resume.pendingRewriteSuggestions && (
                  <div className="mt-6 border-t border-surface-border pt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary bg-surface-raised px-3 py-1 rounded-full">
                        {getPendingSuggestionCount()} pending suggestions
                      </span>
                    </div>

                    {['experience', 'projects', 'internships'].map(sectionKey => {
                      const suggestions = Array.isArray(resume.pendingRewriteSuggestions[sectionKey]) ? resume.pendingRewriteSuggestions[sectionKey] : [];
                      if (suggestions.length === 0) return null;
                      
                      return (
                        <div key={sectionKey} className="mb-8 last:mb-0">
                          <h5 className="font-bold text-text-primary mb-3 capitalize text-lg border-b border-surface-border pb-1">{sectionKey}</h5>
                          <div className="space-y-4">
                            {suggestions.map((suggestion) => (
                              <div key={suggestion.entryIndex} className="border border-surface-border rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-surface-raised px-4 py-2 border-b border-surface-border flex justify-between items-center">
                                  <span className="text-xs font-bold text-text-tertiary uppercase">Entry #{suggestion.entryIndex + 1}</span>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleApplyRewrite(sectionKey, suggestion.entryIndex, 'reject')}
                                      disabled={applyingSuggestion}
                                      className="px-3 py-1.5 bg-surface-base border border-surface-border text-text-secondary rounded-md text-xs font-bold hover:bg-surface-raised flex items-center gap-1 disabled:opacity-50"
                                    >
                                      <X size={14} /> Reject
                                    </button>
                                    <button 
                                      onClick={() => handleApplyRewrite(sectionKey, suggestion.entryIndex, 'accept')}
                                      disabled={applyingSuggestion}
                                      className="px-3 py-1.5 bg-status-success text-white rounded-md text-xs font-bold hover:opacity-90 flex items-center gap-1 disabled:opacity-50"
                                    >
                                      <Check size={14} /> Accept
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface-border">
                                  <div className="p-4 flex-1 bg-surface-base">
                                    <span className="block text-xs font-bold text-text-tertiary uppercase mb-2">Original</span>
                                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{suggestion.original}</p>
                                  </div>
                                  <div className="p-4 flex-1 bg-brand-primary-subtle/50">
                                    <span className="block text-xs font-bold text-brand-primary uppercase mb-2">Suggested</span>
                                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{renderRewrittenText(suggestion.rewritten)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {getPendingSuggestionCount() === 0 && (
                      <div className="text-center p-6 bg-surface-raised rounded-lg text-sm text-text-tertiary italic border border-surface-border">
                        All caught up! No pending rewrite suggestions.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. ATS & Hiring Manager Simulation Block */}
            {resume.recruiterAnalysis && (
              <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm">
                <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-text-primary flex items-center gap-2">
                      <MonitorPlay size={18} className="text-brand-primary" />
                      ATS & Hiring Manager Simulation
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">Run a final format check and simulate a 7-second recruiter skim.</p>
                  </div>
                  <button
                    onClick={handleRunSimulation}
                    disabled={runningSimulation || !selectedJdId}
                    className="px-4 py-2 bg-brand-primary-subtle text-brand-primary font-bold rounded-lg text-sm hover:bg-surface-sunken disabled:opacity-50 flex items-center gap-2 border border-brand-primary-subtle whitespace-nowrap"
                  >
                    {runningSimulation ? <Loader2 size={16} className="animate-spin" /> : <MonitorPlay size={16} />}
                    {runningSimulation ? 'Simulating...' : 'Run Final Simulation'}
                  </button>
                </div>

                {(resume.atsValidation || resume.hiringManagerSimulation) && (
                  <div className="mt-6 border-t border-surface-border pt-6 flex flex-col gap-6">
                    
                    {/* ATS Validation */}
                    {resume.atsValidation && (
                      <div className="bg-surface-raised p-5 rounded-xl border border-surface-border">
                        <h5 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                          ATS Compatibility Check
                          {resume.atsValidation.passes ? (
                            <span className="bg-status-success-subtle text-status-success px-2 py-0.5 rounded text-xs font-bold uppercase">Passed</span>
                          ) : (
                            <span className="bg-status-warning-subtle text-status-warning px-2 py-0.5 rounded text-xs font-bold uppercase">Issues Found</span>
                          )}
                        </h5>
                        
                        {resume.atsValidation.issues?.length > 0 ? (
                          <div className="space-y-2">
                            {resume.atsValidation.issues.map((issue, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm bg-surface-base p-3 rounded-lg border border-surface-border shadow-sm">
                                {issue.severity === 'high' ? <AlertTriangle size={16} className="text-status-warning mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="text-status-info mt-0.5 shrink-0" />}
                                <div>
                                  <span className={`font-bold capitalize ${issue.severity === 'high' ? 'text-status-warning' : 'text-status-info'}`}>{issue.severity} Risk: </span>
                                  <span className="text-text-secondary">{issue.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-text-secondary">No ATS parsing risks detected in raw content. Your chosen layout template is automatically ATS-compliant.</p>
                        )}
                      </div>
                    )}

                    {/* Hiring Manager Simulation */}
                    {resume.hiringManagerSimulation ? (
                      <div className="bg-surface-base p-5 rounded-xl border border-surface-border shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-6 mb-6">
                          <div className={`flex flex-col items-center justify-center shrink-0 w-32 h-32 rounded-full border-4 shadow-sm mx-auto sm:mx-0 ${
                            resume.hiringManagerSimulation?.simulation?.verdict === 'shortlist' ? 'border-status-success/20 bg-status-success-subtle text-status-success' : 
                            resume.hiringManagerSimulation?.simulation?.verdict === 'rejection' ? 'border-status-warning/20 bg-status-warning-subtle text-status-warning' : 
                            'border-status-info/20 bg-status-info-subtle text-status-info'
                          }`}>
                            <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Verdict</span>
                            <span className="text-xl font-black capitalize">
                              {resume.hiringManagerSimulation?.simulation?.verdict}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h5 className="font-bold text-text-primary mb-2">Simulated Feedback</h5>
                            <p className="text-sm text-text-secondary leading-relaxed bg-surface-raised p-4 rounded-lg border border-surface-border">
                              {resume.hiringManagerSimulation?.simulation?.verdictReasoning}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-bold text-text-primary mb-3 border-b border-surface-border pb-2">Attention Grabbers (7s Skim)</h5>
                            <div className="space-y-3">
                              {resume.hiringManagerSimulation?.simulation?.attentionSections?.map((sec, idx) => (
                                <div key={idx} className="text-sm bg-surface-base p-3 rounded-lg border border-surface-border shadow-sm">
                                  <span className="block font-bold text-text-primary capitalize mb-0.5 flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${sec.impact === 'positive' ? 'bg-status-success' : 'bg-status-warning'}`}></div>
                                    {sec.section}
                                  </span>
                                  <span className="text-text-secondary leading-snug">{sec.reason}</span>
                                </div>
                              ))}
                              {!resume.hiringManagerSimulation?.simulation?.attentionSections?.length && (
                                <p className="text-sm text-text-tertiary italic">Nothing strongly stood out.</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-text-primary mb-3 border-b border-surface-border pb-2">Skipped / Ignored</h5>
                            <div className="space-y-3">
                              {resume.hiringManagerSimulation?.simulation?.skippedSections?.map((sec, idx) => (
                                <div key={idx} className="text-sm bg-surface-raised p-3 rounded-lg border border-surface-border">
                                  <span className="block font-bold text-text-secondary capitalize mb-0.5">{sec.section}</span>
                                  <span className="text-text-tertiary leading-snug text-xs">{sec.reason}</span>
                                </div>
                              ))}
                              {!resume.hiringManagerSimulation?.simulation?.skippedSections?.length && (
                                <p className="text-sm text-text-tertiary italic">All major sections reviewed.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : resume.atsValidation ? (
                      <div className="p-4 bg-status-warning-subtle border border-status-warning/20 rounded-xl text-status-warning text-sm">
                        The AI Hiring Manager simulation timed out or failed to return a result, but your ATS validation succeeded above. You can retry the simulation anytime.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ProtectedPage>
  );
}
