import React, { useState, useEffect } from 'react';
import { 
  Database, Key, Save, AlertTriangle, ShieldCheck, Copy
} from 'lucide-react';
import { getStoredFirebaseConfig, saveFirebaseConfig, initFirebase } from './firebase';

export default function SettingsModal({ onClose }) {
  const [config, setConfig] = useState(getStoredFirebaseConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fbConnectionStatus, setFbConnectionStatus] = useState(null);
  const [rulesCopied, setRulesCopied] = useState(false);

  useEffect(() => {
    const fb = initFirebase();
    if (fb && fb.db) {
      setFbConnectionStatus('connected');
    } else {
      setFbConnectionStatus('offline');
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    saveFirebaseConfig(config);
    setSavedSuccess(true);
    const fb = initFirebase();
    if (fb && fb.db) {
      setFbConnectionStatus('connected');
    } else {
      setFbConnectionStatus('offline');
    }
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /batches/{batchId} {
      allow read, write: if true;
    }
    match /homework_logs/{logId} {
      allow read, write: if true;
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">Firebase & Storage Settings</h2>
              <p className="text-xs text-slate-500">Sync homework data across your devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className={`p-3 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            fbConnectionStatus === 'connected' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {fbConnectionStatus === 'connected' ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Firestore Connected</p>
                  <p className="text-[11px] font-normal text-emerald-700">All student records sync securely to your private Firebase cloud database.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Local Offline Storage Active</p>
                  <p className="text-[11px] font-normal text-amber-700">App works completely offline in your browser. Fill Firebase config below to sync.</p>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  placeholder="my-school-hw-123"
                  value={config.projectId || ''}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={config.authDomain || ''}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={config.appId || ''}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Firebase Configuration</span>
            </button>

            {savedSuccess && (
              <p className="text-center text-xs font-semibold text-emerald-600 animate-in fade-in">
                ✓ Firebase configuration updated!
              </p>
            )}
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Firestore Security Rules</span>
              </div>
              <button
                onClick={copyRules}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{rulesCopied ? 'Copied!' : 'Copy Rules'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed">
              {firestoreRulesText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
