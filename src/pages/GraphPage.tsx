import { useCallback, useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import type { GraphNode, GraphEdge } from '../types/graph'
import { buildGraphologyGraph } from '../lib/graph/graphology-builders'

const NODE_TYPES = ['root', 'domain', 'legal_act', 'case', 'party', 'court'] as const
type NodeTypeStr = (typeof NODE_TYPES)[number]

const NODE_TYPE_LABELS: Record<NodeTypeStr, string> = {
  root: 'Root',
  domain: 'Domain',
  legal_act: 'Legal Act',
  case: 'Case',
  party: 'Party',
  court: 'Court',
}

const NODE_TYPE_COLORS: Record<NodeTypeStr, string> = {
  root: '#ffffff',
  domain: '#3b82f6',
  legal_act: '#94a3b8',
  case: '#ef459d',
  party: '#c07a2e',
  court: '#2e7ab5',
}

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

// Shared reducer state read from refs so sigma closure always sees fresh values
interface ReducerState {
  activeFilters: Set<string>
  hoveredNode: string | null
  selectedNode: string | null
}

function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const reducerStateRef = useRef<ReducerState>({
    activeFilters: new Set(NODE_TYPES),
    hoveredNode: null,
    selectedNode: null,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(NODE_TYPES))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Init sigma once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const graph = buildGraphologyGraph(mockNodes, mockEdges)
    graphRef.current = graph

    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeColor: 'rgba(255,255,255,0.18)',
      nodeReducer: (node, data) => {
        const { activeFilters: filters, hoveredNode: hovered, selectedNode: selected } =
          reducerStateRef.current

        const nodeType = NODE_INDEX.get(node)?.type ?? ''
        if (!filters.has(nodeType)) {
          return { ...data, hidden: true }
        }

        const result = { ...data }

        if (hovered) {
          const isNeighbor = graph.neighbors(hovered).includes(node)
          if (node !== hovered && !isNeighbor) {
            result.color = '#1e293b'
            result.size = (data.size as number) * 0.6
            result.zIndex = 0
          } else {
            result.zIndex = 1
          }
        }

        if (selected === node) {
          result.color = '#f1f5f9'
          result.size = (data.size as number) * 1.3
          result.zIndex = 1
        }

        return result
      },
      edgeReducer: (edge, data) => {
        const { hoveredNode: hovered } = reducerStateRef.current
        if (hovered) {
          const src = graph.source(edge)
          const tgt = graph.target(edge)
          if (src !== hovered && tgt !== hovered) {
            return { ...data, color: '#0f172a', size: 0.4 }
          }
          return { ...data, color: '#64748b', size: 2 }
        }
        return data
      },
    })

    sigmaRef.current = sigma

    sigma.on('enterNode', ({ node }) => {
      setHoveredNode(node)
      containerRef.current!.style.cursor = 'pointer'
    })
    sigma.on('leaveNode', () => {
      setHoveredNode(null)
      containerRef.current!.style.cursor = 'default'
    })
    sigma.on('clickNode', ({ node }) =>
      setSelectedNodeId(prev => (prev === node ? null : node)),
    )
    sigma.on('clickStage', () => setSelectedNodeId(null))

    return () => {
      sigma.kill()
      sigmaRef.current = null
      graphRef.current = null
    }
  }, [])

  // Sync reducer state ref and refresh sigma whenever interaction state changes
  useEffect(() => {
    reducerStateRef.current = { activeFilters, hoveredNode, selectedNode: selectedNodeId }
    sigmaRef.current?.refresh()
  }, [activeFilters, hoveredNode, selectedNodeId])

  // Search: animate camera to first matching node
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    const sigma = sigmaRef.current
    const graph = graphRef.current
    if (!query.trim() || !sigma || !graph) return

    let foundNode: string | undefined
    graph.forEachNode((node, attrs) => {
      if (!foundNode && (attrs.label as string).toLowerCase().includes(query.toLowerCase())) {
        foundNode = node
      }
    })

    if (foundNode) {
      const nodeData = sigma.getNodeDisplayData(foundNode)
      if (nodeData) {
        sigma.getCamera().animate({ x: nodeData.x, y: nodeData.y, ratio: 0.35 }, { duration: 600 })
      }
    }
  }, [])

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

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
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <div className="graph-toolbar-actions">
          <button
            className="graph-btn"
            aria-label="Zoom in"
            onClick={() => {
              const cam = sigmaRef.current?.getCamera()
              if (cam) cam.animate({ ratio: cam.ratio / 1.5 }, { duration: 300 })
            }}
          >
            +
          </button>
          <button
            className="graph-btn"
            aria-label="Zoom out"
            onClick={() => {
              const cam = sigmaRef.current?.getCamera()
              if (cam) cam.animate({ ratio: cam.ratio * 1.5 }, { duration: 300 })
            }}
          >
            −
          </button>
          <button
            className="graph-btn graph-btn-wide"
            aria-label="Fit view"
            onClick={() =>
              sigmaRef.current
                ?.getCamera()
                .animate({ x: 0, y: 0, ratio: 1, angle: 0 }, { duration: 400 })
            }
          >
            Fit
          </button>
          <button
            className="graph-btn graph-btn-wide"
            aria-label="Reset"
            onClick={() => {
              sigmaRef.current
                ?.getCamera()
                .animate({ x: 0, y: 0, ratio: 1, angle: 0 }, { duration: 400 })
              setSelectedNodeId(null)
              setSearchQuery('')
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="graph-workspace">
        <div className="graph-canvas info-card graph-canvas--sigma">
          <div ref={containerRef} className="sigma-container" />
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
              {NODE_TYPES.map(type => (
                <li key={type} className="graph-legend-item">
                  <span
                    className="graph-legend-dot"
                    style={{ background: NODE_TYPE_COLORS[type] }}
                  />
                  {NODE_TYPE_LABELS[type]}
                </li>
              ))}
            </ul>
          </article>

          <article className="info-card graph-sidebar-card">
            <h2>Filters</h2>
            <ul className="graph-filter-list">
              {NODE_TYPES.map(type => (
                <li key={type} className="graph-filter-item">
                  <label className="graph-filter-label">
                    <input
                      type="checkbox"
                      checked={activeFilters.has(type)}
                      onChange={() => toggleFilter(type)}
                    />
                    <span
                      className="graph-legend-dot"
                      style={{ background: NODE_TYPE_COLORS[type] }}
                    />
                    {NODE_TYPE_LABELS[type]}
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
