import { useMemo } from 'react';

export default function Inspector({ selectedNodeId, designJson, onChangeNodeProperty }) {
  const node = useMemo(() => {
    if (!selectedNodeId || !designJson?.nodes) return null;
    return designJson.nodes[selectedNodeId];
  }, [selectedNodeId, designJson]);

  if (!node) {
    return (
      <div className="inspector-empty">
        <div className="inspector-empty-icon">🎛️</div>
        <h3>No Element Selected</h3>
        <p>Click on any layer in the preview canvas or the layers tree to inspect and adjust its properties.</p>
      </div>
    );
  }

  const handleValueChange = (path, value) => {
    if (!onChangeNodeProperty) return;
    onChangeNodeProperty(node.id, path, value);
  };

  return (
    <div className="inspector-container">
      {/* Header */}
      <div className="inspector-header">
        <div className="inspector-title-row">
          <span className="inspector-type-tag">{node.type}</span>
          <h3 className="inspector-node-name">{node.name}</h3>
        </div>
        <span className="inspector-node-id">ID: {node.id}</span>
      </div>

      {/* Geometry Panel */}
      <div className="inspector-section">
        <h4 className="inspector-section-title">Geometry</h4>
        <div className="inspector-grid">
          <div className="inspector-field">
            <label>X Position</label>
            <div className="inspector-input-wrapper">
              <input
                type="number"
                value={Math.round(node.x)}
                onChange={(e) => handleValueChange('x', parseFloat(e.target.value))}
              />
              <span className="unit">px</span>
            </div>
          </div>
          <div className="inspector-field">
            <label>Y Position</label>
            <div className="inspector-input-wrapper">
              <input
                type="number"
                value={Math.round(node.y)}
                onChange={(e) => handleValueChange('y', parseFloat(e.target.value))}
              />
              <span className="unit">px</span>
            </div>
          </div>
          <div className="inspector-field">
            <label>Width</label>
            <div className="inspector-input-wrapper">
              <input
                type="number"
                value={Math.round(node.width)}
                onChange={(e) => handleValueChange('width', parseFloat(e.target.value))}
              />
              <span className="unit">px</span>
            </div>
          </div>
          <div className="inspector-field">
            <label>Height</label>
            <div className="inspector-input-wrapper">
              <input
                type="number"
                value={Math.round(node.height)}
                onChange={(e) => handleValueChange('height', parseFloat(e.target.value))}
              />
              <span className="unit">px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Normalized Values (Read-Only Specs) */}
      <div className="inspector-section">
        <h4 className="inspector-section-title">Normalized Ratios</h4>
        <div className="inspector-grid">
          <div className="inspector-field readonly">
            <label>NX (X Ratio)</label>
            <input type="text" readOnly value={node.nx?.toFixed(4) || '0.0000'} />
          </div>
          <div className="inspector-field readonly">
            <label>NY (Y Ratio)</label>
            <input type="text" readOnly value={node.ny?.toFixed(4) || '0.0000'} />
          </div>
          <div className="inspector-field readonly">
            <label>NW (Width Ratio)</label>
            <input type="text" readOnly value={node.nw?.toFixed(4) || '0.0000'} />
          </div>
          <div className="inspector-field readonly">
            <label>NH (Height Ratio)</label>
            <input type="text" readOnly value={node.nh?.toFixed(4) || '0.0000'} />
          </div>
        </div>
      </div>

      {/* Type Specific Fields */}
      {node.type === 'text' && (
        <div className="inspector-section">
          <h4 className="inspector-section-title">Typography</h4>
          <div className="inspector-field" style={{ marginBottom: '12px' }}>
            <label>Content</label>
            <textarea
              value={node.data?.content || ''}
              onChange={(e) => handleValueChange('data.content', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="inspector-grid">
            <div className="inspector-field">
              <label>Font Size</label>
              <div className="inspector-input-wrapper">
                <input
                  type="number"
                  value={node.style?.visual?.fontSize || 16}
                  onChange={(e) => handleValueChange('style.visual.fontSize', parseInt(e.target.value))}
                />
                <span className="unit">pt</span>
              </div>
            </div>
            
            <div className="inspector-field">
              <label>Font Weight</label>
              <select
                value={node.style?.visual?.fontWeight || 400}
                onChange={(e) => handleValueChange('style.visual.fontWeight', parseInt(e.target.value))}
              >
                <option value={300}>300 - Light</option>
                <option value={400}>400 - Regular</option>
                <option value={500}>500 - Medium</option>
                <option value={600}>600 - SemiBold</option>
                <option value={700}>700 - Bold</option>
                <option value={800}>800 - ExtraBold</option>
              </select>
            </div>

            <div className="inspector-field">
              <label>Color</label>
              <div className="inspector-color-picker">
                <input
                  type="color"
                  value={node.style?.visual?.color?.value || '#ffffff'}
                  onChange={(e) => handleValueChange('style.visual.color.value', e.target.value)}
                />
                <input
                  type="text"
                  className="color-hex"
                  value={node.style?.visual?.color?.value || '#ffffff'}
                  onChange={(e) => handleValueChange('style.visual.color.value', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {node.type === 'shape' && (
        <div className="inspector-section">
          <h4 className="inspector-section-title">Shape Properties</h4>
          <div className="inspector-grid">
            <div className="inspector-field">
              <label>Fill Color</label>
              <div className="inspector-color-picker">
                <input
                  type="color"
                  value={node.style?.visual?.fill?.value || '#000000'}
                  onChange={(e) => handleValueChange('style.visual.fill.value', e.target.value)}
                />
                <input
                  type="text"
                  className="color-hex"
                  value={node.style?.visual?.fill?.value || '#000000'}
                  onChange={(e) => handleValueChange('style.visual.fill.value', e.target.value)}
                />
              </div>
            </div>

            <div className="inspector-field">
              <label>Stroke Color</label>
              <div className="inspector-color-picker">
                <input
                  type="color"
                  value={node.style?.visual?.stroke?.value || '#000000'}
                  onChange={(e) => handleValueChange('style.visual.stroke.value', e.target.value)}
                />
                <input
                  type="text"
                  className="color-hex"
                  value={node.style?.visual?.stroke?.value || '#000000'}
                  onChange={(e) => handleValueChange('style.visual.stroke.value', e.target.value)}
                />
              </div>
            </div>

            <div className="inspector-field">
              <label>Stroke Width</label>
              <div className="inspector-input-wrapper">
                <input
                  type="number"
                  value={node.style?.visual?.strokeWidth || 0}
                  onChange={(e) => handleValueChange('style.visual.strokeWidth', parseInt(e.target.value))}
                />
                <span className="unit">px</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {node.type === 'image' && (
        <div className="inspector-section">
          <h4 className="inspector-section-title">Image Asset</h4>
          <div className="inspector-field" style={{ marginBottom: '12px' }}>
            <label>Source URL</label>
            <input
              type="text"
              style={{ width: '100%', fontSize: '11px' }}
              value={node.data?.sourceUrl || ''}
              onChange={(e) => handleValueChange('data.sourceUrl', e.target.value)}
            />
          </div>
          <div className="inspector-field">
            <label>Object Fit</label>
            <select
              value={node.data?.fit || 'cover'}
              onChange={(e) => handleValueChange('data.fit', e.target.value)}
            >
              <option value="cover">Cover (Fill)</option>
              <option value="contain">Contain (Fit)</option>
              <option value="fill">Stretch</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
