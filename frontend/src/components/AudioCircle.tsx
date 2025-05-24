import React, { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import '../static/AudioStreamer.css';

type AudioCircleProps = {
  recording: boolean;
  onClick: () => void;
};

const AudioCircle: React.FC<AudioCircleProps> = ({ recording, onClick }) => {
  const [scale, setScale] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!recording) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setScale(1);
      return;
    }

    const setup = async () => {
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
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setScale(1 + volume / 200);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    };

    setup();
  }, [recording]);

  return (
    <button
      onClick={onClick}
      className={`circle-button ${recording ? 'recording' : ''}`}
      style={{ transform: `scale(${scale})` }}
    >
      {recording ? 'Stop' : <Mic size={'40px'} />}
    </button>
  );
};

export default AudioCircle;
