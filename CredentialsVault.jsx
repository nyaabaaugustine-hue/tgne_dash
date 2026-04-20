import React, { useState } from 'react';

const CredentialsVault = ({ credentials = [], onEdit, onDelete, onStore }) => {
  const [visiblePass, setVisiblePass] = useState({});

  const toggleVisibility = (id) => {
    setVisiblePass(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden font-['Inter']">
      <div className="p-6 bg-[#4A7289] text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight">Credentials Vault</h2>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Simulated Base64 Encryption</p>
        </div>
        <button onClick={onStore} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-xl text-xs font-black transition-all">
          Store Credential
        </button>
      </div>

      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
          <tr>
            <th className="px-6 py-4">Client / Business</th>
            <th className="px-6 py-4">Account Type</th>
            <th className="px-6 py-4">Username</th>
            <th className="px-6 py-4">Password</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {credentials.map((cred) => (
            <tr key={cred.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="text-xs font-black text-slate-800">{cred.businessName}</div>
                <div className="text-[10px] text-slate-400">{cred.contactPerson}</div>
              </td>
              <td className="px-6 py-4 text-xs font-bold text-[#4A7289]">{cred.type}</td>
              <td className="px-6 py-4 text-xs font-medium text-slate-600">{cred.username}</td>
              <td className="px-6 py-4 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{visiblePass[cred.id] ? cred.password : '••••••••••••'}</span>
                  <button onClick={() => toggleVisibility(cred.id)} className="text-slate-300 hover:text-[#8585E3]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onEdit(cred)} className="text-[#8585E3] hover:underline text-xs font-black mr-4">Edit</button>
                <button onClick={() => onDelete(cred.id)} className="text-red-400 hover:underline text-xs font-black">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CredentialsVault;