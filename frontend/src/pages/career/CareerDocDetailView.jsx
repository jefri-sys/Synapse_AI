import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { ArrowLeft, AlertCircle, Save, Trash2, X } from 'lucide-react';
import { useVault } from './CareerVaultLayout.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';

const categoryOptions = [
  { label: 'Certifications', value: 'certification' },
  { label: 'Internships', value: 'internship' },
  { label: 'Projects', value: 'project' },
  { label: 'Research', value: 'research' },
  { label: 'Achievements', value: 'achievement' }
];

export default function CareerDocDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [dateEarned, setDateEarned] = useState('');
  const [category, setCategory] = useState('');
  const [skillsTags, setSkillsTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const fetchDoc = async () => {
    try {
      const res = await api.get(`/career-vault/${id}`);
      const data = res.data.document || res.data;
      setDoc(data);
      setTitle(data.title || '');
      setIssuer(data.issuer || '');
      setDateEarned(data.dateEarned ? new Date(data.dateEarned).toISOString().split('T')[0] : '');
      setCategory(data.category || '');
      setSkillsTags(data.skillsTags || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError('Failed to load document details.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/career-vault/${id}`, {
        title,
        issuer,
        dateEarned: dateEarned || null,
        category,
        skillsTags
      });
      // Optionally show a toast here
      navigate('/career');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError(err.response?.data?.message || 'Failed to save changes.');
        console.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/career-vault/${id}`);
      navigate('/career');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError(err.response?.data?.message || 'Failed to delete document.');
        console.error(err);
        setDeleting(false);
      }
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!skillsTags.includes(tagInput.trim())) {
        setSkillsTags([...skillsTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setSkillsTags(skillsTags.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <ProtectedPage title="Loading Document..." description="">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </ProtectedPage>
    );
  }

  if (!doc) {
    return (
      <ProtectedPage title="Document Not Found" description="">
        <div className="text-center py-20 text-text-tertiary">
          <p>The document you are looking for does not exist or has been deleted.</p>
          <button onClick={() => navigate('/career')} className="mt-4 text-brand-primary font-bold hover:text-brand-primary-hover transition-colors">Return to Career Vault</button>
        </div>
      </ProtectedPage>
    );
  }

  const isPdf = doc.fileType === 'pdf' || doc.fileType === 'application/pdf';

  return (
    <ProtectedPage
      title={title || 'Document Details'}
      description="Review and update extracted information."
    >
      <div className="mb-6 flex justify-between items-center">
        <Button 
          onClick={() => navigate('/career')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vault
        </Button>
        
        <div className="flex gap-3">
          <Button
            onClick={handleDelete}
            disabled={deleting || saving}
            variant="danger"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button
            onClick={handleSave}
            disabled={deleting || saving}
            variant="primary"
            className="flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {(doc.extractionStatus === 'partial' || doc.extractionStatus === 'failed') && (
        <div className="mb-6 bg-status-warning-subtle border border-status-warning/20 text-status-warning px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold mb-1">We couldn't fully read this document</h4>
            <p className="text-sm">Please check the details below and fill in any missing information manually to ensure your portfolio is accurate.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-status-danger-subtle border border-status-danger/20 text-status-danger px-5 py-4 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Preview */}
        <div className="bg-surface-sunken rounded-2xl overflow-hidden border border-surface-border flex flex-col items-center justify-center min-h-[500px] lg:h-[calc(100vh-250px)]">
          {isPdf ? (
            <iframe 
              src={doc.fileUrl} 
              className="w-full h-full min-h-[500px]"
              title="PDF Preview"
            />
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img 
                src={doc.fileUrl} 
                alt="Document Preview" 
                className="max-w-full h-auto max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Right Column: Editable Fields */}
        <Card className="p-6 lg:overflow-y-auto lg:h-[calc(100vh-250px)]">
          <h3 className="text-lg font-bold text-text-primary mb-5">Document Metadata</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Certified Solutions Architect"
                className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary text-text-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Issuer / Organization</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Amazon Web Services"
                className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary text-text-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Date Earned</label>
                <input
                  type="date"
                  value={dateEarned}
                  onChange={(e) => setDateEarned(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary text-text-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary text-text-primary transition-colors"
                >
                  <option value="" disabled>Select category...</option>
                  {categoryOptions.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Skills & Tags</label>
              <div className="w-full bg-surface-base border border-surface-border rounded-xl p-3 focus-within:ring-2 focus-within:ring-brand-primary transition-colors min-h-[100px]">
                <div className="flex flex-wrap gap-2 mb-2">
                  {skillsTags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-primary-subtle text-brand-primary text-xs font-bold rounded-lg border border-brand-primary/20">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-status-danger p-0.5 rounded-full transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Type a skill and press Enter..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary text-text-primary border-none p-1 focus:ring-0"
                />
              </div>
            </div>

          </div>
        </Card>
      </div>
    </ProtectedPage>
  );
}
