import { useState, useCallback, useMemo } from 'react';
import ChatPanel from './components/ChatPanel';
import WireframePreview from './components/WireframePreview';
import JsonViewer from './components/JsonViewer';
import LayerTree from './components/LayerTree';
import Inspector from './components/Inspector';
import { initialDesignJson } from './data/designJson';

const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.PROD ? '' : 'http://localhost:3001');

function App() {
  const [designJson, setDesignJson] = useState(initialDesignJson);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rightActiveTab, setRightActiveTab] = useState('specs');
  const [visualMode, setVisualMode] = useState('mockup'); // 'mockup' | 'wireframe'
  const [apiStatus, setApiStatus] = useState('connected');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Keep track of design revisions history for timeline
  const [revisions, setRevisions] = useState([
    {
      id: 'rev_initial',
      timestamp: new Date().toLocaleTimeString(),
      description: 'Initial Template Loaded',
      changesCount: 0,
    }
  ]);

  const handleSendMessage = useCallback(async (message) => {
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

      // Record a new layout revision in the timeline
      const newRevId = `rev_${Date.now()}`;
      setRevisions(prev => [
        {
          id: newRevId,
          timestamp: new Date().toLocaleTimeString(),
          description: message,
          changesCount: data.changes?.length || 0,
        },
        ...prev
      ]);

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
    setSelectedNodeId(null);
    setRevisions([
      {
        id: 'rev_initial',
        timestamp: new Date().toLocaleTimeString(),
        description: 'Initial Template Loaded',
        changesCount: 0,
      }
    ]);
  };

  const handleSelectNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Real-time properties updater from inspector
  const handleChangeNodeProperty = useCallback((nodeId, path, value) => {
    setDesignJson(prev => {
      if (!prev?.nodes || !prev.nodes[nodeId]) return prev;
      
      const updatedNodes = { ...prev.nodes };
      const node = { ...updatedNodes[nodeId] };
      
      const keys = path.split('.');
      let current = node;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      // Auto-recalculate normalized values relative to the artboard
      const artboard = Object.values(updatedNodes).find(n => n.type === 'artboard');
      if (artboard && nodeId !== artboard.id) {
        if (['x', 'y', 'width', 'height'].some(k => path.includes(k))) {
          node.nx = node.x / artboard.width;
          node.ny = node.y / artboard.height;
          node.nw = node.width / artboard.width;
          node.nh = node.height / artboard.height;
        }
      }
      
      updatedNodes[nodeId] = node;
      
      return {
        ...prev,
        nodes: updatedNodes
      };
    });
  }, []);

  // Quick Action transformations
  const handleQuickAction = (action) => {
    switch (action) {
      case '916':
        handleSendMessage('Convert this design to 9:16');
        break;
      case 'headline-top':
        handleSendMessage('Move the headline to the top');
        break;
      case 'product-large':
        handleSendMessage('Keep the product large');
        break;
      case 'headline-small':
        handleSendMessage('Make the headline smaller');
        break;
      case 'offer-higher':
        handleSendMessage('Move the offer badge higher');
        break;
      default:
        break;
    }
  };

  const rightTabs = [
    { id: 'specs', label: 'Specs', icon: '🎛️' },
    { id: 'layers', label: 'Layers', icon: '📑' },
    { id: 'json', label: 'Schema', icon: '📂' },
    { id: 'history', label: 'Revisions', icon: '📜' },
  ];

  return (
    <div className="app-container">
      {/* Sleek Enterprise Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <img src="/compra-logo.svg" alt="Compra Logo" className="brand-logo-img" />
          <div className="header-breadcrumbs">
            <span className="breadcrumb-root">Projects</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-folder">Designs</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-active">Instagram Post Studio</span>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="header-right-side">
          <div className={`status-pill ${apiStatus}`}>
            <span className="status-dot" />
            Engine: Gemini 3 Flash
          </div>
          <button className="btn-reset" onClick={handleReset} id="reset-btn">
            ↺ Reset Layout
          </button>
        </div>
      </header>

      {/* Main Studio Arena */}
      <div className="main-content">
        {/* Column 1: AI Assistant docked sidebar */}
        <div className="left-panel-wrapper">
          <ChatPanel
            onSendMessage={handleSendMessage}
            messages={messages}
            isLoading={isLoading}
          />
        </div>

        {/* Column 2: Central Graphic Workspace */}
        <div className="center-workspace">
          {/* Quick Preset Action Bar */}
          <div className="quick-actions-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-label">Quick Actions:</span>
              <button className="toolbar-btn" onClick={() => handleQuickAction('916')}>📱 9:16 Portrait</button>
              <button className="toolbar-btn" onClick={() => handleQuickAction('headline-top')}>⬆️ Headline Top</button>
              <button className="toolbar-btn" onClick={() => handleQuickAction('product-large')}>🛋️ Large Product</button>
              <button className="toolbar-btn" onClick={() => handleQuickAction('headline-small')}>🔎 Smaller Text</button>
              <button className="toolbar-btn" onClick={() => handleQuickAction('offer-higher')}>⭐ Offer High</button>
            </div>
            
            <div className="visual-mode-toggle">
              <button 
                className={`mode-btn ${visualMode === 'mockup' ? 'active' : ''}`}
                onClick={() => setVisualMode('mockup')}
              >
                Mockup Mode
              </button>
              <button 
                className={`mode-btn ${visualMode === 'wireframe' ? 'active' : ''}`}
                onClick={() => setVisualMode('wireframe')}
              >
                Blueprint Mode
              </button>
            </div>
          </div>

          {/* Dotted Figma Grid Preview Canvas Area */}
          <div className="canvas-wrapper">
            <WireframePreview
              designJson={designJson}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              visualMode={visualMode}
            />
          </div>
        </div>

        {/* Column 3: Properties Inspector Panel */}
        <div className="right-panel-wrapper">
          <div className="right-panel-tabs">
            {rightTabs.map(tab => (
              <button
                key={tab.id}
                className={`right-tab-btn ${rightActiveTab === tab.id ? 'active' : ''}`}
                onClick={() => setRightActiveTab(tab.id)}
                id={`tab-${tab.id}`}
              >
                <span className="right-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="right-panel-content">
            {rightActiveTab === 'specs' && (
              <Inspector
                selectedNodeId={selectedNodeId}
                designJson={designJson}
                onChangeNodeProperty={handleChangeNodeProperty}
              />
            )}
            
            {rightActiveTab === 'layers' && (
              <LayerTree
                designJson={designJson}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
              />
            )}

            {rightActiveTab === 'json' && (
              <div className="json-tab-container">
                <div className="json-actions-header">
                  <span>💾 Live Payload Schema</span>
                  <button 
                    className="btn-json-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(designJson, null, 2));
                      alert('JSON Payload copied to clipboard!');
                    }}
                  >
                    📋 Copy Code
                  </button>
                </div>
                <JsonViewer designJson={designJson} />
              </div>
            )}

            {rightActiveTab === 'history' && (
              <div className="history-tab-container">
                <div className="history-header">🕰️ Layout Revision History</div>
                <div className="revisions-timeline">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="revision-card">
                      <div className="revision-meta-row">
                        <span className="revision-time">{rev.timestamp}</span>
                        <span className="revision-badge">{rev.changesCount} modifications</span>
                      </div>
                      <div className="revision-desc">"{rev.description}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
