import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { BookText, Plus, UploadCloud, X, File, FileType2, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

export default function NotebookList() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nbRes, subRes] = await Promise.all([
        api.get('/notebooks'),
        api.get('/subjects')
      ]);
      setNotebooks(nbRes.data.notebooks || []);
      setSubjects(subRes.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    if (subjectId) formData.append('subjectId', subjectId);

    try {
      await api.post('/notebooks/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setShowModal(false);
      setTitle('');
      setFile(null);
      setSubjectId('');
      fetchData();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notebook?')) return;
    try {
      await api.delete(`/notebooks/${id}`);
      setNotebooks(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notebook', err);
    }
  };

  return (
    <ProtectedPage
      title="AI Notebooks"
      description="Upload your study materials to interact with them via AI."
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-stretch gap-4">
        <div className="w-full sm:max-w-xs bg-surface-raised p-3 rounded-xl border border-surface-border shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-ai-accent" /> AI Usage</span>
            <span className="text-xs font-medium text-text-secondary">
              {((user?.aiTokensUsed || 0) / 1000).toFixed(1)}k / {((user?.aiTokenLimit || 500000) / 1000).toFixed(0)}k tokens
            </span>
          </div>
          <div className="w-full bg-surface-sunken rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) > 0.8 ? 'bg-status-danger' : 'bg-brand-primary'}`} 
              style={{ width: `${Math.min(100, ((user?.aiTokensUsed || 0) / (user?.aiTokenLimit || 500000)) * 100)}%` }}
            ></div>
          </div>
        </div>

        <Button onClick={() => setShowModal(true)} className="h-auto py-3 px-6 shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          Create Notebook
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-24 bg-surface-raised rounded-2xl border border-surface-border shadow-sm">
          <BookText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-1">No Notebooks Found</h3>
          <p className="text-text-secondary mb-6">Upload your first document to start chatting with your notes.</p>
          <Button variant="ghost" onClick={() => setShowModal(true)} className="text-brand-primary font-medium">
            Upload Document &rarr;
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map(nb => (
            <Card 
              key={nb._id} 
              onClick={() => navigate(`/notebook/${nb._id}`)}
              className="group hover:border-brand-primary hover:shadow-md transition-all cursor-pointer relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${nb.fileType === 'pdf' ? 'bg-status-danger-subtle text-status-danger' : 'bg-brand-primary-subtle text-brand-primary'}`}>
                  {nb.fileType === 'pdf' ? <FileType2 className="w-6 h-6" /> : <File className="w-6 h-6" />}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, nb._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-text-tertiary hover:text-status-danger hover:bg-status-danger-subtle rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display font-bold text-text-primary text-lg line-clamp-1 mb-1">{nb.title}</h3>
              <div className="mb-4">
                <Badge status="info">
                  {subjects.find(s => s._id === nb.subjectId)?.name || 'General Notes'}
                </Badge>
              </div>
              <div className="pt-4 border-t border-surface-border flex justify-between items-center text-xs text-text-secondary font-medium mt-auto">
                <span>{new Date(nb.uploadedAt).toLocaleDateString()}</span>
                <span>{nb.pageCount || 1} Pages</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-raised rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Upload Notebook</h2>
              <button onClick={() => !uploading && setShowModal(false)} className="text-text-tertiary hover:text-text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Notebook Title</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Physics Chapter 3 Notes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Subject (Optional)</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="flex w-full rounded-sm border border-surface-border bg-surface-base px-3 py-3 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <option value="">General (No Subject)</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Document (PDF or DOCX)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-surface-border border-dashed rounded-xl hover:bg-surface-sunken transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-1 text-center">
                      <UploadCloud className={`mx-auto h-10 w-10 ${file ? 'text-brand-primary' : 'text-text-tertiary group-hover:text-brand-primary'} transition-colors`} />
                      <div className="text-sm text-text-secondary font-medium">
                        {file ? <span className="text-brand-primary">{file.name}</span> : <span>Click to upload or drag and drop</span>}
                      </div>
                      <p className="text-xs text-text-tertiary">PDF or DOCX up to 10MB</p>
                    </div>
                  </div>
                </div>
                
                {uploading && (
                  <div className="w-full bg-surface-sunken rounded-full h-2.5 mt-4 overflow-hidden">
                    <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
                  ) : (
                    'Upload & Process'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
