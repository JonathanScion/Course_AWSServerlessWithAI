import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

const FileUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      await api.completeUpload(selectedFile, description, (percent) => {
        setProgress(percent);
      });

      // Reset form
      setSelectedFile(null);
      setDescription('');
      setProgress(0);
      setUploading(false);

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      setUploading(false);
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
    <div className="bg-white border-4 border-gray-900 rounded-none p-8 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-blue-600"></div>
        <h2 className="text-2xl font-bold text-gray-900 uppercase">Step 1: Upload File</h2>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`drop-zone rounded-none p-16 text-center mb-6 cursor-pointer ${
          isDragActive ? 'bg-blue-100' : 'bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <div>
            <svg className="mx-auto h-20 w-20 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-bold text-gray-900 mb-2 uppercase">{selectedFile.name}</p>
            <p className="text-base text-gray-600 font-medium mb-6">{formatFileSize(selectedFile.size)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="px-6 py-2 bg-red-600 text-white font-bold uppercase tracking-wide hover:bg-red-700 transition-colors border-2 border-red-600"
            >
              Remove File
            </button>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-20 w-20 text-blue-900 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xl font-bold text-gray-900 mb-2 uppercase">
              {isDragActive ? 'Drop File Here' : 'Drag & Drop File Here'}
            </p>
            <p className="text-base text-gray-600 font-medium mb-6">Or click the button below</p>
            <button
              type="button"
              className="px-8 py-3 bg-blue-900 text-white font-bold uppercase tracking-wide hover:bg-blue-800 transition-colors border-2 border-blue-900"
            >
              Choose File
            </button>
          </>
        )}
      </div>

      {/* Description Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
          File Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border-3 border-gray-900 rounded-none focus:outline-none focus:ring-4 focus:ring-blue-300 resize-none font-medium"
          rows="3"
          placeholder="Describe your file..."
          disabled={uploading}
        />
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mb-6">
          <div className="w-full h-6 bg-gray-200 border-2 border-gray-900 mb-2">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm font-bold text-gray-700 uppercase text-center">
            {progress}% Uploaded
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-3 border-red-600">
          <p className="text-red-800 font-bold">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full py-4 bg-[#ff6b5a] text-white font-bold uppercase tracking-wide hover:bg-[#ff5544] transition-colors border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
};

export default FileUpload;
