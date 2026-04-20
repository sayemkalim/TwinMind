import React from 'react';
import { Download, Settings } from 'lucide-react';

export default function Header({ onExport, onOpenSettings }) {
  return (
    <header className="flex items-center justify-between px-2">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white">TwinMind <span className="text-xs font-normal text-white/40 ml-2">— Live Suggestions Web App </span></h1>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button 
          onClick={onExport} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 uppercase tracking-widest text-[10px]"
        >
          <Download size={14} />
          Export Session
        </button>
        <button 
          onClick={onOpenSettings} 
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
