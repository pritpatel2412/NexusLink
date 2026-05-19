import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  tags: string[];
  relationshipType: "warm" | "cold" | "mentor" | "recruiter" | "peer" | "you";
  affinityScore: number;
  lastContactedDaysAgo: number | null;
  connectedSince: string | null;
  interactionCount: number;
  description: string;
  // Physics state (mutable)
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number; // 0-1
}

// ─── Colour mapping ───────────────────────────────────────────────────────────
const TYPE_COLORS: Record<GraphNode["relationshipType"], string> = {
  you: "#9333ea",
  warm: "#22d3ee",
  mentor: "#f59e0b",
  recruiter: "#10b981",
  peer: "#6366f1",
  cold: "#64748b",
};

const TYPE_LABELS: Record<GraphNode["relationshipType"], string> = {
  you: "You",
  warm: "Warm Contact",
  mentor: "Mentor",
  recruiter: "Recruiter",
  peer: "Peer",
  cold: "Cold Contact",
};

// ─── Force simulation helpers ─────────────────────────────────────────────────
const REPULSION = 3200;
const ATTRACTION = 0.04;
const DAMPING = 0.85;
const CENTER_PULL = 0.015;

function runTick(nodes: GraphNode[], edges: GraphEdge[], cx: number, cy: number) {
  // Repulsion (node-node)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x || 0.01;
      const dy = nodes[j].y - nodes[i].y || 0.01;
      const distSq = Math.max(dx * dx + dy * dy, 1);
      const force = REPULSION / distSq;
      nodes[i].vx -= (dx / Math.sqrt(distSq)) * force;
      nodes[i].vy -= (dy / Math.sqrt(distSq)) * force;
      nodes[j].vx += (dx / Math.sqrt(distSq)) * force;
      nodes[j].vy += (dy / Math.sqrt(distSq)) * force;
    }
    // Center gravity
    nodes[i].vx += (cx - nodes[i].x) * CENTER_PULL;
    nodes[i].vy += (cy - nodes[i].y) * CENTER_PULL;
  }

  // Attraction along edges
  for (const edge of edges) {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const targetDist = 120 + (1 - edge.strength) * 120;
    const f = (dist - targetDist) * ATTRACTION * edge.strength;
    src.vx += (dx / dist) * f;
    src.vy += (dy / dist) * f;
    tgt.vx -= (dx / dist) * f;
    tgt.vy -= (dy / dist) * f;
  }

  // Integrate + damping (pin "you" node to center)
  for (const node of nodes) {
    if (node.relationshipType === "you") {
      node.x = cx;
      node.y = cy;
      node.vx = 0;
      node.vy = 0;
    } else {
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;
    }
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

interface TooltipState {
  node: GraphNode;
  x: number;
  y: number;
}

export function NetworkGraph({ nodes: initialNodes, edges, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const rafRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  // Initialise node positions in a circle
  useEffect(() => {
    const cx = width / 2;
    const cy = height / 2;
    nodesRef.current = initialNodes.map((n, i) => {
      if (n.relationshipType === "you") return { ...n, x: cx, y: cy, vx: 0, vy: 0 };
      const angle = (i / (initialNodes.length - 1)) * Math.PI * 2;
      const r = 180 + Math.random() * 80;
      return { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, vx: 0, vy: 0 };
    });
  }, [initialNodes, width, height]);

  // Draw frame
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nodes = nodesRef.current;
    const cx = width / 2;
    const cy = height / 2;

    // Physics tick
    runTick(nodes, edges, cx, cy);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    for (const edge of edges) {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) continue;
      const isHighlighted = selectedId && (src.id === selectedId || tgt.id === selectedId);
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted
        ? `rgba(147,51,234,${0.3 + edge.strength * 0.7})`
        : `rgba(255,255,255,${0.04 + edge.strength * 0.08})`;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      const color = TYPE_COLORS[node.relationshipType];
      const radius = node.relationshipType === "you"
        ? 22
        : 8 + (node.affinityScore / 100) * 14;
      const isSelected = node.id === selectedId;
      const connectedToSelected = selectedId
        ? edges.some(e =>
            (e.source === selectedId && e.target === node.id) ||
            (e.target === selectedId && e.source === node.id)
          )
        : false;
      const dimmed = selectedId && !isSelected && !connectedToSelected;

      // Glow
      if (isSelected) {
        const grd = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 2.5);
        grd.addColorStop(0, color + "60");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = dimmed ? "#1a1a2a" : color + (isSelected ? "ff" : "cc");
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#fff" : dimmed ? "#ffffff08" : color + "88";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Initials
      const initials = node.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
      ctx.fillStyle = dimmed ? "#333" : "#fff";
      ctx.font = `bold ${radius > 16 ? 13 : 9}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.relationshipType === "you" ? "YOU" : initials, node.x, node.y);

      // Label below node
      if (!dimmed) {
        ctx.font = `500 10px Inter, sans-serif`;
        ctx.fillStyle = isSelected ? "#fff" : "#aaa";
        ctx.fillText(node.name.split(" ")[0], node.x, node.y + radius + 13);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [edges, width, height, selectedId]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Hit-test helper
  const getNodeAt = useCallback((px: number, py: number): GraphNode | null => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = n.relationshipType === "you" ? 22 : 8 + (n.affinityScore / 100) * 14;
      const dx = px - n.x;
      const dy = py - n.y;
      if (dx * dx + dy * dy <= (r + 6) * (r + 6)) return n;
    }
    return null;
  }, []);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (dragRef.current) {
      const node = nodesRef.current.find(n => n.id === dragRef.current!.id);
      if (node && node.relationshipType !== "you") {
        node.x = px - dragRef.current.ox;
        node.y = py - dragRef.current.oy;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    const hit = getNodeAt(px, py);
    if (hit) {
      setTooltip({ node: hit, x: px, y: py });
      canvasRef.current!.style.cursor = "pointer";
    } else {
      setTooltip(null);
      canvasRef.current!.style.cursor = "default";
    }
  }, [getNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hit = getNodeAt(px, py);
    if (hit) {
      dragRef.current = { id: hit.id, ox: px - hit.x, oy: py - hit.y };
    }
  }, [getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (dragRef.current) {
      // Only register as click if barely moved
      const node = nodesRef.current.find(n => n.id === dragRef.current!.id);
      if (node) {
        const dx = px - dragRef.current.ox - node.x;
        const dy = py - dragRef.current.oy - node.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          setSelectedId(prev => prev === node.id ? null : node.id);
        }
      }
    }
    dragRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    dragRef.current = null;
  }, []);

  const selectedNode = nodesRef.current.find(n => n.id === selectedId) ?? null;

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full rounded-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 50%, #0f0f1e 0%, #06060d 100%)" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover Tooltip */}
      {tooltip && tooltip.node.relationshipType !== "you" && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 16, width - 240),
            top: Math.max(tooltip.y - 8, 8),
          }}
        >
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] border border-white/10 rounded-xl p-3 shadow-2xl w-52 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: TYPE_COLORS[tooltip.node.relationshipType] }}
              />
              <span className="text-white font-bold text-sm truncate">{tooltip.node.name}</span>
            </div>
            {tooltip.node.role && (
              <p className="text-[11px] text-gray-400 truncate">{tooltip.node.role}{tooltip.node.company ? ` @ ${tooltip.node.company}` : ""}</p>
            )}
            <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Affinity</span>
                <span className="text-white font-semibold">{tooltip.node.affinityScore}/100</span>
              </div>
              {tooltip.node.lastContactedDaysAgo !== null && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Last contact</span>
                  <span className="text-white">{tooltip.node.lastContactedDaysAgo}d ago</span>
                </div>
              )}
              {tooltip.node.connectedSince && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Connected</span>
                  <span className="text-white">{tooltip.node.connectedSince}</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-500 italic mt-2 leading-relaxed">{tooltip.node.description}</p>
            <div className="mt-1.5 text-[9px] text-primary/80 font-medium">Click to pin details →</div>
          </div>
        </div>
      )}

      {/* Pinned Detail Panel */}
      {selectedNode && selectedNode.relationshipType !== "you" && (
        <div className="absolute bottom-4 right-4 w-72 bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] border border-primary/20 rounded-2xl p-5 shadow-2xl z-40 backdrop-blur-xl">
          <button
            onClick={() => setSelectedId(null)}
            className="absolute top-3 right-3 text-gray-500 hover:text-white text-xs"
          >✕</button>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: TYPE_COLORS[selectedNode.relationshipType] }}
            >
              {selectedNode.name.split(" ").map(p => p[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{selectedNode.name}</p>
              <p className="text-gray-400 text-[11px]">{selectedNode.role}{selectedNode.company ? ` @ ${selectedNode.company}` : ""}</p>
            </div>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-500">Relationship type</span>
              <span
                className="font-semibold"
                style={{ color: TYPE_COLORS[selectedNode.relationshipType] }}
              >
                {TYPE_LABELS[selectedNode.relationshipType]}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-500">Affinity score</span>
              <span className="text-white font-semibold">{selectedNode.affinityScore}/100</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-500">Interactions</span>
              <span className="text-white">{selectedNode.interactionCount}</span>
            </div>
            {selectedNode.connectedSince && (
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500">Connected since</span>
                <span className="text-white">{selectedNode.connectedSince}</span>
              </div>
            )}
            {selectedNode.lastContactedDaysAgo !== null && (
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-500">Last contacted</span>
                <span className={selectedNode.lastContactedDaysAgo > 30 ? "text-red-400" : "text-emerald-400"}>
                  {selectedNode.lastContactedDaysAgo} days ago
                </span>
              </div>
            )}
            {selectedNode.tags.length > 0 && (
              <div className="pt-1">
                <span className="text-gray-500 block mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Relationship</span>
              <p className="text-gray-300 leading-relaxed italic">{selectedNode.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3">
        {(Object.entries(TYPE_COLORS) as [GraphNode["relationshipType"], string][])
          .filter(([k]) => k !== "you")
          .map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[10px] text-gray-400">{TYPE_LABELS[type]}</span>
            </div>
          ))}
        <div className="mt-1 pt-1 border-t border-white/5 text-[9px] text-gray-600 italic">Drag nodes • Click to pin</div>
      </div>
    </div>
  );
}
