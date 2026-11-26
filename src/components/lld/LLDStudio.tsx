import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  PanelLeft,
  X,
  Sun,
  Moon,
  Code2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAppShell } from '../../AppShellContext';
import { ControlBar, CodePanel, useAnimationController } from '../animations/VisualizerLayout';
import { LLD_PART1 } from './lldDataPart1';
import { LLD_PART2 } from './lldDataPart2';
import { CONCURRENCY_PART1 } from './concurrencyDataPart1';
import { CONCURRENCY_PART2 } from './concurrencyDataPart2';
import type { LLDProblemData, ArchNode, DomainGroup, LLDScenario } from './lldTypes';
import './LLDStudio.css';

export const ALL_LLD_PROBLEMS: Record<string, LLDProblemData> = {
  ...LLD_PART1,
  ...LLD_PART2,
  ...CONCURRENCY_PART1,
  ...CONCURRENCY_PART2
};

export const LLD_ORDERED_LIST: LLDProblemData[] = [
  ALL_LLD_PROBLEMS['lru-cache'],
  ALL_LLD_PROBLEMS['elevator'],
  ALL_LLD_PROBLEMS['parking-lot'],
  ALL_LLD_PROBLEMS['atm-machine'],
  ALL_LLD_PROBLEMS['splitwise'],
  ALL_LLD_PROBLEMS['bookmyshow'],
  ALL_LLD_PROBLEMS['food-delivery'],
  ALL_LLD_PROBLEMS['rate-limiter'],
  ALL_LLD_PROBLEMS['meeting-scheduler'],
  ALL_LLD_PROBLEMS['snake-and-ladder'],
  ALL_LLD_PROBLEMS['design-logger']
];

export const CONCURRENCY_ORDERED_LIST: LLDProblemData[] = [
  ALL_LLD_PROBLEMS['concurrency-basics'],
  ALL_LLD_PROBLEMS['concurrenthashmap-collections'],
  ALL_LLD_PROBLEMS['synchronization-types'],
  ALL_LLD_PROBLEMS['volatile-keyword'],
  ALL_LLD_PROBLEMS['volatile-atomic-transient'],
  ALL_LLD_PROBLEMS['synchronized-vs-reentrantlock'],
  ALL_LLD_PROBLEMS['thread-pools-executorservice'],
  ALL_LLD_PROBLEMS['completablefuture-async'],
  ALL_LLD_PROBLEMS['deadlock-livelock-starvation'],
  ALL_LLD_PROBLEMS['blocking-queue'],
  ALL_LLD_PROBLEMS['hashmap-vs-concurrenthashmap'],
  ALL_LLD_PROBLEMS['virtual-threads'],
  ALL_LLD_PROBLEMS['jvm-gc-overview'],
  ALL_LLD_PROBLEMS['weakhashmap'],
  ALL_LLD_PROBLEMS['weak-soft-phantom-reference']
];

interface Point {
  x: number;
  y: number;
}

function evalCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  };
}

// Lay out the 5 nodes in a spacious, non-overlapping geometry inside 880 x 195
function getNormalizedNodePos(node: ArchNode, index: number, total: number): Point {
  // Canonical 5-node layout with generous separation:
  // Top row (y = 54): Client (x = 95), Controller/Server (x = 340), Storage/DB (x = 760)
  // Bottom row (y = 148): Pattern/Queue (x = 465), Service/Engine (x = 655)
  if (node.layer === 'client') return { x: 92, y: 56 };
  if (node.layer === 'controller') return { x: 330, y: 56 };
  if (node.layer === 'storage') return { x: 768, y: 56 };
  if (node.layer === 'pattern') return { x: 455, y: 146 };
  if (node.layer === 'service') return { x: 645, y: 146 };
  const step = 740 / Math.max(1, total - 1);
  return { x: 70 + index * step, y: 95 };
}

function getBoxHalfSize(layer: ArchNode['layer']) {
  if (layer === 'client') return { hw: 40, hh: 40 };
  if (layer === 'storage') return { hw: 58, hh: 36 };
  return { hw: 62, hh: 32 };
}

