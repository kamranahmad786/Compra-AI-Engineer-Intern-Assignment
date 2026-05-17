import { useMemo, useState } from 'react';

export default function WireframePreview({ designJson, selectedNodeId, onSelectNode, visualMode = 'mockup' }) {
  const [zoom, setZoom] = useState(1);

  const artboard = useMemo(() => {
    if (!designJson?.nodes) return null;
    return Object.values(designJson.nodes).find(n => n.type === 'artboard');
  }, [designJson]);

  const elements = useMemo(() => {
    if (!designJson?.nodes || !artboard) return [];
    return artboard.children
      ?.map(id => designJson.nodes[id])
      .filter(Boolean) || [];
  }, [designJson, artboard]);

  if (!artboard) {
    return (
      <div className="wireframe-container">
        <p style={{ color: 'var(--text-tertiary)' }}>No artboard found in design JSON</p>
      </div>
    );
  }

  // Calculate base scale to fit the preview container
  const baseScaleWidth = 560 / artboard.width;
  const baseScaleHeight = 580 / artboard.height;
  const baseScale = Math.min(baseScaleWidth, baseScaleHeight, 1);
  const currentScale = baseScale * zoom;

  const canvasWidth = artboard.width * currentScale;
  const canvasHeight = artboard.height * currentScale;

  const renderElement = (node) => {
    if (!node) return null;

    const isSelected = selectedNodeId === node.id;
    
    // Position bounding box
    const style = {
      left: `${node.x * currentScale}px`,
      top: `${node.y * currentScale}px`,
      width: `${node.width * currentScale}px`,
      height: `${node.height * currentScale}px`,
      zIndex: node.name === 'Background.png' ? 1 : 2,
    };

    const handleElementClick = (e) => {
      e.stopPropagation();
      if (onSelectNode) {
        onSelectNode(node.id);
      }
    };

    if (node.type === 'image') {
      const isBackground = node.name === 'Background.png';
      
      return (
        <div
          key={node.id}
          className={`canvas-element image-element ${isSelected ? 'selected' : ''} ${visualMode}`}
          style={style}
          onClick={handleElementClick}
        >
          {isSelected && <div className="selection-border" />}
          
          {visualMode === 'mockup' ? (
            <img
              src={node.data?.sourceUrl}
              alt={node.name}
              loading="lazy"
              crossOrigin="anonymous"
              style={{ objectFit: node.data?.fit || 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('error-image');
              }}
            />
          ) : (
            <div className="wireframe-blueprint-image">
              <svg className="blueprint-cross" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100" y2="100" />
                <line x1="100" y1="0" x2="0" y2="100" />
              </svg>
              <span className="blueprint-label">🖼️ {node.name}</span>
            </div>
          )}
          
          {!isBackground && <span className="canvas-element-label">{node.name}</span>}
          {isSelected && (
            <>
              <div className="resize-handle nw" />
              <div className="resize-handle ne" />
              <div className="resize-handle sw" />
              <div className="resize-handle se" />
            </>
          )}
        </div>
      );
    }

    if (node.type === 'text') {
      const fontSize = (node.style?.visual?.fontSize || 16) * currentScale;
      const color = node.style?.visual?.color?.value || '#FFFFFF';
      const fontWeight = node.style?.visual?.fontWeight || 400;
      const fontStyle = node.style?.visual?.fontStyle || 'normal';
      const fontFamily = node.style?.visual?.fontFamily || 'Arial';

      return (
        <div
          key={node.id}
          className={`canvas-element text-element ${isSelected ? 'selected' : ''} ${visualMode}`}
          style={{
            ...style,
            fontSize: `${Math.max(fontSize, 6)}px`,
            color: visualMode === 'mockup' ? color : 'var(--text-primary)',
            fontWeight,
            fontStyle,
            fontFamily: `${fontFamily}, sans-serif`,
          }}
          onClick={handleElementClick}
        >
          {isSelected && <div className="selection-border" />}
          
          {visualMode === 'mockup' ? (
            node.data?.content
          ) : (
            <div className="wireframe-blueprint-text">
              <span className="blueprint-text-line">{node.data?.content}</span>
              <span className="blueprint-text-spec">📝 {node.style?.visual?.fontSize}px</span>
            </div>
          )}
          
          <span className="canvas-element-label">{node.name}</span>
          {isSelected && (
            <>
              <div className="resize-handle nw" />
              <div className="resize-handle ne" />
              <div className="resize-handle sw" />
              <div className="resize-handle se" />
            </>
          )}
        </div>
      );
    }

    if (node.type === 'shape') {
      const fillColor = node.style?.visual?.fill?.value || 'transparent';
      const strokeColor = node.style?.visual?.stroke?.value || 'transparent';
      const strokeWidth = (node.style?.visual?.strokeWidth || 0) * currentScale;
      const isCircle = node.data?.shapeType === 'circle';

      return (
        <div
          key={node.id}
          className={`canvas-element shape-element ${isSelected ? 'selected' : ''} ${visualMode}`}
          style={{
            ...style,
            backgroundColor: visualMode === 'mockup' && node.style?.visual?.fill?.type === 'solid' ? fillColor : 'rgba(245, 158, 11, 0.1)',
            border: visualMode === 'mockup' && node.style?.visual?.stroke?.type === 'solid' 
              ? `${Math.max(strokeWidth, 1)}px solid ${strokeColor}` 
              : '1px dashed var(--accent-warning)',
            borderRadius: isCircle ? '50%' : `${(node.style?.visual?.borderRadius || 0) * currentScale}px`,
          }}
          onClick={handleElementClick}
        >
          {isSelected && <div className="selection-border" />}
          <span className="blueprint-shape-label">⬤ {node.name}</span>
          <span className="canvas-element-label">{node.name}</span>
          {isSelected && (
            <>
              <div className="resize-handle nw" />
              <div className="resize-handle ne" />
              <div className="resize-handle sw" />
              <div className="resize-handle se" />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="wireframe-container" onClick={() => onSelectNode && onSelectNode(null)}>
      {/* Canvas Top Bar Controls */}
      <div className="canvas-controls-header">
        <div className="canvas-scale-display">
          🔍 Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="canvas-zoom-buttons">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="btn-zoom-icon">-</button>
          <button onClick={() => setZoom(1)} className="btn-zoom-icon">↺</button>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="btn-zoom-icon">+</button>
        </div>
        <div className="canvas-spec-badge">
          Aspect Ratio: {artboard.width} × {artboard.height} ({artboard.data?.preset})
        </div>
      </div>

      {/* Rulers and Board Area */}
      <div className="canvas-editor-area">
        {/* Dotted Editor Board */}
        <div className="editor-board-grid">
          <div
            className="wireframe-canvas"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              background: visualMode === 'mockup' ? (artboard.data?.backgroundColor || '#ffffff') : '#1a1a2e',
              border: '1px solid var(--border-medium)',
            }}
          >
            {elements.map(renderElement)}
          </div>
        </div>
      </div>
    </div>
  );
}
