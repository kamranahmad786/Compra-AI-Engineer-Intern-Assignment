import { useState, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import WireframePreview from './components/WireframePreview';
import JsonViewer from './components/JsonViewer';
import LayerTree from './components/LayerTree';
import { initialDesignJson } from './data/designJson';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [designJson, setDesignJson] = useState(initialDesignJson);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [apiStatus, setApiStatus] = useState('connected');

  const handleSendMessage = useCallback(async (message) => {
    // Add user message
    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          designJson,
          chatHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
            updatedJson: m.updatedJson || null,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process instruction');
      }

      // Update the design JSON
      setDesignJson(data.updatedJson);

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.message || 'Layout updated successfully!',
        changes: data.changes || [],
        updatedJson: data.updatedJson,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setApiStatus('connected');

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I encountered an issue processing your request.',
        error: error.message,
      };
      setMessages(prev => [...prev, errorMessage]);
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        setApiStatus('disconnected');
      }
    } finally {
      setIsLoading(false);
    }
  }, [designJson, messages]);

  const handleReset = () => {
    setDesignJson(initialDesignJson);
    setMessages([]);
  };

  const tabs = [
    { id: 'preview', label: 'Preview', icon: '🎨' },
    { id: 'json', label: 'JSON Output', icon: '{ }' },
    { id: 'layers', label: 'Layers', icon: '📑' },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">C</div>
          <div>
            <div className="header-title">Compra Layout Agent</div>
            <div className="header-subtitle">AI-Powered Design Transformer</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-badge">
            <span className={`dot`} style={{
              background: apiStatus === 'connected' ? 'var(--accent-success)' : 'var(--accent-error)',
              boxShadow: apiStatus === 'connected' 
                ? '0 0 8px rgba(16, 185, 129, 0.5)' 
                : '0 0 8px rgba(239, 68, 68, 0.5)',
            }} />
            {apiStatus === 'connected' ? 'Gemini Connected' : 'Disconnected'}
          </div>
          <button className="btn-reset" onClick={handleReset} id="reset-btn">
            ↺ Reset
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Chat Panel */}
        <ChatPanel
          onSendMessage={handleSendMessage}
          messages={messages}
          isLoading={isLoading}
        />

        {/* Preview Panel */}
        <div className="preview-panel">
          {/* Tabs */}
          <div className="preview-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`preview-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                id={`tab-${tab.id}`}
              >
                <span className="preview-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'preview' && (
            <WireframePreview designJson={designJson} />
          )}
          {activeTab === 'json' && (
            <JsonViewer designJson={designJson} />
          )}
          {activeTab === 'layers' && (
            <LayerTree designJson={designJson} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
