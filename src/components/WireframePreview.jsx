import { useMemo } from 'react';

export default function WireframePreview({ designJson }) {
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

  // Calculate scale to fit the preview area
  const maxPreviewWidth = 520;
  const maxPreviewHeight = 600;
  const scaleX = maxPreviewWidth / artboard.width;
  const scaleY = maxPreviewHeight / artboard.height;
  const scale = Math.min(scaleX, scaleY, 1);

  const canvasWidth = artboard.width * scale;
  const canvasHeight = artboard.height * scale;

  const renderElement = (node) => {
    if (!node) return null;

    const style = {
      left: `${Math.max(0, node.x) * scale}px`,
      top: `${Math.max(0, node.y) * scale}px`,
      width: `${node.width * scale}px`,
      height: `${node.height * scale}px`,
    };

    if (node.type === 'image') {
      return (
        <div
          key={node.id}
          className="wireframe-element image-element"
          style={style}
          title={`${node.name} (${Math.round(node.width)}×${Math.round(node.height)})`}
        >
          <span className="element-label">{node.name}</span>
          <img
            src={node.data?.sourceUrl}
            alt={node.name}
            loading="lazy"
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'rgba(6, 182, 212, 0.1)';
              e.target.parentElement.style.border = '1px dashed rgba(6, 182, 212, 0.3)';
            }}
          />
        </div>
      );
    }

    if (node.type === 'text') {
      const fontSize = (node.style?.visual?.fontSize || 16) * scale;
      const color = node.style?.visual?.color?.value || '#FFFFFF';
      const fontWeight = node.style?.visual?.fontWeight || 400;
      const fontStyle = node.style?.visual?.fontStyle || 'normal';
      const fontFamily = node.style?.visual?.fontFamily || 'Arial';

      return (
        <div
          key={node.id}
          className="wireframe-element text-element"
          style={{
            ...style,
            fontSize: `${Math.max(fontSize, 6)}px`,
            color: color.length === 5 ? color + 'F' : color,
            fontWeight,
            fontStyle,
            fontFamily: `${fontFamily}, sans-serif`,
          }}
          title={`${node.data?.content} (font: ${node.style?.visual?.fontSize}px)`}
        >
          <span className="element-label">{node.name}: {node.data?.content?.substring(0, 20)}</span>
          {node.data?.content}
        </div>
      );
    }

    if (node.type === 'shape') {
      const fillColor = node.style?.visual?.fill?.value || 'transparent';
      const strokeColor = node.style?.visual?.stroke?.value || 'transparent';
      const strokeWidth = (node.style?.visual?.strokeWidth || 0) * scale;
      const isCircle = node.data?.shapeType === 'circle';

      return (
        <div
          key={node.id}
          className="wireframe-element shape-element"
          style={{
            ...style,
            backgroundColor: node.style?.visual?.fill?.type === 'solid' ? fillColor : 'transparent',
            border: node.style?.visual?.stroke?.type === 'solid' 
              ? `${Math.max(strokeWidth, 1)}px solid ${strokeColor}` 
              : 'none',
            borderRadius: isCircle ? '50%' : `${(node.style?.visual?.borderRadius || 0) * scale}px`,
          }}
          title={`${node.name} (${node.data?.shapeType})`}
        >
          <span className="element-label">{node.name}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="wireframe-container">
      <div>
        <div
          className="wireframe-canvas"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            background: artboard.data?.backgroundColor || '#ffffff',
          }}
        >
          {elements.map(renderElement)}
        </div>
        <div className="wireframe-dimension-label">
          {artboard.width} × {artboard.height}
          {artboard.data?.preset && ` • ${artboard.data.preset}`}
        </div>
      </div>
    </div>
  );
}
