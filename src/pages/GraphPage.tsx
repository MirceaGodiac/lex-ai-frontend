import { useState, useCallback } from 'react'
import SigmaGraphRenderer from '../components/explore/SigmaGraphRenderer'
import type { GraphNode, GraphEdge } from '../types/graph'

const legendNodes = [
  { label: 'Case', color: 'var(--accent)' },
  { label: 'Statute', color: '#7c5cbc' },
  { label: 'Party', color: '#c07a2e' },
  { label: 'Court', color: '#2e7ab5' },
]

const mockNodes: GraphNode[] = [
  { id: 'root-1', label: 'Romanian Law', type: 'root' },
  { id: 'domain-civil', label: 'Civil Law', type: 'domain', domain: 'civil' },
  { id: 'domain-penal', label: 'Criminal Law', type: 'domain', domain: 'penal' },
  { id: 'domain-comercial', label: 'Commercial Law', type: 'domain', domain: 'comercial' },
  { id: 'domain-admin', label: 'Administrative Law', type: 'domain', domain: 'administrativ' },
  { id: 'act-cc', label: 'Civil Code', type: 'legal_act' },
  { id: 'act-cp', label: 'Penal Code', type: 'legal_act' },
  { id: 'act-cpc', label: 'Code of Civil Procedure', type: 'legal_act' },
  { id: 'act-cpp', label: 'Code of Criminal Procedure', type: 'legal_act' },
  { id: 'act-legea31', label: 'Law no. 31/1990', type: 'legal_act' },
  { id: 'case-1', label: 'Dec. 123/2023 ICCJ', type: 'case' },
  { id: 'case-2', label: 'Dec. 456/2022 CA Buc', type: 'case' },
  { id: 'case-3', label: 'Dec. 789/2021 ICCJ', type: 'case' },
  { id: 'party-1', label: 'Ministerul Justiției', type: 'party' },
  { id: 'party-2', label: 'SC Alpha SRL', type: 'party' },
  { id: 'court-1', label: 'ICCJ', type: 'court' },
  { id: 'court-2', label: 'Curtea de Apel București', type: 'court' },
]

const mockEdges: GraphEdge[] = [
  { id: 'e1', source: 'root-1', target: 'domain-civil' },
  { id: 'e2', source: 'root-1', target: 'domain-penal' },
  { id: 'e3', source: 'root-1', target: 'domain-comercial' },
  { id: 'e4', source: 'root-1', target: 'domain-admin' },
  { id: 'e5', source: 'domain-civil', target: 'act-cc' },
  { id: 'e6', source: 'domain-civil', target: 'act-cpc' },
  { id: 'e7', source: 'domain-penal', target: 'act-cp' },
  { id: 'e8', source: 'domain-penal', target: 'act-cpp' },
  { id: 'e9', source: 'domain-comercial', target: 'act-legea31' },
  { id: 'e10', source: 'act-cc', target: 'case-1' },
  { id: 'e11', source: 'act-cp', target: 'case-2' },
  { id: 'e12', source: 'act-cpc', target: 'case-3' },
  { id: 'e13', source: 'case-1', target: 'court-1' },
  { id: 'e14', source: 'case-2', target: 'court-2' },
  { id: 'e15', source: 'case-3', target: 'court-1' },
  { id: 'e16', source: 'case-1', target: 'party-1' },
  { id: 'e17', source: 'case-2', target: 'party-2' },
]

const NODE_INDEX = new Map(mockNodes.map((n) => [n.id, n]))

function getNeighborLabels(nodeId: string): string[] {
  return mockEdges
    .filter((e) => e.source === nodeId || e.target === nodeId)
    .map((e) => {
      const neighborId = e.source === nodeId ? e.target : e.source
      return NODE_INDEX.get(neighborId)?.label ?? neighborId
    })
}

function GraphPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
  }, [])

  const handleStageClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const selectedNode = selectedNodeId ? NODE_INDEX.get(selectedNodeId) : null
  const neighbors = selectedNodeId ? getNeighborLabels(selectedNodeId) : []

  return (
    <section className="page">
      <div className="section-header">
        <span className="eyebrow">Graph Viewer</span>
        <h1>Knowledge Graph</h1>
        <p>Explore relationships between cases, statutes, parties, and courts.</p>
      </div>

      <div className="graph-toolbar info-card">
        <div className="graph-toolbar-search">
          <input
            className="graph-search-input"
            type="text"
            placeholder="Search nodes…"
            aria-label="Search graph nodes"
          />
        </div>
        <div className="graph-toolbar-actions">
          <button className="graph-btn" aria-label="Zoom in">+</button>
          <button className="graph-btn" aria-label="Zoom out">−</button>
          <button className="graph-btn graph-btn-wide" aria-label="Fit view">Fit</button>
          <button className="graph-btn graph-btn-wide" aria-label="Reset">Reset</button>
        </div>
      </div>

      <div className="graph-workspace">
        <div className="graph-canvas info-card" style={{ padding: 0, overflow: 'hidden' }}>
          <SigmaGraphRenderer
            nodes={mockNodes}
            edges={mockEdges}
            onNodeClick={handleNodeClick}
            onStageClick={handleStageClick}
          />
        </div>

        <aside className="graph-sidebar">
          <article className="info-card graph-sidebar-card">
            <h2>Node Detail</h2>
            {selectedNode ? (
              <dl className="graph-node-detail">
                <dt>Label</dt>
                <dd>{selectedNode.label}</dd>
                <dt>Type</dt>
                <dd style={{ textTransform: 'capitalize' }}>{selectedNode.type.replace('_', ' ')}</dd>
                {selectedNode.domain && (
                  <>
                    <dt>Domain</dt>
                    <dd style={{ textTransform: 'capitalize' }}>{selectedNode.domain}</dd>
                  </>
                )}
                {neighbors.length > 0 && (
                  <>
                    <dt>Connected to</dt>
                    <dd>
                      <ul className="graph-neighbor-list">
                        {neighbors.map((label) => (
                          <li key={label}>{label}</li>
                        ))}
                      </ul>
                    </dd>
                  </>
                )}
              </dl>
            ) : (
              <p className="graph-empty-hint">Select a node to inspect its properties and connections.</p>
            )}
          </article>

          <article className="info-card graph-sidebar-card">
            <h2>Legend</h2>
            <ul className="graph-legend">
              {legendNodes.map((item) => (
                <li key={item.label} className="graph-legend-item">
                  <span className="graph-legend-dot" style={{ background: item.color }} />
                  {item.label}
                </li>
              ))}
            </ul>
          </article>

          <article className="info-card graph-sidebar-card">
            <h2>Filters</h2>
            <ul className="graph-filter-list">
              {legendNodes.map((item) => (
                <li key={item.label} className="graph-filter-item">
                  <label className="graph-filter-label">
                    <input type="checkbox" defaultChecked />
                    <span className="graph-legend-dot" style={{ background: item.color }} />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default GraphPage
