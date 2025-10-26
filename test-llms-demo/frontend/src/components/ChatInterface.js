import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './ChatInterface.css';

function ChatInterface() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResponses(null);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        question: question.trim()
      });

      setResponses(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Failed to get responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModelColor = (modelName) => {
    if (modelName.includes('Claude')) return '#8B5CF6';
    if (modelName.includes('Llama')) return '#10B981';
    if (modelName.includes('Titan')) return '#F59E0B';
    return '#6B7280';
  };

  return (
    <div className="chat-interface">
      <form onSubmit={handleSubmit} className="question-form">
        <div className="input-container">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="question-input"
            disabled={loading}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !question.trim()}
          >
            {loading ? 'Processing...' : 'Ask'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Querying all three models...</p>
        </div>
      )}

      {responses && (
        <div className="responses-container">
          <div className="context-info">
            <strong>Question:</strong> {responses.question}
            <br />
            <strong>Context chunks found:</strong> {responses.contexts_found}
          </div>

          <div className="responses-grid">
            {responses.responses?.map((response, index) => (
              <div
                key={index}
                className="response-panel"
                style={{ borderTopColor: getModelColor(response.model) }}
              >
                <div
                  className="model-header"
                  style={{ backgroundColor: getModelColor(response.model) }}
                >
                  <h3>{response.model}</h3>
                </div>
                <div className="response-content">
                  {response.status === 'error' ? (
                    <div className="error-response">
                      <strong>Error:</strong> {response.answer}
                    </div>
                  ) : (
                    <p>{response.answer}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !responses && !error && (
        <div className="welcome-message">
          <h2>Welcome to the Multi-LLM RAG Chatbot!</h2>
          <p>Ask a question and get answers from three different AI models simultaneously.</p>
          <div className="model-info">
            <div className="model-badge claude">Claude Sonnet 4</div>
            <div className="model-badge llama">Meta Llama 3 70B</div>
            <div className="model-badge titan">Amazon Titan</div>
          </div>
          <p className="tip">Make sure you've uploaded documents in the Document Management tab first!</p>
        </div>
      )}
    </div>
  );
}

export default ChatInterface;
