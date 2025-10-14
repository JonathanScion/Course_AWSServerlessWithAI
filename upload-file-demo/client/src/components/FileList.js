import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './FileList.css';

const FileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const fileList = await api.listFiles();
      setFiles(fileList);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      await api.downloadFile(fileId, fileName);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file: ' + err.message);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingId(fileId);

    try {
      await api.deleteFile(fileId);
      await loadFiles(); // Refresh the list
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete file: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="file-list-container">
        <h2>Uploaded Files</h2>
        <div className="loading">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list-container">
        <h2>Uploaded Files</h2>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadFiles} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h2>Uploaded Files ({files.length})</h2>
        <button onClick={loadFiles} className="refresh-btn" title="Refresh">
          Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="no-files">
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="file-grid">
          {files.map((file) => (
            <div key={file.fileId} className="file-card">
              <div className="file-card-header">
                <h3 className="file-card-name" title={file.fileName}>
                  {file.fileName}
                </h3>
                <div className="file-card-actions">
                  <button
                    onClick={() => handleDownload(file.fileId, file.fileName)}
                    className="action-btn download-btn"
                    title="Download"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.fileId)}
                    className="action-btn delete-btn"
                    disabled={deletingId === file.fileId}
                    title="Delete"
                  >
                    {deletingId === file.fileId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div className="file-card-body">
                {file.description && (
                  <div className="file-description">
                    <strong>Description:</strong>
                    <p>{file.description}</p>
                  </div>
                )}

                <div className="file-metadata">
                  <div className="metadata-item">
                    <span className="metadata-label">Size:</span>
                    <span className="metadata-value">
                      {formatFileSize(file.actualFileSize || file.fileSize)}
                    </span>
                  </div>

                  <div className="metadata-item">
                    <span className="metadata-label">Type:</span>
                    <span className="metadata-value">{file.contentType}</span>
                  </div>

                  <div className="metadata-item">
                    <span className="metadata-label">Uploaded:</span>
                    <span className="metadata-value">
                      {formatDate(file.completedTimestamp || file.uploadTimestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
