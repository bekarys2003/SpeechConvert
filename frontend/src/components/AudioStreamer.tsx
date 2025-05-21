import React, { useEffect, useRef, useState } from 'react';

const AudioStreamer: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState('ru');

  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [emotion, setEmotion] = useState('');
  const lastChunkRef = useRef('');

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8000/ws/subtitles/');

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.transcript && data.transcript !== lastChunkRef.current) {
        lastChunkRef.current = data.transcript;
        setTranscript((prev) => prev + ' ' + data.transcript);
      }
      if (data.translation) setTranslation(data.translation);
      if (data.emotion && data.emotion !== emotion) setEmotion(data.emotion);
    };

    return () => socketRef.current?.close();
  }, [emotion]);

  // Toggle audio recording
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } else {
      // Clear previous results when starting a new recording
      setTranscript('');
      setTranslation('');
      setEmotion('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          if (typeof base64Audio === 'string' && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ audio: base64Audio, lang: language }));
          }
        };
        reader.readAsDataURL(fullBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>🎤 Live Subtitles</h2>

      <label>
        Translate to:
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ marginLeft: '1rem', marginBottom: '1rem' }}
        >
          <option value="ru">Russian</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>
      </label>

      <br />

      <button
        onClick={toggleRecording}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: recording ? 'red' : 'green',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>

      <div style={{
        background: '#f9f9f9',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 0 5px rgba(0,0,0,0.1)'
      }}>
        <p><strong>Transcript:</strong> {transcript.trim()}</p>
        <p><strong>Translation:</strong> {translation}</p>
        <p><strong>Emotion:</strong> {emotion}</p>
      </div>
    </div>
  );
};

export default AudioStreamer;
