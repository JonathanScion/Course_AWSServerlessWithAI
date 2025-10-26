import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './DocumentManager.css';

function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/documents`);
      setDocuments(response.data.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check file type
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.md'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type ${fileExtension} not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Read file as base64
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64Content = e.target.result.split(',')[1];

        try {
          await axios.post(`${API_URL}/documents`, {
            fileName: file.name,
            fileContent: base64Content,
            contentType: file.type || 'application/octet-stream'
          });

          setSuccess(`File "${file.name}" uploaded successfully! Knowledge base sync started.`);
          loadDocuments();
        } catch (err) {
          console.error('Upload error:', err);
          setError(err.response?.data?.error || 'Failed to upload file');
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process file');
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = ''; // Reset input
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm(`Are you sure you want to delete "${documentId}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/documents/${encodeURIComponent(documentId)}`);
      setSuccess(`Document "${documentId}" deleted successfully!`);
      loadDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/sync`);
      setSuccess('Knowledge base sync started!');
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.response?.data?.error || 'Failed to sync knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="document-manager">
      <div className="manager-header">
        <h2>Document Management</h2>
        <button onClick={handleSync} disabled={loading} className="sync-button">
          Sync Knowledge Base
        </button>
      </div>

      {error && (
        <div className="message error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="message success-message">
          {success}
        </div>
      )}

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          onChange={handleFileInput}
          disabled={uploading}
          accept=".pdf,.txt,.doc,.docx,.md"
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="upload-label">
          {uploading ? (
            <>
              <div className="spinner-small"></div>
              <p>Uploading...</p>
            </>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p className="upload-hint">PDF, TXT, DOC, DOCX, MD (max 10MB)</p>
            </>
          )}
        </label>
      </div>

      <div className="documents-section">
        <h3>Uploaded Documents ({documents.length})</h3>

        {loading && documents.length === 0 ? (
          <div className="loading-state">
            <div className="spinner-small"></div>
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <p>No documents uploaded yet.</p>
            <p>Upload some documents to get started!</p>
          </div>
        ) : (
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="document-info">
                  <div className="document-icon">📄</div>
                  <div className="document-details">
                    <div className="document-name">{doc.name}</div>
                    <div className="document-meta">
                      {formatFileSize(doc.size)} • {new Date(doc.lastModified).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="delete-button"
                  title="Delete document"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentManager;
