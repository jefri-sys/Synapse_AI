import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import AddSubjectSheet from '../AddSubjectSheet.jsx';
import AddSemesterSheet from '../AddSemesterSheet.jsx';
import MobileTimetable from './MobileTimetable.jsx';
import MobileExamSchedule from './MobileExamSchedule.jsx';
import MobileImportGradeCard from './MobileImportGradeCard.jsx';
import { Calendar, Clock, FileText } from 'lucide-react';

export default function MobileAcademics({ 
  activeSemesterId, 
  setActiveSemesterId 
}) {
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [cgpaData, setCgpaData] = useState({ cgpa: 0, subjects: [], semesters: [], totalCredits: 0 });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubjectSheet, setShowAddSubjectSheet] = useState(false);
  const [showAddSemesterSheet, setShowAddSemesterSheet] = useState(false);
  const [activeView, setActiveView] = useState('main');
  const navigate = useNavigate();

  const fetchAcademicsData = useCallback(async () => {
    try {
      setLoading(true);
      const [semRes, cgpaRes, subRes, attRes] = await Promise.all([
        api.get('/semesters'),
        api.get('/academics/cgpa'),
        api.get('/subjects'),
        api.get('/attendance')
      ]);
      setSemesters(semRes.data.semesters || []);
      if (cgpaRes.data && cgpaRes.data.success) {
        setCgpaData(cgpaRes.data);
      }
      setSubjects(subRes.data.subjects || []);
      setAttendance(attRes.data.attendance || []);
    } catch (err) {
      console.error('MobileAcademics fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicsData();
  }, [fetchAcademicsData]);

  const filteredSubjects = activeSemesterId 
    ? cgpaData.subjects.filter(s => subjects.find(sub => sub.name === s.name && sub.semesterId === activeSemesterId))
    : cgpaData.subjects;

  const targetCgpa = 9.0;
  const currentCgpa = cgpaData.cgpa || 0;
  const strokeDasharray = 251.2; 
  const progress = Math.min((currentCgpa / 10) * strokeDasharray, strokeDasharray);

  if (activeView === 'timetable') {
    return <MobileTimetable activeSemesterId={activeSemesterId} onBack={() => { setActiveView('main'); fetchAcademicsData(); }} />;
  }
  if (activeView === 'exams') {
    return <MobileExamSchedule activeSemesterId={activeSemesterId} onBack={() => { setActiveView('main'); fetchAcademicsData(); }} />;
  }
  if (activeView === 'import') {
    return <MobileImportGradeCard onBack={() => { setActiveView('main'); fetchAcademicsData(); }} />;
  }

  return (
    <div className="mobile-shell" style={{
      minHeight: '100dvh',
      background: 'var(--mobile-bg)',
      overflowY: 'auto',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
    }}>
      {/* 1. HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-primary)', margin: 0 }}>Academics</h1>
        <button 
          onClick={() => setShowAddSemesterSheet(true)}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--mobile-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0px 6px 16px rgba(255,122,89,0.35)' }}
        >
          <Plus color="#fff" size={24} />
        </button>
      </div>

      {/* 2. CGPA HERO CARD */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,122,89,0.08) 0%, var(--mobile-surface) 100%)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--mobile-shadow-card)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="cgpa-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--mobile-primary)" />
                  <stop offset="100%" stopColor="var(--mobile-secondary)" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mobile-border)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#cgpa-gradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDasharray - progress} />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mobile-text-primary)', lineHeight: 1 }}>{currentCgpa > 0 ? currentCgpa.toFixed(2) : '—'}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--mobile-text-tertiary)' }}>CGPA</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '13px', color: 'var(--mobile-text-secondary)' }}>Target: {targetCgpa.toFixed(1)}</div>
            {currentCgpa < targetCgpa ? (
              <div style={{ fontSize: '13px', color: 'var(--mobile-success)', fontWeight: 500 }}>You're {(targetCgpa - currentCgpa).toFixed(2)} away!</div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--mobile-success)', fontWeight: 500 }}>Target reached! 🎉</div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--mobile-text-tertiary)' }}>Credits: {cgpaData.totalCredits || 0}</div>
          </div>
        </div>
      </div>

      {/* 3. SEMESTER PILL ROW */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '4px 20px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <style>{`.mobile-shell ::-webkit-scrollbar { display: none; }`}</style>
        <button 
          onClick={() => setActiveSemesterId(null)}
          style={{
            padding: '12px 20px', borderRadius: '999px', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', border: !activeSemesterId ? 'none' : '1.5px solid var(--mobile-border)',
            background: !activeSemesterId ? 'var(--mobile-primary)' : 'var(--mobile-surface)', color: !activeSemesterId ? '#fff' : 'var(--mobile-text-secondary)'
          }}
        >
          All
        </button>
        {semesters.map(sem => {
          const isActive = activeSemesterId === sem._id;
          return (
            <button 
              key={sem._id}
              onClick={() => setActiveSemesterId(sem._id)}
              style={{
                padding: '12px 20px', borderRadius: '999px', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', border: isActive ? 'none' : '1.5px solid var(--mobile-border)',
                background: isActive ? 'var(--mobile-primary)' : 'var(--mobile-surface)', color: isActive ? '#fff' : 'var(--mobile-text-secondary)'
              }}
            >
              Sem {sem.semesterNumber}
            </button>
          );
        })}
      </div>

      {/* QUICK ACTIONS ROW (SEMESTER SPECIFIC) */}
      {activeSemesterId && (
        <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', marginBottom: '8px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <style>{`.mobile-shell ::-webkit-scrollbar { display: none; }`}</style>
          <button onClick={() => setActiveView('timetable')} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--mobile-surface)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--mobile-border)', boxShadow: 'var(--mobile-shadow-card)', color: 'var(--mobile-text-primary)', fontSize: '14px', fontWeight: 600 }}>
            <Clock size={16} color="var(--mobile-secondary)" /> Timetable
          </button>
          <button onClick={() => setActiveView('exams')} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--mobile-surface)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--mobile-border)', boxShadow: 'var(--mobile-shadow-card)', color: 'var(--mobile-text-primary)', fontSize: '14px', fontWeight: 600 }}>
            <Calendar size={16} color="var(--mobile-warning)" /> Exam Schedule
          </button>
          <button onClick={() => setActiveView('import')} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--mobile-surface)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--mobile-border)', boxShadow: 'var(--mobile-shadow-card)', color: 'var(--mobile-text-primary)', fontSize: '14px', fontWeight: 600 }}>
            <FileText size={16} color="var(--mobile-primary)" /> Import Grade Card
          </button>
        </div>
      )}

      {/* 4. LIST (SEMESTERS OR SUBJECTS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px 20px 20px' }}>
        {!activeSemesterId ? (
          <>
            {semesters.map((sem) => {
              const semInfo = cgpaData.semesters?.find(s => s.semester === sem.semesterNumber) || { sgpa: null };
              return (
                <div 
                  key={sem._id}
                  onClick={() => setActiveSemesterId(sem._id)}
                  style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--mobile-shadow-card)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--mobile-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '18px' }}>🎓</span> 
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>Semester {sem.semesterNumber}</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mobile-text-tertiary)' }}>{sem.academicYear || '—'}</div>
                      </div>
                    </div>
                    {sem.isActive && (
                      <div style={{ background: 'var(--mobile-primary)', color: '#fff', borderRadius: '999px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Current
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                     <div style={{ flex: 1, border: '1px solid var(--mobile-border)', borderRadius: '12px', padding: '12px' }}>
                       <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Status</div>
                       <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{sem.isCompleted ? 'Completed' : 'In Progress'}</div>
                     </div>
                     <div style={{ flex: 1, border: '1px solid var(--mobile-border)', borderRadius: '12px', padding: '12px' }}>
                       <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mobile-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>SGPA</div>
                       <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>{semInfo.sgpa !== null ? semInfo.sgpa.toFixed(2) : '—'}</div>
                     </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--mobile-border)' }}>
                     <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mobile-primary)' }}>Open Workspace &rarr;</span>
                     <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--mobile-surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--mobile-text-secondary)' }}>✓</span>
                     </div>
                  </div>
                </div>
              );
            })}
            {semesters.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', fontSize: '14px', marginTop: '20px' }}>No semesters found.</div>
            )}
          </>
        ) : (
          <>
            {filteredSubjects.map((sub, idx) => {
              const rawSub = subjects.find(s => s.name === sub.name);
              const attInfo = rawSub ? attendance.find(a => a.subjectId === rawSub._id || a.subjectId?._id === rawSub._id) : null;
              const attPercent = attInfo?.totalClasses > 0 ? ((attInfo.attendedClasses / attInfo.totalClasses) * 100).toFixed(1) : 0;
              const isWarning = attPercent > 0 && attPercent < 75;

              let gradeColor = { bg: 'var(--mobile-border)', text: 'var(--mobile-text-tertiary)' };
              if (sub.grade === 'A' || sub.grade === 'A+' || sub.grade === 'O' || sub.grade === 'S') {
                gradeColor = { bg: 'var(--mobile-success-subtle)', text: 'var(--mobile-success)' };
              } else if (sub.grade === 'B' || sub.grade === 'B+') {
                gradeColor = { bg: 'var(--mobile-warning-subtle)', text: 'var(--mobile-warning)' };
              } else if (sub.grade && sub.grade !== 'N/A') {
                gradeColor = { bg: 'var(--mobile-danger-subtle)', text: 'var(--mobile-danger)' };
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => rawSub?._id && navigate(`/academics/subjects/${rawSub._id}`)}
                  style={{ background: 'var(--mobile-surface)', borderRadius: '24px', padding: '16px', boxShadow: 'var(--mobile-shadow-card)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>{sub.name}</div>
                    <div style={{ background: gradeColor.bg, color: gradeColor.text, borderRadius: '999px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>
                      {sub.grade || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', fontWeight: 400, color: 'var(--mobile-text-tertiary)', marginTop: '4px' }}>
                    {rawSub?.code || '—'} • {rawSub?.credits || sub.credits || 0} credits
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mobile-text-secondary)' }}>Attendance</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: isWarning ? 'var(--mobile-warning)' : 'var(--mobile-text-secondary)' }}>
                        {isWarning && <AlertTriangle size={12} color="var(--mobile-warning)" />}
                        {attPercent}%
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--mobile-border)', borderRadius: '999px', marginTop: '4px' }}>
                      <div style={{ 
                        height: '100%', borderRadius: '999px', width: `${Math.min(100, attPercent)}%`,
                        background: isWarning ? 'var(--mobile-warning)' : 'linear-gradient(90deg, var(--mobile-primary), var(--mobile-secondary))' 
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredSubjects.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--mobile-text-secondary)', fontSize: '14px', marginTop: '20px' }}>No subjects found.</div>
            )}
          </>
        )}
      </div>

      {showAddSubjectSheet && (
        <AddSubjectSheet 
          onClose={() => setShowAddSubjectSheet(false)}
          onSuccess={() => {
            setShowAddSubjectSheet(false);
            api.get('/subjects').then(res => setSubjects(res.data.subjects || []));
            api.get('/academics/cgpa').then(res => res.data && res.data.success && setCgpaData(res.data));
          }}
          activeSemesterId={activeSemesterId}
        />
      )}

      {showAddSemesterSheet && (
        <AddSemesterSheet 
          onClose={() => setShowAddSemesterSheet(false)}
          onSuccess={() => {
            setShowAddSemesterSheet(false);
            fetchAcademicsData();
          }}
        />
      )}
    </div>
  );
}
