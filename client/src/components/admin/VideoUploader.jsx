import { useState, useRef } from 'react';
import api from '../../services/api';

function VideoUploader({ onUploadComplete, onRemove, currentVideoUrl }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove this video?')) {
      onRemove && onRemove();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('Video file must be less than 500MB');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (response.data.url) {
        onUploadComplete(response.data.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="video-uploader">
      {currentVideoUrl && !uploading && (
        <div className="current-video">
          <div className="current-video-header">
            <span className="video-label">Current Video</span>
            {onRemove && (
              <button 
                type="button"
                className="remove-video-btn"
                onClick={handleRemove}
                title="Remove video"
              >
                🗑️ Remove Video
              </button>
            )}
          </div>
          <video 
            src={currentVideoUrl} 
            controls 
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
          />
          <p className="video-url-display">{currentVideoUrl}</p>
        </div>
      )}

      <div className="upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleUpload}
          disabled={uploading}
          style={{ display: 'none' }}
          id="video-upload-input"
        />
        
        <label 
          htmlFor="video-upload-input" 
          className={`upload-button ${uploading ? 'uploading' : ''}`}
        >
          {uploading ? '⏳ Uploading...' : '📹 Upload Video'}
        </label>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}

        {error && (
          <div className="upload-error">
            ❌ {error}
          </div>
        )}
      </div>

      <style>{`
        .video-uploader {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .current-video {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 8px;
        }

        .current-video-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .video-label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .remove-video-btn {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-video-btn:hover {
          background: #fecaca;
          border-color: #f87171;
        }

        .video-url-display {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
          word-break: break-all;
        }

        .upload-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .upload-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: #1a365d;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .upload-button:hover:not(.uploading) {
          background: #2d4a7c;
        }

        .upload-button.uploading {
          background: #666;
          cursor: not-allowed;
        }

        .upload-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar-container {
          flex: 1;
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #c9a227, #1a365d);
          transition: width 0.3s ease;
          border-radius: 6px;
        }

        .progress-text {
          font-weight: 600;
          color: #1a365d;
          min-width: 45px;
          text-align: right;
        }

        .upload-error {
          color: #dc2626;
          padding: 8px 12px;
          background: #fef2f2;
          border-radius: 6px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default VideoUploader;
