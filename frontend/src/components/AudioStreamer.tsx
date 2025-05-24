import React, { useEffect, useRef, useState } from 'react';
import '../static/AudioStreamer.css';
import { Mic, Download } from 'lucide-react';

const AudioStreamer: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [recording, setRecording] = useState(false);
  const [circleScale, setCircleScale] = useState(1);

  const [language, setLanguage] = useState('ru');
  const [enableTranslation, setEnableTranslation] = useState(true);
  const [enableEmotion, setEnableEmotion] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [emotion, setEmotion] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const lastChunkRef = useRef('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/subtitles/');
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        alert(`Backend error: ${data.error}`);
        return;
      }
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
      audioContextRef.current?.close();
      setRecording(false);
    } else {
      setTranscript('');
      setTranslation('');
      setEmotion('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        if (!recording || !analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setCircleScale(1 + volume / 200);
        requestAnimationFrame(animate);
      };
      animate();

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
      setRecording(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmitFile = () => {
    if (!uploadedFile) return;
    setTranscript('');
    setTranslation('');
    setEmotion('');
    sendBlobToSocket(uploadedFile);
  };

  const sendBlobToSocket = (blob: Blob) => {
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
    reader.readAsDataURL(blob);
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
    <div className="audio-container">
      <h2>SpeechConvert</h2>

      <div className="controls-container">
        <div className="side-options">
          <div className="settings-container">
            <div className="checkbox-group">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={enableTranslation}
                  onChange={() => setEnableTranslation(prev => !prev)}
                />
                <span className="custom-checkbox"></span>
                Translation
              </label>
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={enableEmotion}
                  onChange={() => setEnableEmotion(prev => !prev)}
                />
                <span className="custom-checkbox"></span>
                Emotion Detection
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
          <button
            onClick={toggleRecording}
            className={`circle-button ${recording ? 'recording' : ''}`}
            style={{ transform: `scale(${circleScale})` }}
          >
            {recording ? 'Stop' : <Mic size={'40px'} />}
          </button>
        </div>

        <div className="upload-box">
          <div className="file-container">
            <h6>Upload your File</h6>
            <div
              className="drag-area"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) setUploadedFile(file);
              }}
              onClick={() => document.getElementById('fileUpload')?.click()}
            >
              <div className="icon"><Download size={24} /></div>
              <span className="header">Drag & Drop</span>
              <span className="header">or <span className="button">Browse</span></span>
              <span className="support">Supports: MP3, WAV, WEBM</span>
            </div>
            <input
              id="fileUpload"
              className="file-hidden"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
            />
          </div>
          <button
            onClick={handleSubmitFile}
            disabled={!uploadedFile}
            className="submit-audio-button"
          >
            Submit Audio
          </button>
        </div>
      </div>

      <div className="transcript-box">
        <p><strong>Transcript:</strong> {transcript.trim()}</p>
        {enableTranslation && <p><strong>Translation:</strong> {translation}</p>}
        {enableEmotion && <p><strong>Emotion:</strong> {emotion}</p>}
      </div>
    </div>
  );
};

export default AudioStreamer;
