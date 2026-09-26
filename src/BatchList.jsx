import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, ArrowRight, BookOpen, MessageCircle, Calendar, Sparkles, CheckCircle2, UserPlus, Shield, X, Check, Key, Edit3
} from 'lucide-react';
import { addTeacher, loadTeachers, deleteTeacher, updateAdminCredentials } from './dataService';

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

  // Add & Manage Teachers state
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teachersList, setTeachersList] = useState([]);
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [teacherAddedMsg, setTeacherAddedMsg] = useState('');

  // Change Admin Account state
  const [showChangeAdmin, setShowChangeAdmin] = useState(false);
  const [newAdminId, setNewAdminId] = useState('admin');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminUpdatedMsg, setAdminUpdatedMsg] = useState('');

  // Refresh teachers list whenever modal opens
  useEffect(() => {
    if (showTeacherModal) {
      loadTeachers().then(list => setTeachersList(list || []));
    }
  }, [showTeacherModal]);

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm(`Are you sure you want to remove teacher "${teacherId}"? They will no longer be able to log in.`)) {
      const updated = await deleteTeacher(teacherId);
      setTeachersList(updated);
    }
  };

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

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

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacherId.trim() || !newTeacherPass) return;
    await addTeacher(newTeacherId, newTeacherPass);
    const updated = await loadTeachers();
    setTeachersList(updated || []);
    setTeacherAddedMsg(`Teacher "${newTeacherId.trim()}" added with password!`);
    setNewTeacherId('');
    setNewTeacherPass('');
    setTimeout(() => {
      setTeacherAddedMsg('');
    }, 2500);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminId.trim() || !newAdminPass) return;
    await updateAdminCredentials(newAdminId, newAdminPass);
    const updated = await loadTeachers();
    setTeachersList(updated || []);
    setAdminUpdatedMsg(`Admin updated! User ID: "${newAdminId.trim()}"`);
    setNewAdminPass('');
    setTimeout(() => {
      setAdminUpdatedMsg('');
      setShowChangeAdmin(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-emerald-600 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/60 rounded-xl">
              <BookOpen className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">Teacher's HW Desk</h1>
              <p className="text-xs text-emerald-100/90 font-medium">Daily Homework & WhatsApp Notifier</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTeacherModal(true)}
              title="Add New Teacher ID & Password"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-700/70 hover:bg-emerald-700 active:scale-95 text-xs text-emerald-100 font-semibold transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Teacher</span>
            </button>
            <button
              onClick={onSignOut}
              title="Lock / Sign Out"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-rose-600 active:scale-95 text-xs text-white font-semibold transition-all flex items-center gap-1"
            >
              <span>Lock Desk</span>
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

      {/* Add Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Add Teacher Account</h3>
              </div>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Create an authorized login ID and password for another teacher.
            </p>

            {teacherAddedMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{teacherAddedMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Existing Teachers List */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Authorized Teachers ({teachersList.length})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {teachersList.map((t) => (
                    <div 
                      key={t.userId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                          {t.userId.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{t.userId}</p>
                          {t.name && t.name !== t.userId && (
                            <p className="text-[10px] text-slate-500">{t.name}</p>
                          )}
                        </div>
                      </div>

                      {t.userId.toLowerCase() !== 'admin' && !t.isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacher(t.userId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Remove ${t.userId}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewAdminId(t.userId);
                              setShowChangeAdmin(!showChangeAdmin);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Change Admin ID or Password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Change Admin Form */}
              {showChangeAdmin && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change Admin ID & Password</span>
                  </div>

                  {adminUpdatedMsg && (
                    <div className="mb-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                      {adminUpdatedMsg}
                    </div>
                  )}

                  <form onSubmit={handleUpdateAdmin} className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-950 uppercase mb-0.5">
                        Admin User ID
                      </label>
                      <input
                        type="text"
                        required
                        value={newAdminId}
                        onChange={(e) => setNewAdminId(e.target.value)}
                        placeholder="e.g. admin or headmaster"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-950 uppercase mb-0.5">
                        New Admin Password
                      </label>
                      <input
                        type="text"
                        required
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowChangeAdmin(false)}
                        className="flex-1 py-1.5 bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer active:scale-95"
                      >
                        Save Admin
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add New Teacher Form */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-800 mb-2">+ Add Another Teacher</p>
                <form onSubmit={handleCreateTeacher} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="New Teacher User ID (e.g. priya_mam)"
                      value={newTeacherId}
                      onChange={(e) => setNewTeacherId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={newTeacherPass}
                      onChange={(e) => setNewTeacherPass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTeacherModal(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md active:scale-95 cursor-pointer"
                    >
                      Add Teacher
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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
