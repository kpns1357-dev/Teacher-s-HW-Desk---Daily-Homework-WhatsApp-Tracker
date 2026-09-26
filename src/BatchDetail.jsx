import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Check, X, AlertTriangle, UserX, Sun, BookX, Share2, Copy, 
  MessageSquare, Edit3, Send, CheckCircle2, AlertCircle, Plus, Trash2, Calendar,
  ExternalLink, Zap, History, Bell, BellRing, Eye
} from 'lucide-react';
import { formatWhatsAppMessage, sendFastShare, copyToClipboard } from './whatsappUtil';
import { 
  saveHomeworkRecord, getHomeworkRecord, getBatchLogs, check3DayDefaulters 
} from './dataService';

export default function BatchDetail({ 
  batch, 
  onBack, 
  onUpdateBatch 
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Batch-level mode: 'normal' | 'no_homework' | 'holiday'
  const [batchStatus, setBatchStatus] = useState('normal');
  const [specialReason, setSpecialReason] = useState('');

  // Student homework entries: map of studentId -> { status: 'done' | 'incomplete' | 'not_done' | 'absent', remarks: '' }
  const [entries, setEntries] = useState({});
  const [activeRemarkId, setActiveRemarkId] = useState(null);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Student management modal inside batch
  const [showManageStudents, setShowManageStudents] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  // Batch WhatsApp link settings modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [batchLinkInput, setBatchLinkInput] = useState(batch.whatsappGroupLink || '');

  // History Drawer / Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [batchLogs, setBatchLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  // 3-Day Consecutive Incomplete / Not Done Alert State
  const [defaulters, setDefaulters] = useState([]);
  const [includeDefaultersInWA, setIncludeDefaultersInWA] = useState(false);
  const [ignoredDefaulters, setIgnoredDefaulters] = useState(false);

  // Check 3-day defaulters on load
  const runDefaulterCheck = async () => {
    try {
      const list = await check3DayDefaulters(batch.id, batch.students);
      setDefaulters(list);
    } catch (e) {
      console.warn("Defaulter check error:", e);
    }
  };

  useEffect(() => {
    runDefaulterCheck();
  }, [batch.id, batch.students]);

  // Load existing log for today or selectedDate
  useEffect(() => {
    let isMounted = true;
    async function loadRecord() {
      const record = await getHomeworkRecord(batch.id, selectedDate);
      if (record && isMounted) {
        setBatchStatus(record.batchStatus || 'normal');
        setSpecialReason(record.specialReason || '');
        if (record.entries) {
          const map = {};
          record.entries.forEach(item => {
            map[item.studentId] = {
              status: item.status || 'done',
              remarks: item.remarks || ''
            };
          });
          setEntries(map);
        }
      } else if (isMounted) {
        const map = {};
        batch.students.forEach(s => {
          map[s.id] = { status: 'done', remarks: '' };
        });
        setEntries(map);
        setBatchStatus('normal');
        setSpecialReason('');
      }
    }
    loadRecord();
    return () => { isMounted = false; };
  }, [batch.id, selectedDate, batch.students]);

  // Load history logs when History is opened
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    const logs = await getBatchLogs(batch.id);
    setBatchLogs(logs);
    setHistoryLoading(false);
  };

  // Set student status
  const handleStatusChange = (studentId, status) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status
      }
    }));
  };

  // Set remarks description
  const handleRemarkChange = (studentId, remarks) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: remarks
      }
    }));
  };

  // Mark all
  const markAllAs = (status) => {
    const updated = {};
    batch.students.forEach(s => {
      updated[s.id] = {
        status,
        remarks: entries[s.id]?.remarks || ''
      };
    });
    setEntries(updated);
  };

  // Compute status counts
  const totalStudents = batch.students.length;
  const doneCount = Object.values(entries).filter(e => e.status === 'done').length;
  const incompleteCount = Object.values(entries).filter(e => e.status === 'incomplete').length;
  const notDoneCount = Object.values(entries).filter(e => e.status === 'not_done').length;
  const absentCount = Object.values(entries).filter(e => e.status === 'absent').length;

  // Build the WhatsApp message payload
  const buildCurrentMessage = () => {
    const formattedEntries = batch.students.map(s => {
      const entry = entries[s.id] || { status: 'done', remarks: '' };
      return {
        studentId: s.id,
        studentName: s.name,
        rollNo: s.rollNo,
        status: entry.status,
        remarks: entry.remarks
      };
    });

    return formatWhatsAppMessage({
      batchName: batch.name,
      subject: batch.subject,
      date: selectedDate,
      batchStatus,
      specialReason,
      entries: formattedEntries,
      includeRemarks: true,
      repeatDefaulters: (includeDefaultersInWA && !ignoredDefaulters) ? defaulters : []
    });
  };

  // Save current record to storage & firestore
  const handleSaveRecord = async () => {
    const formattedEntries = batch.students.map(s => {
      const entry = entries[s.id] || { status: 'done', remarks: '' };
      return {
        studentId: s.id,
        studentName: s.name,
        rollNo: s.rollNo,
        status: entry.status,
        remarks: entry.remarks
      };
    });

    const record = {
      batchId: batch.id,
      batchName: batch.name,
      date: selectedDate,
      batchStatus,
      specialReason,
      entries: formattedEntries,
      updatedAt: new Date().toISOString()
    };

    await saveHomeworkRecord(record);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    runDefaulterCheck();
  };

  // Ultra-Fast Dispatch Action
  const handleFastSend = async () => {
    await handleSaveRecord();
    const msg = buildCurrentMessage();
    const res = await sendFastShare(msg, batch.whatsappGroupLink, batch.whatsappGroupNumber);

    if (res?.type === 'group_link_opened') {
      setActionNotice('Copied & opening WhatsApp group directly! Simply tap Paste inside.');
      setTimeout(() => setActionNotice(''), 4500);
    }
  };

  // Copy text action
  const handleCopyMessage = async () => {
    const msg = buildCurrentMessage();
    await copyToClipboard(msg);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
  };

  // Add new student to batch
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent = {
      id: `s_${Date.now()}`,
      name: newStudentName.trim(),
      rollNo: `${batch.students.length + 1}`
    };
    const updated = {
      ...batch,
      students: [...batch.students, newStudent]
    };
    onUpdateBatch(updated);
    setNewStudentName('');
  };

  // Delete student from batch
  const handleDeleteStudent = (studentId) => {
    if (confirm("Remove this student from batch?")) {
      const updated = {
        ...batch,
        students: batch.students.filter(s => s.id !== studentId)
      };
      onUpdateBatch(updated);
    }
  };

  // Save WhatsApp group invite link
  const handleSaveGroupLink = (e) => {
    e.preventDefault();
    const updated = {
      ...batch,
      whatsappGroupLink: batchLinkInput.trim()
    };
    onUpdateBatch(updated);
    setShowLinkModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-32">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 bg-emerald-600 text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-emerald-700/60 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="font-bold text-base leading-snug">{batch.name}</h1>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1.5">
                <span>{batch.students.length} Students</span>
                {batch.subject && <span>• {batch.subject}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* History Button */}
            <button
              onClick={handleOpenHistory}
              title="View Homework History"
              className="px-2.5 py-1.5 bg-emerald-700/60 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-emerald-100 active:scale-95 flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Quick Link WhatsApp Group */}
            <button
              onClick={() => setShowLinkModal(true)}
              title="Set WhatsApp Group Link"
              className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                batch.whatsappGroupLink 
                  ? 'bg-emerald-500/80 text-white ring-1 ring-white/30' 
                  : 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">
                {batch.whatsappGroupLink ? 'Linked' : 'Link'}
              </span>
            </button>

            <button
              onClick={() => setShowManageStudents(!showManageStudents)}
              className="px-2.5 py-1.5 bg-emerald-700/60 hover:bg-emerald-700 rounded-xl text-xs font-semibold text-emerald-100 active:scale-95"
            >
              {showManageStudents ? 'Done' : 'Students'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-xl mx-auto px-4 pt-4">
        {/* Instant feedback notification */}
        {actionNotice && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Zap className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 3-DAY CONSECUTIVE INCOMPLETE/NOT-DONE TEACHER ALERT NOTIFICATION */}
        {defaulters.length > 0 && !ignoredDefaulters && (
          <div className="mb-4 p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-2xl flex-shrink-0 shadow-xs">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-amber-900">
                    ⚠️ 3-Day Homework Alert!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {defaulters.length} Student{defaulters.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                  The following students have <b>not completed</b> their homework for <b>3 consecutive sessions</b>:
                </p>

                <div className="mt-2.5 space-y-1 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                  {defaulters.map((d, i) => (
                    <div key={d.studentId} className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                      <span>• {d.studentName} {d.rollNo ? `(#${d.rollNo})` : ''}</span>
                      <span className="text-[10px] text-amber-700 font-normal">Pending 3 days</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIncludeDefaultersInWA(!includeDefaultersInWA)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      includeDefaultersInWA
                        ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
                        : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/50'
                    }`}
                  >
                    <span>{includeDefaultersInWA ? '✓ Included in WhatsApp Note' : '+ Add Note to WhatsApp'}</span>
                  </button>

                  <button
                    onClick={() => setIgnoredDefaulters(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Selector & Special Batch Statuses */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Homework Date</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Special status selector buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setBatchStatus('normal')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border ${
                batchStatus === 'normal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              📝 Check HW
            </button>

            <button
              onClick={() => setBatchStatus('no_homework')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1 ${
                batchStatus === 'no_homework'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BookX className="w-3.5 h-3.5" />
              <span>No Homework</span>
            </button>

            <button
              onClick={() => setBatchStatus('holiday')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1 ${
                batchStatus === 'holiday'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Holiday</span>
            </button>
          </div>

          {/* Optional reason/note for holiday or no homework */}
          {batchStatus !== 'normal' && (
            <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {batchStatus === 'holiday' ? 'Holiday Reason / Greeting (Optional):' : 'Reason / Class Remark (Optional):'}
              </label>
              <input
                type="text"
                value={specialReason}
                onChange={(e) => setSpecialReason(e.target.value)}
                placeholder={batchStatus === 'holiday' ? 'e.g. Festival / School Event' : 'e.g. Test preparation in class'}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* If manage students mode is toggled */}
        {showManageStudents && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs mb-4">
            <h3 className="font-bold text-sm text-slate-800 mb-2">Edit Batch Students</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Student full name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button
                onClick={handleAddStudent}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {batch.students.map((s, idx) => (
                <div key={s.id} className="py-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{idx + 1}. {s.name}</span>
                  <button 
                    onClick={() => handleDeleteStudent(s.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Normal Homework Checking View */}
        {batchStatus === 'normal' ? (
          <div>
            {/* Quick Summary Counts & Bulk Actions */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200/80 mb-3 shadow-2xs">
              <div className="flex items-center justify-between gap-1 flex-wrap text-[11px] mb-2">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  <Check className="w-3 h-3" /> {doneCount} Done
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3 h-3" /> {incompleteCount} Incomplete
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                  <X className="w-3 h-3" /> {notDoneCount} Not Done
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                  <UserX className="w-3 h-3" /> {absentCount} Absent
                </span>
              </div>

              {/* Bulk mark all as done */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400 font-medium">Quick Mark:</span>
                <button
                  onClick={() => markAllAs('done')}
                  className="font-bold text-emerald-700 hover:underline px-1"
                >
                  Mark All Done ✓
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-2.5">
              {batch.students.map((student, index) => {
                const entry = entries[student.id] || { status: 'done', remarks: '' };
                const isRemarkOpen = activeRemarkId === student.id;

                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-2xl p-3 border transition-all shadow-2xs ${
                      entry.status === 'not_done'
                        ? 'border-rose-300 ring-1 ring-rose-300/40 bg-rose-50/20'
                        : entry.status === 'incomplete'
                        ? 'border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/25'
                        : entry.status === 'absent'
                        ? 'border-slate-300 bg-slate-50/60'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Student info */}
                      <div className="flex-1 pr-2 min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0">
                            {index + 1}.
                          </span>
                          <span className="font-bold text-sm text-slate-800 truncate">
                            {student.name}
                          </span>
                        </div>
                        {entry.remarks && (
                          <p className="text-[11px] text-amber-800 font-medium pl-6 mt-0.5 italic truncate">
                            "{entry.remarks}"
                          </p>
                        )}
                      </div>

                      {/* 4 Status Action Buttons: Done, Incomplete, Not Done, Absent */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* DONE */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'done')}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                            entry.status === 'done'
                              ? 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-600/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title="Done"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* INCOMPLETE */}
                        <button
                          onClick={() => {
                            handleStatusChange(student.id, 'incomplete');
                            if (!entry.remarks) {
                              setActiveRemarkId(student.id);
                            }
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                            entry.status === 'incomplete'
                              ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-500/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          title="Incomplete Work"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        {/* NOT DONE */}
                        <button
                          onClick={() => {
                            handleStatusChange(student.id, 'not_done');
                            if (!entry.remarks) {
                              setActiveRemarkId(student.id);
                            }
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                            entry.status === 'not_done'
                              ? 'bg-rose-600 text-white shadow-xs scale-105 ring-2 ring-rose-600/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                          title="Not Done"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* ABSENT */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                            entry.status === 'absent'
                              ? 'bg-slate-700 text-white shadow-xs scale-105 ring-2 ring-slate-700/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Absent"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>

                        {/* REMARK TOGGLE BUTTON */}
                        <button
                          onClick={() => setActiveRemarkId(isRemarkOpen ? null : student.id)}
                          className={`w-7 h-8 rounded-lg flex items-center justify-center text-xs transition-colors ${
                            entry.remarks
                              ? 'text-amber-600 bg-amber-50 ring-1 ring-amber-200'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="Add Optional Note/Description"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Description/Remarks field */}
                    {isRemarkOpen && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 animate-in fade-in duration-150">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Note (e.g. Only question 1-3 done, rough copy)..."
                          value={entry.remarks || ''}
                          onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setActiveRemarkId(null);
                          }}
                          className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => setActiveRemarkId(null)}
                          className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Special Status Message Box */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center my-6 shadow-2xs">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 bg-emerald-50 text-emerald-600">
              {batchStatus === 'holiday' ? <Sun className="w-8 h-8" /> : <BookX className="w-8 h-8" />}
            </div>
            <h3 className="font-bold text-base text-slate-800">
              {batchStatus === 'holiday' ? 'Today Marked as Holiday' : 'No Homework Assigned'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ready to send update directly to WhatsApp group of {batch.name}.
            </p>
          </div>
        )}

        {/* Live Message Preview Card */}
        <div className="mt-6 bg-slate-900 text-emerald-400 p-4 rounded-2xl shadow-inner text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 font-sans border-b border-slate-800 pb-2">
            <span>WhatsApp Message Preview</span>
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedAlert ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-slate-200 text-xs leading-relaxed max-h-48 overflow-y-auto">
            {buildCurrentMessage()}
          </pre>
        </div>
      </main>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-30 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopyMessage}
            className="p-3.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center"
            title="Copy Text to Clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>

          {/* Save Status / Progress indicator */}
          {isSaved && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-2 rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Saved!</span>
            </div>
          )}

          {/* Big Green Instant Send to WhatsApp Button */}
          <button
            onClick={handleFastSend}
            className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>
              {batch.whatsappGroupLink 
                ? 'Open Batch Group & Paste' 
                : 'Send to Batch on WhatsApp'}
            </span>
          </button>
        </div>
      </div>

      {/* HOMEWORK HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{batch.name} - History</h3>
                  <p className="text-xs text-slate-500">View past homework records by date</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-3">
              {historyLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading past records...
                </div>
              ) : batchLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No past homework records found for this batch yet.
                </div>
              ) : (
                batchLogs.map((log) => {
                  const logDone = log.entries ? log.entries.filter(e => e.status === 'done').length : 0;
                  const logIncomplete = log.entries ? log.entries.filter(e => e.status === 'incomplete').length : 0;
                  const logNotDone = log.entries ? log.entries.filter(e => e.status === 'not_done').length : 0;
                  const isExpanded = selectedHistoryDate === log.date;

                  return (
                    <div 
                      key={log.date} 
                      className="border border-slate-200 rounded-2xl p-3 hover:border-emerald-300 transition-colors"
                    >
                      <div 
                        onClick={() => setSelectedHistoryDate(isExpanded ? null : log.date)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-sm text-slate-800">
                            📅 {log.date}
                          </span>
                          {log.batchStatus === 'holiday' ? (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">Holiday</span>
                          ) : log.batchStatus === 'no_homework' ? (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">No HW</span>
                          ) : (
                            <div className="flex gap-2 text-[11px] font-semibold mt-1">
                              <span className="text-emerald-700">✓ {logDone} Done</span>
                              <span className="text-amber-700">⚠️ {logIncomplete} Incomplete</span>
                              <span className="text-rose-700">❌ {logNotDone} Not Done</span>
                            </div>
                          )}
                        </div>
                        <button className="text-xs text-emerald-600 font-bold">
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      </div>

                      {/* Expanded student breakdown */}
                      {isExpanded && log.entries && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                          {log.entries.map((e, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-slate-700 font-medium">
                                {e.studentName} {e.remarks ? <span className="text-amber-700 italic">("{e.remarks}")</span> : ''}
                              </span>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                e.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                                e.status === 'incomplete' ? 'bg-amber-100 text-amber-800' :
                                e.status === 'not_done' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {e.status === 'done' ? 'Done' : e.status === 'incomplete' ? 'Incomplete' : e.status === 'not_done' ? 'Not Done' : 'Absent'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Group Direct Link Setup Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Direct WhatsApp Group Link</h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Paste the batch's <b>WhatsApp Group Invite Link</b> once (e.g. from WhatsApp Group Info &rarr; Invite via link).
            </p>

            <form onSubmit={handleSaveGroupLink} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  WhatsApp Group Invite Link
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={batchLinkInput}
                  onChange={(e) => setBatchLinkInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Save Direct Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
