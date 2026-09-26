import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initFirebase } from './firebase';
import AuthScreen from './AuthScreen';
import BatchList from './BatchList';
import BatchDetail from './BatchDetail';
import { loadBatches, saveBatches } from './dataService';
import { LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [batches, setBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth State
  useEffect(() => {
    const fb = initFirebase();
    if (!fb || !fb.auth) {
      setAuthChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(fb.auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Initial load of batches once authenticated
  useEffect(() => {
    if (!user) return;
    async function init() {
      setLoading(true);
      const data = await loadBatches();
      setBatches(data);
      setLoading(false);
    }
    init();
  }, [user]);

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

  const handleSignOut = async () => {
    const fb = initFirebase();
    if (fb && fb.auth) {
      await signOut(fb.auth);
    }
    setUser(null);
    setActiveBatch(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the Auth / Login screen
  if (!user) {
    return <AuthScreen onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
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
          user={user}
          onSelectBatch={handleSelectBatch}
          onAddBatch={handleAddBatch}
          onDeleteBatch={handleDeleteBatch}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
