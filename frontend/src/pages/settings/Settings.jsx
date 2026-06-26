import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Lock, Bell, Moon, Sun, 
  AlertTriangle, Upload, Trash2, Edit2, Save, X, ArrowLeft, Sparkles, Monitor, Smartphone
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import AIPersonalizationSettings from './AIPersonalizationSettings';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // States
  const [profile, setProfile] = useState({
    name: '', college: '', course: '', semester: '', targetCGPA: '', universityType: '10_point', theme: 'light', avatar: ''
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [notifications, setNotifications] = useState({
    EXAM_ALERT: true, ASSIGNMENT_DUE: true, BUDGET_WARNING: true, 
    HABIT_REMINDER: true, GROUP_MESSAGE: true, NEW_MESSAGE: true, 
    MISSED_CALL: true, CALENDAR_REMINDER: true, AI_BRIEFING: true,
    ATTENDANCE_WARNING: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await axios.get(`${API_URL}/api/users/profile`);
      if (profileRes.data.success) {
        const u = profileRes.data.user;
        setProfile(prev => ({ ...prev, ...u }));
        if (u.notificationPreferences) {
          setNotifications(prev => ({ ...prev, ...u.notificationPreferences }));
        }
        if (u.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
      }

    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Handlers
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_URL}/api/users/profile`, profile);
      if (user) updateUser({ ...user, ...profile });
      showMessage('success', 'Profile updated successfully.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error updating profile');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_URL}/api/users/password`, passwords);
      showMessage('success', 'Password updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error updating password');
    }
  };

  const handleNotificationUpdate = async (key, val) => {
    const newPrefs = { ...notifications, [key]: val };
    setNotifications(newPrefs);
    try {
      await axios.patch(`${API_URL}/api/users/notification-preferences`, { preferences: newPrefs });
    } catch (err) {
      showMessage('error', 'Error saving notification preference');
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = profile.theme === 'light' ? 'dark' : 'light';
    setProfile({ ...profile, theme: newTheme });
    
    if (user) updateUser({ ...user, theme: newTheme });
    if (newTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');

    try {
      await axios.patch(`${API_URL}/api/users/profile`, { theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme', err);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetData = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users/reset-data`, { password: confirmPassword });
      showMessage('success', 'All Synapse data reset successfully.');
      setShowResetModal(false);
      setConfirmPassword('');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error resetting data');
      setShowResetModal(false);
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.delete(`${API_URL}/api/users/account`, { data: { password: confirmPassword } });
      window.location.href = '/login'; // hard reload and redirect
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Error deleting account');
      setShowDeleteModal(false);
      setConfirmPassword('');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-surface-base text-text-primary">Loading Settings...</div>;
  }

  const tabs = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'security', icon: <Lock size={18} />, label: 'Security' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
    { id: 'appearance', icon: profile.theme === 'light' ? <Sun size={18} /> : <Moon size={18} />, label: 'Appearance' },
    { id: 'ai-settings', icon: <Sparkles size={18} />, label: 'AI Personalization' },
  ];

  return (
    <div className="min-h-screen bg-surface-sunken p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface-base border border-surface-border rounded-full hover:bg-surface-sunken transition">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === 'error' ? 'bg-status-danger-subtle text-status-danger' : 'bg-status-success-subtle text-status-success'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card className="p-0 rounded-xl shadow-sm overflow-hidden flex flex-col">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-brand-primary-subtle text-brand-primary border-l-4 border-brand-primary' 
                      : 'text-text-secondary hover:bg-surface-sunken border-l-4 border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              <div className="border-t border-surface-border my-2"></div>
              <Button
                variant="ghost"
                tone="danger"
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-3 px-6 py-4 text-left w-full justify-start rounded-none h-auto border-l-4 border-transparent"
              >
                <AlertTriangle size={18} />
                <span className="font-medium">Reset Synapse Data</span>
              </Button>
              <Button
                variant="ghost"
                tone="danger"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-3 px-6 py-4 text-left w-full justify-start rounded-none h-auto border-l-4 border-transparent"
              >
                <Trash2 size={18} />
                <span className="font-medium">Delete Account</span>
              </Button>
            </Card>
          </div>

          {/* Main Content Area */}
          <Card className="flex-1 rounded-xl shadow-sm p-6 md:p-8">
            
            {/* 1. Profile Section */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-text-primary">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-surface-sunken border border-surface-border rounded-full flex items-center justify-center overflow-hidden shrink-0">
                      {profile.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-text-tertiary" />}
                    </div>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Change Avatar" />
                      <Button variant="outline" type="button" className="pointer-events-none">
                        <Upload size={16} className="mr-2" /> Change Avatar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                      <Input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">College</label>
                      <Input type="text" value={profile.college} onChange={e => setProfile({...profile, college: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Course</label>
                      <Input type="text" value={profile.course} onChange={e => setProfile({...profile, course: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Semester</label>
                      <Input type="number" value={profile.semester} onChange={e => setProfile({...profile, semester: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Target CGPA</label>
                      <Input type="number" step="0.1" value={profile.targetCGPA} onChange={e => setProfile({...profile, targetCGPA: e.target.value})} />
                    </div>
                  </div>
                  <Button type="submit" variant="primary">
                    <Save size={18} className="mr-2" /> Save Profile
                  </Button>
                </form>
              </div>
            )}

            {/* 2. Security Section */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-semibold mb-6 text-text-primary">Security Settings</h2>
                
                {/* Change Password Form */}
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
                      <Input 
                        type="password" 
                        value={passwords.currentPassword} 
                        onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                      <Input 
                        type="password" 
                        value={passwords.newPassword} 
                        onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                        required 
                      />
                    </div>
                    <Button type="submit" variant="primary">
                      Update Password
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* 5. Notifications Section */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-text-primary">Notification Preferences</h2>
                <div className="space-y-4 max-w-lg">
                  {Object.entries(notifications).map(([key, enabled]) => (
                    <div key={key} className="flex justify-between items-center p-4 border border-surface-border rounded-lg">
                      <div>
                        <p className="font-medium text-text-primary capitalize">{key.replace(/_/g, ' ').toLowerCase()}</p>
                      </div>
                      <Switch checked={enabled} onCheckedChange={(val) => handleNotificationUpdate(key, val)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Appearance Section */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-text-primary">Appearance</h2>
                <div className="flex items-center justify-between p-6 border border-surface-border rounded-xl bg-surface-sunken max-w-md">
                  <div className="flex items-center gap-4">
                    {profile.theme === 'light' ? <Sun size={24} className="text-status-warning" /> : <Moon size={24} className="text-brand-primary" />}
                    <div>
                      <h3 className="font-semibold text-text-primary">Dark Mode</h3>
                      <p className="text-sm text-text-secondary">Toggle dark theme</p>
                    </div>
                  </div>
                  <Switch checked={profile.theme === 'dark'} onCheckedChange={handleThemeToggle} />
                </div>
              </div>
            )}

            {/* 7. AI Personalization Section */}
            {activeTab === 'ai-settings' && (
              <AIPersonalizationSettings />
            )}

          </Card>
        </div>
      </div>

      {/* Reset Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-status-warning flex items-center gap-2"><AlertTriangle /> Reset Synapse Data</h3>
              <button onClick={() => setShowResetModal(false)} className="text-text-tertiary hover:text-text-secondary"><X size={20} /></button>
            </div>
            <p className="text-text-secondary mb-6 text-sm">
              This action will clear all your generated data (notebooks, habits, finances, groups) but your account and profile will remain active.
            </p>
            <form onSubmit={handleResetData}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">Confirm with Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="ghost" type="button" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" className="shadow-lg shadow-status-danger/20">
                  Reset Data
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-status-danger flex items-center gap-2"><Trash2 /> Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-text-tertiary hover:text-text-secondary"><X size={20} /></button>
            </div>
            <p className="text-text-secondary mb-6 text-sm">
              This action is <span className="font-bold">permanent</span> and cannot be undone. All your data and your account will be permanently deleted.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">Confirm with Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="ghost" type="button" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" className="shadow-lg shadow-status-danger/20">
                  Delete Permanently
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default Settings;
