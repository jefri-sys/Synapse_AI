import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ChevronLeft, ChevronRight, DollarSign, Wallet, Plus, X, Trash2, Loader, Utensils, Car, BookOpen, Tv, Home, Receipt, Fuel, ShoppingBag, Tag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

export default function FinanceTracker() {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Food', note: '', recurring: false, overspendSource: '' });

  // Budget Edit State
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newTotalBudget, setNewTotalBudget] = useState('');
  const [chartColors, setChartColors] = useState(['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658']);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  useEffect(() => {
    const updateColors = () => {
      const root = getComputedStyle(document.documentElement);
      const getVar = (v, fallback) => {
        const val = root.getPropertyValue(v).trim();
        return val ? val : fallback;
      };
      setChartColors([
        getVar('--brand-primary', '#6366f1'),
        getVar('--status-info', '#3b82f6'),
        getVar('--status-success', '#10b981'),
        getVar('--status-warning', '#f59e0b'),
        getVar('--status-danger', '#ef4444'),
        getVar('--ai-accent', '#8b5cf6')
      ]);
    };

    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  const fetchData = async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        api.get(`/expenses/summary?month=${monthStr}`),
        api.get(`/expenses?month=${monthStr}`)
      ]);
      setSummary(sumRes.data.summary);
      setExpenses(expRes.data.expenses);
      
      // Clear insight when month changes
      setInsight('');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInsight = async () => {
    setInsightLoading(true);
    setInsight('');
    try {
      const res = await api.get(`/ai/finance-insight?month=${monthStr}`);
      if (res.data.success) {
        setInsight(res.data.insight);
      }
    } catch (err) {
      console.error('Failed to get finance insight', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        amount: Number(newExpense.amount),
        category: newExpense.category,
        note: newExpense.note,
        recurring: newExpense.recurring,
        overspendSource: newExpense.overspendSource || undefined
      });
      setShowExpenseModal(false);
      setNewExpense({ amount: '', category: 'Food', note: '', recurring: false, overspendSource: '' });
      fetchData(); // Refresh list & summary
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleUpdateBudget = async () => {
    try {
      const parsedBudget = parseFloat(newTotalBudget);
      if (isNaN(parsedBudget) || parsedBudget <= 0) return alert('Invalid budget amount');
      
      const res = await api.put('/budget', { totalBudget: parsedBudget, month: monthStr });
      if (res.data.success) {
        setSummary(prev => ({ ...prev, totalBudget: parsedBudget, remaining: parsedBudget - prev.totalSpent }));
        setIsEditingBudget(false);
      }
    } catch (err) {
      alert('Failed to update budget');
    }
  };

  const exportCsv = async () => {
    try {
      const response = await api.get('/finance/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expenses.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 80) return 'bg-status-success';
    if (percent <= 90) return 'bg-status-warning';
    return 'bg-status-danger';
  };
  
  const getTextColor = (percent) => {
    if (percent < 80) return 'text-status-success';
    if (percent <= 90) return 'text-status-warning';
    return 'text-status-danger';
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const groupedExpenses = expenses.reduce((acc, exp) => {
    const date = exp.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(exp);
    return acc;
  }, {});

  const getCategoryTheme = (category) => {
    switch (category?.toLowerCase()) {
      case 'food': return { icon: <Utensils className="w-5 h-5" />, bg: "bg-status-warning/20", text: "text-status-warning" };
      case 'transport': return { icon: <Car className="w-5 h-5" />, bg: "bg-brand-primary-subtle", text: "text-brand-primary" };
      case 'petrol': return { icon: <Fuel className="w-5 h-5" />, bg: "bg-status-danger/20", text: "text-status-danger" };
      case 'shopping': return { icon: <ShoppingBag className="w-5 h-5" />, bg: "bg-status-info/20", text: "text-status-info" };
      case 'books': return { icon: <BookOpen className="w-5 h-5" />, bg: "bg-status-info/20", text: "text-status-info" };
      case 'entertainment': return { icon: <Tv className="w-5 h-5" />, bg: "bg-status-danger-subtle", text: "text-status-danger" };
      case 'hostel': return { icon: <Home className="w-5 h-5" />, bg: "bg-status-success/20", text: "text-status-success" };
      case 'miscellaneous': return { icon: <Tag className="w-5 h-5" />, bg: "bg-surface-sunken border border-surface-border", text: "text-text-secondary" };
      default: return { icon: <Receipt className="w-5 h-5" />, bg: "bg-surface-sunken border border-surface-border", text: "text-text-secondary" };
    }
  };

  if (!summary) return <ProtectedPage><div className="p-8">Loading...</div></ProtectedPage>;

  const pieData = summary.categorySummary.map(c => ({
    name: c.category,
    value: c.spent
  })).filter(c => c.value > 0);

  return (
    <ProtectedPage>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 bg-surface-raised p-2 rounded-xl shadow-sm border border-surface-border">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-surface-sunken rounded-lg text-text-primary"><ChevronLeft className="w-5 h-5"/></button>
            <span className="font-bold w-32 text-center text-text-primary">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-surface-sunken rounded-lg text-text-primary"><ChevronRight className="w-5 h-5"/></button>
          </div>
          
          <button 
            onClick={fetchInsight}
            disabled={insightLoading}
            className="flex items-center justify-center p-3 rounded-xl bg-ai-accent/10 text-ai-accent hover:bg-ai-accent/20 transition-colors shadow-sm border border-ai-accent/20"
            title="Generate AI Financial Insight"
          >
            <Loader className={`w-5 h-5 ${insightLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowExpenseModal(true)} className="font-semibold text-sm">
            <Plus className="w-4 h-4 mr-2"/> Add Expense
          </Button>
          <Button variant="outline" onClick={exportCsv} className="font-semibold text-sm bg-surface-raised">
            <Download className="w-4 h-4 mr-2"/> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-primary"/> Total Budget Overview
              </h3>
              {!isEditingBudget ? (
                <button onClick={() => { setIsEditingBudget(true); setNewTotalBudget(summary.totalBudget || ''); }} className="p-1.5 text-text-tertiary hover:text-brand-primary hover:bg-brand-primary-subtle rounded-lg transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={handleUpdateBudget} className="p-1.5 text-status-success hover:bg-status-success-subtle rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                  <button onClick={() => setIsEditingBudget(false)} className="p-1.5 text-status-danger hover:bg-status-danger-subtle rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-text-secondary font-medium">Spent</p>
                <p className="text-3xl font-black text-text-primary">₹{summary.totalSpent}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary font-medium">Remaining</p>
                {isEditingBudget ? (
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xl font-bold text-text-tertiary">₹</span>
                    <Input 
                      type="number" 
                      value={newTotalBudget} 
                      onChange={(e) => setNewTotalBudget(e.target.value)}
                      className="text-xl font-bold text-text-primary w-24 text-right py-1 h-auto"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className={`text-xl font-bold ${summary.remaining < 0 ? 'text-status-danger' : 'text-text-primary'}`}>
                    {summary.remaining < 0 ? `-₹${Math.abs(summary.remaining)}` : `₹${summary.remaining}`}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full bg-surface-sunken rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${summary.remaining < 0 ? 'bg-status-danger' : getProgressColor((summary.totalSpent / summary.totalBudget) * 100)}`} 
                style={{ width: `${Math.min((summary.totalSpent / summary.totalBudget) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-right text-xs text-text-tertiary font-medium">of ₹{summary.totalBudget} allocated</div>
          </Card>

          {/* AI Insight Card - Only appears when generated */}
          {(insight || insightLoading) && (
            <div className="bg-ai-accent/10 p-5 rounded-2xl border border-ai-accent/20 flex gap-4">
              <div className="bg-ai-accent/20 p-2 rounded-full h-fit text-ai-accent">
                <Loader className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary mb-1">AI Financial Insight</h4>
                {insightLoading ? (
                  <p className="text-sm text-ai-accent/70 animate-pulse">Analyzing your spending patterns...</p>
                ) : (
                  <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.categorySummary.map(cat => (
              <Card key={cat.category} className="p-5">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-text-primary">{cat.category}</span>
                  <span className={`font-bold ${getTextColor(cat.percentUsed)}`}>{cat.percentUsed.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-surface-sunken rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(cat.percentUsed)}`} 
                    style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">₹{cat.spent} / ₹{cat.allocated}</span>
                  <span className="font-medium text-text-primary">₹{cat.allocated - cat.spent} left</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 flex flex-col items-center">
          <h3 className="font-bold text-text-primary mb-4 w-full">Spending Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: 'var(--surface-base)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-tertiary">No expenses yet</div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden mt-6 p-0 border-0">
        <div className="p-5 border-b border-surface-border bg-surface-base">
          <h3 className="font-bold text-text-primary">Recent Expenses</h3>
        </div>
        <div className="p-0">
          {Object.keys(groupedExpenses).sort((a,b) => new Date(b) - new Date(a)).map(date => (
            <div key={date} className="border-b border-surface-border last:border-0">
              <div className="bg-surface-base px-5 py-2 text-xs font-bold text-text-secondary uppercase">{date}</div>
              {groupedExpenses[date].map(exp => {
                const theme = getCategoryTheme(exp.category);
                return (
                  <div key={exp._id} className="flex justify-between items-center p-5 hover:bg-surface-sunken transition-colors group bg-surface-raised">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg} ${theme.text}`}>
                        {theme.icon}
                      </div>
                      <div>
                      <p className="font-bold text-text-primary">{exp.note || exp.category}</p>
                      <p className="text-sm text-text-secondary">{exp.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-black text-text-primary">₹{exp.amount}</div>
                    <button onClick={() => handleDeleteExpense(exp._id)} className="text-text-tertiary hover:text-status-danger opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          ))}
          {expenses.length === 0 && <div className="p-8 text-center text-text-tertiary font-medium bg-surface-raised">No expenses recorded for this month.</div>}
        </div>
      </Card>

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-text-primary">Add New Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-text-tertiary hover:text-text-primary"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Amount (₹)</label>
                <Input 
                  type="number" 
                  required 
                  min="1"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  className="flex w-full rounded-sm border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Books">Books</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Note (Optional)</label>
                <Input 
                  type="text" 
                  value={newExpense.note}
                  onChange={e => setNewExpense({...newExpense, note: e.target.value})}
                  placeholder="e.g., Pizza with friends"
                />
              </div>

              {((summary?.remaining || 0) - Number(newExpense.amount || 0)) < 0 && (
                <div className="bg-status-danger-subtle p-4 rounded-xl border border-status-danger/20">
                  <p className="text-sm font-semibold text-status-danger mb-2">
                    ⚠️ You're going over budget!
                  </p>
                  <p className="text-xs text-status-danger/80 mb-3">
                    Where did the extra money come from? (Optional)
                  </p>
                  <select 
                    value={newExpense.overspendSource}
                    onChange={e => setNewExpense({...newExpense, overspendSource: e.target.value})}
                    className="flex w-full rounded-sm border border-status-danger/30 bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                  >
                    <option value="">Select source...</option>
                    <option value="Borrowed from friend">Borrowed from friend</option>
                    <option value="Extra from parents">Extra from parents</option>
                    <option value="Used savings">Used savings</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input 
                  type="checkbox" 
                  checked={newExpense.recurring} 
                  onChange={e => setNewExpense({...newExpense, recurring: e.target.checked})}
                  className="rounded text-brand-primary w-4 h-4 bg-surface-base border-surface-border"
                />
                <span className="text-sm font-medium text-text-primary">Recurring Monthly Expense</span>
              </label>
              
              <Button type="submit" variant="primary" className="w-full py-3 mt-2">
                Save Expense
              </Button>
            </form>
          </Card>
        </div>
      )}
    </ProtectedPage>
  );
}
