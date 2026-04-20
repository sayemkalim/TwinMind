import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsModal({ showSettings, setShowSettings, settings, setSettings, saveSettings }) {
  return (
    <AnimatePresence>
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-[#161b22] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue to-transparent opacity-50" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">System Configuration</h2>
                <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">Adjust AI behavior and API settings</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-2.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Groq API Key</label>
                    <input 
                      type="password"
                      value={settings.apiKey} 
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner" 
                      placeholder="gsk_..."
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Base Model</label>
                    <select 
                      value={settings.model} 
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner appearance-none custom-select" 
                    >
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                      <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                      <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                      <option value="llama3-70b-8192">Llama 3 70B (Legacy)</option>
                      <option value="llama3-8b-8192">Llama 3 8B (Legacy)</option>
                      <option value="gemma2-9b-it">Gemma 2 9B</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Suggestion Context (chunks)</label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={settings.suggestionContextWindow} 
                      onChange={(e) => setSettings({ ...settings, suggestionContextWindow: parseInt(e.target.value) || 10 })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Detail Analysis Context (chunks)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={settings.detailContextWindow} 
                      onChange={(e) => setSettings({ ...settings, detailContextWindow: parseInt(e.target.value) || 20 })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Suggestions Prompt</label>
                      <span className="text-[9px] text-brand-blue/60 font-mono">JSON Engine</span>
                    </div>
                    <textarea 
                      rows={4}
                      value={settings.prompts.suggestions} 
                      onChange={(e) => setSettings({ ...settings, prompts: { ...settings.prompts, suggestions: e.target.value } })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-4 text-[11px] text-white/80 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner resize-none font-mono leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">On-Click Detailed Analysis Prompt</label>
                    <textarea 
                      rows={4}
                      value={settings.prompts.detailed} 
                      onChange={(e) => setSettings({ ...settings, prompts: { ...settings.prompts, detailed: e.target.value } })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-4 text-[11px] text-white/80 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner resize-none font-mono leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Interactive Chat Prompt</label>
                    <textarea 
                      rows={3}
                      value={settings.prompts.chat} 
                      onChange={(e) => setSettings({ ...settings, prompts: { ...settings.prompts, chat: e.target.value } })} 
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-4 text-[11px] text-white/80 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner resize-none font-mono leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-white/5 flex gap-4">
              <button 
                onClick={() => setShowSettings(false)} 
                className="flex-1 py-4 rounded-2xl font-bold text-xs text-white/30 hover:text-white hover:bg-white/5 transition-all text-center tracking-widest uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={() => saveSettings(settings)} 
                className="flex-[2] bg-brand-blue hover:bg-brand-blue/80 text-white py-4 rounded-2xl font-bold text-xs shadow-xl shadow-brand-blue/10 transition-all active:scale-[0.98] tracking-widest uppercase"
              >
                Save Configuration
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
