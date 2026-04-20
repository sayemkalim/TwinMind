# TwinMind — Live Conversation Intelligence

TwinMind is a premium, real-time conversation assistant that transcribes live audio, surfaces context-aware suggestions, and provides an interactive chat interface for deep-dives during meetings or interviews.

![TwinMind Architecture](https://img.shields.io/badge/Architecture-3--Column-blue)
![Models](https://img.shields.io/badge/Models-Groq--Whisper--Llama-orange)
![Tech](https://img.shields.io/badge/Stack-React--Vite--Tailwind-blueviolet)

## 🚀 Key Features

- **Live Transcription**: Powered by **Groq Whisper Large V3**, providing near-instant audio-to-text in 30-second chunks.
- **Smart Suggestions**: An AI engine that analyzes your conversation context to surface:
    - ❓ **Questions to ask**
    - 💡 **Talking points**
    - ✅ **Direct answers** to raised questions
    - 🔍 **Fact-checks** for live data verification
- **Interactive Deep-Dives**: Click any suggestion to get a detailed, actionable breakdown in the persistent chat column.
- **Persistent Chat**: A dedicated space for manual follow-up questions and AI assistance.
- **Session Export**: One-click export of your entire session (transcript + suggestions + chat) for evaluation or records.
- **Pro Settings**: Full control over Groq API keys, model selection (Llama 3.3, Mixtral, etc.), and custom prompt engineering.

## 🛠️ Technology Stack

- **Framework**: [React 18+](https://reactjs.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: Tailwind CSS with custom Glassmorphism effects
- **AI Infrastructure**: [Groq Cloud SDK](https://groq.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: Lucide React

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- A [Groq API Key](https://console.groq.com/keys)

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd twinmind
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Setup
1. Open the application in your browser.
2. Click the **Settings (Gear Icon)** in the top right.
3. Paste your **Groq API Key**.
4. Select your preferred model (e.g., `Llama 3.3 70B Versatile`).
5. Click **Save Configuration**.
6. Hit the **Microphone Icon** to start your session!

## 📄 Session Export
At the end of your meeting, use the **EXPORT SESSION** button. This will download a `.json` file containing:
- Full transcript with timestamps.
- All suggestion batches generated.
- Full chat history between you and the AI.

## ⚖️ Privacy & Security
TwinMind processes audio in real-time through the Groq API. No data is persisted on any backend; all session data is stored in-memory during the session and cleared upon page reload. Your API key is stored securely in your browser's local storage.

---
