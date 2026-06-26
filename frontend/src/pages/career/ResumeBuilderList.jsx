import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { useVault } from './CareerVaultLayout.jsx';
import { Plus, FileText, Trash2, Edit3, Loader2 } from 'lucide-react';
import CareerVaultNav from './CareerVaultNav.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';

const roleMap = {
  'software_development': 'Software Development',
  'data_analytics': 'Data Analytics',
  'research': 'Research',
  'higher_studies': 'Higher Studies',
  'internships': 'Internships',
  'general_placement': 'General Placement'
};

export default function ResumeBuilderList() {
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState('software_development');
  const [error, setError] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/career-vault/resumes');
      setResumes(res.data.resumes || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Error fetching resumes', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return setError('Title is required');
    setError('');
    setCreating(true);
    try {
      const res = await api.post('/career-vault/resumes', { title: newTitle, targetRole: newRole });
      setIsModalOpen(false);
      navigate(`/career/resumes/${res.data.resume._id}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError(err.response?.data?.message || 'Failed to create resume');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return setError('Please select a file to upload');
    setError('');
    setUploading(true);
    
    try {
      const formData = new FormData();
      // Rename the file if a custom title is provided so the backend uses it as originalname
      const fileToUpload = uploadTitle.trim() 
        ? new File([uploadFile], uploadTitle.trim(), { type: uploadFile.type })
        : uploadFile;
        
      formData.append('document', fileToUpload);
      
      const res = await api.post('/career-vault/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsUploadModalOpen(false);
      navigate(`/career/resumes/${res.data.resume._id}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        setError(err.response?.data?.message || 'Failed to upload resume');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/career-vault/resumes/${id}`);
      setResumes(resumes.filter(r => r._id !== id));
    } catch (err) {
      console.error('Error deleting resume', err);
    }
  };

  return (
    <ProtectedPage title="Resume Builder" description="Generate and edit role-specific resumes.">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <CareerVaultNav activeTab="resumes" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => { setError(''); setIsUploadModalOpen(true); }}
            variant="outline"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Upload Existing
          </Button>
          <Button
            onClick={() => { setError(''); setIsModalOpen(true); }}
            variant="primary"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create New
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin w-8 h-8 text-brand-primary" />
        </div>
      ) : resumes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-surface-raised">
          <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">No resumes yet</h3>
          <p className="text-text-secondary mb-4">Create your first AI-tailored resume using your Vault data.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-brand-primary font-bold hover:text-brand-primary-hover underline underline-offset-2"
          >
            Create Resume
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map(resume => (
            <Card key={resume._id} className="p-5 hover:border-brand-primary-subtle hover:shadow-md transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-brand-primary-subtle rounded-lg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <button onClick={() => handleDelete(resume._id)} className="text-text-tertiary hover:text-status-danger p-1 rounded-md hover:bg-status-danger-subtle transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-lg font-display font-bold text-text-primary mb-1 line-clamp-1">{resume.title}</h4>
              <p className="text-sm font-medium text-text-secondary mb-4">
                {resume.origin === 'uploaded' ? 'Uploaded Resume' : (roleMap[resume.targetRole] || resume.targetRole || 'General')}
              </p>
              
              <div className="mt-auto pt-4 border-t border-surface-border flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  Generated: {resume.lastGeneratedAt ? new Date(resume.lastGeneratedAt).toLocaleDateString() : 'Draft'}
                </span>
                <Link to={`/career/resumes/${resume._id}`} className="text-sm font-semibold text-brand-primary flex items-center gap-1 hover:text-brand-primary-hover">
                  <Edit3 className="w-4 h-4" /> Edit
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-display font-bold text-text-primary mb-2">Create New Resume</h3>
            <p className="text-sm text-text-secondary mb-6">AI will extract and organize your Vault data based on the chosen role.</p>
            
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Resume Title</label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. SWE Summer Internship"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Target Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-surface-base border border-surface-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {Object.entries(roleMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {error && <p className="text-status-danger text-sm mb-4">{error}</p>}
              
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={creating} variant="primary" type="submit" className="flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? 'Generating...' : 'Create & Generate'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-display font-bold text-text-primary mb-2">Upload Existing Resume</h3>
            <p className="text-sm text-text-secondary mb-6">Upload a PDF, Word document, or image to parse your resume content.</p>
            
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Resume Title (Optional)</label>
                <Input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Defaults to filename"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Select File</label>
                <input
                  type="file"
                  onChange={e => {
                    setUploadFile(e.target.files[0]);
                    if (!uploadTitle && e.target.files[0]) {
                      setUploadTitle(e.target.files[0].name);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary-subtle file:text-brand-primary hover:file:bg-brand-primary/10"
                  required
                />
              </div>
              
              {error && <p className="text-status-danger text-sm mb-4">{error}</p>}
              
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button disabled={uploading || !uploadFile} variant="primary" type="submit" className="flex items-center gap-2">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? 'Parsing resume...' : 'Upload & Parse'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </ProtectedPage>
  );
}
