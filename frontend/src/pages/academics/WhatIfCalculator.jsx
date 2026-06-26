import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

function calculateGradePoints(marksPercent) {
  if (marksPercent >= 90) return 10;
  if (marksPercent >= 80) return 9;
  if (marksPercent >= 70) return 8;
  if (marksPercent >= 60) return 7;
  if (marksPercent >= 50) return 6;
  if (marksPercent >= 40) return 5;
  return 0;
}

function whatIfCGPA(subjects, marks, hypotheticalScores) {
  let totalCreditPoints = 0;
  let totalCredits = 0;

  for (const subject of subjects) {
    const subjMarks = marks.filter(m => m.subjectId === subject._id);
    const hasFinal = subjMarks.some(m => m.assessmentType === 'Final');
    
    let totalObtained = 0;
    let totalMax = 0;

    for (const m of subjMarks) {
      if (m.assessmentType === 'Final' && hypotheticalScores[subject._id] !== undefined) {
        totalObtained += Number(hypotheticalScores[subject._id]);
        totalMax += m.totalMarks;
        continue;
      }
      totalObtained += m.marksObtained;
      totalMax += m.totalMarks;
    }

    if (!hasFinal && hypotheticalScores[subject._id] !== undefined) {
      totalObtained += Number(hypotheticalScores[subject._id]);
      totalMax += 100; // Assume 100 max if no final mark exists
    }

    const marksPercent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const points = calculateGradePoints(marksPercent);

    totalCreditPoints += points * subject.credits;
    totalCredits += subject.credits;
  }

  return totalCredits > 0 ? Number((totalCreditPoints / totalCredits).toFixed(2)) : 0;
}

export default function WhatIfCalculator() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [hypotheticalScores, setHypotheticalScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const [subRes, markRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/marks'),
        ]);
        setSubjects(subRes.data.subjects);
        setMarks(markRes.data.marks);

        // Initialize sliders with existing Final marks or 0
        const initial = {};
        subRes.data.subjects.forEach(sub => {
          const finalMark = markRes.data.marks.find(m => m.subjectId === sub._id && m.assessmentType === 'Final');
          initial[sub._id] = finalMark ? finalMark.marksObtained : 0;
        });
        setHypotheticalScores(initial);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAcademics();
  }, []);

  const predictedCGPA = useMemo(() => {
    return whatIfCGPA(subjects, marks, hypotheticalScores);
  }, [subjects, marks, hypotheticalScores]);

  const targetCGPA = user?.targetCGPA || 8.0;

  const getMarksNeeded = (subjectId) => {
    for (let score = 0; score <= 100; score++) {
      const testScores = { ...hypotheticalScores, [subjectId]: score };
      if (whatIfCGPA(subjects, marks, testScores) >= targetCGPA) {
        return score;
      }
    }
    return null;
  };

  if (loading) return <div className="p-4">Loading predictor...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-surface-raised border border-surface-border p-8 text-white shadow-lg flex flex-col justify-center items-center">
        <h2 className="text-xl font-medium text-brand-primary-subtle">Predicted CGPA</h2>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-6xl font-bold">{predictedCGPA.toFixed(2)}</span>
          <span className="text-xl text-brand-primary-subtle">/ 10.0</span>
        </div>
        <p className="mt-4 text-sm font-medium bg-surface-base/20 px-4 py-1 rounded-full">
          Target CGPA: {targetCGPA.toFixed(1)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {subjects.map(subject => {
          const currentScore = hypotheticalScores[subject._id] || 0;
          const finalMarkEntry = marks.find(m => m.subjectId === subject._id && m.assessmentType === 'Final');
          const maxMarks = finalMarkEntry ? finalMarkEntry.totalMarks : 100;
          const needed = getMarksNeeded(subject._id);

          return (
            <div key={subject._id} className="rounded-lg bg-surface-base p-6 shadow-sm border border-surface-border">
              <h3 className="text-lg font-semibold text-text-primary">{subject.name}</h3>
              
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-text-secondary mb-2">
                    <span>Hypothetical Final Exam Score</span>
                    <span className="text-brand-primary bg-brand-primary-subtle px-2 py-0.5 rounded">{currentScore} / {maxMarks}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max={maxMarks}
                    value={currentScore}
                    onChange={(e) => setHypotheticalScores({ ...hypotheticalScores, [subject._id]: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="pt-4 border-t border-surface-border">
                  {needed !== null ? (
                    <p className="text-sm text-text-secondary">
                      You need <span className="font-bold text-status-success">{needed}</span> marks in this subject's final to reach your target CGPA of {targetCGPA}.
                    </p>
                  ) : (
                    <p className="text-sm text-status-warning font-medium">
                      Cannot reach target CGPA solely by improving this subject.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
