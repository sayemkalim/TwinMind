import Groq from 'groq-sdk';

export const transcribeAudio = async (audioBlob, apiKey) => {
  if (!apiKey) throw new Error('Groq API Key is required');

  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'json',
    });

    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

export const chatCompletion = async (messages, apiKey, model = 'llama-3.3-70b-versatile', stream = false) => {
  if (!apiKey) throw new Error('Groq API Key is required');

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  try {
    const config = {
      messages,
      model,
      temperature: 0.7,
      max_completion_tokens: stream ? 8192 : 1024,
      top_p: 1,
      stream,
    };

    const response = await groq.chat.completions.create(config);

    if (stream) {
      return response;
    }

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Chat completion error:', error);
    throw error;
  }
};
