import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    // Trigger file list refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>File Upload Demo</h1>
        <p>Upload, manage, and download your files</p>
      </header>

      <main className="App-main">
        <div className="container">
          <FileUpload onUploadComplete={handleUploadComplete} />
          <FileList refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <footer className="App-footer">
        <p>
          Powered by AWS Lambda, S3, DynamoDB, API Gateway, CloudFront, and React
        </p>
      </footer>
    </div>
  );
}

export default App;
