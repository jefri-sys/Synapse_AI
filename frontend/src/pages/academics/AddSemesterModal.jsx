import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import api from '../../services/api';

const AddSemesterModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    semesterNumber: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    isActive: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/semesters', formData);
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create semester');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-base rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h2 className="text-lg font-bold text-text-primary">Add Semester</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-3 bg-status-danger-subtle text-status-danger text-sm rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Semester No. <span className="text-status-danger">*</span></label>
              <input 
                type="number" min="1" max="10"
                className="w-full border border-surface-border rounded-lg p-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none" 
                placeholder="E.g. 3"
                value={formData.semesterNumber}
                onChange={e => setFormData({...formData, semesterNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Academic Year <span className="text-status-danger">*</span></label>
              <input 
                type="text" 
                className="w-full border border-surface-border rounded-lg p-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none" 
                placeholder="E.g. 2025-2026"
                value={formData.academicYear}
                onChange={e => setFormData({...formData, academicYear: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full border border-surface-border rounded-lg p-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full border border-surface-border rounded-lg p-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-surface-border text-brand-primary focus:ring-brand-primary w-4 h-4"
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
              />
              Set as Current Active Semester
            </label>
            <p className="text-xs text-text-secondary mt-1 ml-6">
              Check this only if you are currently studying in this semester.
            </p>
          </div>
          
          <div className="pt-4 border-t border-surface-border flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="ghost">Cancel</Button>
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Saving...' : 'Save Semester'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSemesterModal;
