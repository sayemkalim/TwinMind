import React, { useState, useEffect, useRef, useCallback } from 'react';
import { transcribeAudio, chatCompletion } from './services/groq';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

// Components
import Header from './components/Header';
import TranscriptColumn from './components/TranscriptColumn';
import SuggestionsColumn from './components/SuggestionsColumn';
import ChatColumn from './components/ChatColumn';
import SettingsModal from './components/SettingsModal';

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
      syncChunk();
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
      <Header onExport={exportSession} onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        <TranscriptColumn 
          transcript={transcript} 
          isRecording={isRecording} 
          toggleRecording={toggleRecording} 
          transcriptEndRef={transcriptEndRef}
          cn={cn}
        />

        <SuggestionsColumn 
          suggestionBatches={suggestionBatches}
          isProcessing={isProcessing}
          handleManualRefresh={handleManualRefresh}
          handleSuggestionClick={handleSuggestionClick}
          isRecording={isRecording}
          transcript={transcript}
          suggestionsTopRef={suggestionsTopRef}
          cn={cn}
        />

        <ChatColumn 
          chatMessages={chatMessages}
          isStreaming={isStreaming}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleChatSubmit={handleChatSubmit}
          chatEndRef={chatEndRef}
          cn={cn}
        />
      </main>

      <SettingsModal 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settings={settings}
        setSettings={setSettings}
        saveSettings={saveSettings}
      />

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs backdrop-blur-md z-50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}
    </div>
  );
}
