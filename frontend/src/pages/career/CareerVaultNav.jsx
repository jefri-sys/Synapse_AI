import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Activity, Brain, FileText } from 'lucide-react';

export default function CareerVaultNav({ activeTab }) {
  const tabs = [
    { id: 'vault', label: 'Vault', path: '/career', icon: Folder },
    { id: 'timeline', label: 'Timeline', path: '/career/timeline', icon: Activity },
    { id: 'intelligence', label: 'Resume Intelligence', path: '/career/resume-intelligence', icon: Brain },
    { id: 'resumes', label: 'Resumes', path: '/career/resumes', icon: FileText }
  ];

  return (
    <div className="flex bg-surface-sunken p-1 rounded-lg self-start sm:self-auto overflow-x-auto w-full sm:w-auto border border-surface-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return isActive ? (
          <div 
            key={tab.id}
            className="px-4 py-2 text-sm font-bold rounded-md bg-surface-base text-brand-primary shadow-sm whitespace-nowrap flex items-center gap-2"
          >
            <Icon className="w-4 h-4"/> {tab.label}
          </div>
        ) : (
          <Link 
            key={tab.id}
            to={tab.path} 
            className="px-4 py-2 text-sm font-medium rounded-md text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <Icon className="w-4 h-4"/> {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
