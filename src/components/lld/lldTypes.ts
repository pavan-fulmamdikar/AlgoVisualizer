export interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  layer: 'client' | 'controller' | 'service' | 'pattern' | 'storage';
  x: number; // 0..100 percentage or SVG coordinate (0..760)
  y: number; // SVG coordinate (0..170)
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
}

export interface UMLClassBox {
  name: string;
  stereotype: 'interface' | 'class' | 'enum' | 'singleton' | 'strategy' | 'state';
  role: string; // 1-sentence beginner explanation
  fields: string[];
  methods: string[];
  relations?: { target: string; type: 'implements' | 'has-a' | 'uses' | 'creates' | 'notifies'; label?: string }[];
}

export interface DomainCell {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  status: 'default' | 'active' | 'success' | 'warning' | 'danger' | 'muted' | 'locked';
}

export interface DomainGroup {
  title: string;
  subtitle?: string;
  layout?: 'row' | 'grid' | 'chain' | 'shaft' | 'split';
  columns?: number;
  cells: DomainCell[];
}

export interface LLDStep {
  title: string;
  explanation: string; // Beginner-friendly 1-2 sentence explanation
  status?: 'info' | 'success' | 'warning' | 'error';
  activeArchNodes: string[];
  activeArchEdge?: { from: string; to: string; call: string };
  domainGroups: DomainGroup[];
  stateChips: { label: string; value: string; changed?: boolean }[];
  activeLinesJava: number[];
  activeLinesPy: number[];
}

export interface LLDScenario {
  id: string;
  label: string;
  summary: string;
  steps: LLDStep[];
}

export interface LLDProblemData {
  slug: string;
  num: number;
  title: string;
  category?: 'lld' | 'concurrency';
  priority: 'Must Know' | 'Important' | 'Advanced' | 'Specialized' | 'Optional';
  patterns: string[];
  concurrencyNote: string;
  analogy: string;
  requirements: string[];
  patternExplanations: { pattern: string; why: string }[];
  edgeCases: { title: string; solution: string }[];
  followUps: { q: string; a: string }[];
  archNodes: ArchNode[];
  archEdges: ArchEdge[];
  umlClasses: UMLClassBox[];
  javaCode: string[];
  pythonCode: string[];
  scenarios: LLDScenario[];
}
