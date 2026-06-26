import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import api from '../../services/api';

const MigrationModal = ({ onComplete }) => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  
  // New semester form state
  const [newSem, setNewSem] = useState({
    semesterNumber: '',
    academicYear: '2025-2026',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters');
      if (res.data.success) {
        setSemesters(res.data.semesters);
        if (res.data.semesters.length > 0) {
          setSelectedSemester(res.data.semesters[0]._id);
        } else {
          setShowNewForm(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSemester = async () => {
    try {
      setSubmitting(true);
      const res = await api.post('/semesters', newSem);
      if (res.data.success) {
        const createdId = res.data.semester._id;
        // Proceed to migrate
        await handleMigrate(createdId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create semester');
      setSubmitting(false);
    }
  };

  const handleMigrate = async (semId) => {
    try {
      setSubmitting(true);
      const targetId = semId || selectedSemester;
      if (!targetId) {
        setError('Please select or create a semester');
        setSubmitting(false);
        return;
      }
      
      const res = await api.post('/subjects/migrate', { semesterId: targetId });
      if (res.data.success) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Migration failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-base rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-status-warning-subtle border-b border-status-warning-subtle p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-status-warning">Action Required: Organize Your Subjects</h2>
            <p className="text-xs text-status-warning mt-1">We noticed you have existing subjects. To use the new Academics features, please assign them to a semester.</p>
          </div>
        </div>
        
        <div className="p-5">
          {error && <div className="mb-4 p-3 bg-status-danger-subtle text-status-danger text-sm rounded-lg border border-status-danger-subtle">{error}</div>}
          
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : showNewForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Semester Number</label>
                <input 
                  type="number" 
                  min="1" max="10"
                  className="w-full border border-surface-border rounded-lg p-2 outline-none focus:border-brand-primary" 
                  value={newSem.semesterNumber}
                  onChange={e => setNewSem({...newSem, semesterNumber: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Academic Year</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2025-2026"
                  className="w-full border border-surface-border rounded-lg p-2 outline-none focus:border-brand-primary" 
                  value={newSem.academicYear}
                  onChange={e => setNewSem({...newSem, academicYear: e.target.value})}
                  required
                />
              </div>
              <div className="pt-2">
                <Button 
                  onClick={handleCreateSemester}
                  disabled={submitting || !newSem.semesterNumber || !newSem.academicYear}
                  variant="primary"
                  className="w-full"
                >
                  {submitting ? 'Migrating...' : 'Create Semester & Migrate'}
                </Button>
              </div>
              {semesters.length > 0 && (
                <Button onClick={() => setShowNewForm(false)} variant="ghost" className="w-full mt-2">
                  Use an existing semester instead
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Select Semester</label>
                <select 
                  className="w-full border border-surface-border rounded-lg p-2 outline-none focus:border-brand-primary"
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                >
                  {semesters.map(s => (
                    <option key={s._id} value={s._id}>Semester {s.semesterNumber} ({s.academicYear})</option>
                  ))}
                </select>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={() => handleMigrate()}
                  disabled={submitting || !selectedSemester}
                  variant="primary"
                  className="w-full"
                >
                  {submitting ? 'Migrating...' : 'Migrate Existing Subjects'}
                </Button>
              </div>
              <Button onClick={() => setShowNewForm(true)} variant="ghost" className="w-full mt-2 text-brand-primary hover:text-brand-primary-hover">
                + Create new semester instead
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationModal;
