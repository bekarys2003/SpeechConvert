import React, { useEffect, useRef, useState } from 'react';

const AudioStreamer: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [enableEmotion, setEnableEmotion] = useState(true);

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

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } else {
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
            socketRef.current.send(JSON.stringify({
              audio: base64Audio,
              lang: language,
              translate: enableTranslation,
              detectEmotion: enableEmotion
            }));
          }
        };
        reader.readAsDataURL(fullBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    }
  };

  const downloadTranscript = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript.trim()], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "transcript.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          <input
            type="checkbox"
            checked={enableTranslation}
            onChange={() => setEnableTranslation(prev => !prev)}
          /> Enable Translation
        </label>
        <label>
          <input
            type="checkbox"
            checked={enableEmotion}
            onChange={() => setEnableEmotion(prev => !prev)}
          /> Enable Emotion Detection
        </label>
      </div>

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

      <button
        onClick={downloadTranscript}
        disabled={!transcript.trim()}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#555',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: transcript.trim() ? 'pointer' : 'not-allowed',
          marginLeft: '1rem',
          marginBottom: '1rem'
        }}
      >
        Download Transcript
      </button>

      <div style={{
        background: '#f9f9f9',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 0 5px rgba(0,0,0,0.1)'
      }}>
        <p><strong>Transcript:</strong> {transcript.trim()}</p>
        {enableTranslation && <p><strong>Translation:</strong> {translation}</p>}
        {enableEmotion && <p><strong>Emotion:</strong> {emotion}</p>}
      </div>
    </div>
  );
};

export default AudioStreamer;
