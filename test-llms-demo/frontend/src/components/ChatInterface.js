import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './ChatInterface.css';

function ChatInterface() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // NEW: Chat history for each model - array of {question, answer, status} objects
  const [chatHistory, setChatHistory] = useState({
    claude: [],
    llama: [],
    titan: []
  });

  // NEW: Refs for auto-scrolling to bottom of each chat box
  const claudeRef = useRef(null);
  const llamaRef = useRef(null);
  const titanRef = useRef(null);

  // NEW: Auto-scroll to bottom when chat history changes
  useEffect(() => {
    claudeRef.current?.scrollTo(0, claudeRef.current.scrollHeight);
    llamaRef.current?.scrollTo(0, llamaRef.current.scrollHeight);
    titanRef.current?.scrollTo(0, titanRef.current.scrollHeight);
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    const currentQuestion = question.trim();
    setLoading(true);
    setError(null);

    // NEW: Clear input immediately after submission (like chat apps)
    setQuestion('');

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        question: currentQuestion
      });

      // NEW: Add responses to chat history for each model
      const newHistory = { ...chatHistory };

      response.data.responses?.forEach((modelResponse) => {
        const modelKey = getModelKey(modelResponse.model);
        if (modelKey) {
          newHistory[modelKey] = [
            ...newHistory[modelKey],
            {
              question: currentQuestion,
              answer: modelResponse.answer,
              status: modelResponse.status,
              timestamp: new Date().toISOString()
            }
          ];
        }
      });

      setChatHistory(newHistory);

    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Failed to get responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Map model names to keys
  const getModelKey = (modelName) => {
    if (modelName.includes('Claude')) return 'claude';
    if (modelName.includes('Llama')) return 'llama';
    if (modelName.includes('Titan')) return 'titan';
    return null;
  };

  const getModelColor = (modelKey) => {
    if (modelKey === 'claude') return '#8B5CF6';
    if (modelKey === 'llama') return '#10B981';
    if (modelKey === 'titan') return '#F59E0B';
    return '#6B7280';
  };

  const getModelName = (modelKey) => {
    if (modelKey === 'claude') return 'Claude 3.7 Sonnet';
    if (modelKey === 'llama') return 'Meta Llama 3 70B';
    if (modelKey === 'titan') return 'Amazon Titan Express';
    return modelKey;
  };

  // NEW: Render a single chat box with history
  const renderChatBox = (modelKey, ref) => {
    const history = chatHistory[modelKey];
    const hasHistory = history && history.length > 0;

    return (
      <div className="chat-box" style={{ borderTopColor: getModelColor(modelKey) }}>
        <div
          className="chat-header"
          style={{ backgroundColor: getModelColor(modelKey) }}
        >
          <h3>{getModelName(modelKey)}</h3>
        </div>

        <div className="chat-messages" ref={ref}>
          {!hasHistory && !loading && (
            <div className="empty-chat">
              <p>Ask a question to start chatting with {getModelName(modelKey)}!</p>
            </div>
          )}

          {history?.map((message, index) => (
            <div key={index} className="message-pair">
              {/* User question */}
              <div className="message user-message">
                <div className="message-content">
                  <strong>You:</strong> {message.question}
                </div>
              </div>

              {/* AI answer */}
              <div className={`message ai-message ${message.status === 'error' ? 'error' : ''}`}>
                <div className="message-content">
                  <strong>{getModelName(modelKey)}:</strong>
                  {message.status === 'error' ? (
                    <span className="error-text"> {message.answer}</span>
                  ) : (
                    <span> {message.answer}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* NEW: Show loading indicator in each box */}
          {loading && (
            <div className="message ai-message loading-message">
              <div className="message-content">
                <strong>{getModelName(modelKey)}:</strong>
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // NEW: Clear all chat history
  const handleClearHistory = () => {
    if (window.confirm('Clear all chat history?')) {
      setChatHistory({
        claude: [],
        llama: [],
        titan: []
      });
    }
  };

  return (
    <div className="chat-interface">
      {/* NEW: Show welcome message only when no history */}
      {!loading && chatHistory.claude.length === 0 && chatHistory.llama.length === 0 && chatHistory.titan.length === 0 && (
        <div className="welcome-message">
          <h2>Welcome to the Multi-LLM RAG Chatbot!</h2>
          <p>Ask a question and get answers from three different AI models simultaneously.</p>
          <div className="model-info">
            <div className="model-badge claude">Claude 3.7 Sonnet</div>
            <div className="model-badge llama">Meta Llama 3 70B</div>
            <div className="model-badge titan">Amazon Titan</div>
          </div>
          <p className="tip">Make sure you've uploaded documents in the Document Management tab first!</p>
        </div>
      )}

      {/* NEW: Three chat boxes side by side */}
      <div className="chat-grid">
        {renderChatBox('claude', claudeRef)}
        {renderChatBox('llama', llamaRef)}
        {renderChatBox('titan', titanRef)}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* NEW: Input fixed at bottom */}
      <div className="input-section">
        <form onSubmit={handleSubmit} className="question-form">
          <div className="input-container">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="question-input"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !question.trim()}
            >
              {loading ? 'Processing...' : 'Send'}
            </button>
            {/* NEW: Clear history button */}
            {(chatHistory.claude.length > 0 || chatHistory.llama.length > 0 || chatHistory.titan.length > 0) && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="clear-button"
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
