import React from 'react';
import { Mic } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TranscriptColumn({ transcript, isRecording, toggleRecording, transcriptEndRef, cn }) {
  return (
    <section className="flex flex-col bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase border-b border-white/5">
        <span>1. MIC & TRANSCRIPT</span>
        <span className={cn("text-white/40", isRecording && "text-red-400 animate-pulse")}>
          {isRecording ? "RECORDING" : "IDLE"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
          <button
            onClick={toggleRecording}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-inner",
              isRecording ? "bg-red-500 text-white animate-pulse active-recording" : "bg-[#2d333b] text-brand-blue"
            )}
          >
            {isRecording ? <div className="w-4 h-4 rounded-sm bg-white" /> : <Mic size={20} />}
          </button>
          <p className="text-xs text-white/60">Click mic to start. Transcript appends every ~30s.</p>
        </div>

        {transcript.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-white/20">
            <p className="text-sm">No transcript yet — start the mic.</p>
          </div>
        ) : (
          transcript.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="p-4 rounded-lg bg-white/5 border border-white/10 group hover:border-white/20 transition-colors"
            >
              <span className="text-[10px] text-white/20 block mb-1">{item.timestamp}</span>
              <p className="text-sm text-gray-300 leading-relaxed">{item.text}</p>
            </motion.div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>
    </section>
  );
}
