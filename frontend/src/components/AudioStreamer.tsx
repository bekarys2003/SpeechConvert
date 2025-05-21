import React, { useEffect, useRef, useState } from 'react';

const AudioStreamer: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [emotion, setEmotion] = useState('');
  const lastChunkRef = useRef(''); // ✅ Track last transcript chunk

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8000/ws/subtitles/');

    socketRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.transcript && data.transcript !== lastChunkRef.current) {
        lastChunkRef.current = data.transcript;
        setTranscript((prev) => prev + ' ' + data.transcript);
      }

      if (data.translation) {
        setTranslation(data.translation);
      }

      if (data.emotion && data.emotion !== emotion) {
        setEmotion(data.emotion);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onclose = () => {
      console.log('❌ WebSocket closed');
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        mediaRecorder.start(5000); // Capture chunks every 5 seconds

        mediaRecorder.ondataavailable = (event) => {
          const audioBlob = event.data;

          if (audioBlob && audioBlob.size > 0) {
            const reader = new FileReader();

            reader.onloadend = () => {
              const base64Audio = reader.result;
              if (typeof base64Audio === 'string' && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ audio: base64Audio }));
              } else {
                console.warn("⚠️ WebSocket is not open. Skipping audio chunk.");
              }
            };

            reader.readAsDataURL(audioBlob);
          }
        };
      })
      .catch((err) => {
        console.error("🎤 Microphone access error:", err);
      });

    return () => {
      socketRef.current?.close();
    };
  }, [emotion]); // ✅ Re-render only when emotion changes

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>🎤 Live Subtitles</h2>
      <div style={{
        background: '#f9f9f9',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 0 5px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <p><strong>🗣️ Transcript:</strong> {transcript.trim()}</p>
        <p><strong>🌐 Translation:</strong> {translation}</p>
        <p><strong>😐 Emotion:</strong> {emotion}</p>
      </div>
    </div>
  );
};

export default AudioStreamer;
