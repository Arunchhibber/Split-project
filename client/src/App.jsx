import React, { useState } from 'react';
import ExpenseSplitter from './components/ExpenseSplitter';

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/expenses/scan`,
        {
          method: 'POST',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 py-12 px-4">
      {/* Brand Header */}
      <div className="max-w-3xl mx-auto mb-10 text-center space-y-2">
    
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">SplitLens</h1>
        <p className="text-gray-500 font-medium text-sm">
          Snap your receipt, let OCR parse the items, and split bills effortlessly.
        
        </p>
      </div>

      {!receiptData ? (
        <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/60 border border-gray-100 transition-all">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Dropzone / File Picker Box */}
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
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing OCR & Saving...
                </>
              ) : (
                'Scan & Extract Receipt'
              )}
            </button>
          </form>
        </div>
      ) : (
        <ExpenseSplitter
          receiptData={receiptData}
          onReset={() => {
            setReceiptData(null);
            setFile(null);
            setPreviewUrl(null);
          }}
        />
      )}
     
      <footer className="w-full text-center py-8 mt-12 text-xs font-semibold text-gray-400">
        ✨ Made by Arun 
      </footer>
    </div>
    
  );
}