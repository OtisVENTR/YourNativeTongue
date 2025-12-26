/**
 * Add Speaker Modal Component
 * 
 * Modal for adding new speakers with voice sample upload.
 */

import { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { FileUpload } from './FileUpload';
import './AddSpeakerModal.css';

interface AddSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddSpeakerModal = ({ isOpen, onClose, onSuccess }: AddSpeakerModalProps) => {
  const { organization } = useAuth();
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState<'pastor' | 'worship_leader' | 'guest_speaker'>('pastor');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSpeakerName('');
      setSpeakerRole('pastor');
      setSelectedFile(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!organization) {
      setError('No organization selected');
      return;
    }

    if (!speakerName.trim()) {
      setError('Please enter a speaker name');
      return;
    }

    if (!selectedFile) {
      setError('Please upload a voice sample file');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create speaker record
      const { data: speaker, error: speakerError } = await supabase
        .from('speakers')
        .insert({
          name: speakerName.trim(),
          role: speakerRole,
          organization_id: organization.id,
          training_status: 'pending',
        })
        .select()
        .single();

      if (speakerError) throw speakerError;
      if (!speaker) throw new Error('Failed to create speaker');

      // Step 2: Upload voice sample file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${speaker.id}.${fileExt}`;
      const filePath = `${organization.id}/${speaker.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Step 3: Get audio duration (using FileUpload validation already done)
      let durationSeconds: number | null = null;
      try {
        const audio = document.createElement('audio');
        const url = URL.createObjectURL(selectedFile);
        await new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', () => {
            durationSeconds = Math.floor(audio.duration);
            URL.revokeObjectURL(url);
            resolve(null);
          });
          audio.addEventListener('error', reject);
          audio.src = url;
        });
      } catch (err) {
        console.warn('Failed to get audio duration:', err);
      }

      // Step 4: Create voice sample record
      const { error: sampleError } = await supabase
        .from('voice_samples')
        .insert({
          speaker_id: speaker.id,
          file_path: filePath,
          file_name: selectedFile.name,
          file_size_bytes: selectedFile.size,
          duration_seconds: durationSeconds,
        });

      if (sampleError) throw sampleError;

      // Step 5: Update speaker with sample duration
      if (durationSeconds) {
        await supabase
          .from('speakers')
          .update({ sample_duration_seconds: durationSeconds })
          .eq('id', speaker.id);
      }

      // Step 6: Trigger voice training Edge Function
      const { error: trainError } = await supabase.functions.invoke('train-voice', {
        body: {
          speaker_id: speaker.id,
        },
      });

      if (trainError) {
        console.error('Failed to trigger voice training:', trainError);
        // Don't throw - speaker is created, training can be retried
      }

      // Success
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error adding speaker:', err);
      setError(err.message || 'Failed to add speaker. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Speaker</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="speakerName" className="form-label">
              Speaker Name <span className="required">*</span>
            </label>
            <input
              id="speakerName"
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className="form-input"
              placeholder="Enter speaker name"
              disabled={isSubmitting}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="speakerRole" className="form-label">
              Role
            </label>
            <select
              id="speakerRole"
              value={speakerRole}
              onChange={(e) => setSpeakerRole(e.target.value as 'pastor' | 'worship_leader' | 'guest_speaker')}
              className="form-input"
              disabled={isSubmitting}
            >
              <option value="pastor">Pastor</option>
              <option value="worship_leader">Worship Leader</option>
              <option value="guest_speaker">Guest Speaker</option>
            </select>
          </div>

          <div className="form-group">
            <FileUpload
              onFileSelect={handleFileSelect}
              onError={(err) => setError(err)}
              disabled={isSubmitting}
              label="Voice Sample"
              hint="Upload a clear audio sample (MP3 or WAV) between 1-10 minutes"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
              maxSizeMB={50}
              minDurationSeconds={60}
              maxDurationSeconds={600}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting || !speakerName.trim() || !selectedFile}
            >
              {isSubmitting ? 'Adding Speaker...' : 'Add Speaker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