function getCleanConnector(
  fromNode: ArchNode,
  toNode: ArchNode,
  posMap: Map<string, Point>
): { p0: Point; p1: Point; p2: Point; p3: Point; isCurved: boolean } {
  const c1 = posMap.get(fromNode.id) || { x: fromNode.x, y: fromNode.y };
  const c2 = posMap.get(toNode.id) || { x: toNode.x, y: toNode.y };
  const b1 = getBoxHalfSize(fromNode.layer);
  const b2 = getBoxHalfSize(toNode.layer);

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  // Same horizontal tier (e.g. Client -> Server, Server -> DB, Pattern -> Service)
  if (Math.abs(dy) < 25) {
    const dir = dx >= 0 ? 1 : -1;
    const p0 = { x: c1.x + dir * (b1.hw + 6), y: c1.y };
    const p3 = { x: c2.x - dir * (b2.hw + 8), y: c2.y };
    return {
      p0,
      p1: { x: p0.x + (p3.x - p0.x) * 0.35, y: p0.y },
      p2: { x: p0.x + (p3.x - p0.x) * 0.65, y: p3.y },
      p3,
      isCurved: false
    };
  }

  // Top tier -> Bottom tier: exit from BOTTOM center of top node, enter LEFT center of bottom node
  if (dy > 0) {
    const p0 = { x: c1.x, y: c1.y + b1.hh + 4 };
    const p3 = { x: c2.x - b2.hw - 8, y: c2.y };
    return {
      p0,
      p1: { x: p0.x, y: p3.y },
      p2: { x: (p0.x + p3.x) / 2, y: p3.y },
      p3,
      isCurved: true
    };
  }

  // Bottom tier -> Top tier: exit from RIGHT center of bottom node, enter BOTTOM center of top node
  const p0 = { x: c1.x + b1.hw + 4, y: c1.y };
  const p3 = { x: c2.x, y: c2.y + b2.hh + 8 };
  return {
    p0,
    p1: { x: p3.x, y: p0.y },
    p2: { x: p3.x, y: (p0.y + p3.y) / 2 },
    p3,
    isCurved: true
  };
}

