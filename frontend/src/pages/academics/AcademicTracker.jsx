import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, AlertTriangle, UploadCloud, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diff = target - now;
  if (diff < 0) return 'Passed';
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + ' days left';
};

const assessmentTypes = ['Assignment', 'Internal', 'Series', 'Lab', 'Project', 'Final'];
const gradesList = ['O', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'W', 'I', 'R'];

export default function AcademicTracker({ semesterId }) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [cgpaData, setCgpaData] = useState({ cgpa: 0, subjects: [], semesters: [] });
  
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  
  const [newSubject, setNewSubject] = useState({
    name: '', code: '', professor: '', semester: 1, credits: 4
  });
  
  const [semesterFilter, setSemesterFilter] = useState('All');
  
  // Marks forms state: keyed by subjectId
  const [markForms, setMarkForms] = useState({});

  const fetchData = async () => {
    try {
      const [subRes, markRes, attRes, cgpaRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/marks'),
        api.get('/attendance'),
        api.get('/academics/cgpa')
      ]);
      setSubjects(subRes.data.subjects);
      setMarks(markRes.data.marks);
      setAttendance(attRes.data.attendance);
      setCgpaData({ cgpa: cgpaRes.data.cgpa, subjects: cgpaRes.data.subjects, semesters: cgpaRes.data.semesters });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newSubject };
      if (semesterId) payload.semesterId = semesterId;
      await api.post('/subjects', payload);
      setShowAddSubject(false);
      setNewSubject({ name: '', code: '', professor: '', semester: 1, credits: 4 });
      fetchData();
    } catch (err) {
      console.error('Failed to add subject', err);
      alert('Failed to add subject. Please check all fields.');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await api.delete(`/subjects/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMark = async (subjectId) => {
    const form = markForms[subjectId];
    if (!form || !form.assessmentType) {
      alert('Please select an assessment type.');
      return;
    }

    let payload = { subjectId, assessmentType: form.assessmentType };
    
    if (form.assessmentType === 'Final') {
      if (!form.grade) {
        alert('Please select a grade for the final assessment.');
        return;
      }
      payload.grade = form.grade;
    } else {
      if (form.marksObtained === '' || form.marksObtained === undefined || form.totalMarks === '' || form.totalMarks === undefined) {
        alert('Please fill in both marks fields.');
        return;
      }
      payload.marksObtained = Number(form.marksObtained);
      payload.totalMarks = Number(form.totalMarks);
    }

    try {
      await api.post('/marks', payload);
      setMarkForms({ ...markForms, [subjectId]: null });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add mark: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteMark = async (id) => {
    try {
      await api.delete(`/marks/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttendanceChange = async (subjectId, field, value) => {
    try {
      await api.patch(`/attendance/${subjectId}`, { [field]: Number(value) });
      // Update local state temporarily to avoid full reload delay
      setAttendance(prev => prev.map(a => {
        if (a.subjectId && (a.subjectId._id === subjectId || a.subjectId === subjectId)) {
          return { ...a, [field]: Number(value) };
        }
        return a;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading academics data...</div>;

  const filteredSubjects = semesterId 
    ? cgpaData.subjects.filter(s => subjects.find(sub => sub.name === s.name && sub.semesterId === semesterId))
    : cgpaData.subjects;

  const chartData = filteredSubjects.map(s => ({
    name: s.name,
    gradePoints: s.gradePoints,
    percentage: s.marks
  }));

  const getColorByPoints = (points) => {
    if (points >= 8) return 'var(--status-success)'; // green
    if (points >= 6) return 'var(--status-warning)'; // yellow
    return 'var(--status-danger)'; // red
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Chart */}
      {!semesterId && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-brand-primary p-6 text-white shadow-md flex flex-col justify-center items-center">
            <h2 className="text-lg font-medium text-brand-primary-hover">Overall CGPA</h2>
            <div className="mt-2 text-5xl font-bold">{cgpaData.cgpa !== null ? cgpaData.cgpa.toFixed(2) : 'Pending'}</div>
          </div>
          <Card className="md:col-span-2 p-6 shadow-md">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Subject Performance</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorByPoints(entry.gradePoints)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-text-primary">{semesterId ? 'Semester Subjects' : 'Your Subjects'}</h2>
          {!semesterId && (
            <select 
              className="rounded-md border border-surface-border px-3 py-1.5 text-sm font-medium text-text-primary bg-surface-base"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="All">All Semesters</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>
          )}
          {semesterFilter !== 'All' && !semesterId && (() => {
            const semData = cgpaData.semesters?.find(s => s.semester === Number(semesterFilter));
            if (semData) {
              return (
                <div className="rounded-md bg-brand-primary-subtle px-3 py-1.5 text-sm font-medium text-brand-primary border border-brand-primary-subtle">
                  SGPA: {semData.sgpa !== null ? semData.sgpa.toFixed(2) : 'Pending'}
                </div>
              );
            }
            return null;
          })()}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/academics/import')}
            variant="outline"
            className="gap-2 border-brand-primary-subtle text-brand-primary bg-brand-primary-subtle hover:bg-brand-primary-subtle"
          >
            <FileText className="h-4 w-4" /> Import Grade Card
          </Button>
          <Button
            onClick={() => setShowAddSubject(true)}
            variant="primary"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </div>
      </div>

      {showAddSubject && (
        <form onSubmit={handleAddSubject} className="rounded-lg bg-surface-base p-4 border border-brand-primary-subtle shadow-sm flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1 text-sm"><span className="text-text-secondary">Name</span>
            <input required className="border p-2 rounded-md" value={newSubject.name} onChange={e=>setNewSubject({...newSubject, name: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-sm"><span className="text-text-secondary">Code</span>
            <input className="border p-2 rounded-md w-24" value={newSubject.code} onChange={e=>setNewSubject({...newSubject, code: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-sm"><span className="text-text-secondary">Professor</span>
            <input className="border p-2 rounded-md w-32" value={newSubject.professor} onChange={e=>setNewSubject({...newSubject, professor: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-sm"><span className="text-text-secondary">Semester</span>
            <input type="number" min="1" max="10" className="border p-2 rounded-md w-20" value={newSubject.semester} onChange={e=>setNewSubject({...newSubject, semester: Number(e.target.value)})} />
          </label>
          <label className="flex flex-col gap-1 text-sm"><span className="text-text-secondary">Credits</span>
            <input type="number" min="0" max="10" className="border p-2 rounded-md w-20" value={newSubject.credits} onChange={e=>setNewSubject({...newSubject, credits: Number(e.target.value)})} />
          </label>
          <Button type="submit" variant="primary">Save</Button>
          <Button type="button" onClick={() => setShowAddSubject(false)} variant="outline">Cancel</Button>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {subjects
          .filter(s => {
            if (semesterId) return s.semesterId === semesterId;
            return semesterFilter === 'All' || s.semester === Number(semesterFilter);
          })
          .map(subject => {
          const subjectMarks = marks.filter(m => m.subjectId === subject._id);
          const att = attendance.find(a => a.subjectId === subject._id || a.subjectId?._id === subject._id) || { attendedClasses: 0, totalClasses: 0, percentage: 0 };
          const cgpaInfo = cgpaData.subjects.find(s => s.name === subject.name) || { grade: 'N/A', gradePoints: 0 };
          const isWarning = att.totalClasses > 0 && (att.attendedClasses / att.totalClasses * 100) < 75;
          const attPercent = att.totalClasses > 0 ? (att.attendedClasses / att.totalClasses * 100).toFixed(1) : 0;
          const colorClass = cgpaInfo.gradePoints >= 8 ? 'text-status-success bg-status-success-subtle border-status-success-subtle' :
                             cgpaInfo.gradePoints >= 6 ? 'text-status-warning bg-status-warning-subtle border-amber-200' :
                             'text-status-danger bg-status-danger-subtle border-status-danger-subtle';

          return (
            <Card key={subject._id} className="p-0 overflow-hidden shadow-sm">
              {/* Card Header */}
              <div className="p-4 border-b border-surface-border flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{subject.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                    {subject.code && <span className="px-2 py-0.5 rounded bg-surface-raised">{subject.code}</span>}
                    {subject.semester && <span className="px-2 py-0.5 rounded bg-surface-raised">Sem {subject.semester}</span>}
                    {subject.credits !== undefined && <span className="px-2 py-0.5 rounded bg-surface-raised">{subject.credits} Credits</span>}
                    {subject.professor && <span className="px-2 py-0.5 rounded bg-surface-raised">{subject.professor}</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className={`px-3 py-1 rounded-full border text-sm font-bold ${colorClass}`}>
                    Grade: {cgpaInfo.grade}
                  </div>
                  <button onClick={() => handleDeleteSubject(subject._id)} className="text-text-tertiary hover:text-status-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>



              {/* Attendance Panel */}
              <div className="p-4 border-b border-surface-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-text-primary">Attendance</span>
                  <span className="font-medium">{attPercent}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isWarning ? 'bg-status-danger' : 'bg-status-success'}`} 
                      style={{ width: `${Math.min(100, attPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <input 
                      type="number" min="0" className="w-12 border rounded px-1 py-0.5" 
                      value={att.attendedClasses}
                      onChange={(e) => handleAttendanceChange(subject._id, 'attendedClasses', e.target.value)}
                    />
                    <span>/</span>
                    <input 
                      type="number" min="0" className="w-12 border rounded px-1 py-0.5" 
                      value={att.totalClasses}
                      onChange={(e) => handleAttendanceChange(subject._id, 'totalClasses', e.target.value)}
                    />
                  </div>
                </div>
                {isWarning && (
                  <div className="mt-2 text-xs text-status-danger flex items-center gap-1 bg-status-danger-subtle p-1.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> Attendance below 75%
                  </div>
                )}
              </div>

              {/* Marks Panel */}
              <div className="p-4 bg-surface-raised/50">
                <h4 className="text-sm font-medium text-text-primary mb-3">Marks</h4>
                
                {subjectMarks.length > 0 && (
                  <table className="w-full text-xs text-left mb-4">
                    <thead className="text-text-secondary">
                      <tr>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Score</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="text-text-primary divide-y divide-slate-100">
                      {subjectMarks.map(m => (
                        <tr key={m._id}>
                          <td className="py-1.5">{m.assessmentType}</td>
                          <td className="py-1.5 font-medium">{m.grade ? m.grade : `${m.marksObtained} / ${m.totalMarks}`}</td>
                          <td className="py-1.5 text-right">
                            <button onClick={() => handleDeleteMark(m._id)} className="text-text-tertiary hover:text-status-danger">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="flex gap-2 items-center text-xs">
                  <select 
                    className="border rounded px-2 py-1 flex-1 bg-surface-base"
                    value={markForms[subject._id]?.assessmentType || ''}
                    onChange={(e) => setMarkForms({...markForms, [subject._id]: {...markForms[subject._id], assessmentType: e.target.value}})}
                  >
                    <option value="">Type...</option>
                    {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {markForms[subject._id]?.assessmentType === 'Final' ? (
                    <select
                      className="border rounded px-2 py-1 flex-1 bg-surface-base"
                      value={markForms[subject._id]?.grade || ''}
                      onChange={(e) => setMarkForms({...markForms, [subject._id]: {...markForms[subject._id], grade: e.target.value}})}
                    >
                      <option value="">Grade</option>
                      {gradesList.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  ) : (
                    <>
                      <input 
                        type="number" placeholder="Obtained" className="border rounded px-2 py-1 w-20 bg-surface-base"
                        value={markForms[subject._id]?.marksObtained || ''}
                        onChange={(e) => setMarkForms({...markForms, [subject._id]: {...markForms[subject._id], marksObtained: e.target.value}})}
                      />
                      <span>/</span>
                      <input 
                        type="number" placeholder="Total" className="border rounded px-2 py-1 w-16 bg-surface-base"
                        value={markForms[subject._id]?.totalMarks || ''}
                        onChange={(e) => setMarkForms({...markForms, [subject._id]: {...markForms[subject._id], totalMarks: e.target.value}})}
                      />
                    </>
                  )}
                  <Button 
                    onClick={() => handleAddMark(subject._id)}
                    variant="secondary"
                    className="px-3 py-1 h-auto text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
