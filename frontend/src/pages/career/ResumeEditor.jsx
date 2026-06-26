import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { useVault } from './CareerVaultLayout.jsx';
import { ArrowLeft, Save, RefreshCw, EyeOff, Eye, ArrowUp, ArrowDown, Plus, Trash2, Loader2, LayoutTemplate, Download } from 'lucide-react';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';

const TEMPLATES = [
  { id: 'ats_classic', label: 'ATS Classic' },
  { id: 'software_developer', label: 'Software Developer' },
  { id: 'research_higher_studies', label: 'Research & Higher Studies' }
];

const sectionLabels = {
  personalInfo: 'Personal Info',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  internships: 'Internships',
  achievements: 'Achievements',
  research: 'Research',
  experience: 'Experience'
};

export default function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);


  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      const res = await api.get(`/career-vault/resumes/${id}`);
      const fetchedResume = res.data.resume;

      // Defensively apply defaults for missing sectionOrder/hiddenSections
      if (!fetchedResume.sectionOrder || fetchedResume.sectionOrder.length === 0) {
        fetchedResume.sectionOrder = [
          'personalInfo', 'education', 'skills', 'projects', 'internships',
          'experience', 'certifications', 'research', 'achievements'
        ];
      }
      if (!fetchedResume.hiddenSections) {
        fetchedResume.hiddenSections = [];
      }

      setResume(fetchedResume);
      if (fetchedResume.lastAnalysis) {
        setAnalysisResult(fetchedResume.lastAnalysis);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Fetch resume error', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/career-vault/resumes/${id}`, {
        content: resume.content,
        sectionOrder: resume.sectionOrder,
        hiddenSections: resume.hiddenSections,
        title: resume.title
      });
      alert('Resume saved successfully!');
      setPreviewKey(k => k + 1);
    } catch (err) {
      console.error('Save error', err);
      alert('Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('WARNING: Regenerating will overwrite all manual edits in the content fields. Are you sure?')) return;
    setRegenerating(true);
    try {
      const res = await api.post(`/career-vault/resumes/${id}/regenerate`);
      setResume({ ...resume, content: res.data.resume.content });
      alert('Regeneration complete!');
      setPreviewKey(k => k + 1);
    } catch (err) {
      console.error('Regenerate error', err);
      alert('Failed to regenerate resume.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleTemplateChange = async (templateId) => {
    try {
      await api.put(`/career-vault/resumes/${id}/template`, { templateId });
      setResume({ ...resume, templateId });
      setPreviewKey(k => k + 1);
    } catch (err) {
      console.error('Template change error', err);
      alert('Failed to change template.');
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await api.post(`/career-vault/resumes/${id}/export`);
      const pdfUrl = res.data.pdfUrl;

      const a = document.createElement('a');
      a.href = pdfUrl;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.download = `${resume.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      a.click();

      setResume({ ...resume, lastExportedAt: new Date().toISOString(), lastExportedPdfUrl: pdfUrl });
    } catch (err) {
      console.error('Export PDF error', err);
      alert(err.response?.data?.message || 'Failed to export PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/career-vault/resumes/${id}/analyze`, { jobDescription });
      setAnalysisResult(res.data.analysis);
      setResume({ ...resume, lastAnalysis: res.data.analysis });
    } catch (err) {
      console.error('Analyze error', err);
      alert('Failed to run analysis.');
    } finally {
      setAnalyzing(false);
    }
  };


  const moveSection = (index, direction) => {
    const newOrder = [...resume.sectionOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setResume({ ...resume, sectionOrder: newOrder });
  };

  const toggleHidden = (sectionKey) => {
    let newHidden = [...(resume.hiddenSections || [])];
    if (newHidden.includes(sectionKey)) {
      newHidden = newHidden.filter(s => s !== sectionKey);
    } else {
      newHidden.push(sectionKey);
    }
    setResume({ ...resume, hiddenSections: newHidden });
  };

  const updateContent = (sectionKey, newValue) => {
    setResume({
      ...resume,
      content: { ...resume.content, [sectionKey]: newValue }
    });
  };

  if (loading) {
    return (
      <ProtectedPage title="Edit Resume">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
      </ProtectedPage>
    );
  }

  if (!resume) return <ProtectedPage title="Edit Resume"><div>Resume not found.</div></ProtectedPage>;

  // RENDERERS FOR DIFFERENT CONTENT SHAPES
  const renderPersonalInfo = (data) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {['name', 'email', 'phone', 'linkedin', 'github', 'portfolio'].map(field => (
        <div key={field}>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">{field}</label>
          <input
            type="text"
            value={data[field] || ''}
            onChange={e => updateContent('personalInfo', { ...data, [field]: e.target.value })}
            className="w-full border border-surface-border bg-surface-base text-text-primary rounded-lg p-2 text-sm focus:ring-brand-primary focus:border-brand-primary outline-none"
          />
        </div>
      ))}
    </div>
  );

  const renderStringArray = (sectionKey, data) => {
    const arr = Array.isArray(data) ? data : (typeof data === 'string' ? data.split(',').map(s => s.trim()) : []);
    return (
      <div>
        <textarea
          value={arr.join(', ')}
          onChange={e => updateContent(sectionKey, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="Comma separated values"
          rows={3}
          className="w-full border border-surface-border bg-surface-base text-text-primary rounded-lg p-2 text-sm focus:ring-brand-primary focus:border-brand-primary outline-none"
        />
      </div>
    )
  };

  const renderGenericArray = (sectionKey, data, template) => {
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return (
      <div className="space-y-4">
        {arr.map((rawItem, i) => {
          let item = rawItem;
          if (typeof rawItem !== 'object' || rawItem === null) {
            const firstKey = Object.keys(template)[0];
            item = { [firstKey]: String(rawItem || '') };
          }
          return (
            <div key={i} className="relative border border-surface-border rounded-lg p-4 bg-surface-raised">
              <button onClick={() => {
                const newArr = [...arr];
                newArr.splice(i, 1);
                updateContent(sectionKey, newArr);
              }} className="absolute top-2 right-2 text-text-tertiary hover:text-status-danger transition-colors">
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mr-6">
                {Object.keys(template).map(field => (
                  <div key={field} className={field === 'description' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">{field}</label>
                    {field === 'description' ? (
                      <textarea
                        value={item[field] || ''}
                        onChange={e => {
                          const newArr = [...arr];
                          newArr[i] = typeof newArr[i] === 'object' && newArr[i] !== null ? { ...newArr[i], [field]: e.target.value } : { [field]: e.target.value };
                          updateContent(sectionKey, newArr);
                        }}
                        rows={2}
                        className="w-full border border-surface-border bg-surface-base text-text-primary rounded-lg p-2 text-sm focus:ring-brand-primary focus:border-brand-primary outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={Array.isArray(item[field]) ? item[field].join(', ') : (item[field] || '')}
                        onChange={e => {
                          const newArr = [...arr];
                          newArr[i] = typeof newArr[i] === 'object' && newArr[i] !== null ? { ...newArr[i], [field]: Array.isArray(template[field]) ? e.target.value.split(',').map(s => s.trim()) : e.target.value } : { [field]: Array.isArray(template[field]) ? e.target.value.split(',').map(s => s.trim()) : e.target.value };
                          updateContent(sectionKey, newArr);
                        }}
                        className="w-full border border-surface-border bg-surface-base text-text-primary rounded-lg p-2 text-sm focus:ring-brand-primary focus:border-brand-primary outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        <button onClick={() => updateContent(sectionKey, [...arr, { ...template }])} className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:text-brand-primary-hover">
          <Plus size={16} /> Add Entry
        </button>
      </div>
    )
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;
    return (
      <div className="flex flex-col gap-6">
        {/* Structural Issues */}
        <Card className="p-5">
          <h4 className="font-bold text-text-primary mb-4 border-b border-surface-border pb-2">Structural Checks</h4>
          {analysisResult.structureIssues?.issues?.length > 0 ? (
            <div className="space-y-3">
              {analysisResult?.structureIssues?.issues?.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-surface-raised rounded-lg border border-surface-border">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                    issue.severity === 'high' ? 'bg-status-danger-subtle text-status-danger' :
                      issue.severity === 'medium' ? 'bg-status-warning-subtle text-status-warning' :
                        'bg-status-info-subtle text-status-info'
                  }`}>
                    {issue.severity}
                  </span>
                  <div>
                    <span className="block text-xs font-semibold text-text-secondary capitalize">{issue.section}</span>
                    <span className="text-sm text-text-primary block">{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-status-success font-bold bg-status-success-subtle p-3 rounded-lg border border-status-success/20">
              Looking good! No structural issues found.
            </div>
          )}
        </Card>

        {/* Skill Gap Analysis */}
        <Card className="p-5">
          <h4 className="font-bold text-text-primary mb-4 border-b border-surface-border pb-2">Skill Gap & Suggestions</h4>

          {analysisResult.skillGapAnalysisFailed ? (
            <div className="text-sm text-status-warning font-medium bg-status-warning-subtle p-3 rounded-lg border border-status-warning/20">
              {analysisResult.skillGapErrorNote || "Skill-gap analysis unavailable right now — structural checks above are still valid."}
            </div>
          ) : analysisResult.skillGapAnalysis ? (
            <div className="space-y-6">
              {/* Missing Skills */}
              {Array.isArray(analysisResult?.skillGapAnalysis?.missingSkills) && analysisResult.skillGapAnalysis.missingSkills.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-text-secondary mb-2">Missing Skills to Consider:</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult?.skillGapAnalysis?.missingSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-status-danger-subtle text-status-danger border border-status-danger/20 rounded-md text-xs font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyword Suggestions */}
              {Array.isArray(analysisResult?.skillGapAnalysis?.keywordSuggestions) && analysisResult.skillGapAnalysis.keywordSuggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-text-secondary mb-2">ATS Keyword Suggestions:</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult?.skillGapAnalysis?.keywordSuggestions.map((kw, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-brand-primary-subtle text-brand-primary border border-brand-primary/20 rounded-md text-xs font-bold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Sections */}
              {Array.isArray(analysisResult?.skillGapAnalysis?.weakSections) && analysisResult.skillGapAnalysis.weakSections.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-text-secondary mb-2">Weak Sections:</h5>
                  <div className="space-y-2">
                    {analysisResult?.skillGapAnalysis?.weakSections.map((ws, idx) => (
                      <div key={idx} className="text-sm p-3 bg-surface-raised border border-surface-border rounded-lg">
                        <span className="font-semibold capitalize text-text-primary">{ws.section}: </span>
                        <span className="text-text-secondary">{ws.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!analysisResult?.skillGapAnalysis?.missingSkills?.length && !analysisResult?.skillGapAnalysis?.weakSections?.length && !analysisResult?.skillGapAnalysis?.keywordSuggestions?.length) && (
                <div className="text-sm text-text-tertiary">No specific skill gaps identified.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-text-tertiary italic">No skill gap analysis data available.</div>
          )}
        </Card>

        <div className="text-xs text-center text-text-tertiary pb-4">
          Last analyzed: {new Date(analysisResult.analyzedAt).toLocaleString()}
        </div>
      </div>
    );
  }; return (
    <ProtectedPage title="Resume Editor" hideSidebar>
      <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden">

        {/* Left Side: Editor or Info */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 overflow-y-auto pb-20 pr-2">

          {/* Header */}
          <Card className="p-6 flex flex-col gap-4 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <button onClick={() => navigate('/career/resumes')} className="text-sm font-semibold text-text-tertiary flex items-center gap-1 hover:text-text-primary mb-2 transition-colors">
                  <ArrowLeft size={16} /> Back to Resumes
                </button>
                <div className="flex items-center gap-3">
                  <input
                    value={resume.title}
                    onChange={e => setResume({ ...resume, title: e.target.value })}
                    className="text-2xl font-display font-bold text-text-primary border-none p-0 focus:ring-0 bg-transparent w-full outline-none"
                  />
                  {resume.origin === 'uploaded' && (
                    <span className="px-2 py-1 bg-brand-primary-subtle text-brand-primary rounded text-xs font-bold whitespace-nowrap">Uploaded</span>
                  )}
                </div>
                {resume.targetRole && <p className="text-sm text-text-secondary capitalize">{resume.targetRole.replace('_', ' ')}</p>}
              </div>

              <div className="flex items-center gap-3">
                {resume.origin !== 'uploaded' && (
                  <Button onClick={handleRegenerate} disabled={regenerating} variant="outline" className="flex items-center gap-2">
                    <RefreshCw size={16} className={regenerating ? "animate-spin" : ""} /> {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving} variant="primary" className="flex items-center gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Title'}
                </Button>
              </div>
            </div>

            {/* Template Switcher */}
            <div className="pt-4 border-t border-surface-border flex items-center gap-3">
              <LayoutTemplate size={18} className="text-text-tertiary" />
              <span className="text-sm font-bold text-text-secondary">Template:</span>
              <select
                value={resume.templateId || 'ats_classic'}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="text-sm border border-surface-border rounded-md p-1.5 focus:ring-brand-primary focus:border-brand-primary bg-surface-raised text-text-primary outline-none shadow-sm"
              >
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Sections Editor */}
          <div className="space-y-4 shrink-0">
            {resume.sectionOrder.map((sectionKey, index) => {
              const isHidden = (resume.hiddenSections || []).includes(sectionKey);
              const contentData = resume.content?.[sectionKey];

              return (
                <div key={sectionKey} className={`bg-surface-base border rounded-xl shadow-sm transition-all ${isHidden ? 'border-dashed border-surface-border opacity-60' : 'border-surface-border'}`}>
                  {/* Section Header */}
                  <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-raised rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="text-text-tertiary hover:text-brand-primary disabled:opacity-30"><ArrowUp size={16} /></button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === resume.sectionOrder.length - 1} className="text-text-tertiary hover:text-brand-primary disabled:opacity-30"><ArrowDown size={16} /></button>
                      </div>
                      <h3 className="font-bold text-text-primary">{sectionLabels[sectionKey]}</h3>
                      {isHidden && <span className="text-xs bg-surface-border text-text-secondary px-2 py-0.5 rounded font-bold">Hidden</span>}
                    </div>
                    <button onClick={() => toggleHidden(sectionKey)} className="text-sm font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors">
                      {isHidden ? <><Eye size={16} /> Show</> : <><EyeOff size={16} /> Hide</>}
                    </button>
                  </div>

                  {/* Section Body */}
                  <div className={`p-5 ${isHidden ? 'hidden' : 'block'}`}>
                    {sectionKey === 'personalInfo' && renderPersonalInfo(contentData || {})}
                    {sectionKey === 'skills' && renderStringArray('skills', contentData)}
                    {sectionKey === 'education' && renderGenericArray('education', contentData, { institution: '', degree: '', field: '', startDate: '', endDate: '', cgpa: '', relevantCoursework: [] })}
                    {sectionKey === 'projects' && renderGenericArray('projects', contentData, { title: '', description: '', technologies: [], link: '', dateRange: '' })}
                    {sectionKey === 'internships' && renderGenericArray('internships', contentData, { company: '', role: '', startDate: '', endDate: '', description: '' })}
                    {sectionKey === 'experience' && renderGenericArray('experience', contentData, { company: '', role: '', startDate: '', endDate: '', description: '' })}
                    {sectionKey === 'certifications' && renderGenericArray('certifications', contentData, { title: '', issuer: '', date: '' })}
                    {sectionKey === 'achievements' && renderGenericArray('achievements', contentData, { title: '', description: '', date: '' })}
                    {sectionKey === 'research' && renderGenericArray('research', contentData, { title: '', publication: '', date: '', description: '' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Live Preview / Analysis */}
        <div className="w-full lg:w-1/2 h-full flex flex-col">
          <div className="flex-1 bg-surface-base border border-surface-border shadow-sm rounded-xl overflow-hidden flex flex-col">
            <div className="bg-surface-raised border-b border-surface-border p-3 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'preview' ? 'bg-brand-primary-subtle text-brand-primary' : 'text-text-secondary hover:bg-surface-sunken'}`}
                >
                  <Eye size={16} /> Live Preview
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-brand-primary-subtle text-brand-primary' : 'text-text-secondary hover:bg-surface-sunken'}`}
                >
                  <RefreshCw size={16} /> AI Analysis
                </button>
              </div>

              {activeTab === 'preview' && (
                <div className="flex items-center gap-3">
                  {resume.lastExportedAt && (
                    <span className="text-xs text-text-tertiary">
                      Last exported: {new Date(resume.lastExportedAt).toLocaleDateString()}
                    </span>
                  )}
                  <Button
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    variant="primary"
                    className="flex items-center gap-1.5 py-1.5 px-3 h-auto text-xs"
                  >
                    {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {exportingPdf ? 'Generating...' : 'Export PDF'}
                  </Button>
                </div>
              )}
            </div>

            {activeTab === 'preview' ? (
              <iframe
                key={previewKey}
                src={`${api.defaults.baseURL}/career-vault/resumes/${id}/preview`}
                className="w-full flex-1 border-none bg-surface-sunken"
                title="Resume Preview"
              />
            ) : activeTab === 'analysis' ? (
              <div className="flex-1 overflow-y-auto p-6 bg-surface-raised flex flex-col gap-6">
                <Card className="p-5 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">AI Resume Analyzer</h3>
                    <p className="text-sm text-text-secondary">Run a structural check and skill-gap analysis against your target role or a specific job description.</p>
                  </div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste a job description here (optional). If left empty, analysis runs against general role expectations."
                    className="w-full border border-surface-border bg-surface-base text-text-primary rounded-lg p-3 text-sm focus:ring-brand-primary outline-none min-h-[100px]"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    variant="primary"
                    className="self-end flex items-center gap-2"
                  >
                    {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {analyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </Card>

                {renderAnalysisResults()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
