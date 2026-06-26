import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';
import { useVault } from './CareerVaultLayout.jsx';
import { Award, Briefcase, FolderGit2, FlaskConical, Trophy, GraduationCap, ChevronRight, Loader2 } from 'lucide-react';
import CareerVaultNav from './CareerVaultNav.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';

const getCategoryIcon = (cat, type) => {
  if (type === 'academic') return <GraduationCap className="w-5 h-5 text-brand-primary" />;
  switch (cat) {
    case 'certification': return <Award className="w-5 h-5 text-status-info" />;
    case 'internship': return <Briefcase className="w-5 h-5 text-brand-primary" />;
    case 'project': return <FolderGit2 className="w-5 h-5 text-status-success" />;
    case 'research': return <FlaskConical className="w-5 h-5 text-ai-accent" />;
    case 'achievement': return <Trophy className="w-5 h-5 text-status-warning" />;
    default: return <Award className="w-5 h-5 text-text-tertiary" />;
  }
};

export default function CareerTimeline() {
  const navigate = useNavigate();
  const { setIsLocked } = useVault();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (yearFilter) params.year = yearFilter;
      const res = await api.get('/career-vault/timeline', { params });
      setTimeline(res.data.timeline || []);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'VAULT_LOCKED') {
        setIsLocked(true);
      } else {
        console.error('Error fetching timeline', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [categoryFilter, yearFilter]);

  return (
    <ProtectedPage title="Career Timeline" description="A chronological view of your academic and professional milestones.">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <CareerVaultNav activeTab="timeline" />
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 sm:w-40 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="academic">Academic</option>
            <option value="certification">Certifications</option>
            <option value="internship">Internships</option>
            <option value="project">Projects</option>
            <option value="research">Research</option>
            <option value="achievement">Achievements</option>
          </select>
          <select 
            value={yearFilter} 
            onChange={e => setYearFilter(e.target.value)}
            className="flex-1 sm:w-32 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
          >
            <option value="">All Years</option>
            {[...Array(10)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : timeline.length === 0 ? (
        <Card className="p-12 text-center max-w-2xl mx-auto border-dashed border-2 bg-surface-raised">
          <h3 className="text-lg font-bold text-text-primary mb-1">No milestones found</h3>
          <p className="text-text-secondary mb-4">You don't have any timeline events yet.</p>
          <Link to="/career" className="text-brand-primary font-bold hover:text-brand-primary-hover">Upload to your Vault</Link>
        </Card>
      ) : (
        <div className="relative border-l-2 border-surface-border ml-4 md:ml-6 space-y-8 pb-8 mt-8">
          {timeline.map((item, idx) => (
            <div key={`${item.sourceId}-${idx}`} className="relative pl-6 md:pl-8 group">
              <div className="absolute -left-[13px] top-1.5 w-6 h-6 rounded-full bg-brand-primary border-4 border-surface-base flex items-center justify-center z-10" />
              
              <Card 
                onClick={() => {
                  if (item.type === 'career') navigate(`/career/${item.sourceId}`);
                }}
                className={`p-5 transition-all ${item.type === 'career' ? 'cursor-pointer hover:border-brand-primary-subtle hover:shadow-md' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className="p-2 bg-surface-raised rounded-lg">
                      {getCategoryIcon(item.category, item.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-display font-bold text-text-primary">{item.title}</h4>
                      <p className="text-xs font-medium text-text-secondary capitalize">{item.type === 'academic' ? 'Academic Milestone' : item.category}</p>
                    </div>
                  </div>
                  <div className="text-sm text-text-tertiary font-medium bg-surface-raised px-3 py-1 rounded-md self-start sm:self-auto">
                    {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                  </div>
                </div>

                <div className="mt-3 text-sm text-text-secondary">
                  {item.type === 'academic' && (
                    <div className="flex items-center gap-2">
                      <p>Academic Year: <span className="font-display font-medium text-text-primary">{item.details?.academicYear}</span></p>
                      <span>•</span>
                      <p className="flex items-center gap-1.5">
                        Status: 
                        <Badge variant={item.details?.isCompleted ? "success" : "neutral"} className="px-2">
                          {item.details?.isCompleted ? 'Completed' : 'Active'}
                        </Badge>
                      </p>
                    </div>
                  )}
                  {item.type === 'career' && item.details?.issuer && (
                    <p>Issued by: <span className="font-medium text-text-primary">{item.details.issuer}</span></p>
                  )}
                  {item.type === 'career' && item.details?.skillsTags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.details.skillsTags.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-brand-primary-subtle text-brand-primary text-xs font-medium rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {item.type === 'career' && (
                  <div className="mt-4 flex items-center text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">
                    View Details <ChevronRight size={14} className="ml-0.5" />
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </ProtectedPage>
  );
}
