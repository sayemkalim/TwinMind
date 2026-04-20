import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Mic, MicOff, Send, Download, RefreshCw, X, ChevronRight, MessageSquare, Lightbulb, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { transcribeAudio, chatCompletion } from './services/groq';
import { useAudioRecorder } from './hooks/useAudioRecorder';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const DEFAULT_PROMPTS = {
  suggestions: `You are an elite conversation intelligence engine. Analyze the recent transcript chunks and provide EXACTLY 3 high-value "Live Suggestions".
The suggestions MUST be a diverse mix of:
- "question": A penetrating question the user should ask now.
- "point": A key talking point or summary of what was just said.
- "answer": A direct answer to a question that was just raised in the transcript.
- "fact-check": Correcting a potential inaccuracy or providing a verified fact.
- "info": Brief clarifying information or context.

Focus on relevance, timing, and utility. The preview must be self-contained and useful.
FORMAT: JSON array of 3 objects: { "type": "question" | "point" | "answer" | "fact-check" | "info", "title": "Headline", "preview": "Self-contained insight" }`,
  detailed: `Using the full transcript context and the specific suggestion selected, provide a comprehensive, detailed, and actionable deep-dive. 
Structure your response for quick reading: use bolding, bullet points, and clear headers where appropriate. 
If it's a fact-check, provide the evidence. If it's a question, explain why it's important to ask.`,
  chat: `You are TwinMind AI, a helpful and proactive meeting assistant. 
Use the provided transcript to answer user queries with high precision. 
If the transcript doesn't contain the answer, state that but offer related insights based on the conversation flow.`
};

const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  prompts: DEFAULT_PROMPTS,
  suggestionContextWindow: 10,
  detailContextWindow: 20,
};