function ModernArchitectureCanvas({
  problem,
  scenarios,
  scenarioIdx,
  onSelectScenario,
  stepNum,
  maxSteps,
  stepTitle,
  activeNodes,
  activeEdge,
  domainGroups,
  stateChips
}: {
  problem: LLDProblemData;
  scenarios: LLDScenario[];
  scenarioIdx: number;
  onSelectScenario: (idx: number) => void;
  stepNum: number;
  maxSteps: number;
  stepTitle: string;
  activeNodes: string[];
  activeEdge?: { from: string; to: string; call: string };
  domainGroups: DomainGroup[];
  stateChips: { label: string; value: string; changed?: boolean }[];
}) {
  const nodeMap = new Map(problem.archNodes.map(n => [n.id, n]));
  const posMap = new Map<string, Point>();
  problem.archNodes.forEach((n, idx) => {
    posMap.set(n.id, getNormalizedNodePos(n, idx, problem.archNodes.length));
  });

  // Smooth 0% -> 100% packet motion along the active connector
  const [animT, setAnimT] = useState(0.1);

  useEffect(() => {
    let rafId: number;
    const start = performance.now();
    const travelMs = 1250;
    const holdMs = 450;
    const cycleMs = travelMs + holdMs;

    const tick = (now: number) => {
      const elapsed = (now - start) % cycleMs;
      if (elapsed < travelMs) {
        const raw = elapsed / travelMs;
        const eased = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
        setAnimT(0.06 + eased * 0.88);
      } else {
        setAnimT(0.94);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [stepNum, problem.slug, activeEdge?.from, activeEdge?.to, activeEdge?.call]);

  let packetPt: Point | null = null;
  let trailPathD: string | null = null;
  const rawCall = activeEdge?.call || '';

  if (activeEdge) {
    const fromN = nodeMap.get(activeEdge.from);
    const toN = nodeMap.get(activeEdge.to);
    if (fromN && toN) {
      const pts = getCleanConnector(fromN, toN, posMap);
      packetPt = evalCubicBezier(pts.p0, pts.p1, pts.p2, pts.p3, animT);
      trailPathD = pts.isCurved
        ? `M ${pts.p0.x} ${pts.p0.y} C ${pts.p1.x} ${pts.p1.y}, ${pts.p2.x} ${pts.p2.y}, ${pts.p3.x} ${pts.p3.y}`
        : `M ${pts.p0.x} ${pts.p0.y} L ${pts.p3.x} ${pts.p3.y}`;
    }
  }

  const cleanStepTitle = stepTitle.replace(/^Step\s*\d+\s*:\s*/i, '');

  return (
    <div className="modern-arch-board">
      {/* 1. COMPACT INTEGRATED HEADER BAR INSIDE WHITEBOARD (Step Badge + Active Call + Live State Chips) */}
      <div className="modern-board-topbar">
        <div className="modern-board-topbar-left">
          <span className="modern-arch-step-pill">
            Step {stepNum} / {maxSteps}
          </span>
          <span className="modern-board-step-title">{cleanStepTitle}</span>
        </div>

        <div className="modern-board-topbar-right">
          {scenarios.length > 1 && (
            <div className="modern-scenario-pills">
              {scenarios.map((sc, idx) => {
                const isBroken = sc.label.includes('❌');
                const isFixed = sc.label.includes('✅');
                const shortLabel = isBroken
                  ? '❌ Broken (Bug)'
                  : isFixed
                  ? '✅ Fixed (Safe)'
                  : `Case ${idx + 1}`;
                return (
                  <button
                    type="button"
                    key={sc.id}
                    className={`modern-scn-btn ${scenarioIdx === idx ? 'active' : ''} ${
                      isBroken ? 'is-broken' : isFixed ? 'is-fixed' : ''
                    }`}
                    onClick={() => onSelectScenario(idx)}
                    title={sc.label}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          )}
          {rawCall && (
            <span className="modern-call-badge" title="Active request packet in flight">
              <span className="modern-call-dot" />
              <code>{rawCall}</code>
            </span>
          )}
        </div>
      </div>

      {/* 2. SPACIOUS ZERO-COLLISION ARCHITECTURE DIAGRAM */}
      <div className="modern-svg-container">
        <svg viewBox="0 0 860 194" className="modern-arch-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mod-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M 1 1.5 L 7 4.5 L 1 7.5" fill="none" stroke="var(--arch-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="mod-arrow-muted" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M 1 1.5 L 7 4.5 L 1 7.5" fill="none" stroke="var(--arch-muted-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="mod-arrow-active" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M 1 1.5 L 7 4.5 L 1 7.5" fill="none" stroke="#ea580c" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          {/* CONNECTORS */}
          {problem.archEdges.map((edge, idx) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;

            const isEdgeActive =
              activeEdge &&
              ((activeEdge.from === edge.from && activeEdge.to === edge.to) ||
                (activeEdge.from === edge.to && activeEdge.to === edge.from));

            const bothNodesActive = activeNodes.includes(from.id) && activeNodes.includes(to.id);
            const pts = getCleanConnector(from, to, posMap);
            const isClientEdge = from.layer === 'client' || to.layer === 'client';

            const pathD = pts.isCurved
              ? `M ${pts.p0.x} ${pts.p0.y} C ${pts.p1.x} ${pts.p1.y}, ${pts.p2.x} ${pts.p2.y}, ${pts.p3.x} ${pts.p3.y}`
              : `M ${pts.p0.x} ${pts.p0.y} L ${pts.p3.x} ${pts.p3.y}`;

            const midPt = evalCubicBezier(pts.p0, pts.p1, pts.p2, pts.p3, 0.5);

            const strokeColor = isEdgeActive
              ? '#ea580c'
              : bothNodesActive
              ? 'var(--arch-ink)'
              : 'var(--arch-muted-line)';

            return (
              <g key={idx}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isEdgeActive ? 2.4 : 1.6}
                  strokeDasharray={isClientEdge ? '5 4' : undefined}
                  opacity={isEdgeActive ? 1 : bothNodesActive ? 0.85 : 0.45}
                  markerEnd={
                    isEdgeActive
                      ? 'url(#mod-arrow-active)'
                      : bothNodesActive
                      ? 'url(#mod-arrow)'
                      : 'url(#mod-arrow-muted)'
                  }
                />

                {/* Clean masked protocol label on wide horizontal edges */}
                {edge.label && !pts.isCurved && Math.abs(pts.p3.x - pts.p0.x) > 105 && (
                  <g transform={`translate(${midPt.x}, ${midPt.y})`}>
                    <rect
                      x={-(edge.label.length * 3.4 + 8)}
                      y={-8}
                      width={edge.label.length * 6.8 + 16}
                      height={16}
                      rx={4}
                      fill="var(--arch-board-bg)"
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="600"
                      fill={isEdgeActive ? '#ea580c' : 'var(--arch-sub)'}
                      fontFamily="'Fira Code', monospace"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ACTIVE GLOWING PACKET DOT TRAVELING ALONG THE WIRE */}
          {packetPt && trailPathD && (
            <g>
              {/* Outer pulse */}
              <circle cx={packetPt.x} cy={packetPt.y} r={12} fill="#ea580c" opacity="0.2" />
              <circle cx={packetPt.x} cy={packetPt.y} r={6.5} fill="#ea580c" stroke="#ffffff" strokeWidth="1.8" />
            </g>
          )}

          {/* COMPONENT NODES */}
          {problem.archNodes.map(node => {
            const isActive = activeNodes.includes(node.id);
            const pt = posMap.get(node.id) || { x: node.x, y: node.y };
            const cx = pt.x;
            const cy = pt.y;
            const strokeCol = isActive ? 'var(--arch-ink)' : 'var(--arch-muted-stroke)';
            const nodeOpacity = isActive ? 1 : 0.46;

            // 1) CLIENT CIRCLE NODE
            if (node.layer === 'client') {
              return (
                <g
                  key={node.id}
                  transform={`translate(${cx}, ${cy})`}
                  style={{ opacity: nodeOpacity, transition: 'opacity 0.2s ease' }}
                >
                  <circle
                    r={39}
                    fill="var(--arch-node-bg)"
                    stroke={strokeCol}
                    strokeWidth={isActive ? 2.2 : 1.5}
                  />
                  <text
                    x={0}
                    y={-8}
                    textAnchor="middle"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="var(--arch-ink)"
                  >
                    {node.label}
                  </text>
                  <rect x={-30} y={2} width={60} height={17} rx={8.5} fill="#1e293b" />
                  <text
                    x={0}
                    y={13.5}
                    textAnchor="middle"
                    fontSize="8.2"
                    fontWeight="600"
                    fill="#ffffff"
                    fontFamily="'Fira Code', monospace"
                  >
                    {node.sublabel.length > 10 ? node.sublabel.slice(0, 9) + '…' : node.sublabel}
                  </text>

                  {/* Non-overlapping Actor / Thread tag positioned cleanly at bottom-left */}
                  <g transform="translate(-44, 34)" className={isActive ? 'alice-cursor-active' : ''}>
                    <rect x={0} y={0} width={42} height={16} rx={4} fill={problem.category === 'concurrency' ? '#3b82f6' : '#10b981'} />
                    <text x={21} y={11} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#ffffff">
                      {problem.category === 'concurrency' ? 'Thread' : 'Alice'}
                    </text>
                    <polygon points="34,-2 41,-8 38,1" fill={problem.category === 'concurrency' ? '#3b82f6' : '#10b981'} />
                  </g>
                </g>
              );
            }

            // 2) STORAGE / DATABASE 3D CYLINDER NODE
            if (node.layer === 'storage') {
              const w = 114;
              const h = 68;
              const rx = w / 2;
              const ry = 9.5;
              return (
                <g
                  key={node.id}
                  transform={`translate(${cx}, ${cy})`}
                  style={{ opacity: nodeOpacity, transition: 'opacity 0.2s ease' }}
                >
                  <path
                    d={`M ${-rx} ${-h / 2 + ry}
                        L ${-rx} ${h / 2 - ry}
                        A ${rx} ${ry} 0 0 0 ${rx} ${h / 2 - ry}
                        L ${rx} ${-h / 2 + ry} Z`}
                    fill="var(--arch-node-bg)"
                    stroke={strokeCol}
                    strokeWidth={isActive ? 2.2 : 1.5}
                  />
                  <ellipse
                    cx={0}
                    cy={-h / 2 + ry}
                    rx={rx}
                    ry={ry}
                    fill="var(--arch-node-bg)"
                    stroke={strokeCol}
                    strokeWidth={isActive ? 2.2 : 1.5}
                  />
                  <text
                    x={0}
                    y={3}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--arch-ink)"
                  >
                    {node.label}
                  </text>
                  <text
                    x={0}
                    y={18}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="var(--arch-sub)"
                    fontFamily="'Fira Code', monospace"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            }

            // 3) CLEAN COMPONENT CARD (Controller / Pattern / Service)
            const w = 124;
            const h = 62;
            const accentBarColor =
              node.layer === 'controller'
                ? '#3b82f6'
                : node.layer === 'pattern'
                ? '#ea580c'
                : '#8b5cf6';

            return (
              <g
                key={node.id}
                transform={`translate(${cx - w / 2}, ${cy - h / 2})`}
                style={{ opacity: nodeOpacity, transition: 'opacity 0.2s ease' }}
              >
                <rect
                  width={w}
                  height={h}
                  rx={11}
                  fill="var(--arch-node-bg)"
                  stroke={isActive ? accentBarColor : strokeCol}
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                {/* Subtle top role pill bar */}
                <rect
                  x={14}
                  y={9}
                  width={w - 28}
                  height={4}
                  rx={2}
                  fill={isActive ? accentBarColor : 'var(--arch-bar)'}
                  opacity={isActive ? 0.9 : 0.45}
                />
                <text
                  x={w / 2}
                  y={31}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--arch-ink)"
                >
                  {node.label}
                </text>
                <text
                  x={w / 2}
                  y={47}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="var(--arch-sub)"
                  fontFamily="'Fira Code', monospace"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. INTEGRATED LIVE DATA DOCK + INLINE STATE PILLS */}
      <div className="modern-arch-data-dock">
        {domainGroups.map((grp, gIdx) => (
          <div key={gIdx} className="lld-domain-group">
            <div className="lld-domain-hdr-row">
              <span className="lld-domain-title">{grp.title}</span>
              {gIdx === 0 && stateChips.length > 0 && (
                <div className="lld-inline-state-pills">
                  {stateChips.map((chip, i) => (
                    <span key={i} className={`lld-mini-state ${chip.changed ? 'is-changed' : ''}`}>
                      <span className="lld-mini-state-lbl">{chip.label}:</span>
                      <strong>{chip.value}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`lld-domain-cells layout-${grp.layout || 'row'}`}>
              {grp.cells.map((cell, cIdx) => (
                <React.Fragment key={cell.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0.9, scale: 0.98 }}
                    animate={{
                      opacity: 1,
                      scale: cell.status === 'active' || cell.status === 'success' ? 1.02 : 1
                    }}
                    transition={{ duration: 0.18 }}
                    className={`lld-cell status-${cell.status}`}
                  >
                    {cell.badge && <span className="lld-cell-badge">{cell.badge}</span>}
                    <div className="lld-cell-label">{cell.label}</div>
                    {cell.sublabel && <div className="lld-cell-sub">{cell.sublabel}</div>}
                  </motion.div>
                  {grp.layout === 'chain' && cIdx < grp.cells.length - 1 && (
                    <span className="lld-chain-arrow" aria-hidden="true">
                      <ChevronRight size={14} />
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LLDStudio({ onBackToSD }: { onBackToSD?: () => void }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const shell = useAppShell();

  const problem = (slug && ALL_LLD_PROBLEMS[slug]) || LLD_ORDERED_LIST[0];

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [rightTab, setRightTab] = useState<'code' | 'explanation' | 'arch'>('code');
  const [leftPct, setLeftPct] = useState(56);
  const [isDragging, setIsDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);

  const safeScenarioIdx = scenarioIdx < problem.scenarios.length ? scenarioIdx : 0;
  const scenario = problem.scenarios[safeScenarioIdx];

  const {
    step,
    isPlaying,
    speed,
    setSpeed,
    handleStepChange,
    handlePlayToggle,
    reset
  } = useAnimationController(scenario.steps.length);

  useEffect(() => {
    setScenarioIdx(0);
    reset();
  }, [problem.slug]);

  const safeStepIdx = Math.min(step, scenario.steps.length - 1);
  const currentStep = scenario.steps[safeStepIdx];

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const el = splitRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(72, Math.max(36, pct)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const handleBack = () => {
    if (onBackToSD) onBackToSD();
    else navigate('/?cat=system-design');
  };

  return (
    <div className="visualizer-route-wrap">
      <div className="vp-shell lld-studio-shell">
        {/* UNIFIED 48PX TOP HEADER */}
        <div className="vp-header">
          <div className="vp-title-row">
            {shell?.isProblemPage && (
              <button
                type="button"
                className="vp-icon-btn"
                onClick={shell.toggleSidebar}
                title="Browse categories"
              >
                {shell.sidebarOpen ? <X size={16} /> : <PanelLeft size={16} />}
              </button>
            )}
            <button type="button" className="vp-back" onClick={handleBack}>
              <ArrowLeft size={14} />
              <span>System Design</span>
            </button>
            <span className="vp-header-divider" />

            <select
              className="lld-topic-select"
              value={problem.slug}
              onChange={e => navigate(`/system-design/${e.target.value}`)}
              aria-label="Select System Design problem"
            >
              <optgroup label="LLD Interview Prep (11)">
                {LLD_ORDERED_LIST.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.num} · {p.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Concurrency & Threading (15)">
                {CONCURRENCY_ORDERED_LIST.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.num} · {p.title}
                  </option>
                ))}
              </optgroup>
            </select>

            <div className="vp-badges">
              <span
                className={`sd-priority-chip ${
                  problem.priority === 'Must Know'
                    ? 'sd-prio-must-know'
                    : problem.priority === 'Important'
                    ? 'sd-prio-important'
                    : problem.priority === 'Advanced'
                    ? 'sd-prio-advanced'
                    : 'sd-prio-specialized'
                }`}
              >
                {problem.priority}
              </span>
              {problem.patterns.map((pat, i) => (
                <span key={i} className="tag-badge">{pat}</span>
              ))}
            </div>
          </div>

          <div className="vp-header-right">
            {shell && (
              <button
                type="button"
                className="vp-icon-btn"
                onClick={shell.toggleTheme}
                title={`Switch to ${shell.theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {shell.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* ZERO-SCROLL STUDIO WORKSPACE */}
        <div className={`studio-main ${isDragging ? 'is-resizing' : ''}`}>
          <div
            className="studio-split"
            ref={splitRef}
            style={{ '--left-pct': `${leftPct}%` } as React.CSSProperties}
          >
            {/* LEFT PANE: Only 2 Clean Blocks -> 1) Unified Whiteboard Card, 2) Live Step Caption */}
            <div className="studio-left">
              <div className="studio-stage-scroll lld-stage-scroll">
                <ModernArchitectureCanvas
                  problem={problem}
                  scenarios={problem.scenarios}
                  scenarioIdx={safeScenarioIdx}
                  onSelectScenario={idx => {
                    setScenarioIdx(idx);
                    reset();
                  }}
                  stepNum={safeStepIdx + 1}
                  maxSteps={scenario.steps.length}
                  stepTitle={currentStep.title}
                  activeNodes={currentStep.activeArchNodes}
                  activeEdge={currentStep.activeArchEdge}
                  domainGroups={currentStep.domainGroups}
                  stateChips={currentStep.stateChips}
                />

                <div className={`step-hud-bar ${currentStep.status || 'info'}`}>
                  <span className={`step-hud-dot ${currentStep.status || 'info'}`} />
                  <div className="step-hud-text">
                    {currentStep.explanation}
                  </div>
                </div>
              </div>
            </div>

            {/* RESIZABLE VERTICAL DIVIDER */}
            <div
              className="studio-resizer"
              onMouseDown={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDoubleClick={() => setLeftPct(56)}
              title="Drag to resize · Double-click to reset"
              role="separator"
              aria-orientation="vertical"
            >
              <span className="studio-resizer-grip" />
            </div>

            {/* RIGHT PANE: Code | Explanation | UML & Classes */}
            <div className="studio-right">
              <div className="studio-right-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === 'code'}
                  className={`studio-rtab ${rightTab === 'code' ? 'active' : ''}`}
                  onClick={() => setRightTab('code')}
                >
                  <Code2 size={13} />
                  <span>Code</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === 'explanation'}
                  className={`studio-rtab ${rightTab === 'explanation' ? 'active' : ''}`}
                  onClick={() => setRightTab('explanation')}
                >
                  <Lightbulb size={13} />
                  <span>Explanation</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === 'arch'}
                  className={`studio-rtab ${rightTab === 'arch' ? 'active' : ''}`}
                  onClick={() => setRightTab('arch')}
                >
                  <Layers size={13} />
                  <span>{problem.category === 'concurrency' ? 'Cheat Sheet' : 'UML & Classes'}</span>
                </button>
              </div>

              <div className="studio-right-body">
                {/* TAB 1: SYNCED JAVA & PYTHON CODE */}
                <div className={`studio-tab-pane studio-code-pane ${rightTab === 'code' ? 'active' : ''}`}>
                  <div className="studio-code-slot">
                    <CodePanel
                      title={`${problem.title} — Clean Interview Implementation`}
                      javaCode={problem.javaCode}
                      pythonCode={problem.pythonCode}
                      activeLinesJava={currentStep.activeLinesJava}
                      activeLinesPy={currentStep.activeLinesPy}
                    />
                  </div>
                  <div className="studio-complexity-slot">
                    <div className="cplx-footer lld-pattern-footer">
                      <div className="cplx-chip">
                        <Lock size={12} className="cplx-chip-icon" />
                        <span className="cplx-chip-lbl">Concurrency</span>
                        <span className="cplx-chip-val">{problem.concurrencyNote}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TAB 2: EXPLANATION (Right Beside Code!) */}
                <div className={`studio-tab-pane studio-scroll-pane ${rightTab === 'explanation' ? 'active' : ''}`}>
                  <div className="lld-guide-list">
                    <div className="card lld-live-exp-card">
                      <div className="lld-live-exp-header">
                        <span className="modern-arch-step-pill">
                          Step {safeStepIdx + 1} of {scenario.steps.length}
                        </span>
                        <span className="lld-live-exp-scn">{scenario.label}</span>
                      </div>
                      <h4 className="lld-live-exp-title">{currentStep.title}</h4>
                      <p className="why-p">{currentStep.explanation}</p>
                      {currentStep.activeArchEdge && (
                        <div className="lld-live-call-box">
                          <span>Active Request Packet:</span>
                          <code>{currentStep.activeArchEdge.call}</code>
                        </div>
                      )}
                    </div>

                    <div className="card">
                      <div className="card-title">
                        Full Request Walkthrough from Start (Click any step to jump)
                      </div>
                      <div className="algo-list">
                        {scenario.steps.map((st, idx) => (
                          <div
                            key={idx}
                            className={`al lld-clickable-step ${safeStepIdx === idx ? 'on' : ''}`}
                            onClick={() => handleStepChange(idx)}
                          >
                            <div className="al-num">{idx + 1}</div>
                            <div className="al-txt">
                              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                                {st.title}
                              </div>
                              <div>{st.explanation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card lld-analogy-card">
                      <div className="card-title">
                        <Sparkles size={14} style={{ marginRight: 6, color: 'var(--accent)' }} />
                        Real-World Beginner Analogy
                      </div>
                      <p className="why-p">{problem.analogy}</p>
                    </div>

                    <div className="card">
                      <div className="card-title">
                        <CheckCircle2 size={14} style={{ marginRight: 6, color: 'var(--easy)' }} />
                        Core Functional Requirements
                      </div>
                      <ul className="lld-req-list">
                        {problem.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="card">
                      <div className="card-title">
                        <Layers size={14} style={{ marginRight: 6, color: 'var(--purple)' }} />
                        Why These Design Patterns Work
                      </div>
                      <div className="lld-pattern-list">
                        {problem.patternExplanations.map((pe, i) => (
                          <div key={i} className="lld-pattern-item">
                            <div className="lld-pattern-name">{pe.pattern}</div>
                            <div className="lld-pattern-why">{pe.why}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-title">
                        <ShieldAlert size={14} style={{ marginRight: 6, color: 'var(--medium)' }} />
                        Concurrency & Edge Cases
                      </div>
                      <div className="lld-pattern-list">
                        {problem.edgeCases.map((ec, i) => (
                          <div key={i} className="lld-pattern-item">
                            <div className="lld-pattern-name">⚠️ {ec.title}</div>
                            <div className="lld-pattern-why"><strong>Fix:</strong> {ec.solution}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-title">
                        <HelpCircle size={14} style={{ marginRight: 6, color: 'var(--cyan)' }} />
                        Common Interviewer Follow-Ups
                      </div>
                      <div className="lld-pattern-list">
                        {problem.followUps.map((fu, i) => (
                          <div key={i} className="lld-pattern-item">
                            <div className="lld-pattern-name">Q: {fu.q}</div>
                            <div className="lld-pattern-why"><strong>A:</strong> {fu.a}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TAB 3: UML & CLASSES BLUEPRINT */}
                <div className={`studio-tab-pane studio-scroll-pane ${rightTab === 'arch' ? 'active' : ''}`}>
                  <div className="lld-uml-list">
                    <div className="lld-section-heading">Class & Interface Blueprint (UML)</div>
                    {problem.umlClasses.map((cls, idx) => (
                      <div key={idx} className="card lld-uml-card">
                        <div className="lld-uml-header">
                          <div>
                            <span className={`lld-stereotype st-${cls.stereotype}`}>
                              «{cls.stereotype}»
                            </span>
                            <h4 className="lld-uml-name">{cls.name}</h4>
                          </div>
                        </div>
                        <p className="lld-uml-role">{cls.role}</p>

                        {cls.fields.length > 0 && (
                          <div className="lld-uml-block">
                            <div className="lld-uml-block-lbl">Fields</div>
                            {cls.fields.map((f, fi) => (
                              <code key={fi} className="lld-uml-line">{f}</code>
                            ))}
                          </div>
                        )}

                        {cls.methods.length > 0 && (
                          <div className="lld-uml-block">
                            <div className="lld-uml-block-lbl">Methods</div>
                            {cls.methods.map((m, mi) => (
                              <code key={mi} className="lld-uml-line">{m}</code>
                            ))}
                          </div>
                        )}

                        {cls.relations && cls.relations.length > 0 && (
                          <div className="lld-uml-relations">
                            {cls.relations.map((rel, ri) => (
                              <span key={ri} className="lld-rel-chip">
                                <strong>{rel.type}</strong> → <code>{rel.target}</code>
                                {rel.label ? ` (${rel.label})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCKED BOTTOM PLAYBACK TRANSPORT BAR */}
          <div className="studio-bottom-dock">
            <ControlBar
              step={step}
              maxSteps={scenario.steps.length}
              isPlaying={isPlaying}
              speed={speed}
              onStepChange={handleStepChange}
              onPlayToggle={handlePlayToggle}
              onSpeedChange={setSpeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
