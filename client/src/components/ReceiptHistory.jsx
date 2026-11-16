import React, { useEffect, useState } from 'react';

export default function ReceiptHistory({ session, onSelectReceipt }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/expenses`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        if (!res.ok) throw new Error('Could not load receipt history');
        const data = await res.json();
        setReceipts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchHistory();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-gray-500 font-medium">
        Loading past receipts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-black text-gray-900">Saved Receipts</h2>
        <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
          {receipts.length} {receipts.length === 1 ? 'Receipt' : 'Receipts'}
        </span>
      </div>

      {receipts.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center space-y-2 shadow-sm">
          <p className="text-gray-800 font-bold">No receipts saved yet</p>
          <p className="text-xs text-gray-400">Scan your first receipt to see it appear here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {receipts.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 truncate">
                    {r.merchant_name || 'Unknown Merchant'}
                  </h3>
                  <span className="text-base font-black text-indigo-600">
                    ${(parseFloat(r.total_amount) || 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  · {r.receipt_items?.length || 0} items
                </p>
              </div>

              <button
                onClick={() =>
                  onSelectReceipt({
                    merchantName: r.merchant_name || 'Receipt',
                    subtotal: r.subtotal || 0,
                    taxAmount: r.tax_amount || 0,
                    tipAmount: r.tip_amount || 0,
                    items: (r.receipt_items || []).map((item) => ({
                      name: item.name,
                      price: parseFloat(item.price) || 0,
                    })),
                  })
                }
                className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs rounded-xl transition"
              >
                Open & Split Items
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}