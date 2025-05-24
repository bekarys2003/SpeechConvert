import React, { useEffect, useRef, useState } from 'react';
import '../static/AudioStreamer.css';
import AudioCircle from './AudioCircle';
import { AudioUpload } from './AudioUpload';

const AudioStreamer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [enableEmotion, setEnableEmotion] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [emotion, setEmotion] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const lastChunkRef = useRef('');

  const initWebSocket = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket('ws://localhost:8000/ws/subtitles/');
    socketRef.current = socket;

    socket.onopen = () => console.log('[WebSocket] Connected');
    socket.onerror = (err) => console.error('[WebSocket] Error:', err);
    socket.onclose = () => {
      console.warn('[WebSocket] Disconnected');
      socketRef.current = null;
    };

    socket.onmessage = (event) => {
      setLoading(false);
      const data = JSON.parse(event.data);

      if (data.error) {
        alert(`Backend error: ${data.error}`);
        return;
      }

      if (data.transcript && !transcript.trim().endsWith(data.transcript.trim())) {
        lastChunkRef.current = data.transcript;
        setTranscript((prev) => prev + ' ' + data.transcript);
      }

      if (data.translation) setTranslation(data.translation);
      if (data.emotion && data.emotion !== emotion) setEmotion(data.emotion);
    };
  };

  useEffect(() => {
    initWebSocket();
  }, []);

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      audioContextRef.current?.close();
      setRecording(false);
    } else {
      setTranscript('');
      setTranslation('');
      setEmotion('');
      setRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: 'audio/webm' });
        sendBlobToSocket(fullBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    }
  };

  const sendBlobToSocket = (blob: Blob) => {
    setLoading(true);
    initWebSocket();

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      if (typeof base64Audio === 'string' && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            audio: base64Audio,
            lang: language,
            translate: enableTranslation,
            detectEmotion: enableEmotion,
          })
        );
      } else {
        console.warn('WebSocket not ready or encoding failed');
        alert('Failed to send audio: WebSocket not ready or encoding error.');
        setLoading(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read audio file.');
      setLoading(false);
    };
    reader.readAsDataURL(blob);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmitFile = () => {
    if (!uploadedFile || loading) return;
    setTranscript('');
    setTranslation('');
    setEmotion('');
    sendBlobToSocket(uploadedFile);
  };

  const downloadTranscript = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript.trim()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transcript.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="audio-container">
      <h2>SpeechConvert</h2>



      <div className="controls-container">
        <div className="side-options">
          <div className="settings-container">
            <div className="checkbox-group">
              <label className="checkbox-wrapper">
                <input type="checkbox" checked={enableTranslation} onChange={() => setEnableTranslation(p => !p)} />
                <span className="custom-checkbox"></span> Translation
              </label>
              <label className="checkbox-wrapper">
                <input type="checkbox" checked={enableEmotion} onChange={() => setEnableEmotion(p => !p)} />
                <span className="custom-checkbox"></span> Emotion Detection
              </label>
            </div>
            {enableTranslation && (
              <label className="language-select">
                Translate to:
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="kk">Kazakh</option>
                  <option value="ru">Russian</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </label>
            )}
          </div>
          <button className="download-button" onClick={downloadTranscript} disabled={!transcript.trim()}>
            Download Transcript
          </button>
        </div>
        <div className="recording-column">
          <AudioCircle recording={recording} onClick={toggleRecording} />
        </div>

        <AudioUpload
          uploadedFile={uploadedFile}
          onUpload={handleFileUpload}
          onDrop={(file) => setUploadedFile(file)}
          onSubmit={handleSubmitFile}
        />
      </div>

      <div className="transcript-box">
        <p><strong>Transcript:</strong> {transcript.trim()}</p>
        {loading && <p style={{ color: 'orange' }}><em>Loading...</em></p>}
        {enableTranslation && <p><strong>Translation:</strong> {translation}</p>}
        {enableEmotion && <p><strong>Emotion:</strong> {emotion}</p>}
      </div>
    </div>
  );
};

export default AudioStreamer;
