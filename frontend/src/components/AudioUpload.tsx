import React from 'react';
import { Download } from 'lucide-react';

interface AudioUploadProps {
  uploadedFile: File | null;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (file: File) => void;
  onSubmit: () => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ uploadedFile, onUpload, onDrop, onSubmit }) => {
  return (
    <div className={`upload-box ${uploadedFile ? 'uploaded' : ''}`}>
      <div className="file-container">
        <h6>Upload your File</h6>
        <div
          className="drag-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) onDrop(file);
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
          onChange={onUpload}
        />
        {uploadedFile && (
          <p style={{ fontSize: '0.7rem', color: '#ccc', maxWidth: '280px', marginTop: '0.5rem' }}>
            <strong>{uploadedFile.name}</strong>
          </p>
        )}
      </div>
      <button
        onClick={onSubmit}
        disabled={!uploadedFile}
        className="submit-audio-button"
      >
        Submit Audio
      </button>
    </div>
  );
};
