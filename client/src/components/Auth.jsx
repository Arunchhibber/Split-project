import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created successfully! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-indigo-100/70 border border-indigo-50 transition-all duration-300">
      {/* Icon / Brand Badge */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-200">
          ⚡
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {isSignUp
              ? 'Sign up to start saving and splitting receipts'
              : 'Enter your details to access your split history'}
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-gray-100/80 rounded-2xl mb-6 border border-gray-200/60">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setError(''); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            !isSignUp
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setError(''); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            isSignUp
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 text-center animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : isSignUp ? (
            'Create Account'
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}