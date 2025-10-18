import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    // Trigger file list refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-4 border-gray-900">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 uppercase tracking-tight">
            File Manager
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            Upload, organize, and manage your documents
          </p>
        </div>

        {/* Upload Section */}
        <FileUpload onUploadComplete={handleUploadComplete} />

        {/* Files List */}
        <FileList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

export default App;
