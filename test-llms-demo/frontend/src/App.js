import React, { useState } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="App">
      <header className="app-header">
        <h1>Multi-LLM RAG Chatbot</h1>
        <p className="subtitle">Compare Claude Sonnet 4, Meta Llama 3, and Amazon Titan</p>
      </header>

      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Document Management
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'chat' ? <ChatInterface /> : <DocumentManager />}
      </div>
    </div>
  );
}

export default App;
