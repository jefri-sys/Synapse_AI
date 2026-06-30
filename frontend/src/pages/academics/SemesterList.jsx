import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, GraduationCap, Clock, Award, TrendingUp, Star, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import AddSemesterModal from './AddSemesterModal.jsx';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const SemesterList = ({ onSelectSemester }) => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cgpaData, setCgpaData] = useState(null);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/semesters');
      if (res.data.success) {
        setSemesters(res.data.semesters);
      }
      
      const cgpaRes = await api.get('/academics/cgpa');
      if (cgpaRes.data.success) {
        setCgpaData(cgpaRes.data);
      }
    } catch (err) {
      console.error('Failed to load semesters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleMarkComplete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Mark this semester as complete? This will archive recurring classes.')) return;
    try {
      await api.patch(`/semesters/${id}/complete`);
      fetchSemesters();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-surface-raised rounded-xl"></div>
      <div className="h-48 bg-surface-raised rounded-xl"></div>
    </div>;
  }

  const renderAnalytics = () => {
    if (!cgpaData) return null;

    // Trend chart data
    const trendData = (cgpaData.semesters || [])
      .filter(s => s.sgpa > 0)
      .map(s => ({
        name: `Sem ${s.semester}`,
        sgpa: parseFloat(s.sgpa.toFixed(2))
      }));

    // Best and Worst subjects
    const validSubjects = (cgpaData.subjects || []).filter(s => s.grade && s.grade !== 'N/A');
    
    // Sort for best (highest grade points)
    const sortedDesc = [...validSubjects].sort((a, b) => b.gradePoints - a.gradePoints);
    const bestSubject = sortedDesc.length > 0 ? sortedDesc[0] : null;
    
    // Sort for worst (lowest grade points, including F/0 points)
    const sortedAsc = [...validSubjects].sort((a, b) => a.gradePoints - b.gradePoints);
    const worstSubject = sortedAsc.length > 0 ? sortedAsc[0] : null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            <h3 className="font-bold text-text-primary">CGPA Trend</h3>
          </div>
          <div className="h-48 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 10]} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="sgpa" stroke="var(--brand-primary)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-text-tertiary">
                Your grade journey starts here
              </div>
            )}
          </div>
        </Card>

        {/* Top/Bottom Performers */}
        <Card className="flex flex-col gap-4 shadow-sm">
          <h3 className="font-bold text-text-primary mb-1">Performance Highlights</h3>
          
          <div className="bg-status-success-subtle border border-status-success-subtle rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-status-success-subtle rounded-lg text-status-success shrink-0">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-status-success uppercase tracking-wider mb-0.5">Best Subject</p>
                {bestSubject ? (
                  <>
                    <p className="text-sm font-semibold text-text-primary leading-tight">{bestSubject.name}</p>
                    <p className="text-xs text-status-success mt-1 font-medium">Grade: {bestSubject.grade} ({bestSubject.gradePoints} pt)</p>
                  </>
                ) : <p className="text-sm text-text-secondary">No data</p>}
              </div>
            </div>
          </div>

          <div className="bg-status-danger-subtle border border-status-danger-subtle rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-status-danger-subtle rounded-lg text-status-danger shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-status-danger uppercase tracking-wider mb-0.5">Needs Attention</p>
                {worstSubject ? (
                  <>
                    <p className="text-sm font-semibold text-text-primary leading-tight">{worstSubject.name}</p>
                    <p className="text-xs text-status-danger mt-1 font-medium">Grade: {worstSubject.grade} ({worstSubject.gradePoints} pt)</p>
                  </>
                ) : <p className="text-sm text-text-secondary">No data</p>}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Academic History Overview */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Academic History</h2>
          <p className="text-white/80 text-sm">Overview across all semesters</p>
        </div>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Overall CGPA</p>
            <p className="text-3xl font-bold">{cgpaData?.cgpa ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Total Credits</p>
            <p className="text-3xl font-bold">{cgpaData?.totalCredits ?? 0}</p>
          </div>
        </div>
      </div>

      {renderAnalytics()}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Your Semesters</h3>
        {semesters.length > 0 && (
          <Button 
            onClick={() => setShowAddModal(true)}
            variant="primary"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Semester
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semesters.map(sem => (
          <div 
            key={sem._id} 
            onClick={() => onSelectSemester(sem._id)}
            className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md relative overflow-hidden group
              ${sem.isActive ? 'border-brand-primary/40 bg-surface-raised shadow-sm ring-1 ring-brand-primary/10' : 'border-surface-border bg-surface-raised shadow-sm'}`}
          >
            {sem.isActive && (
              <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                Current
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${sem.isCompleted ? 'bg-status-success-subtle text-status-success' : 'bg-brand-primary-subtle text-brand-primary'}`}>
                  {sem.isCompleted ? <Award className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-lg">Semester {sem.semesterNumber}</h4>
                  <p className="text-xs text-text-secondary font-medium">{sem.academicYear}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-raised rounded-lg p-2.5 border border-surface-border">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-0.5">Status</p>
                <p className={`text-sm font-semibold ${sem.isCompleted ? 'text-status-success' : 'text-text-primary'}`}>
                  {sem.isCompleted ? 'Completed' : 'In Progress'}
                </p>
              </div>
              <div className="bg-surface-raised rounded-lg p-2.5 border border-surface-border">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-0.5">SGPA</p>
                <p className="text-sm font-semibold text-text-primary">
                  {cgpaData?.semesters?.find(s => s.semester === sem.semesterNumber)?.sgpa ?? '--'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-surface-border">
              <button 
                className="text-sm font-medium text-brand-primary group-hover:text-brand-primary flex items-center gap-1"
              >
                Open Workspace &rarr;
              </button>
              
              {!sem.isCompleted && (
                <button 
                  onClick={(e) => handleMarkComplete(e, sem._id)}
                  className="p-1.5 text-text-tertiary hover:text-status-success hover:bg-status-success-subtle rounded-md transition-colors tooltip-wrapper relative"
                  title="Mark as completed"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {semesters.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-surface-border rounded-xl">
            <GraduationCap className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <h3 className="text-text-primary font-semibold mb-1">Create Your First Semester Card</h3>
            <p className="text-sm text-text-secondary mb-4">Add your first semester to start tracking subjects.</p>
            <Button 
              onClick={() => setShowAddModal(true)}
              variant="primary"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Semester
            </Button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSemesterModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchSemesters();
          }}
        />
      )}
    </div>
  );
};

export default SemesterList;
