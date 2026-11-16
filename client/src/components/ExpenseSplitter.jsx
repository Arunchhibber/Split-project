import React, { useState, useMemo } from 'react';

export default function ExpenseSplitter({ receiptData, onReset }) {
  // Default participants list
  const [participants, setParticipants] = useState(['You']);
  const [newPerson, setNewPerson] = useState('');
  
  // Track which participants are assigned to each item index: { 0: ['You'], 1: ['You', 'Alex'] }
  const [assignments, setAssignments] = useState({});
  
  // Editable tip and tax
  const [tipAmount, setTipAmount] = useState(receiptData.tipAmount || 0);
  const [taxAmount, setTaxAmount] = useState(receiptData.taxAmount || 0);

  // Add a participant
  const handleAddPerson = (e) => {
    e.preventDefault();
    const trimmed = newPerson.trim();
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed]);
      setNewPerson('');
    }
  };

  // Remove a participant and clear their assignments
  const handleRemovePerson = (personToRemove) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((p) => p !== personToRemove));
    
    const updatedAssignments = { ...assignments };
    Object.keys(updatedAssignments).forEach((itemIdx) => {
      updatedAssignments[itemIdx] = updatedAssignments[itemIdx].filter((p) => p !== personToRemove);
    });
    setAssignments(updatedAssignments);
  };

  // Toggle participant assignment for a specific line item
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

  // Assign an item equally to everyone
  const assignAllToItem = (itemIndex) => {
    setAssignments((prev) => ({
      ...prev,
      [itemIndex]: [...participants],
    }));
  };

  // Calculate individual totals with proportional tax and tip
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
      // Proportional share of tax and tip based on their item subtotal
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

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{receiptData.merchantName}</h2>
          <p className="text-sm text-gray-500">Tap names under each item to split</p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          Scan Another
        </button>
      </div>

      {/* Add Participants Bar */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Participants</label>
        <form onSubmit={handleAddPerson} className="flex gap-2">
          <input
            type="text"
            placeholder="Add friend's name..."
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {participants.map((person) => (
            <span
              key={person}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              {person}
              {participants.length > 1 && (
                <button
                  onClick={() => handleRemovePerson(person)}
                  className="text-indigo-400 hover:text-indigo-700 font-bold ml-1"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Receipt Items Assignment List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Itemized Breakdown</h3>
        {receiptData.items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No individual items detected on this receipt.</p>
        ) : (
          <div className="divide-y border rounded-xl overflow-hidden">
            {receiptData.items.map((item, idx) => {
              const assigned = assignments[idx] || [];
              return (
                <div key={idx} className="p-4 bg-gray-50/50 hover:bg-gray-50 transition space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {participants.map((person) => {
                      const isSelected = assigned.includes(person);
                      return (
                        <button
                          key={person}
                          onClick={() => toggleAssignment(idx, person)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {person}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => assignAllToItem(idx)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
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

      {/* Tax & Tip Adjustments */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase">Tax ($)</label>
          <input
            type="number"
            step="0.01"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase">Tip ($)</label>
          <input
            type="number"
            step="0.01"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium"
          />
        </div>
      </div>

      {/* Final Split Summary */}
      <div className="border-t pt-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Final Split</h3>
          <span className="text-sm font-semibold text-gray-600">
            Receipt Total: ${grandTotal.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {breakdown.map((person) => (
            <div
              key={person.name}
              className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-gray-900">{person.name}</p>
                <p className="text-xs text-gray-500">
                  Sub: ${person.subtotal.toFixed(2)} · Tax: ${person.tax.toFixed(2)} · Tip: $
                  {person.tip.toFixed(2)}
                </p>
              </div>
              <span className="text-xl font-extrabold text-indigo-600">
                ${person.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}