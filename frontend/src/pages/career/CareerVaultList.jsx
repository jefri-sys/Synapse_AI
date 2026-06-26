import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { Plus, FileText, AlertCircle, Award, Briefcase, FolderGit2, FlaskConical, Trophy, Folder, Activity, Brain, LayoutGrid, Code, CloudUpload, Loader2 } from 'lucide-react';
import CareerDocUploadModal from './CareerDocUploadModal.jsx';
import CareerVaultNav from './CareerVaultNav.jsx';
import { useVault } from './CareerVaultLayout.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';

const categories = ['All', 'Certifications', 'Internships', 'Projects', 'Research', 'Achievements'];

const categoryMap = {
  'All': 'All',
  'Certifications': 'certification',
  'Internships': 'internship',
  'Projects': 'project',
  'Research': 'research',
  'Achievements': 'achievement'
};

const getCategoryLabel = (val) => {
  const map = {
    'certification': 'Certifications',
    'internship': 'Internships',
    'project': 'Projects',
    'research': 'Research',
    'achievement': 'Achievements'
  };
  return map[val] || val;
};

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'certification': return <Award className="w-5 h-5 text-status-info" />;
    case 'internship': return <Briefcase className="w-5 h-5 text-brand-primary" />;
    case 'project': return <FolderGit2 className="w-5 h-5 text-status-success" />;
    case 'research': return <FlaskConical className="w-5 h-5 text-ai-accent" />;
    case 'achievement': return <Trophy className="w-5 h-5 text-status-warning" />;
    default: return <FileText className="w-5 h-5 text-text-tertiary" />;
  }
};

export default function CareerVaultList() {
  const [activeTab, setActiveTab] = useState('All');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();
  const { setIsLocked } = useVault();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = activeTab === 'All' ? {} : { category: categoryMap[activeTab] };
      const res = await api.get('/career-vault', { params });
      setDocuments(res.data.documents || res.data || []);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Error fetching documents', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <ProtectedPage
      title={
        <div className="flex items-center justify-between gap-4 -mt-1 -mb-1 w-full flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary-subtle flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold text-text-primary leading-tight">Career Vault</span>
              <span className="text-sm font-normal text-text-secondary leading-normal mt-0.5">Manage your professional documents, certifications, and portfolio items.</span>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 whitespace-nowrap mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <CareerVaultNav activeTab="vault" />
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
          {categories.map(cat => {
            const getFilterIcon = (c) => {
              switch (c) {
                case 'Certifications': return <Award className="w-4 h-4" />;
                case 'Internships': return <Briefcase className="w-4 h-4" />;
                case 'Projects': return <Code className="w-4 h-4" />;
                case 'Research': return <FlaskConical className="w-4 h-4" />;
                case 'Achievements': return <Trophy className="w-4 h-4" />;
                default: return <LayoutGrid className="w-4 h-4" />;
              }
            };
            const count = cat === 'All' ? documents.length : documents.filter(d => getCategoryLabel(d.category) === cat).length;
            return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === cat ? 'bg-brand-primary-subtle text-brand-primary' : 'text-text-secondary bg-transparent hover:bg-surface-sunken'}`}
            >
              {getFilterIcon(cat)}
              {cat}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === cat ? 'bg-brand-primary text-white' : 'bg-surface-border text-text-tertiary'}`}>{count}</span>
            </button>
          )})}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center max-w-2xl mx-auto border-dashed border-2 bg-surface-raised">
          <CloudUpload className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-1">No documents found</h3>
          <p className="text-text-secondary mb-2">You haven't uploaded any {activeTab !== 'All' ? activeTab.toLowerCase() : 'documents'} yet.</p>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">Uploaded documents are automatically parsed by AI to extract details, saving you time when building your resume.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-brand-primary font-bold hover:text-brand-primary-hover underline underline-offset-2"
          >
            Upload your first document
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <Card 
              key={doc._id} 
              onClick={() => navigate(`/career/${doc._id}`)}
              className="p-5 hover:border-brand-primary-subtle hover:shadow-md cursor-pointer transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-surface-raised rounded-lg group-hover:bg-brand-primary-subtle transition-colors">
                  {getCategoryIcon(doc.category)}
                </div>
                {(doc.extractionStatus === 'partial' || doc.extractionStatus === 'failed') && (
                  <Badge variant="warning" className="flex items-center gap-1" title={`Extraction ${doc.extractionStatus}`}>
                    <AlertCircle className="w-3 h-3" />
                    Review needed
                  </Badge>
                )}
              </div>
              <h4 className="text-base font-display font-semibold text-text-primary mb-1 line-clamp-2">{doc.title || 'Untitled Document'}</h4>
              <p className="text-sm text-text-secondary mb-4 flex-1 line-clamp-1">{doc.issuer || 'Unknown Issuer'}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-border">
                <Badge variant="neutral">
                  {getCategoryLabel(doc.category)}
                </Badge>
                <span className="text-xs text-text-secondary">
                  {doc.dateEarned ? new Date(doc.dateEarned).toLocaleDateString() : 'No date'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CareerDocUploadModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(msg) => {
            setIsModalOpen(false);
            if (msg) showToast(msg);
            fetchDocuments();
          }}
          onError={(err) => {
            if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
              setIsLocked(true);
              setIsModalOpen(false);
            }
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-text-primary text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
          <div className="w-2 h-2 bg-status-success rounded-full"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </ProtectedPage>
  );
}
