import React, { useState, useEffect } from 'react';
import { UploadCloud, Plus, Trash2, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import api from '../../services/api';
import ExamImportModal from './ExamImportModal.jsx';

const ExamScheduleList = ({ semesterId }) => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Basic manual entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExam, setNewExam] = useState({
    subjectId: '',
    examType: 'internal1',
    date: '',
    startTime: '10:00',
    venue: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, subjectsRes] = await Promise.all([
        api.get(`/semesters/${semesterId}/exams`),
        api.get('/subjects')
      ]);
      
      if (examsRes.data.success) {
        setExams(examsRes.data.exams);
      }
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.subjects.filter(s => s.semesterId === semesterId));
      }
    } catch (err) {
      console.error('Failed to fetch exams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter(e => e._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/semesters/${semesterId}/exams`, newExam);
      if (res.data.success) {
        setExams([...exams, res.data.exam].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setShowAddForm(false);
        setNewExam({ ...newExam, subjectId: '', date: '', venue: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add exam');
    }
  };

  const formatExamType = (type) => {
    if (type === 'internal1') return 'Internal 1';
    if (type === 'internal2') return 'Internal 2';
    if (type === 'endSemester') return 'End Semester';
    return type;
  };

  if (loading) return <div className="p-12 text-center text-text-secondary">Loading exams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface-base p-4 rounded-xl shadow-sm border border-surface-border">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Exam Schedule</h2>
          <p className="text-sm text-text-secondary">Exams are pushed to your Calendar and AI Briefing.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-status-danger-subtle text-status-danger rounded-lg text-sm font-medium hover:bg-status-danger-subtle transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Import from PDF
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-status-danger text-white rounded-lg text-sm font-medium hover:bg-status-danger transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddExam} className="bg-surface-base p-4 rounded-xl border border-status-danger/20 shadow-sm flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1 text-sm flex-1 min-w-[200px]">
            <span className="text-text-secondary">Subject <span className="text-status-danger">*</span></span>
            <select required className="border p-2 rounded-md" value={newExam.subjectId} onChange={e => setNewExam({...newExam, subjectId: e.target.value})}>
              <option value="">Select Subject...</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || ''})</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Type <span className="text-status-danger">*</span></span>
            <select className="border p-2 rounded-md" value={newExam.examType} onChange={e => setNewExam({...newExam, examType: e.target.value})}>
              <option value="internal1">Internal 1</option>
              <option value="internal2">Internal 2</option>
              <option value="endSemester">End Semester</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Date <span className="text-status-danger">*</span></span>
            <input type="date" required className="border p-2 rounded-md" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Time <span className="text-status-danger">*</span></span>
            <input type="time" required className="border p-2 rounded-md w-24" value={newExam.startTime} onChange={e => setNewExam({...newExam, startTime: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Venue</span>
            <input type="text" placeholder="e.g. Hall B" className="border p-2 rounded-md w-32" value={newExam.venue} onChange={e => setNewExam({...newExam, venue: e.target.value})} />
          </label>
          <button type="submit" className="rounded-md bg-status-danger px-4 py-2 text-white text-sm font-medium">Save</button>
        </form>
      )}

      {exams.length === 0 ? (
        <div className="bg-surface-base rounded-xl border border-dashed border-surface-border p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <h3 className="text-text-secondary font-semibold mb-1">No Exams Scheduled</h3>
          <p className="text-sm text-text-secondary mb-4">Import your exam schedule PDF or add them manually.</p>
        </div>
      ) : (
        <div className="bg-surface-base rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-raised text-text-secondary border-b border-surface-border text-sm">
              <tr>
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Subject</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Venue</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map(exam => {
                const dateObj = new Date(exam.date);
                const isEndSem = exam.examType === 'endSemester';
                
                return (
                  <tr key={exam._id} className={`hover:bg-surface-raised transition-colors ${isEndSem ? 'bg-status-danger-subtle/30' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isEndSem ? 'bg-status-danger-subtle text-rose-600' : 'bg-surface-sunken text-text-secondary'}`}>
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-semibold ${isEndSem ? 'text-status-danger' : 'text-text-primary'}`}>
                            {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {exam.startTime}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">{exam.subjectId?.name || 'Unknown Subject'}</div>
                      {exam.subjectId?.code && <div className="text-xs text-text-secondary">{exam.subjectId.code}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isEndSem ? 'bg-status-danger-subtle text-rose-800 border border-rose-200' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {formatExamType(exam.examType)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {exam.venue ? (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-text-tertiary" /> {exam.venue}</span>
                      ) : (
                        <span className="text-text-tertiary italic">TBA</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(exam._id)}
                        className="p-2 text-text-tertiary hover:text-status-danger hover:bg-status-danger-subtle rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showImportModal && (
        <ExamImportModal 
          semesterId={semesterId} 
          subjects={subjects}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default ExamScheduleList;
