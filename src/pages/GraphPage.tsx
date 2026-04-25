import { useCallback, useEffect, useRef, useState } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'

const DOMAIN_COLORS: Record<string, string> = {
  Case: '#ef459d',
  Statute: '#7c5cbc',
  Party: '#c07a2e',
  Court: '#2e7ab5',
}

const DOMAINS = ['Case', 'Statute', 'Party', 'Court']

const MOCK_NODES = [
  { id: 'case-1', label: 'Smith v. Jones', domain: 'Case', x: 0.5, y: 0.5 },
  { id: 'case-2', label: 'Brown v. State', domain: 'Case', x: 0.25, y: 0.65 },
  { id: 'case-3', label: 'Davis Corp v. Miller', domain: 'Case', x: 0.72, y: 0.3 },
  { id: 'statute-1', label: 'Civil Code §142', domain: 'Statute', x: 0.18, y: 0.38 },
  { id: 'statute-2', label: 'Penal Code §48', domain: 'Statute', x: 0.82, y: 0.62 },
  { id: 'party-1', label: 'John Smith', domain: 'Party', x: 0.42, y: 0.18 },
  { id: 'party-2', label: 'Alice Brown', domain: 'Party', x: 0.6, y: 0.82 },
  { id: 'court-1', label: 'Supreme Court', domain: 'Court', x: 0.12, y: 0.88 },
  { id: 'court-2', label: 'Court of Appeals', domain: 'Court', x: 0.88, y: 0.12 },
]

const MOCK_EDGES: [string, string][] = [
  ['case-1', 'statute-1'],
  ['case-1', 'party-1'],
  ['case-1', 'court-1'],
  ['case-2', 'statute-2'],
  ['case-2', 'party-2'],
  ['case-2', 'court-2'],
  ['case-3', 'statute-1'],
  ['case-3', 'party-1'],
  ['case-3', 'court-1'],
  ['statute-1', 'court-1'],
  ['statute-2', 'court-2'],
]

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
    activeFilters: new Set(DOMAINS),
    hoveredNode: null,
    selectedNode: null,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(DOMAINS))
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedAttrs, setSelectedAttrs] = useState<{
    label: string
    domain: string
    degree: number
  } | null>(null)

  // Init sigma once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const graph = new Graph()
    graphRef.current = graph

    for (const { id, label, domain, x, y } of MOCK_NODES) {
      graph.addNode(id, {
        label,
        domain,
        x,
        y,
        size: 12,
        color: DOMAIN_COLORS[domain],
      })
    }

    for (const [source, target] of MOCK_EDGES) {
      graph.addEdge(source, target, { color: 'rgba(255,255,255,0.18)', size: 1.5 })
    }

    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultLabelColor: 'rgba(255,239,227,0.9)',
      defaultEdgeColor: 'rgba(255,255,255,0.18)',
      // Reducers read from ref so they always see current state
      nodeReducer: (node, data) => {
        const { activeFilters: filters, hoveredNode: hovered, selectedNode: selected } =
          reducerStateRef.current

        if (!filters.has(data.domain as string)) {
          return { ...data, hidden: true }
        }

        const result = { ...data }

        if (hovered) {
          const isNeighbor = graph.neighbors(hovered).includes(node)
          if (node !== hovered && !isNeighbor) {
            result.color = 'rgba(80,80,80,0.22)'
            result.label = null
            result.zIndex = 0
          } else {
            result.zIndex = 1
          }
        }

        if (selected === node) {
          result.highlighted = true
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
            return { ...data, hidden: true }
          }
        }
        return data
      },
    })

    sigmaRef.current = sigma

    sigma.on('enterNode', ({ node }) => setHoveredNode(node))
    sigma.on('leaveNode', () => setHoveredNode(null))
    sigma.on('clickNode', ({ node }) =>
      setSelectedNode(prev => (prev === node ? null : node)),
    )
    sigma.on('clickStage', () => setSelectedNode(null))

    return () => {
      sigma.kill()
      sigmaRef.current = null
      graphRef.current = null
    }
  }, [])

  // Sync reducer state ref and refresh sigma whenever interaction state changes
  useEffect(() => {
    reducerStateRef.current = { activeFilters, hoveredNode, selectedNode }
    sigmaRef.current?.refresh()
  }, [activeFilters, hoveredNode, selectedNode])

  // Update selected node details (reads graph ref inside effect, not render)
  useEffect(() => {
    if (!selectedNode || !graphRef.current) {
      setSelectedAttrs(null)
      return
    }
    const attrs = graphRef.current.getNodeAttributes(selectedNode)
    setSelectedAttrs({
      label: attrs.label as string,
      domain: attrs.domain as string,
      degree: graphRef.current.degree(selectedNode),
    })
  }, [selectedNode])

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

  const toggleFilter = (domain: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }

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
              setSelectedNode(null)
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
            {selectedAttrs ? (
              <>
                <p className="graph-node-name">{selectedAttrs.label}</p>
                <p
                  className="graph-node-domain"
                  style={{ color: DOMAIN_COLORS[selectedAttrs.domain] }}
                >
                  {selectedAttrs.domain}
                </p>
                <p className="graph-empty-hint" style={{ marginTop: 8 }}>
                  Connections: {selectedAttrs.degree}
                </p>
              </>
            ) : (
              <p className="graph-empty-hint">
                Select a node to inspect its properties and connections.
              </p>
            )}
          </article>

          <article className="info-card graph-sidebar-card">
            <h2>Legend</h2>
            <ul className="graph-legend">
              {DOMAINS.map(domain => (
                <li key={domain} className="graph-legend-item">
                  <span className="graph-legend-dot" style={{ background: DOMAIN_COLORS[domain] }} />
                  {domain}
                </li>
              ))}
            </ul>
          </article>

          <article className="info-card graph-sidebar-card">
            <h2>Filters</h2>
            <ul className="graph-filter-list">
              {DOMAINS.map(domain => (
                <li key={domain} className="graph-filter-item">
                  <label className="graph-filter-label">
                    <input
                      type="checkbox"
                      checked={activeFilters.has(domain)}
                      onChange={() => toggleFilter(domain)}
                    />
                    <span
                      className="graph-legend-dot"
                      style={{ background: DOMAIN_COLORS[domain] }}
                    />
                    {domain}
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
