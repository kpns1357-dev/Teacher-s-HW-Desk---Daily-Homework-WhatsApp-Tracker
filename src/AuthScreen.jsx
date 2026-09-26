import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { initFirebase } from './firebase';
import { Lock, Mail, KeyRound, BookOpen, AlertCircle, ArrowRight, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both Email / User ID and Password.');
      return;
    }

    // Auto-complete email format if user only enters a username (e.g. "teacher1" -> "teacher1@homework.desk")
    const formattedEmail = email.includes('@') ? email.trim() : `${email.trim().toLowerCase()}@homework.desk`;

    setLoading(true);
    const fb = initFirebase();

    if (!fb || !fb.auth) {
      setErrorMsg('Firebase Authentication is not available.');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        // Register new teacher
        const userCred = await createUserWithEmailAndPassword(fb.auth, formattedEmail, password);
        onLoginSuccess(userCred.user);
      } else {
        // Login existing teacher
        const userCred = await signInWithEmailAndPassword(fb.auth, formattedEmail, password);
        onLoginSuccess(userCred.user);
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Invalid User ID or Password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this User ID already exists. Please Sign In.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Email/Password provider is not enabled in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Teacher's HW Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isRegistering ? 'Create your private teacher account' : 'Sign in to access your batches & homework'}
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            Passwords are encrypted using <b>Firebase SHA-256 / scrypt</b> hashing. Credentials are never public.
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              User ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="teacher1 or teacher@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              You can type a simple User ID (e.g. <span className="font-mono text-slate-600">teacher1</span>) or your email.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Teacher Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Homework Desk</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
            }}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {isRegistering ? (
              <span>Already have an account? <b>Sign In</b></span>
            ) : (
              <span>First time? <b>Create a Teacher Account</b></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
