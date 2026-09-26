import React, { useState, useEffect } from 'react';
import AuthScreen from './AuthScreen';
import BatchList from './BatchList';
import BatchDetail from './BatchDetail';
import { loadBatches, saveBatches, signOutTeacher } from './dataService';

const ACTIVE_TEACHER_KEY = 'hw_logged_teacher';

export default function App() {
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [batches, setBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if teacher is already logged in on this device
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TEACHER_KEY);
      if (saved) {
        setCurrentTeacher(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    setAuthChecking(false);
  }, []);

  // Load batches once logged in
  useEffect(() => {
    if (!currentTeacher) return;
    async function init() {
      setLoading(true);
      const data = await loadBatches();
      setBatches(data);
      setLoading(false);
    }
    init();
  }, [currentTeacher]);

  const handleLoginSuccess = (teacher) => {
    setCurrentTeacher(teacher);
    localStorage.setItem(ACTIVE_TEACHER_KEY, JSON.stringify(teacher));
  };

  const handleSignOut = () => {
    signOutTeacher();
    localStorage.removeItem(ACTIVE_TEACHER_KEY);
    setCurrentTeacher(null);
    setActiveBatch(null);
  };

  const handleSelectBatch = (batch) => {
    setActiveBatch(batch);
  };

  const handleBackToBatches = () => {
    setActiveBatch(null);
  };

  const handleAddBatch = (newBatch) => {
    const updated = [newBatch, ...batches];
    setBatches(updated);
    saveBatches(updated);
  };

  const handleDeleteBatch = (batchId) => {
    const updated = batches.filter(b => b.id !== batchId);
    setBatches(updated);
    saveBatches(updated);
  };

  const handleUpdateBatch = (updatedBatch) => {
    const updated = batches.map(b => b.id === updatedBatch.id ? updatedBatch : b);
    setBatches(updated);
    setActiveBatch(updatedBatch);
    saveBatches(updated);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium text-sm">
        <span>Loading...</span>
      </div>
    );
  }

  // IF NOT LOGGED IN -> SHOW CLEAN LOGIN PAGE
  if (!currentTeacher) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Homework Desk...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {activeBatch ? (
        <BatchDetail
          batch={activeBatch}
          onBack={handleBackToBatches}
          onUpdateBatch={handleUpdateBatch}
        />
      ) : (
        <BatchList
          batches={batches}
          user={currentTeacher}
          onSelectBatch={handleSelectBatch}
          onAddBatch={handleAddBatch}
          onDeleteBatch={handleDeleteBatch}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
