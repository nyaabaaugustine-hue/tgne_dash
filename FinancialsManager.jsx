import React from 'react';

const FinancialsManager = ({ invoices = [], onMarkPaid, onCreateInvoice }) => {
  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden font-['Inter']">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-lg font-black text-[#4A7289]">Financials</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage invoices & payments</p>
        </div>
        <button 
          onClick={onCreateInvoice}
          className="bg-[#8585E3] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[#8585E3]/20 hover:scale-105 transition-all"
        >
          + Create Invoice
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-50">
              <th className="px-6 py-4">Invoice / ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-xs font-black text-[#8585E3]">{inv.id}</span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-700">{inv.clientName}</td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{inv.description}</td>
                <td className="px-6 py-4 text-xs font-black text-[#4A7289]">{inv.currency} {inv.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {inv.status !== 'PAID' ? (
                    <button onClick={() => onMarkPaid(inv.id)} className="text-[10px] font-black text-[#8585E3] hover:underline">Mark Paid</button>
                  ) : (
                    <button className="text-[10px] font-black text-[#4A7289] hover:underline">View Receipt</button>
                  )}
                  <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialsManager;