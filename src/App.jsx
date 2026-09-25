import React, { useState, useEffect } from 'react';
import BatchList from './BatchList';
import BatchDetail from './BatchDetail';
import { loadBatches, saveBatches } from './dataService';

export default function App() {
  const [batches, setBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial load directly from Firebase
  useEffect(() => {
    async function init() {
      const data = await loadBatches();
      setBatches(data);
      setLoading(false);
    }
    init();
  }, []);

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
          onSelectBatch={handleSelectBatch}
          onAddBatch={handleAddBatch}
          onDeleteBatch={handleDeleteBatch}
        />
      )}
    </div>
  );
}
