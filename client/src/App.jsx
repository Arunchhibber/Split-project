import React, { useState } from 'react';
import ReceiptUploader from './components/ReceiptUploader';

function App() {
  const [scannedData, setScannedData] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <header className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-600">SplitLens</h1>
        <p className="text-sm text-slate-500 mt-1">Smart Receipt OCR & Expense Settler</p>
      </header>

      <main className="max-w-3xl mx-auto">
        {!scannedData ? (
          <ReceiptUploader onScanComplete={setScannedData} />
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-4">Scanned Receipt Result</h2>
            <div className="bg-slate-50 p-4 rounded-xl mb-4 text-sm space-y-2">
              <p><strong>Merchant:</strong> {scannedData.merchantName}</p>
              <p><strong>Subtotal:</strong> ${scannedData.subtotal.toFixed(2)}</p>
              <p><strong>Tax:</strong> ${scannedData.taxAmount.toFixed(2)}</p>
              <p className="text-base font-bold text-emerald-600"><strong>Total:</strong> ${scannedData.totalAmount.toFixed(2)}</p>
            </div>

            <h3 className="font-semibold mb-2">Detected Items:</h3>
            <ul className="space-y-2 mb-6">
              {scannedData.items.map((item, index) => (
                <li key={index} className="flex justify-between bg-slate-50 p-3 rounded-lg text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">${item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => setScannedData(null)}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition text-sm"
            >
              Scan Another Receipt
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;