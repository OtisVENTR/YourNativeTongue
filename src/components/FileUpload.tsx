/**
 * File Upload Component
 * 
 * Reusable file upload component with drag-and-drop support,
 * file validation (type, size, duration), and upload progress.
 */

import { useState, useRef, useCallback } from 'react';
import './FileUpload.css';

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  onFileSelect: (file: File) => Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export const FileUpload = ({
  accept = 'audio/mpeg,audio/mp3,audio/wav,audio/x-wav',
  maxSizeMB = 50,
  minDurationSeconds = 60,
  maxDurationSeconds = 600,
  onFileSelect,
  onError,
  disabled = false,
  label = 'Upload File',
  hint,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    const validExtensions = ['.mp3', '.wav'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Invalid file type. Please upload an MP3 or WAV file.' };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
    }

    // Check audio duration
    try {
      const duration = await getAudioDuration(file);
      if (duration < minDurationSeconds) {
        return { valid: false, error: `Audio duration must be at least ${Math.floor(minDurationSeconds / 60)} minutes.` };
      }
      if (duration > maxDurationSeconds) {
        return { valid: false, error: `Audio duration must not exceed ${Math.floor(maxDurationSeconds / 60)} minutes.` };
      }
    } catch (err) {
      return { valid: false, error: 'Failed to read audio file. Please ensure it is a valid audio file.' };
    }

    return { valid: true };
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      // Clean up previous audio element if it exists
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve(duration);
      });

      audio.addEventListener('error', (e) => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        reject(new Error('Failed to load audio metadata'));
      });

      audio.src = url;
    });
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSelectedFile(null);

    // Validate file
    const validation = await validateFile(file);
    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid file';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await onFileSelect(file);
      setUploadProgress(100);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      onError?.(errorMsg);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onFileSelect, onError, maxSizeMB, minDurationSeconds, maxDurationSeconds]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="file-upload">
      {label && (
        <label className="file-upload__label">
          {label}
        </label>
      )}

      <div
        className={`file-upload__dropzone ${isDragging ? 'file-upload__dropzone--dragging' : ''} ${disabled ? 'file-upload__dropzone--disabled' : ''} ${selectedFile ? 'file-upload__dropzone--has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="file-upload__input"
        />

        {isUploading ? (
          <div className="file-upload__uploading">
            <div className="file-upload__progress">
              <div 
                className="file-upload__progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="file-upload__progress-text">Uploading... {uploadProgress}%</p>
          </div>
        ) : selectedFile ? (
          <div className="file-upload__file-info">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="file-upload__file-details">
              <p className="file-upload__file-name">{selectedFile.name}</p>
              <p className="file-upload__file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        ) : (
          <div className="file-upload__empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="file-upload__empty-text">
              Drag and drop a file here, or click to browse
            </p>
            <p className="file-upload__empty-hint">
              MP3 or WAV, {Math.floor(minDurationSeconds / 60)}-{Math.floor(maxDurationSeconds / 60)} min, max {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="file-upload__error" role="alert">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="file-upload__hint">
          {hint}
        </p>
      )}
    </div>
  );
};

