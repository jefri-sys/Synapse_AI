import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, X, FileText, UploadCloud, AlertCircle, Trash2, Plus, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function ImportGradeCard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugText, setDebugText] = useState('');
  
  const [previewData, setPreviewData] = useState(null);
  const [previewSubjects, setPreviewSubjects] = useState([]);
  
  const [importStats, setImportStats] = useState({ created: 0 });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setDebugText('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropRejected: () => {
      setError('Invalid file. Please upload a PDF file under 10MB.');
    }
  });

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/subjects/import-grade-card', formData);
      
      setPreviewData(res.data.preview);
      setPreviewSubjects(res.data.preview.subjects);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract subjects. Please try again.');
      if (err.response?.data?.debug_text) {
        setDebugText(err.response.data.debug_text);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...previewSubjects];
    updated[index] = { ...updated[index], [field]: field === 'credits' ? Number(value) : value };
    setPreviewSubjects(updated);
  };

  const handleRemoveSubject = (index) => {
    const updated = [...previewSubjects];
    updated.splice(index, 1);
    setPreviewSubjects(updated);
  };

  const handleAddRow = () => {
    setPreviewSubjects([...previewSubjects, { code: '', name: '', credits: 3, grade: 'B' }]);
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const res = await api.post('/subjects/confirm-import', {
        subjects: previewSubjects,
        semester: selectedSemester
      });
      setImportStats({ created: res.data.created });
      setStep(3);
    } catch (err) {
      alert('Failed to import subjects: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setPreviewSubjects([]);
    setError('');
    setStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button 
        onClick={() => step === 1 ? navigate('/academics') : step === 2 ? setStep(1) : navigate('/academics')}
        className="flex items-center text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {step === 3 ? 'Back to Academics' : 'Back'}
      </button>

      {step === 1 && (
        <Card className="p-8 text-center space-y-6 border-surface-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Import from Grade Card</h1>
            <p className="text-text-secondary mt-2">Select the semester and upload your grade card PDF.</p>
          </div>

          <div className="max-w-xs mx-auto text-left space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Target Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full border-surface-border rounded-lg shadow-sm focus:border-brand-primary focus:ring-brand-primary bg-surface-base px-4 py-2.5 border outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
            </select>
          </div>

          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${isDragActive ? 'border-brand-primary bg-brand-primary-subtle' : 'border-surface-border hover:border-brand-primary bg-surface-raised'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="w-10 h-10 text-brand-primary" />
              {isDragActive ? (
                <p className="text-brand-primary font-medium">Drop the PDF here...</p>
              ) : (
                <>
                  <p className="text-text-primary font-medium">Drag & drop your PDF here, or click to select</p>
                  <p className="text-text-tertiary text-sm">Supports PDF files up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-status-danger bg-status-danger-subtle p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {debugText && (
            <div className="mt-4 text-left border border-surface-border rounded-md p-4 bg-surface-raised">
              <p className="text-xs font-bold text-text-secondary mb-2 uppercase">Raw Text Extracted from PDF:</p>
              <pre className="text-xs text-text-primary whitespace-pre-wrap max-h-64 overflow-y-auto font-mono bg-surface-base p-2 border border-surface-border rounded">
                {debugText}
              </pre>
              <p className="text-xs text-brand-primary mt-2">Please copy the text above and share it with the AI so it can fix the parsing logic!</p>
            </div>
          )}

          {file && (
            <div className="flex items-center justify-between bg-brand-primary-subtle border border-brand-primary-subtle p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-primary" />
                <span className="text-text-primary font-medium">{file.name}</span>
                <CheckCircle className="w-4 h-4 text-status-success" />
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-brand-primary hover:text-brand-primary text-sm font-medium">
                Remove
              </button>
            </div>
          )}

          <div className="pt-4">
            <Button 
              disabled={!file || loading}
              onClick={handleExtract}
              variant="primary"
              className="w-full md:w-auto px-8 py-3"
            >
              {loading ? 'Reading your grade card...' : 'Extract Subjects'}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && previewData && (
        <div className="space-y-6">
          <div className="bg-status-success-subtle border border-status-success-subtle p-4 rounded-xl flex items-center gap-4 text-status-success">
            <CheckCircle className="w-6 h-6 text-status-success" />
            <div>
              <h2 className="font-semibold text-lg">Found {previewData.count} subjects</h2>
              <p className="text-status-success text-sm mt-0.5">Importing into Semester {selectedSemester} &middot; SGPA {previewData.sgpa || 'Unknown'}</p>
            </div>
          </div>

          <div className="bg-surface-base rounded-xl shadow-sm border border-surface-border overflow-hidden">
            <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-raised/50">
              <h3 className="font-medium text-text-primary">Review & Edit Subjects</h3>
              <Button onClick={handleAddRow} variant="ghost" className="text-brand-primary hover:text-text-primary gap-1">
                <Plus className="w-4 h-4" /> Add Row
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-surface-raised">
                  <tr>
                    <th className="px-4 py-3 w-32">Course Code</th>
                    <th className="px-4 py-3">Subject Name</th>
                    <th className="px-4 py-3 w-24">Credits</th>
                    <th className="px-4 py-3 w-24">Grade</th>
                    <th className="px-4 py-3 w-16 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewSubjects.map((s, i) => (
                    <tr key={i} className="hover:bg-surface-raised/50">
                      <td className="px-4 py-2">
                        <input value={s.code} onChange={(e) => handleSubjectChange(i, 'code', e.target.value)} className="w-full border-surface-border rounded px-2 py-1.5 focus:ring-brand-primary focus:border-brand-primary outline-none border" placeholder="Code" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={s.name} onChange={(e) => handleSubjectChange(i, 'name', e.target.value)} className="w-full border-surface-border rounded px-2 py-1.5 focus:ring-brand-primary focus:border-brand-primary outline-none border" placeholder="Subject Name" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={s.credits} onChange={(e) => handleSubjectChange(i, 'credits', e.target.value)} className="w-full border-surface-border rounded px-2 py-1.5 focus:ring-brand-primary focus:border-brand-primary outline-none border" min="0" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={s.grade} onChange={(e) => handleSubjectChange(i, 'grade', e.target.value)} className="w-full border-surface-border rounded px-2 py-1.5 focus:ring-brand-primary focus:border-brand-primary outline-none border bg-surface-base">
                          {['O', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F', 'FE', 'W', 'I', 'R'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleRemoveSubject(i)} className="text-text-tertiary hover:text-status-danger p-1 rounded-md hover:bg-status-danger-subtle transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {previewSubjects.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-text-secondary">No subjects found. Click "Add Row" to enter manually.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-surface-border text-xs text-text-secondary bg-surface-raised/50">
              Note: Exam dates are not included in grade cards. You can add them from the Academics page after import.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              onClick={() => setStep(1)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              disabled={previewSubjects.length === 0 || loading}
              onClick={handleConfirmImport}
              variant="primary"
            >
              {loading ? 'Saving subjects...' : `Import ${previewSubjects.length} Subjects`}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="p-12 text-center space-y-6 max-w-lg mx-auto mt-10 shadow-sm border-surface-border">
          <div className="w-20 h-20 bg-status-success-subtle rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-status-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{importStats.created} subjects imported successfully!</h2>
            <p className="text-text-secondary mt-2">
              Marks have been recorded based on your grades. Your CGPA will update automatically.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-6">
            <Button 
              onClick={() => navigate('/academics')}
              variant="primary"
              className="w-full py-3"
            >
              Go to Academics
            </Button>
            <Button 
              onClick={resetAll}
              variant="secondary"
              className="w-full py-3"
            >
              Import Another Semester
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
