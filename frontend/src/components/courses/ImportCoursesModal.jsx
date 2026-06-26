import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, AlertTriangle, CheckCircle, X, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function ImportCoursesModal({ isOpen, onClose, onImportSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setLoadingAI(false);
    setImporting(false);
    setError(null);
    setSuccessToast(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Course Name": "Advanced Algorithms",
        "Course Code": "CS501",
        "Professor": "Dr. Alan Turing",
        "Semester": "1",
        "Credits": "4",
        "Schedule": "Mon 10:00-11:30",
        "Room": "Room 301"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "course_import_template.csv");
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setSuccessToast(null);

    const name = selectedFile.name.toLowerCase();
    if (name.endsWith('.pdf')) {
      processPDF(selectedFile);
    } else if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      processExcel(selectedFile);
    } else {
      setError("Unsupported file format. Please upload .xlsx, .xls, .csv, or .pdf");
    }
  };

  const processExcel = (fileObj) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length < 2) {
          setError("File appears to be empty or missing data rows.");
          return;
        }

        const headers = json[0].map(h => String(h || '').toLowerCase().trim());
        
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h.includes('course'));
        const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('id'));
        const profIdx = headers.findIndex(h => h.includes('prof') || h.includes('instructor') || h.includes('teacher') || h.includes('faculty'));
        const semIdx = headers.findIndex(h => h === 'sem' || h.includes('semester'));
        const creditIdx = headers.findIndex(h => h.includes('credit'));
        const schedIdx = headers.findIndex(h => h.includes('sched') || h.includes('time'));
        const roomIdx = headers.findIndex(h => h.includes('room') || h.includes('venue') || h.includes('location'));

        const parsedCourses = json.slice(1).filter(row => row.some(cell => cell)).map((row, idx) => ({
          _id: `temp-${idx}`,
          name: nameIdx >= 0 ? (row[nameIdx] || '') : '',
          code: codeIdx >= 0 ? (row[codeIdx] || '') : '',
          professor: profIdx >= 0 ? (row[profIdx] || '') : '',
          semester: semIdx >= 0 && row[semIdx] ? Number(row[semIdx]) : 1,
          credits: creditIdx >= 0 && row[creditIdx] ? Number(row[creditIdx]) : 3,
          schedule: schedIdx >= 0 ? (row[schedIdx] || '') : '',
          room: roomIdx >= 0 ? (row[roomIdx] || '') : '',
          selected: true
        }));

        setPreviewData(parsedCourses);
      } catch (err) {
        console.error(err);
        setError("Error parsing the Excel/CSV file.");
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  const processPDF = (fileObj) => {
    setLoadingAI(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const documentBlock = {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64
          }
        };
        
        const res = await api.post('/ai/extract-courses', { document: documentBlock });
        const courses = res.data?.courses || [];
        
        if (courses.length === 0) {
          setError("AI could not find any courses in this PDF.");
        }
        
        const parsedCourses = courses.map((c, idx) => ({
          ...c,
          _id: `temp-ai-${idx}`,
          selected: true
        }));
        
        setPreviewData(parsedCourses);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to parse PDF using AI.");
      } finally {
        setLoadingAI(false);
      }
    };
    reader.readAsDataURL(fileObj);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleCellEdit = (index, field, value) => {
    const updated = [...previewData];
    if (field === 'semester' || field === 'credits') {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value;
    }
    setPreviewData(updated);
  };

  const handleToggleSelect = (index) => {
    const updated = [...previewData];
    updated[index].selected = !updated[index].selected;
    setPreviewData(updated);
  };

  const handleImport = async () => {
    const validSelected = previewData.filter(r => r.selected && r.name && r.code);
    if (validSelected.length === 0) {
      setError("No valid courses selected for import.");
      return;
    }
    
    setImporting(true);
    setError(null);
    try {
      await api.post('/courses/bulk', { courses: validSelected });
      setSuccessToast(`${validSelected.length} courses imported successfully!`);
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess(validSelected);
        handleClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to import courses. Please check your data.");
    } finally {
      setImporting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validCount = previewData.filter(r => r.name && r.code).length;
  const invalidCount = previewData.length - validCount;
  const selectedCount = previewData.filter(r => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-surface-sunken h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Import Courses</h2>
            <p className="text-text-tertiary text-sm mt-1">Bulk add your academic schedule from Excel, CSV, or PDF.</p>
          </div>
          <button onClick={handleClose} className="p-2 text-text-tertiary hover:text-white rounded-full hover:bg-surface-sunken transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Top Actions & Dropzone */}
          {!previewData.length && !loadingAI && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary transition-colors"
                >
                  <Download size={16} /> Download CSV Template
                </button>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  dragActive 
                    ? 'border-brand-primary bg-brand-primary/10' 
                    : 'border-surface-border bg-surface-sunken/30 hover:bg-surface-sunken/70'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className={`p-4 rounded-full ${dragActive ? 'bg-brand-primary/20 text-brand-primary' : 'bg-surface-sunken text-text-tertiary'}`}>
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-text-secondary">
                      Drag & drop your file here
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
                      Supports .xlsx, .xls, .csv, and .pdf timetables
                    </p>
                  </div>
                  <button className="px-4 py-2 mt-2 bg-surface-sunken hover:bg-surface-raised text-white rounded-lg text-sm font-medium transition-colors border border-surface-border">
                    Browse Files
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading AI State */}
          {loadingAI && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <h3 className="text-xl font-medium text-white">AI is reading your timetable...</h3>
              <p className="text-text-tertiary text-sm max-w-md text-center">
                We're extracting course names, codes, and schedules from your document. This might take a few seconds.
              </p>
            </div>
          )}

          {/* File Selected Indicator */}
          {file && !loadingAI && (
            <div className="flex items-center justify-between p-4 bg-surface-sunken/50 border border-surface-border rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-brand-primary/20 text-brand-primary rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-text-tertiary text-xs">{formatSize(file.size)}</p>
                </div>
              </div>
              <button 
                onClick={resetState}
                className="text-text-tertiary hover:text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-surface-raised transition-colors"
              >
                Upload Different File
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-status-danger/10 border border-status-danger/30 rounded-xl flex items-start gap-3 text-status-danger">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Toast (Inline) */}
          {successToast && (
            <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl flex items-start gap-3 text-status-success">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{successToast}</p>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && !loadingAI && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Preview & Edit</h3>
                <div className="text-sm text-text-tertiary">
                  <span className="text-white font-medium">{previewData.length}</span> courses found &bull; {' '}
                  <span className="text-status-success">{validCount} valid</span> &bull; {' '}
                  <span className={invalidCount > 0 ? "text-status-danger font-medium" : ""}>{invalidCount} need attention</span>
                </div>
              </div>

              <div className="border border-surface-border rounded-xl overflow-hidden bg-surface-sunken/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-sunken/80 text-text-tertiary">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-surface-border bg-surface-raised text-brand-primary focus:ring-brand-primary/50"
                            checked={selectedCount === previewData.length && previewData.length > 0}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setPreviewData(previewData.map(r => ({ ...r, selected: isChecked })));
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">Code*</th>
                        <th className="px-4 py-3 font-medium">Course Name*</th>
                        <th className="px-4 py-3 font-medium">Professor</th>
                        <th className="px-4 py-3 font-medium w-20">Sem</th>
                        <th className="px-4 py-3 font-medium w-20">Credits</th>
                        <th className="px-4 py-3 font-medium">Schedule</th>
                        <th className="px-4 py-3 font-medium">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {previewData.map((row, idx) => {
                        const isValid = row.name && row.code;
                        return (
                          <tr 
                            key={row._id} 
                            className={`group transition-colors ${!isValid ? 'bg-red-900/10' : 'hover:bg-surface-sunken/40'}`}
                          >
                            <td className={`px-4 py-3 text-center ${!isValid ? 'border-l-2 border-red-500' : 'border-l-2 border-transparent'}`}>
                              <input 
                                type="checkbox"
                                className="rounded border-surface-border bg-surface-raised text-brand-primary focus:ring-brand-primary/50"
                                checked={row.selected}
                                onChange={() => handleToggleSelect(idx)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {!row.code && <AlertTriangle size={14} className="text-status-danger shrink-0" />}
                                <input 
                                  className={`bg-transparent w-full focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none transition-colors border ${!row.code ? 'border-red-500/50 text-red-300 placeholder-red-400/50' : 'border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken'}`}
                                  value={row.code || ''}
                                  placeholder="Code req"
                                  onChange={(e) => handleCellEdit(idx, 'code', e.target.value)}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {!row.name && <AlertTriangle size={14} className="text-status-danger shrink-0" />}
                                <input 
                                  className={`bg-transparent w-full min-w-[200px] focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none transition-colors border ${!row.name ? 'border-red-500/50 text-red-300 placeholder-red-400/50' : 'border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken'}`}
                                  value={row.name || ''}
                                  placeholder="Name required"
                                  onChange={(e) => handleCellEdit(idx, 'name', e.target.value)}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                className="bg-transparent w-full min-w-[120px] focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none border border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken transition-colors"
                                value={row.professor || ''}
                                placeholder="Professor"
                                onChange={(e) => handleCellEdit(idx, 'professor', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number"
                                className="bg-transparent w-16 focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none border border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken transition-colors"
                                value={row.semester || ''}
                                onChange={(e) => handleCellEdit(idx, 'semester', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number"
                                className="bg-transparent w-16 focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none border border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken transition-colors"
                                value={row.credits || ''}
                                onChange={(e) => handleCellEdit(idx, 'credits', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                className="bg-transparent w-full min-w-[150px] focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none border border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken transition-colors"
                                value={row.schedule || ''}
                                placeholder="e.g. Mon 10:00"
                                onChange={(e) => handleCellEdit(idx, 'schedule', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                className="bg-transparent w-full min-w-[100px] focus:ring-1 focus:ring-brand-primary rounded px-2 py-1 outline-none border border-transparent text-text-secondary hover:border-surface-border focus:bg-surface-sunken transition-colors"
                                value={row.room || ''}
                                placeholder="Room"
                                onChange={(e) => handleCellEdit(idx, 'room', e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewData.length > 0 && !loadingAI && (
          <div className="border-t border-surface-border p-6 bg-surface-sunken flex justify-between items-center shrink-0">
            <p className="text-sm text-text-tertiary">
              You have selected <strong className="text-white">{selectedCount}</strong> courses to import.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg font-medium text-text-tertiary hover:text-white hover:bg-surface-sunken transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                className="px-5 py-2.5 rounded-lg font-medium bg-brand-primary text-white hover:bg-brand-primary focus:ring-4 focus:ring-brand-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <><Loader2 size={18} className="animate-spin" /> Importing...</>
                ) : (
                  <>Import Selected</>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
