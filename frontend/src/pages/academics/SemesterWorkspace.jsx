import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AcademicTracker from './AcademicTracker.jsx';
import Timetable from './Timetable.jsx';
import ExamScheduleList from './ExamScheduleList.jsx';

const SemesterWorkspace = ({ semesterId, onBack }) => {
  const [activeTab, setActiveTab] = useState('subjects');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-surface-border pb-4">
        <button 
          onClick={onBack}
          className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary">Semester Workspace</h2>
      </div>

      <div className="flex space-x-1 rounded-xl bg-surface-raised p-1">
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
            activeTab === 'subjects'
              ? 'bg-white text-indigo-700 shadow'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('subjects')}
        >
          Subjects
        </button>
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
            activeTab === 'timetable'
              ? 'bg-white text-indigo-700 shadow'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('timetable')}
        >
          Timetable
        </button>
        <button
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
            activeTab === 'exams'
              ? 'bg-white text-indigo-700 shadow'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('exams')}
        >
          Exam Schedule
        </button>
      </div>

      {activeTab === 'subjects' && <AcademicTracker semesterId={semesterId} />}
      {activeTab === 'timetable' && <Timetable semesterId={semesterId} />}
      {activeTab === 'exams' && <ExamScheduleList semesterId={semesterId} />}
    </div>
  );
};

export default SemesterWorkspace;
