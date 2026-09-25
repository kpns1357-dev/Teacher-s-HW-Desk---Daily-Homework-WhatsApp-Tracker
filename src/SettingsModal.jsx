import React, { useState, useEffect } from 'react';
import { 
  Server, ShieldCheck, Key, Save, CheckCircle2, AlertTriangle, ExternalLink
} from 'lucide-react';
import { getBackendConfig, saveBackendConfig } from './dataService';

export default function SettingsModal({ onClose }) {
  const [config, setConfig] = useState(getBackendConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  const testConnection = async (url, key) => {
    if (!url) {
      setConnectionStatus('local_only');
      return;
    }
    setConnectionStatus('checking');
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/api/status`, {
        headers: { 'x-teacher-key': key }
      });
      if (res.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (e) {
      setConnectionStatus('offline');
    }
  };

  useEffect(() => {
    testConnection(config.apiUrl, config.teacherKey);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    saveBackendConfig(config.apiUrl, config.teacherKey);
    setSavedSuccess(true);
    await testConnection(config.apiUrl, config.teacherKey);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">100% Private Cloud Database</h2>
              <p className="text-xs text-slate-500">Zero Firebase keys exposed in browser or inspect</p>
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
          {/* Connection Status Banner */}
          <div className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
            connectionStatus === 'connected' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : connectionStatus === 'checking'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {connectionStatus === 'connected' ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Private Server Connected & Syncing</p>
                  <p className="text-[11px] font-normal text-emerald-700">
                    All homework updates are securely routed through your private server to Firebase. No keys exist in the frontend!
                  </p>
                </div>
              </>
            ) : connectionStatus === 'checking' ? (
              <div>Testing private server connection...</div>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Local Device Storage Active</p>
                  <p className="text-[11px] font-normal text-amber-700">
                    App is running securely offline on this device. Connect your private backend server URL below to auto-sync to Firebase.
                  </p>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Private Backend Proxy URL (e.g. Render / Railway / Vercel)
              </label>
              <input
                type="url"
                placeholder="https://my-homework-api.onrender.com"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The frontend sends data only to this URL. The backend holds your Firebase credentials privately.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Teacher Access Password / Key (Optional)
              </label>
              <input
                type="password"
                placeholder="Enter teacher secret pass"
                value={config.teacherKey}
                onChange={(e) => setConfig({ ...config, teacherKey: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect Private Backend</span>
            </button>

            {savedSuccess && (
              <p className="text-center text-xs font-semibold text-emerald-600 animate-in fade-in">
                ✓ Private backend URL updated!
              </p>
            )}
          </form>

          {/* Explanation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>How your privacy is guaranteed:</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              1. <b>Zero Firebase APIs in Frontend:</b> Anyone inspecting the website or source code will never see any Firebase project ID, API keys, or database rules.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. <b>Auto-Sync:</b> Every time you mark a batch as Done, Incomplete, or Holiday, the app automatically updates the database in the background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
