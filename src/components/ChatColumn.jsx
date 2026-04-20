import React from 'react';
import { Send } from 'lucide-react';

export default function ChatColumn({ 
  chatMessages, 
  isStreaming, 
  chatInput, 
  setChatInput, 
  handleChatSubmit, 
  chatEndRef, 
  cn 
}) {
  return (
    <section className="flex flex-col bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase border-b border-white/5">
        <span>3. CHAT (DETAILED ANSWERS)</span>
        <span className="text-white/40">SESSION-ONLY</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/20 text-[11px] text-white/60 leading-relaxed">
          Detailed answers from suggestions or your own questions will appear here. No data is persisted between sessions.
        </div>

        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 text-white/20">
            <p className="text-sm">Click a suggestion or type a question below.</p>
          </div>
        ) : (
          chatMessages.map((m, i) => (
            <div key={i} className={cn("flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn("max-w-[90%] p-3 rounded-xl text-xs shadow-lg leading-relaxed", m.role === 'user' ? "message-bubble-user text-white" : "bg-[#21262d] text-gray-300 border border-white/5")}>
                {m.content}
              </div>
              <span className="text-[9px] text-white/20 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">{m.timestamp}</span>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex flex-col items-start">
            <div className="max-w-[90%] p-4 rounded-xl bg-white/5 border border-white/5 w-24 h-8 animate-pulse text-[10px] flex items-center justify-center text-white/20 uppercase tracking-widest font-bold">
              Typing
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <form onSubmit={handleChatSubmit} className="relative">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask TwinMind anything..."
            className="w-full bg-[#0d1117] border border-white/10 rounded-xl py-3 pl-4 pr-10 text-xs focus:ring-1 focus:ring-brand-blue/40 border-white/5 outline-none transition-all placeholder:text-white/10 text-white"
          />
          <button 
            type="submit" 
            disabled={!chatInput.trim()}
            className="absolute right-2 top-2.5 p-1 rounded-md text-white/20 hover:text-white transition-colors disabled:opacity-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
}
