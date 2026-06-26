import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, X, Check, FileText, ArrowRight, PlusCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';

const ExamImportModal = ({ semesterId, subjects, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [localSubjects, setLocalSubjects] = useState(subjects);

  const handleCreateSubject = async (exam) => {
    try {
      setLoading(true);
      const res = await api.post('/subjects', {
        name: exam.subjectName || 'New Subject',
        code: exam.courseCode || '',
        credits: 3,
        semesterId: semesterId
      });
      if (res.data.success) {
        const newSub = res.data.subject;
        setLocalSubjects(prev => [...prev, newSub]);
        
        setPreviewData(prev => prev.map(e => {
          if (!e.subjectId && e.subjectName === exam.subjectName) {
            return { ...e, subjectId: newSub._id };
          }
          return e;
        }));
      }
    } catch (err) {
      setError('Failed to create subject: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/exams/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const mappedExams = res.data.exams.map(exam => {
          const sName = exam.subjectName?.toLowerCase() || '';
          const sCode = exam.courseCode?.toLowerCase() || '';
          
          let matchedSubject = localSubjects.find(s => 
            (s.code && s.code.toLowerCase() === sCode) || 
            (s.name && s.name.toLowerCase().includes(sName)) ||
            (sName && sName.includes(s.name?.toLowerCase()))
          );

          let type = exam.examType;
          if (!['internal1', 'internal2', 'endSemester'].includes(type)) {
            type = 'internal1';
          }

          return {
            ...exam,
            examType: type,
            _id: Math.random().toString(36).substr(2, 9),
            subjectId: matchedSubject ? matchedSubject._id : ''
          };
        });

        setPreviewData(mappedExams);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to process PDF. Ensure it contains readable text.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const unmapped = previewData.filter(e => !e.subjectId);
      if (unmapped.length > 0) {
        if (!window.confirm(`There are ${unmapped.length} exams not mapped to any subjects. They will be ignored. Continue?`)) {
          return;
        }
      }

      const finalExams = previewData.filter(e => e.subjectId).map(e => ({
        subjectId: e.subjectId,
        examType: e.examType,
        date: e.date,
        startTime: e.startTime,
        venue: e.venue
      }));

      setLoading(true);
      await api.post(`/semesters/${semesterId}/exams/bulk`, { exams: finalExams });
      onSuccess();
    } catch (err) {
      setError('Failed to save exams');
      setLoading(false);
    }
  };

  const updatePreviewExam = (id, field, value) => {
    setPreviewData(previewData.map(e => e._id === id ? { ...e, [field]: value } : e));
  };

  const removePreviewExam = (id) => {
    setPreviewData(previewData.filter(e => e._id !== id));
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all">
      <div className={`bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/[0.06] dark:border-white/10 w-full ${previewData ? 'max-w-[1000px]' : 'max-w-md'} overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between p-5 md:px-6 md:py-5 border-b border-black/[0.06] dark:border-white/10 shrink-0">
          <h2 className="text-[17px] font-bold text-[#111111] dark:text-[#ECECEC] tracking-tight">
            {previewData ? 'Review & Map Exams' : 'Import Exam PDF'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#666666] hover:bg-black/[0.04] dark:text-[#A3A3A3] dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 md:p-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13.5px] rounded-xl flex items-start gap-3">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}
          
          {!previewData ? (
            <form onSubmit={handleUpload} className="space-y-6">
              <p className="text-[14.5px] leading-relaxed text-[#666666] dark:text-[#A3A3A3]">
                Upload your college exam schedule PDF. Synapse AI will extract the dates, times, and venues automatically and add them to your calendar.
              </p>
              
              <div className="relative border border-dashed border-black/15 dark:border-white/15 bg-[#FAFAFA] dark:bg-[#111111]/50 hover:bg-[#F3F4F6] dark:hover:bg-white/5 rounded-2xl p-10 text-center transition-all group">
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={e => setFile(e.target.files[0])}
                  required
                />
                <div className="pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-white dark:bg-[#2A2A2A] rounded-xl shadow-sm border border-black/[0.04] dark:border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-[#111111] dark:text-[#ECECEC]" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#111111] dark:text-[#ECECEC] mb-1">
                    {file ? file.name : 'Click or drag PDF here'}
                  </h3>
                  <p className="text-[13px] text-[#666666] dark:text-[#A3A3A3]">
                    {file ? 'Ready to extract' : 'Supports standard PDF schedules'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-black/[0.04] dark:border-white/5 mt-6">
                <button 
                  type="submit" 
                  disabled={loading || !file} 
                  className="px-5 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[14px] font-semibold rounded-xl shadow-sm hover:bg-black/80 dark:hover:bg-white/90 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {loading ? 'Analyzing PDF...' : 'Extract Exams'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[14px] text-[#666666] dark:text-[#A3A3A3]">
                  Synapse AI extracted these exams. Map them to your subjects to proceed.
                </p>
                <span className="text-[12px] font-medium px-2 py-1 bg-black/[0.04] dark:bg-white/10 text-[#111111] dark:text-white rounded-lg">
                  {previewData.length} Exams Found
                </span>
              </div>

              <div className="border border-black/[0.08] dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#1A1A1A]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead className="bg-[#FAFAFA] dark:bg-white/5 border-b border-black/[0.06] dark:border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-[#888888] dark:text-[#777] uppercase tracking-[0.05em] text-[11px]">Date & Time</th>
                        <th className="px-4 py-3 font-semibold text-[#888888] dark:text-[#777] uppercase tracking-[0.05em] text-[11px]">Extracted Class</th>
                        <th className="px-4 py-3 font-semibold text-[#888888] dark:text-[#777] uppercase tracking-[0.05em] text-[11px]">Match Subject</th>
                        <th className="px-4 py-3 font-semibold text-[#888888] dark:text-[#777] uppercase tracking-[0.05em] text-[11px]">Type & Venue</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/5">
                      {previewData.map(exam => (
                        <tr key={exam._id} className={`group ${!exam.subjectId ? 'bg-amber-50/50 dark:bg-amber-500/5' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.02]'} transition-colors`}>
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <input 
                              type="date" 
                              value={exam.date || ''} 
                              onChange={e => updatePreviewExam(exam._id, 'date', e.target.value)} 
                              className="w-[140px] text-[13px] font-medium bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-2 py-1.5 mb-1.5 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors dark:text-[#ECECEC] block" 
                            />
                            <div className="flex items-center gap-1.5 text-[12px] text-[#666666] dark:text-[#A3A3A3]">
                              <input 
                                type="time" 
                                value={exam.startTime || ''} 
                                onChange={e => updatePreviewExam(exam._id, 'startTime', e.target.value)} 
                                className="w-[140px] bg-transparent border border-black/10 dark:border-white/10 rounded-md px-1.5 py-1 focus:outline-none dark:text-[#ECECEC]" 
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="font-semibold text-[#111111] dark:text-[#ECECEC]">{exam.subjectName || 'Unknown Exam'}</div>
                            {exam.courseCode && <div className="text-[12px] text-[#666666] dark:text-[#A3A3A3] font-mono mt-0.5">{exam.courseCode}</div>}
                          </td>
                          <td className="px-4 py-3 align-top min-w-[200px]">
                            <select 
                              className={`w-full text-[13.5px] bg-transparent border ${!exam.subjectId ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10' : 'border-black/10 dark:border-white/10'} rounded-lg px-3 py-2 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors dark:text-[#ECECEC]`}
                              value={exam.subjectId}
                              onChange={e => updatePreviewExam(exam._id, 'subjectId', e.target.value)}
                            >
                              <option value="" className="dark:bg-[#1A1A1A]">-- Select Subject Match --</option>
                              {localSubjects.map(s => <option key={s._id} value={s._id} className="dark:bg-[#1A1A1A]">{s.name} {s.code ? `(${s.code})` : ''}</option>)}
                            </select>
                            {!exam.subjectId && (
                              <button 
                                onClick={() => handleCreateSubject(exam)}
                                disabled={loading}
                                className="mt-2 w-full text-[12px] font-medium py-1.5 px-2 bg-black/[0.04] dark:bg-white/10 hover:bg-black/[0.08] dark:hover:bg-white/20 text-[#111111] dark:text-white rounded-md transition-colors flex items-center justify-center gap-1.5"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Create New Subject
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-[13px] space-y-2 min-w-[150px]">
                            <select 
                              className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors dark:text-[#ECECEC]"
                              value={exam.examType}
                              onChange={e => updatePreviewExam(exam._id, 'examType', e.target.value)}
                            >
                              <option value="internal1" className="dark:bg-[#1A1A1A]">Internal 1</option>
                              <option value="internal2" className="dark:bg-[#1A1A1A]">Internal 2</option>
                              <option value="endSemester" className="dark:bg-[#1A1A1A]">End Semester</option>
                            </select>
                            <input 
                              placeholder="Venue (Optional)" 
                              value={exam.venue || ''} 
                              onChange={e => updatePreviewExam(exam._id, 'venue', e.target.value)} 
                              className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors dark:text-[#ECECEC]" 
                            />
                          </td>
                          <td className="px-4 py-3 align-top text-right pt-4">
                            <button onClick={() => removePreviewExam(exam._id)} className="p-1.5 text-[#888888] dark:text-[#777] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {previewData.length === 0 && (
                <div className="text-center py-12 text-[#666666] dark:text-[#A3A3A3] text-[14px]">
                  No valid exams found or all have been removed.
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-black/[0.06] dark:border-white/10 mt-6">
                <button 
                  onClick={() => setPreviewData(null)} 
                  className="px-5 py-2.5 text-[#666666] dark:text-[#A3A3A3] text-[14px] font-semibold hover:bg-black/[0.04] dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={loading || previewData.length === 0} 
                  className="px-5 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[14px] font-semibold rounded-xl shadow-sm hover:bg-black/80 dark:hover:bg-white/90 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {loading ? 'Saving to Calendar...' : 'Confirm & Save Exams'}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExamImportModal;
