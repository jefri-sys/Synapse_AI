import React, { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api';
import SemesterList from './SemesterList.jsx';
import SemesterWorkspace from './SemesterWorkspace.jsx';
import MigrationModal from './MigrationModal.jsx';

function Academics() {
  const [activeSemesterId, setActiveSemesterId] = useState(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMigration = async () => {
    try {
      const res = await api.get('/subjects');
      if (res.data.success) {
        const hasUnassigned = res.data.subjects.some(s => !s.semesterId);
        if (hasUnassigned) {
          setNeedsMigration(true);
        }
      }
    } catch (err) {
      console.error('Migration check failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMigration();
  }, []);

  if (loading) {
    return (
      <ProtectedPage title="Academics" description="Loading your academic history...">
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      {needsMigration && (
        <MigrationModal 
          onComplete={() => setNeedsMigration(false)} 
        />
      )}

      {!activeSemesterId ? (
        <SemesterList 
          onSelectSemester={(id) => setActiveSemesterId(id)} 
        />
      ) : (
        <SemesterWorkspace 
          semesterId={activeSemesterId} 
          onBack={() => setActiveSemesterId(null)} 
        />
      )}
    </ProtectedPage>
  );
}

export default Academics;
