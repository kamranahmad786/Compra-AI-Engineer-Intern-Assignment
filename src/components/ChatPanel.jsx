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
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">🎨</div>
            <h2>Layout Agent</h2>
            <p>
              Describe how you'd like to modify the design layout. I can move elements,
              resize the canvas, adjust fonts, and more.
            </p>
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isLoading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-body">
                  <div className="message-content">
                    {msg.content}
                  </div>
                  {msg.changes && msg.changes.length > 0 && (
                    <div className="message-changes">
                      <ul>
                        {msg.changes.map((c, j) => (
                          <li key={j}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {msg.error && (
                    <div className="message-error">
                      ⚠️ {msg.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-body">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit}>
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Describe a layout change..."
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
              ➤
            </button>
          </div>
        </form>
        <p className="chat-hint">Press Enter to send • Powered by Gemini AI</p>
      </div>
    </div>
  );
}
