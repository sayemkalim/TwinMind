import React from 'react';
import { RefreshCw, HelpCircle, ChevronRight, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuggestionsColumn({ 
  suggestionBatches, 
  isProcessing, 
  handleManualRefresh, 
  handleSuggestionClick, 
  isRecording,
  transcript,
  suggestionsTopRef,
  cn 
}) {
  return (
    <section className="flex flex-col bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase border-b border-white/5">
        <span>2. LIVE SUGGESTIONS</span>
        <span className="text-white/40">{suggestionBatches.length} BATCHES</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="flex justify-between items-center">
          <button
            onClick={handleManualRefresh}
            disabled={isProcessing || (transcript.length === 0 && !isRecording)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold transition-all disabled:opacity-30 border border-white/10 uppercase tracking-widest"
          >
            <RefreshCw size={12} className={cn(isProcessing && "animate-spin")} />
            Refresh Insights
          </button>
          <span className="text-[10px] text-white/20 uppercase tracking-widest">Auto-cycle 30s</span>
        </div>

        <div ref={suggestionsTopRef} />

        {suggestionBatches.length === 0 ? (
          <div className="p-6 rounded-lg bg-brand-blue/5 border border-brand-blue/20 text-xs text-white/60 leading-relaxed shimmer-effect">
            On reload (or auto every ~30s), generate <span className="text-white font-bold">3 fresh suggestions</span> from recent transcript context.
          </div>
        ) : null}

        {isProcessing && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-white/5 rounded-lg w-full" />
            <div className="h-24 bg-white/5 rounded-lg w-full" />
          </div>
        )}

        <AnimatePresence>
          {suggestionBatches.map((batch, idx) => (
            <div key={batch.id} className={cn("space-y-3", idx > 0 && "opacity-40 hover:opacity-100 transition-opacity")}>
              <div className="flex items-center gap-2 px-1">
                <div className="h-0.5 flex-1 bg-white/5" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{batch.timestamp}</span>
                <div className="h-0.5 flex-1 bg-white/5" />
              </div>
              {batch.suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSuggestionClick(s)}
                  className="p-4 rounded-lg bg-[#21262d] border border-white/5 hover:border-brand-blue/50 cursor-pointer transition-all shadow-xl group suggestion-card-hover"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <SuggestionIcon type={s.type} />
                    <span className="text-[9px] font-bold uppercase text-white/30 group-hover:text-brand-blue transition-colors">{s.type}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-2 leading-tight">{s.title}</h3>
                  <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{s.preview}</p>
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function SuggestionIcon({ type }) {
  switch (type) {
    case 'question': return <HelpCircle size={10} className="text-brand-blue" />;
    case 'point': return <ChevronRight size={10} className="text-brand-green" />;
    case 'answer': return <CheckCircle2 size={10} className="text-brand-yellow" />;
    case 'fact-check': return <Info size={10} className="text-red-400" />;
    default: return <Lightbulb size={10} />;
  }
}
