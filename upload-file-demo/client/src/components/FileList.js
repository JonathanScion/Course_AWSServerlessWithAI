import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return 'FILE';
    const ext = fileName.split('.').pop().toUpperCase();
    return ext.length > 4 ? ext.substring(0, 4) : ext;
  };

  const getFileTypeColor = (contentType) => {
    if (!contentType) return 'bg-gray-600';

    if (contentType.includes('pdf')) return 'bg-blue-900';
    if (contentType.includes('image')) return 'bg-pink-600';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'bg-green-600';
    if (contentType.includes('word') || contentType.includes('document')) return 'bg-blue-600';
    if (contentType.includes('video')) return 'bg-purple-600';
    if (contentType.includes('audio')) return 'bg-orange-600';

    return 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white border-4 border-gray-900 rounded-none p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-blue-600"></div>
          <h2 className="text-2xl font-bold text-gray-900 uppercase">Your Files</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-lg font-bold text-gray-600 uppercase">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-4 border-gray-900 rounded-none p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-blue-600"></div>
          <h2 className="text-2xl font-bold text-gray-900 uppercase">Your Files</h2>
        </div>
        <div className="p-6 bg-red-100 border-3 border-red-600 mb-4">
          <p className="text-red-800 font-bold mb-4">{error}</p>
          <button
            onClick={loadFiles}
            className="px-6 py-2 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 transition-colors border-2 border-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-gray-900 rounded-none p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-blue-600"></div>
        <h2 className="text-2xl font-bold text-gray-900 uppercase">Your Files</h2>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 border-3 border-gray-300 bg-gray-50">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-bold text-gray-600 uppercase">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file, index) => (
            <div
              key={file.fileId}
              className={`border-3 border-gray-900 p-6 ${
                index % 2 === 0 ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${getFileTypeColor(file.contentType)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">
                        {getFileExtension(file.fileName)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg break-all">
                      {file.fileName}
                    </h3>
                  </div>

                  {file.description && (
                    <p className="text-gray-700 mb-3 font-medium">{file.description}</p>
                  )}

                  <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-600 uppercase">
                    <span>Size: {formatFileSize(file.actualFileSize || file.fileSize)}</span>
                    <span>Type: {file.contentType}</span>
                    <span>Uploaded: {formatDate(file.completedTimestamp || file.uploadTimestamp)}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDownload(file.fileId, file.fileName)}
                    className="w-12 h-12 bg-gray-900 text-white hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(file.fileId)}
                    disabled={deletingId === file.fileId}
                    className="w-12 h-12 bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {deletingId === file.fileId ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
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
