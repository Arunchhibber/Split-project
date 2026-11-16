import React, { useState, useMemo } from 'react';

export default function ExpenseSplitter({ receiptData, onReset }) {
  const [participants, setParticipants] = useState(['You']);
  const [newPerson, setNewPerson] = useState('');
  const [assignments, setAssignments] = useState({});
  const [tipAmount, setTipAmount] = useState(receiptData.tipAmount || 0);
  const [taxAmount, setTaxAmount] = useState(receiptData.taxAmount || 0);
  const [copied, setCopied] = useState(false);

  const handleAddPerson = (e) => {
    e.preventDefault();
    const trimmed = newPerson.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed]);
      setNewPerson('');
    }
  };

  const handleRemovePerson = (personToRemove) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((p) => p !== personToRemove));
    
    const updatedAssignments = { ...assignments };
    Object.keys(updatedAssignments).forEach((itemIdx) => {
      updatedAssignments[itemIdx] = updatedAssignments[itemIdx].filter((p) => p !== personToRemove);
    });
    setAssignments(updatedAssignments);
  };

  const toggleAssignment = (itemIndex, person) => {
    setAssignments((prev) => {
      const current = prev[itemIndex] || [];
      const exists = current.includes(person);
      const updated = exists
        ? current.filter((p) => p !== person)
        : [...current, person];
      return { ...prev, [itemIndex]: updated };
    });
  };

  const assignAllToItem = (itemIndex) => {
    setAssignments((prev) => ({
      ...prev,
      [itemIndex]: [...participants],
    }));
  };

  const breakdown = useMemo(() => {
    const personSubtotals = {};
    participants.forEach((p) => (personSubtotals[p] = 0));

    let assignedSubtotal = 0;

    receiptData.items.forEach((item, idx) => {
      const assignedPeople = assignments[idx] || [];
      if (assignedPeople.length > 0) {
        const splitPrice = item.price / assignedPeople.length;
        assignedPeople.forEach((person) => {
          if (personSubtotals[person] !== undefined) {
            personSubtotals[person] += splitPrice;
          }
        });
        assignedSubtotal += item.price;
      }
    });

    const totalTax = parseFloat(taxAmount) || 0;
    const totalTip = parseFloat(tipAmount) || 0;

    return participants.map((person) => {
      const sub = personSubtotals[person];
      const ratio = assignedSubtotal > 0 ? sub / assignedSubtotal : 0;
      const personTax = totalTax * ratio;
      const personTip = totalTip * ratio;
      const total = sub + personTax + personTip;

      return {
        name: person,
        subtotal: sub,
        tax: personTax,
        tip: personTip,
        total,
      };
    });
  }, [participants, assignments, receiptData.items, taxAmount, tipAmount]);

  const grandTotal =
    (parseFloat(receiptData.subtotal) || 0) +
    (parseFloat(taxAmount) || 0) +
    (parseFloat(tipAmount) || 0);

  const copySummaryText = () => {
    let text = `🧾 Split Summary for ${receiptData.merchantName}:\n`;
    breakdown.forEach((p) => {
      text += `• ${p.name}: $${p.total.toFixed(2)}\n`;
    });
    text += `Total: $${grandTotal.toFixed(2)}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-gray-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Scanned Receipt
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">{receiptData.merchantName}</h2>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200"
        >
          Scan Another Receipt
        </button>
      </div>

      {/* Participants Manager */}
      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
        <label className="block text-sm font-bold text-gray-800">1. Add Participants</label>
        <form onSubmit={handleAddPerson} className="flex gap-2">
          <input
            type="text"
            placeholder="Friend's name..."
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm shadow-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition active:scale-95"
          >
            Add Friend
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {participants.map((person) => (
            <span
              key={person}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-white text-indigo-700 border border-indigo-100 shadow-sm"
            >
              {person}
              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePerson(person)}
                  className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-xs transition"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Itemized List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800">2. Assign Items</h3>
          <span className="text-xs text-gray-400 font-medium">Tap names to split item</span>
        </div>

        {receiptData.items.length === 0 ? (
          <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-xl text-center">
            No individual line items parsed. You can still split tax and tip below!
          </p>
        ) : (
          <div className="space-y-3">
            {receiptData.items.map((item, idx) => {
              const assigned = assignments[idx] || [];
              return (
                <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3 transition hover:border-indigo-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                    <span className="font-bold text-gray-900">${item.price.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {participants.map((person) => {
                      const isSelected = assigned.includes(person);
                      return (
                        <button
                          key={person}
                          onClick={() => toggleAssignment(idx, person)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {person}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => assignAllToItem(idx)}
                      className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1"
                    >
                      Split All
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tax & Tip */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tax ($)</label>
          <input
            type="number"
            step="0.01"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 font-semibold text-sm shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tip ($)</label>
          <input
            type="number"
            step="0.01"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 font-semibold text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Breakdown Summary */}
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-gray-900">3. Final Summary</h3>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total: ${grandTotal.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {breakdown.map((person) => (
            <div
              key={person.name}
              className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-gray-900 text-sm">{person.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Sub: ${person.subtotal.toFixed(2)} + Tax/Tip
                </p>
              </div>
              <span className="text-xl font-black text-indigo-600">
                ${person.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={copySummaryText}
          className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
        >
          {copied ? '✓ Summary Copied to Clipboard!' : '📋 Copy Share Summary'}
        </button>
      </div>
    </div>
  );
}