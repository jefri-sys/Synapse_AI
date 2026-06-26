import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, CreditCard, CheckSquare, StickyNote, ChevronDown } from 'lucide-react';
import api from '../services/api';

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate max-w-[120px]">{selectedLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 py-1">
          {options.map(opt => (
            <div 
              key={opt.value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between mx-1 rounded-md ${value === opt.value ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function QuickCapture({ isOpen: controlledIsOpen, onClose, isPopupMode }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isOpen = isPopupMode ? controlledIsOpen : internalIsOpen;
  
  const handleClose = () => {
    if (isPopupMode && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [activeTab, setActiveTab] = useState('expense');
  
  // Expense Form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  
  // Task Form
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  // Note Form
  const [scratchpad, setScratchpad] = useState('');

  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') handleClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'expense') handleExpense(e);
        if (activeTab === 'task') handleTask(e);
        if (activeTab === 'note') handleNote(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const showToast = () => {
    handleClose();
    setAmount(''); setCategory('Food'); setNote('');
    setTitle(''); setDueDate(''); setPriority('Medium');
    setScratchpad('');
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    if (!amount) return;
    try {
      await api.post('/expenses', { amount: Number(amount), category, note });
      showToast();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving expense');
    }
  };

  const handleTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      await api.post('/tasks', { title, dueDate, priority });
      showToast();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving task');
    }
  };

  const handleNote = (e) => {
    e.preventDefault();
    if (!scratchpad.trim()) return;
    const existing = JSON.parse(localStorage.getItem('synapse_notes') || '[]');
    existing.push({ text: scratchpad, date: new Date().toISOString() });
    localStorage.setItem('synapse_notes', JSON.stringify(existing));
    window.dispatchEvent(new Event('synapse_notes_updated'));
    showToast();
  };

  const expenseCategories = [
    { value: 'Food', label: 'Food & Dining' },
    { value: 'Transport', label: 'Transportation' },
    { value: 'Books', label: 'Books & Supplies' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Hostel', label: 'Hostel/Rent' },
    { value: 'Miscellaneous', label: 'Miscellaneous' },
  ];

  const taskPriorities = [
    { value: 'Low', label: 'Low Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'High', label: 'High Priority' },
    { value: 'Critical', label: 'Critical' },
  ];

  return (
    <>
      {!isPopupMode && (
        <button 
          onClick={() => setInternalIsOpen(true)}
          className={`fixed bottom-8 right-8 w-12 h-12 bg-white/90 border border-black/5 backdrop-blur-xl text-brand-primary rounded-full flex items-center justify-center hover:bg-white hover:border-brand-primary/30 hover:shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all duration-300 z-40 shadow-xl group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
          aria-label="Quick Capture"
        >
          <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 animate-in fade-in duration-200">
          {/* Subtle backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={handleClose}></div>
          
          <div 
            ref={modalRef}
            className="relative w-full max-w-[500px] bg-white/85 backdrop-blur-[40px] border border-white/50 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] overflow-visible flex flex-col animate-in slide-in-from-top-4 zoom-in-95 duration-300 ease-out"
          >
            
            {/* Segmented Control */}
            <div className="flex p-1.5 mx-4 mt-4 bg-gray-500/5 rounded-xl border border-black/5">
              <button 
                onClick={() => setActiveTab('expense')} 
                className={`flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'expense' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <CreditCard className="w-3.5 h-3.5"/> Expense
              </button>
              <button 
                onClick={() => setActiveTab('task')} 
                className={`flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'task' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <CheckSquare className="w-3.5 h-3.5"/> Task
              </button>
              <button 
                onClick={() => setActiveTab('note')} 
                className={`flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'note' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <StickyNote className="w-3.5 h-3.5"/> Note
              </button>
            </div>

            {/* Forms Area */}
            <div className="mt-2">
              {activeTab === 'expense' && (
                <form onSubmit={handleExpense} className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative group px-6 py-5 border-b border-black/[0.04]">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-3xl font-light group-focus-within:text-brand-primary transition-colors">₹</span>
                    <input 
                      type="number" 
                      required 
                      placeholder="0.00" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      className="w-full bg-transparent border-none pl-10 pr-4 text-4xl font-light text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0" 
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex items-center px-4 py-3 border-b border-black/[0.04] gap-2 group">
                    <CustomSelect 
                      value={category} 
                      onChange={setCategory} 
                      options={expenseCategories} 
                      placeholder="Select Category"
                    />
                    <div className="w-px h-5 bg-black/10 mx-2"></div>
                    <input 
                      type="text" 
                      placeholder="Add a note... (optional)" 
                      value={note} 
                      onChange={e => setNote(e.target.value)} 
                      className="w-full bg-transparent border-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 rounded-b-2xl">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5"><X className="w-3 h-3"/> Esc to close</span>
                    <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg shadow-[0_4px_12px_rgba(139,92,246,0.25)] hover:shadow-[0_6px_16px_rgba(139,92,246,0.35)] hover:bg-brand-primary-hover transition-all">
                      Capture <span className="opacity-50 text-xs font-mono ml-1">⌘↵</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'task' && (
                <form onSubmit={handleTask} className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="px-6 py-6 border-b border-black/[0.04]">
                    <input 
                      type="text" 
                      required 
                      placeholder="What needs to be done?" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      className="w-full bg-transparent border-none text-2xl font-light text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0" 
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex items-center px-4 py-3 border-b border-black/[0.04] gap-2">
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={e => setDueDate(e.target.value)} 
                      className="bg-transparent border-none text-sm text-gray-600 focus:text-gray-900 hover:text-gray-900 cursor-pointer focus:outline-none focus:ring-0 px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors [color-scheme:light]" 
                    />
                    <div className="w-px h-5 bg-black/10 mx-2"></div>
                    <CustomSelect 
                      value={priority} 
                      onChange={setPriority} 
                      options={taskPriorities} 
                      placeholder="Set Priority"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 rounded-b-2xl">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5"><X className="w-3 h-3"/> Esc to close</span>
                    <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg shadow-[0_4px_12px_rgba(139,92,246,0.25)] hover:shadow-[0_6px_16px_rgba(139,92,246,0.35)] hover:bg-brand-primary-hover transition-all">
                      Add Task <span className="opacity-50 text-xs font-mono ml-1">⌘↵</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'note' && (
                <form onSubmit={handleNote} className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="px-6 py-5 border-b border-black/[0.04]">
                    <textarea 
                      required 
                      placeholder="Jot down a quick thought..." 
                      value={scratchpad} 
                      onChange={e => setScratchpad(e.target.value)} 
                      className="w-full bg-transparent border-none text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 min-h-[160px] resize-none leading-relaxed" 
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 rounded-b-2xl">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5"><X className="w-3 h-3"/> Esc to close</span>
                    <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg shadow-[0_4px_12px_rgba(139,92,246,0.25)] hover:shadow-[0_6px_16px_rgba(139,92,246,0.35)] hover:bg-brand-primary-hover transition-all">
                      Save Note <span className="opacity-50 text-xs font-mono ml-1">⌘↵</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
