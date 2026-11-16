import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Loader2, Receipt } from 'lucide-react';

export default function ReceiptUploader({ onScanComplete }) {
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/expenses/scan`, formData);
      onScanComplete(res.data);
    } catch (err) {
      alert('Failed to scan receipt. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center max-w-md mx-auto mt-10">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Receipt className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Upload Receipt</h2>
      <p className="text-sm text-slate-500 mb-6">Snap a photo or pick an image to automatically parse items and prices.</p>
      
      <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition shadow-sm">
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Camera className="w-5 h-5" />}
        {loading ? 'Analyzing Receipt...' : 'Snap or Upload Receipt'}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleImageUpload} 
          disabled={loading}
        />
      </label>
    </div>
  );
}