import React, { useState, useEffect } from 'react';
import { UploadCloud, Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import api from '../../services/api';
import TimetableImportModal from './TimetableImportModal.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Timetable = ({ semesterId }) => {
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Basic manual entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    subjectId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    teacherName: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, subjectsRes] = await Promise.all([
        api.get(`/semesters/${semesterId}/timetable`),
        api.get('/subjects')
      ]);
      
      if (slotsRes.data.success) {
        setSlots(slotsRes.data.slots);
      }
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.subjects.filter(s => s.semesterId === semesterId));
      }
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class slot?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      setSlots(slots.filter(s => s._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/semesters/${semesterId}/timetable`, newSlot);
      if (res.data.success) {
        setSlots([...slots, res.data.slot]);
        setShowAddForm(false);
        // Reset basic fields
        setNewSlot({ ...newSlot, startTime: '09:00', endTime: '10:00', room: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add slot');
    }
  };

  // Group slots by day
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  if (loading) return <div className="p-12 text-center text-text-secondary">Loading timetable...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface-base p-4 rounded-xl shadow-sm border border-surface-border">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Weekly Class Timetable</h2>
          <p className="text-sm text-text-secondary">Classes automatically repeat in your calendar.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary-subtle text-brand-primary rounded-lg text-sm font-medium hover:bg-brand-primary-subtle transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Import from PDF
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Class
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSlot} className="bg-surface-base p-4 rounded-xl border border-surface-border shadow-sm flex flex-wrap gap-4 items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Day</span>
            <select className="border p-2 rounded-md" value={newSlot.dayOfWeek} onChange={e => setNewSlot({...newSlot, dayOfWeek: e.target.value})}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Time</span>
            <div className="flex items-center gap-1">
              <input type="time" required className="border p-2 rounded-md" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} />
              <span>to</span>
              <input type="time" required className="border p-2 rounded-md" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm flex-1 min-w-[200px]">
            <span className="text-text-secondary">Subject</span>
            <select required className="border p-2 rounded-md" value={newSlot.subjectId} onChange={e => setNewSlot({...newSlot, subjectId: e.target.value})}>
              <option value="">Select Subject...</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code || ''})</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Room/Venue</span>
            <input className="border p-2 rounded-md w-24" value={newSlot.room} onChange={e => setNewSlot({...newSlot, room: e.target.value})} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Teacher</span>
            <input className="border p-2 rounded-md w-32" value={newSlot.teacherName} onChange={e => setNewSlot({...newSlot, teacherName: e.target.value})} />
          </label>
          <button type="submit" className="rounded-md bg-brand-primary px-4 py-2 text-white text-sm font-medium">Save</button>
        </form>
      )}

      {/* Timetable Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {DAYS.map(day => {
          const daySlots = slotsByDay[day];
          if (day === 'Sunday' && daySlots.length === 0) return null; // Hide Sunday if empty
          
          return (
            <div key={day} className="bg-surface-raised rounded-xl border border-surface-border overflow-hidden flex flex-col">
              <div className="bg-surface-raised p-3 border-b border-surface-border text-center font-bold text-text-secondary">
                {day}
              </div>
              <div className="p-3 flex-1 flex flex-col gap-3">
                {daySlots.length === 0 ? (
                  <div className="text-center text-sm text-text-tertiary py-6 my-auto">No classes</div>
                ) : (
                  daySlots.map(slot => (
                    <div key={slot._id} className="bg-surface-base border border-surface-border rounded-lg p-3 shadow-sm relative group">
                      <button 
                        onClick={() => handleDelete(slot._id)}
                        className="absolute top-2 right-2 text-text-tertiary hover:text-status-danger opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-xs font-bold text-brand-primary mb-1">{slot.startTime} - {slot.endTime}</div>
                      <div className="font-semibold text-text-primary text-sm leading-tight mb-1 pr-6">{slot.subjectId?.name || 'Unknown'}</div>
                      <div className="text-xs text-text-secondary flex flex-col gap-0.5 mt-2">
                        {slot.room && <span>📍 {slot.room}</span>}
                        {slot.teacherName && <span>👨‍🏫 {slot.teacherName}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showImportModal && (
        <TimetableImportModal 
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

export default Timetable;
