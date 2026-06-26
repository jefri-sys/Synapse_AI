import React from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import StudyGroups from './StudyGroups.jsx';

function Groups() {
  return (
    <ProtectedPage>
      <StudyGroups />
    </ProtectedPage>
  );
}

export default Groups;
