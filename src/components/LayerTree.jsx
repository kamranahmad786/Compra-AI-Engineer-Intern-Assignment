import { useMemo } from 'react';

export default function LayerTree({ designJson, selectedNodeId, onSelectNode }) {
  const artboard = useMemo(() => {
    if (!designJson?.nodes) return null;
    return Object.values(designJson.nodes).find(n => n.type === 'artboard');
  }, [designJson]);

  const layers = useMemo(() => {
    if (!designJson?.nodes || !artboard) return [];
    return (artboard.children || [])
      .map(id => designJson.nodes[id])
      .filter(Boolean)
      .reverse(); // Show top layers first
  }, [designJson, artboard]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'text': return '📝';
      case 'shape': return '⬤';
      case 'artboard': return '📐';
      default: return '📦';
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'image': return 'image';
      case 'text': return 'text';
      case 'shape': return 'shape';
      default: return 'artboard';
    }
  };

  const formatPosition = (node) => {
    return `X:${Math.round(node.x)} Y:${Math.round(node.y)}  •  ${Math.round(node.width)}×${Math.round(node.height)}px`;
  };

  return (
    <div className="layers-container">
      {artboard && (
        <div 
          className={`layer-item artboard-item ${selectedNodeId === artboard.id ? 'active' : ''}`}
          onClick={() => onSelectNode && onSelectNode(artboard.id)}
        >
          <div className="layer-icon artboard">📐</div>
          <div className="layer-info">
            <div className="layer-name">{artboard.name || 'Artboard'}</div>
            <div className="layer-meta">
              {artboard.width} × {artboard.height}px • {artboard.data?.preset || 'custom'}
            </div>
          </div>
          <span className="layer-type-badge">artboard</span>
        </div>
      )}
      
      <div className="layer-tree-header">Layers Hierarchy</div>

      <div className="layer-tree">
        {layers.map((node) => (
          <div 
            key={node.id} 
            className={`layer-item ${selectedNodeId === node.id ? 'active' : ''}`}
            onClick={() => onSelectNode && onSelectNode(node.id)}
          >
            <div className={`layer-icon ${getTypeClass(node.type)}`}>
              {getTypeIcon(node.type)}
            </div>
            <div className="layer-info">
              <div className="layer-name">
                {node.type === 'text' 
                  ? (node.data?.content?.substring(0, 32) || node.name)
                  : node.name}
              </div>
              <div className="layer-meta">{formatPosition(node)}</div>
            </div>
            <span className="layer-type-badge">{node.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
