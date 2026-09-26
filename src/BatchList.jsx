import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, ArrowRight, BookOpen, MessageCircle, Settings, Calendar, Sparkles, CheckCircle2, ShieldAlert
} from 'lucide-react';

export default function BatchList({ 
  batches, 
  user,
  onSelectBatch, 
  onAddBatch, 
  onDeleteBatch, 
  onSignOut 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newWhatsAppLink, setNewWhatsAppLink] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [rawStudentNames, setRawStudentNames] = useState('');

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    // Parse students from textarea (one per line or comma-separated)
    const studentList = rawStudentNames
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((name, index) => ({
        id: `s_${Date.now()}_${index}`,
        name: name,
        rollNo: `${index + 1}`
      }));

    const newBatch = {
      id: `batch_${Date.now()}`,
      name: newBatchName.trim(),
      subject: newSubject.trim() || 'General',
      whatsappGroupLink: newWhatsAppLink.trim(),
      whatsappGroupNumber: newPhone.trim(),
      students: studentList.length > 0 ? studentList : [
        { id: `s_${Date.now()}_1`, name: 'Sample Student 1', rollNo: '01' }
      ]
    };

    onAddBatch(newBatch);
    setNewBatchName('');
    setNewSubject('');
    setNewWhatsAppLink('');
    setNewPhone('');
    setRawStudentNames('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-emerald-600 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/60 rounded-xl">
              <BookOpen className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">Teacher's HW Desk</h1>
              <p className="text-xs text-emerald-100/90 font-medium">Daily Homework & WhatsApp Notifier</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-emerald-100 font-medium">
              {user?.email ? user.email.replace('@homework.desk', '') : 'Teacher'}
            </span>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 active:scale-95 text-xs text-white font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 pt-5">
        {/* Intro banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white shadow-sm mb-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 2</span>
            </div>
            <h2 className="text-lg font-bold">Select a Batch to Check Today's HW</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Tap any batch below to mark done, not done, absent, or holiday.
            </p>
          </div>
        </div>

        {/* Batches Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">
              Your Batches ({batches.length})
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Batch</span>
          </button>
        </div>

        {/* Batch Cards Grid */}
        <div className="space-y-3">
          {batches.map((batch) => {
            const studentCount = batch.students ? batch.students.length : 0;
            return (
              <div
                key={batch.id}
                onClick={() => onSelectBatch(batch)}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {batch.name}
                      </h3>
                      {batch.subject && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {batch.subject}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{studentCount} Students</span>
                      </div>
                      {batch.whatsappGroupNumber || batch.whatsappGroupLink ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Linked</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Bottom action bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Tap to start checking</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete batch "${batch.name}"?`)) {
                        onDeleteBatch(batch.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add New Batch</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 - Batch A"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics / Physics"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  WhatsApp Group Invite Link (Optional - Recommended for 1-Tap Send)
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={newWhatsAppLink}
                  onChange={(e) => setNewWhatsAppLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  When added, clicking send auto-copies and opens this exact group directly!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  WhatsApp Phone Number (Alternative)
                </label>
                <input
                  type="text"
                  placeholder="Phone number with country code (e.g. 919876543210)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student Names (Paste one name per line)
                </label>
                <textarea
                  rows={4}
                  placeholder={`Rahul Sharma\nPriya Singh\nAmit Kumar\nSneha Roy`}
                  value={rawStudentNames}
                  onChange={(e) => setRawStudentNames(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                ></textarea>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can easily edit, add or remove students anytime later.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md active:scale-95 transition-all"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