export default function App() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('twinmind_settings');
    let parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    if (parsed.model === 'llama3-8b-8192') parsed.model = 'llama-3.1-8b-instant';
    if (parsed.model === 'llama3-70b-8192') parsed.model = 'llama-3.3-70b-versatile';
    if (parsed.model === 'gpt-oss-120b') parsed.model = 'openai/gpt-oss-120b';
    return parsed;
  });

  const [showSettings, setShowSettings] = useState(!settings.apiKey);
  const [transcript, setTranscript] = useState([]);
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const transcriptRef = useRef([]);
  const transcriptEndRef = useRef(null);
  const chatEndRef = useRef(null);
  const suggestionsTopRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    suggestionsTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [suggestionBatches]);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('twinmind_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  const exportSession = () => {
    const data = {
      sessionDate: new Date().toISOString(),
      transcript,
      suggestionBatches,
      chatMessages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinmind-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSuggestions = useCallback(async (currentTranscript) => {
    if (!settings.apiKey || !currentTranscript || currentTranscript.length === 0) return;
    try {
      const recentContext = currentTranscript.slice(-settings.suggestionContextWindow).map(t => t.text).join('\n');
      const prompt = `CONTEXT TRANSCRIPT:\n${recentContext}\n\nINSTRUCTION:\n${settings.prompts.suggestions}`;
      const response = await chatCompletion(
        [{ role: 'system', content: prompt }],
        settings.apiKey,
        settings.model
      );
      let jsonStr = response.match(/\[.*\]/s)?.[0] || response;
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const newSuggestions = JSON.parse(jsonStr);
        if (Array.isArray(newSuggestions)) {
          setSuggestionBatches(prev => [
            { id: Date.now(), suggestions: newSuggestions.slice(0, 3), timestamp: new Date().toLocaleTimeString() },
            ...prev
          ]);
        }
      } catch (e) { console.error('Suggestion parsing error:', e); }
    } catch (err) { setError('AI Suggestions failed: ' + err.message); }
  }, [settings.apiKey, settings.model, settings.prompts.suggestions, settings.suggestionContextWindow]);

  const handleNewTranscriptChunk = useCallback(async (blob) => {
    if (!settings.apiKey) return;
    setIsProcessing(true);
    setError(null);
    try {
      const text = await transcribeAudio(blob, settings.apiKey);
      if (text && text.trim()) {
        const newEntry = { text, timestamp: new Date().toLocaleTimeString() };
        transcriptRef.current = [...transcriptRef.current, newEntry];
        setTranscript(transcriptRef.current);
        await generateSuggestions(transcriptRef.current);
      }
    } catch (err) { setError('Transcription failed: ' + err.message); }
    finally { setIsProcessing(false); }
  }, [settings.apiKey, generateSuggestions]);

  const { isRecording, toggleRecording, syncChunk } = useAudioRecorder(handleNewTranscriptChunk);

  const handleManualRefresh = async () => {
    if (isRecording) {
      syncChunk(); // This will eventually trigger generateSuggestions via handleNewTranscriptChunk
    } else {
      await generateSuggestions(transcript);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    const userMsg = { 
      role: 'user', 
      content: `[Suggestion: ${suggestion.title}] ${suggestion.preview}`, 
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    try {
      const context = transcript.slice(-settings.detailContextWindow).map(t => t.text).join('\n');
      const response = await chatCompletion(
        [
          { role: 'system', content: `TRANSCRIPT CONTEXT:\n${context}\n\nSUGGESTION SELECTED: ${JSON.stringify(suggestion)}\n\nINSTRUCTION:\n${settings.prompts.detailed}` },
          { role: 'user', content: suggestion.preview }
        ],
        settings.apiKey,
        settings.model
      );
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response, 
        id: Date.now() + 1,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) { setError('Chat failed: ' + err.message); }
    finally { setIsStreaming(false); }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !settings.apiKey) return;
    const userMsg = { 
      role: 'user', 
      content: chatInput, 
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');
    setIsStreaming(true);
    try {
      const context = transcript.slice(-settings.detailContextWindow).map(t => t.text).join('\n');
      const response = await chatCompletion(
        [
          { role: 'system', content: `TRANSCRIPT CONTEXT:\n${context}\n\nINSTRUCTION:\n${settings.prompts.chat}` },
          ...chatMessages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: input }
        ],
        settings.apiKey,
        settings.model
      );
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response, 
        id: Date.now() + 1,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) { setError('Chat failed: ' + err.message); }
    finally { setIsStreaming(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f1115] text-[#9ca3af] font-sans overflow-hidden p-4 gap-4">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">TwinMind <span className="text-xs font-normal text-white/40 ml-2">— Live Suggestions Web App </span></h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={exportSession} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 uppercase tracking-widest text-[10px]">
            <Download size={14} />
            Export Session
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* Column 1: Transcript */}
        <section className="flex flex-col bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase border-b border-white/5">
            <span>1. MIC & TRANSCRIPT</span>
            <span className="text-white/40">{isRecording ? "RECORDING" : "IDLE"}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
              <button
                onClick={toggleRecording}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-inner",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#2d333b] text-brand-blue"
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
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/20 block mb-1">{item.timestamp}</span>
                  <p className="text-sm text-gray-300">{item.text}</p>
                </motion.div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </section>

        {/* Column 2: Suggestions */}
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
              <div className="p-6 rounded-lg bg-brand-blue/5 border border-brand-blue/20 text-xs text-white/60 leading-relaxed">
                On reload (or auto every ~30s), generate <span className="text-white font-bold">3 fresh suggestions</span> from recent transcript context. New batch appears at the top; older batches push down (faded). Each is a tappable card: a <span className="text-brand-blue">question to ask</span>, a <span className="text-brand-green">talking point</span>, an <span className="text-brand-yellow">answer</span>, or a <span className="text-red-400">fact-check</span>. The preview alone should already be useful.
              </div>
            ) : null}

            {isProcessing && (
              <div className="space-y-3 animate-pulse">
                <div className="h-20 bg-white/5 rounded-lg w-full" />
                <div className="h-20 bg-white/5 rounded-lg w-full" />
              </div>
            )}

            <AnimatePresence>
              {suggestionBatches.map((batch, idx) => (
                <div key={batch.id} className={cn("space-y-3", idx > 0 && "opacity-40 hover:opacity-100 transition-opacity")}>
                  {batch.suggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      className="p-4 rounded-lg bg-[#21262d] border border-white/5 hover:border-brand-blue/50 cursor-pointer transition-all shadow-xl group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <SuggestionIcon type={s.type} />
                        <span className="text-[9px] font-bold uppercase text-white/30 group-hover:text-brand-blue transition-colors">{s.type}</span>
                      </div>
                      <h3 className="text-xs font-bold text-white mb-1">{s.title}</h3>
                      <p className="text-[11px] text-white/50">{s.preview}</p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Column 3: Chat */}
        <section className="flex flex-col bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase border-b border-white/5">
            <span>3. CHAT (DETAILED ANSWERS)</span>
            <span className="text-white/40">SESSION-ONLY</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/20 text-[11px] text-white/60 leading-relaxed">
              Clicking a suggestion adds it to this chat and streams a detailed answer (separate prompt, more context). User can also type questions directly. One continuous chat per session — no login, no persistence.
            </div>

            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-white/20">
                <p className="text-sm">Click a suggestion or type a question below.</p>
              </div>
            ) : (
              chatMessages.map((m, i) => (
                <div key={i} className={cn("flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn("max-w-[90%] p-3 rounded-xl text-xs shadow-lg", m.role === 'user' ? "bg-brand-blue text-white" : "bg-white/5 text-gray-300 border border-white/5")}>
                    {m.content}
                  </div>
                  <span className="text-[9px] text-white/20 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">{m.timestamp}</span>
                </div>
              ))
            )}
            {isStreaming && <div className="h-8 w-24 bg-white/5 animate-pulse rounded-lg" />}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <form onSubmit={handleChatSubmit} className="relative">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-[#0d1117] border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-xs focus:ring-1 focus:ring-brand-blue outline-none transition-all"
              />
              <button type="submit" className="absolute right-2 top-2 text-white/40 hover:text-white transition-colors">
                <Send size={16} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[#161b22] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue to-transparent opacity-50" />
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">System Configuration</h2>
                  <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">Adjust AI behavior and API settings</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Groq API Key</label>
                      <div className="relative">
                        <input 
                          type="password"
                          value={settings.apiKey} 
                          onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} 
                          className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none transition-all shadow-inner" 
                          placeholder="gsk_..."
                        />
                      </div>
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
    </div>
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
