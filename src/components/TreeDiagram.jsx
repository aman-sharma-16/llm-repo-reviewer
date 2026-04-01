import { useEffect, useState } from "react";
import "../styles/TreeDiagram.css";

export default function TreeDiagram({ structure, title = "Repository Structure" }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    if (!structure) {
      setExpandedNodes(new Set());
      return;
    }

    const rootId = `root-${structure.name || "root"}`;
    setExpandedNodes(new Set([rootId]));
  }, [structure]);

  const toggleNode = (id) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTree = (node, path = "root", level = 0) => {
    if (!node) return null;

    const nodeId = `${path}-${node.name || "root"}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;
    const isFile = node.type === "file";

    return (
      <div key={nodeId} className="tree-node" style={{ marginLeft: `${level * 20}px` }}>
        <div className="tree-node-content">
          {hasChildren && (
            <button
              className="tree-toggle"
              onClick={() => toggleNode(nodeId)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!hasChildren && <span className="tree-toggle-placeholder"></span>}
          
          <span className={`tree-icon ${isFile ? "file" : "folder"}`}>
            {isFile ? "📄" : "📁"}
          </span>
          
          <span className={`tree-label ${isFile ? "file-label" : "folder-label"}`}>
            {node.name}
          </span>
          
          {node.size && <span className="tree-size">({node.size})</span>}
          {node.language && <span className="tree-language">{node.language}</span>}
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children.map((child) =>
              renderTree(child, `${path}-${node.name}`, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-diagram-container">
      <h3 className="tree-title">{title}</h3>
      <div className="tree-wrapper">
        {structure ? renderTree(structure) : <p>No structure data available</p>}
      </div>
    </div>
  );
}
