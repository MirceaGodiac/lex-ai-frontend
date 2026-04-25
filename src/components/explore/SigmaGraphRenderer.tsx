import { useEffect, useRef } from 'react'
import Sigma from 'sigma'
import type { GraphNode, GraphEdge } from '../../types/graph'
import { buildGraphologyGraph } from '../../lib/graph/graphology-builders'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (nodeId: string) => void
  onStageClick?: () => void
}

export default function SigmaGraphRenderer({ nodes, edges, onNodeClick, onStageClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onNodeClickRef = useRef(onNodeClick)
  const onStageClickRef = useRef(onStageClick)

  useEffect(() => {
    onNodeClickRef.current = onNodeClick
  }, [onNodeClick])

  useEffect(() => {
    onStageClickRef.current = onStageClick
  }, [onStageClick])

  useEffect(() => {
    if (!containerRef.current) return

    const graph = buildGraphologyGraph(nodes, edges)

    let hoveredNode: string | null = null
    let selectedNode: string | null = null

    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeColor: '#334155',
      defaultNodeColor: '#475569',
      nodeReducer(node, data) {
        const res = { ...data }
        const activeNode = hoveredNode ?? selectedNode
        if (activeNode && activeNode !== node && !graph.neighbors(activeNode).includes(node)) {
          res.color = '#1e293b'
          res.size = (data.size as number) * 0.6
        }
        if (selectedNode === node) {
          res.color = '#f1f5f9'
          res.size = (data.size as number) * 1.3
        }
        if (hoveredNode === node) {
          res.size = (data.size as number) * 1.2
        }
        return res
      },
      edgeReducer(edge, data) {
        const res = { ...data }
        const activeNode = hoveredNode ?? selectedNode
        if (activeNode) {
          const src = graph.source(edge)
          const tgt = graph.target(edge)
          if (src !== activeNode && tgt !== activeNode) {
            res.color = '#0f172a'
            res.size = 0.4
          } else {
            res.color = '#64748b'
            res.size = 2
          }
        }
        return res
      },
    })

    sigma.on('enterNode', ({ node }) => {
      hoveredNode = node
      containerRef.current!.style.cursor = 'pointer'
      sigma.refresh()
    })

    sigma.on('leaveNode', () => {
      hoveredNode = null
      containerRef.current!.style.cursor = 'default'
      sigma.refresh()
    })

    sigma.on('clickNode', ({ node }) => {
      selectedNode = selectedNode === node ? null : node
      onNodeClickRef.current?.(node)
      sigma.refresh()
    })

    sigma.on('clickStage', () => {
      selectedNode = null
      onStageClickRef.current?.()
      sigma.refresh()
    })

    return () => {
      sigma.kill()
    }
  }, [nodes, edges])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
    />
  )
}
