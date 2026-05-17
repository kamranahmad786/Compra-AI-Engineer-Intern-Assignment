import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ onSendMessage, messages, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = [
    'Convert this design to 9:16',
    'Make the headline smaller',
    'Move the headline to the top',
    'Keep the product large',
    'Move the offer badge higher',
    'Change headline color to yellow',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (suggestion) => {
    if (isLoading) return;
    onSendMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div className="chat-panel-status">
          <span className="pulsing-dot" />
          AI Layout Copilot Active
        </div>
        <div className="chat-panel-model">Gemini 3 Flash</div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">⚡</div>
            <h2>AI Layout Agent</h2>
            <p>
              Collaborate in natural language to redesign, resize, re-align, and transform your graphics layouts on the fly.
            </p>
            <div className="welcome-divider">SUGGESTED TRANSFORMATIONS</div>
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isLoading}
                >
                  <span>✦</span> {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-header-row">
                  <span className="avatar-icon">
                    {msg.role === 'user' ? '👤 User' : '🤖 AI Copilot'}
                  </span>
                </div>
                
                <div className="message-body">
                  <div className="message-content">
                    {msg.content}
                  </div>
                  
                  {msg.changes && msg.changes.length > 0 && (
                    <div className="message-changes-card">
                      <div className="changes-header">
                        <span>📋 Layout Mutation Log</span>
                        <span className="changes-count">{msg.changes.length} adjustments</span>
                      </div>
                      <ul className="changes-list">
                        {msg.changes.map((c, j) => (
                          <li key={j} className="change-item">
                            <span className="change-bullet">+</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {msg.error && (
                    <div className="message-error-card">
                      <div className="error-title">⚠️ Operation Aborted</div>
                      <div className="error-body">{msg.error}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant loading">
                <div className="message-header-row">
                  <span className="avatar-icon">🤖 Thinking...</span>
                </div>
                <div className="message-body">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Toolbar Above Input */}
      {messages.length > 0 && (
        <div className="mini-suggestions-bar">
          {suggestions.slice(0, 3).map((s, i) => (
            <button
              key={i}
              className="mini-suggestion-btn"
              onClick={() => handleSuggestionClick(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit}>
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="E.g., Make headline smaller and shift it upwards..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="chat-input"
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isLoading}
              id="chat-send-btn"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
        <p className="chat-hint">Press Enter to dispatch layout transformation instruction</p>
      </div>
    </div>
  );
}
