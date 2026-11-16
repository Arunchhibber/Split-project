import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import ExpenseSplitter from './components/ExpenseSplitter';
import ReceiptHistory from './components/ReceiptHistory';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history'
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes (sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !session) return;

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/expenses/scan`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to scan receipt. Please try another image.');
      const data = await response.json();
      setReceiptData(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-gray-500">
        Loading SplitLens...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 py-10 px-4 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="max-w-3xl mx-auto mb-6 text-center space-y-2 relative">
          {session && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="absolute right-0 top-0 text-xs font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs transition"
            >
              Sign Out
            </button>
          )}
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">SplitLens</h1>
          <p className="text-gray-500 font-medium text-sm">
            Snap your receipt, let OCR parse the items, and split bills effortlessly.
          </p>
        </div>

        {!session ? (
          <div className="mt-8">
            <Auth onLogin={(newSession) => setSession(newSession)} />
          </div>
        ) : (
          <>
            {/* Navigation Switcher */}
            {!receiptData && (
              <div className="flex justify-center mb-8">
                <div className="inline-flex p-1 bg-white rounded-2xl border border-gray-200 shadow-xs">
                  <button
                    onClick={() => setActiveTab('scan')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'scan'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    + Scan Receipt
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'history'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Receipt History
                  </button>
                </div>
              </div>
            )}

            {/* Active View */}
            {receiptData ? (
              <ExpenseSplitter
                receiptData={receiptData}
                onReset={() => {
                  setReceiptData(null);
                  setFile(null);
                  setPreviewUrl(null);
                }}
              />
            ) : activeTab === 'history' ? (
              <ReceiptHistory
                session={session}
                onSelectReceipt={(selected) => {
                  setReceiptData(selected);
                }}
              />
            ) : (
              <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/60 border border-gray-100 transition-all">
                <form onSubmit={handleUpload} className="space-y-6">
                  <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 hover:border-indigo-500 bg-gray-50/50 hover:bg-indigo-50/30 rounded-2xl cursor-pointer transition group">
                    {previewUrl ? (
                      <div className="space-y-3 text-center">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="max-h-48 mx-auto rounded-xl shadow-md border object-contain"
                        />
                        <p className="text-xs font-bold text-indigo-600 group-hover:underline">
                          Click or drop to change image
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shadow-xs group-hover:scale-110 transition">
                          📄
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-800">
                            Choose a receipt image or drag it here
                          </p>
                          <p className="text-xs text-gray-400 font-medium">PNG, JPG, HEIC up to 10MB</p>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      className="hidden"
                    />
                  </label>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!file || loading}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing OCR & Saving...' : 'Scan & Extract Receipt'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Centered Footer */}
      <footer className="w-full text-center py-8 mt-12 text-xs font-semibold text-gray-400">
        ✨ Made by Arun 
      </footer>
    </div>
  );
}