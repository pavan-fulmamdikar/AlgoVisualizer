import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@monaco-editor/react';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SkipForward,
  Sparkles,
  Plus,
  Copy,
  Check,
  Code2,
  Eye,
  Bug,
  Clock,
  HardDrive,
  Lightbulb,
  PanelLeft,
  X,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import { useAppShell } from '../../AppShellContext';

// -----------------------------------------------------------------------------
// Studio Portal Context
// Organizes existing problem components into a zero-scroll IDE/Debugger Studio
// without requiring changes to individual problem files.
// -----------------------------------------------------------------------------

interface StudioContextValue {
  casesSlot: HTMLDivElement | null;
  setCasesSlot: (el: HTMLDivElement | null) => void;
  codeSlot: HTMLDivElement | null;
  setCodeSlot: (el: HTMLDivElement | null) => void;
  notesSlot: HTMLDivElement | null;
  setNotesSlot: (el: HTMLDivElement | null) => void;
  promptSlot: HTMLDivElement | null;
  setPromptSlot: (el: HTMLDivElement | null) => void;
  complexitySlot: HTMLDivElement | null;
  setComplexitySlot: (el: HTMLDivElement | null) => void;
  transportSlot: HTMLDivElement | null;
  setTransportSlot: (el: HTMLDivElement | null) => void;
  hasCases: boolean;
  registerCases: () => () => void;
  hasStepLogic: boolean;
  registerStepLogic: () => () => void;
  hasPrompt: boolean;
  registerPrompt: () => () => void;
  hasNotes: boolean;
  registerNotes: () => () => void;
  hasComplexity: boolean;
  registerComplexity: () => () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);
const PracticeModeContext = createContext<boolean>(false);

function useCounterFlag() {
  const [count, setCount] = useState(0);
  const register = useCallback(() => {
    setCount(c => c + 1);
    return () => setCount(c => Math.max(0, c - 1));
  }, []);
  return [count > 0, register] as const;
}

export function VisualizerLayout({ children }: { children: React.ReactNode }) {
  const [casesSlot, setCasesSlot] = useState<HTMLDivElement | null>(null);
  const [codeSlot, setCodeSlot] = useState<HTMLDivElement | null>(null);
  const [notesSlot, setNotesSlot] = useState<HTMLDivElement | null>(null);
  const [promptSlot, setPromptSlot] = useState<HTMLDivElement | null>(null);
  const [complexitySlot, setComplexitySlot] = useState<HTMLDivElement | null>(null);
  const [transportSlot, setTransportSlot] = useState<HTMLDivElement | null>(null);

  const [hasCases, registerCases] = useCounterFlag();
  const [hasStepLogic, registerStepLogic] = useCounterFlag();
  const [hasPrompt, registerPrompt] = useCounterFlag();
  const [hasNotes, registerNotes] = useCounterFlag();
  const [hasComplexity, registerComplexity] = useCounterFlag();

  return (
    <StudioContext.Provider
      value={{
        casesSlot, setCasesSlot,
        codeSlot, setCodeSlot,
        notesSlot, setNotesSlot,
        promptSlot, setPromptSlot,
        complexitySlot, setComplexitySlot,
        transportSlot, setTransportSlot,
        hasCases, registerCases,
        hasStepLogic, registerStepLogic,
        hasPrompt, registerPrompt,
        hasNotes, registerNotes,
        hasComplexity, registerComplexity
      }}
    >
      <div className="vp-shell">
        {children}
      </div>
    </StudioContext.Provider>
  );
}

/** Helper to portal custom test-case toolbars (e.g. Linked List layout) into the Left Stage header strip */
export function CasesPortal({ children }: { children: React.ReactNode }) {
  const studio = useContext(StudioContext);
  const isPractice = useContext(PracticeModeContext);

  useEffect(() => {
    if (!studio || isPractice) return;
    return studio.registerCases();
  }, [studio, isPractice]);

  if (isPractice || !studio) {
    return <>{children}</>;
  }
  if (!studio.casesSlot) return null;
  return createPortal(children, studio.casesSlot);
}

// -----------------------------------------------------------------------------
// Unified Single-Row Top Header (48px)
// -----------------------------------------------------------------------------

const LC_PROBLEM_URLS: Record<string, string> = {
  '1': 'https://leetcode.com/problems/two-sum/',
  '3': 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
  '4': 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
  '5': 'https://leetcode.com/problems/longest-palindromic-substring/',
  '11': 'https://leetcode.com/problems/container-with-most-water/',
  '13': 'https://leetcode.com/problems/roman-to-integer/',
  '14': 'https://leetcode.com/problems/longest-common-prefix/',
  '15': 'https://leetcode.com/problems/3sum/',
  '19': 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
  '21': 'https://leetcode.com/problems/merge-two-sorted-lists/',
  '26': 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/',
  '33': 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
  '34': 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/',
  '35': 'https://leetcode.com/problems/search-insert-position/',
  '36': 'https://leetcode.com/problems/valid-sudoku/',
  '41': 'https://leetcode.com/problems/first-missing-positive/',
  '42': 'https://leetcode.com/problems/trapping-rain-water/',
  '48': 'https://leetcode.com/problems/rotate-image/',
  '49': 'https://leetcode.com/problems/group-anagrams/',
  '53': 'https://leetcode.com/problems/maximum-subarray/',
  '54': 'https://leetcode.com/problems/spiral-matrix/',
  '59': 'https://leetcode.com/problems/spiral-matrix-ii/',
  '73': 'https://leetcode.com/problems/set-matrix-zeroes/',
  '74': 'https://leetcode.com/problems/search-a-2d-matrix/',
  '76': 'https://leetcode.com/problems/minimum-window-substring/',
  '79': 'https://leetcode.com/problems/word-search/',
  '81': 'https://leetcode.com/problems/search-in-rotated-sorted-array-ii/',
  '88': 'https://leetcode.com/problems/merge-sorted-array/',
  '121': 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  '125': 'https://leetcode.com/problems/valid-palindrome/',
  '141': 'https://leetcode.com/problems/linked-list-cycle/',
  '143': 'https://leetcode.com/problems/reorder-list/',
  '153': 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
  '162': 'https://leetcode.com/problems/find-peak-element/',
  '167': 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
  '200': 'https://leetcode.com/problems/number-of-islands/',
  '205': 'https://leetcode.com/problems/isomorphic-strings/',
  '206': 'https://leetcode.com/problems/reverse-linked-list/',
  '217': 'https://leetcode.com/problems/contains-duplicate/',
  '225': 'https://leetcode.com/problems/implement-stack-using-queues/',
  '240': 'https://leetcode.com/problems/search-a-2d-matrix-ii/',
  '242': 'https://leetcode.com/problems/valid-anagram/',
  '268': 'https://leetcode.com/problems/missing-number/',
  '271': 'https://leetcode.com/problems/encode-and-decode-strings/',
  '289': 'https://leetcode.com/problems/game-of-life/',
  '344': 'https://leetcode.com/problems/reverse-string/',
  '410': 'https://leetcode.com/problems/split-array-largest-sum/',
  '424': 'https://leetcode.com/problems/longest-repeating-character-replacement/',
  '438': 'https://leetcode.com/problems/find-all-anagrams-in-a-string/',
  '567': 'https://leetcode.com/problems/permutation-in-string/',
  '622': 'https://leetcode.com/problems/design-circular-queue/',
  '647': 'https://leetcode.com/problems/palindromic-substrings/',
  '680': 'https://leetcode.com/problems/valid-palindrome-ii/',
  '704': 'https://leetcode.com/problems/binary-search/',
  '832': 'https://leetcode.com/problems/flipping-an-image/',
  '875': 'https://leetcode.com/problems/koko-eating-bananas/',
  '933': 'https://leetcode.com/problems/number-of-recent-calls/',
  '977': 'https://leetcode.com/problems/squares-of-a-sorted-array/',
  '1011': 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/',
  '1189': 'https://leetcode.com/problems/maximum-number-of-balloons/',
  '1470': 'https://leetcode.com/problems/shuffle-the-array/',
  '1480': 'https://leetcode.com/problems/running-sum-of-1d-array/',
  '1672': 'https://leetcode.com/problems/richest-customer-wealth/',
  '1700': 'https://leetcode.com/problems/number-of-students-unable-to-eat-lunch/',
  '1929': 'https://leetcode.com/problems/concatenation-of-array/',
  '2239': 'https://leetcode.com/problems/find-closest-number-to-zero/',
  'GFG': 'https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1',
  'IB': 'https://www.interviewbit.com/problems/painters-partition-problem/'
};

export function VPHeader({
  title,
  lcNum,
  difficulty,
  tag,
  onBack,
  activeTab = 'visualizer',
  hasDebug,
  onTabChange
}: {
  title: string;
  lcNum: string;
  difficulty: string;
  tag: string;
  onBack?: () => void;
  activeTab?: 'visualizer' | 'practice' | 'debug';
  hasDebug?: boolean;
  onTabChange?: (tab: any) => void;
}) {
  const shell = useAppShell();
  const lcUrl = lcNum ? LC_PROBLEM_URLS[lcNum] : undefined;

  return (
    <div className="vp-header">
      <div className="vp-title-row">
        {shell?.isProblemPage && (
          <button
            type="button"
            className="vp-icon-btn"
            onClick={shell.toggleSidebar}
            title={shell.sidebarOpen ? 'Close topics' : 'Browse topics'}
            aria-label={shell.sidebarOpen ? 'Close topics sidebar' : 'Open topics sidebar'}
          >
            {shell.sidebarOpen ? <X size={16} /> : <PanelLeft size={16} />}
          </button>
        )}
        <button
          type="button"
          className="vp-back"
          onClick={() => { if (onBack) onBack(); }}
          title="Back to problems"
        >
          <ArrowLeft size={14} />
          <span>Problems</span>
        </button>
        <span className="vp-header-divider" aria-hidden="true" />
        <h2 className="vp-title">{title}</h2>
        <div className="vp-badges">
          {lcNum && (
            lcUrl ? (
              <a
                href={lcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-badge"
                title={`Open Problem #${lcNum} on LeetCode`}
                style={{ textDecoration: 'none' }}
              >
                {lcNum === 'GFG' || lcNum === 'IB' ? lcNum : `LC #${lcNum}`} ↗
              </a>
            ) : (
              <span className="lc-badge">#{lcNum}</span>
            )
          )}
          <span className={`diff-badge ${difficulty.toLowerCase()}`}>{difficulty}</span>
          {tag && <span className="tag-badge">{tag}</span>}
        </div>
      </div>

      <div className="vp-header-right">
        {onTabChange && (
          <div className="vp-tabs" role="tablist" aria-label="Workspace mode">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'visualizer'}
              className={`vp-tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`}
              onClick={() => onTabChange('visualizer')}
            >
              <Eye size={13} />
              <span>Visualizer</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'practice'}
              className={`vp-tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => onTabChange('practice')}
            >
              <Code2 size={13} />
              <span>Practice</span>
            </button>
            {hasDebug && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'debug'}
                className={`vp-tab-btn debug-tab ${activeTab === 'debug' ? 'active' : ''}`}
                onClick={() => onTabChange('debug')}
              >
                <Bug size={13} />
                <span>Fix the Bug</span>
              </button>
            )}
          </div>
        )}

        {shell && (
          <button
            type="button"
            className="vp-icon-btn"
            onClick={shell.toggleTheme}
            title={`Switch to ${shell.theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle color theme"
          >
            {shell.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Problem Statement — Portals into Right Pane "Prompt" tab in Visualizer mode,
// renders inline inside Practice / Debug mode.
// -----------------------------------------------------------------------------

export function ProblemStatement({
  statement,
  examples,
  constraints
}: {
  statement: React.ReactNode;
  examples: { label: string; input: React.ReactNode; output: React.ReactNode; explanation?: React.ReactNode }[];
  constraints: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const studio = useContext(StudioContext);
  const isPractice = useContext(PracticeModeContext);

  useEffect(() => {
    if (!studio || isPractice) return;
    return studio.registerPrompt();
  }, [studio, isPractice]);

  const content = (
    <div className="prompt-content">
      <div className="q-stmt">{statement}</div>
      {examples.length > 0 && (
        <div className="q-examples-list">
          {examples.map((ex, i) => (
            <div key={i} className="q-example">
              <div className="q-ex-label">Example {i + 1}</div>
              <div className="q-io"><span className="q-label">Input:</span> <code>{ex.input}</code></div>
              <div className="q-io"><span className="q-label">Output:</span> <code>{ex.output}</code></div>
              {ex.explanation &&
                !(
                  React.isValidElement(ex.explanation) &&
                  ex.explanation.type === React.Fragment &&
                  !(ex.explanation.props as any)?.children
                ) && (
                <div className="q-io"><span className="q-label">Explanation:</span> <span className="q-note">{ex.explanation}</span></div>
              )}
            </div>
          ))}
        </div>
      )}
      {constraints && (
        <div className="q-constraints">
          <strong style={{ color: 'var(--text)' }}>Constraints:</strong> {constraints}
        </div>
      )}
    </div>
  );

  if (isPractice || !studio) {
    return (
      <div className="practice-prompt-wrap">
        <div className="card">
          <div className="card-title">
            <BookOpen size={14} style={{ marginRight: 6, color: 'var(--accent)' }} />
            Problem Statement
          </div>
          {content}
        </div>
      </div>
    );
  }

  if (!studio.promptSlot) return null;
  return createPortal(content, studio.promptSlot);
}

// -----------------------------------------------------------------------------
// Example Picker — Portals into the slim top strip of the Left Animation Stage
// -----------------------------------------------------------------------------

export function ExamplePicker({
  examples,
  activeEx,
  onSelect,
  onCustomInput,
  onGenerateEdgeCase
}: {
  examples: { label: string; output: string }[];
  activeEx: number;
  onSelect: (idx: number) => void;
  onCustomInput?: (val: string, isEdgeCase?: boolean) => void;
  onGenerateEdgeCase?: () => Promise<string>;
}) {
  const studio = useContext(StudioContext);
  const isPractice = useContext(PracticeModeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const [isLoadingEdgeCase, setIsLoadingEdgeCase] = useState(false);

  useEffect(() => {
    if (!studio || isPractice) return;
    return studio.registerCases();
  }, [studio, isPractice]);

  const handleCustomSubmit = () => {
    if (customVal.trim() && onCustomInput) {
      onCustomInput(customVal);
      setIsEditing(false);
      setCustomVal('');
    }
  };

  const toolbar = (
    <div className="ex-toolbar">
      <span className="ex-toolbar-label">Cases</span>
      <div className="ex-row">
        {examples.map((ex, i) => (
          <button
            type="button"
            key={i}
            className={`ex-btn ${activeEx === i ? 'active' : ''}`}
            onClick={() => onSelect(i)}
            title={`${ex.label} → ${ex.output}`}
          >
            <span className="ex-input">{ex.label}</span>
            <span className="ex-arrow">→</span>
            <span className="ex-output">{ex.output}</span>
          </button>
        ))}

        {onGenerateEdgeCase && onCustomInput && (
          <button
            type="button"
            className="ex-btn edge-btn"
            onClick={async () => {
              if (isLoadingEdgeCase) return;
              setIsLoadingEdgeCase(true);
              try {
                const suggestion = await onGenerateEdgeCase();
                if (onCustomInput) {
                  onCustomInput(suggestion, true);
                }
              } catch (e) {
                console.error(e);
              } finally {
                setIsLoadingEdgeCase(false);
              }
            }}
          >
            <Sparkles size={12} />
            <span>{isLoadingEdgeCase ? 'Loading...' : 'Edge Case'}</span>
          </button>
        )}

        {onCustomInput && (
          isEditing ? (
            <div className="ex-inline-form">
              <input
                autoFocus
                type="text"
                placeholder="e.g. [2,7,11,15], 9"
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCustomSubmit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button type="button" className="ex-inline-go" onClick={handleCustomSubmit}>Run</button>
              <button type="button" className="ex-inline-cancel" onClick={() => setIsEditing(false)} aria-label="Cancel">✕</button>
            </div>
          ) : (
            <button type="button" className="ex-btn custom-btn" onClick={() => setIsEditing(true)}>
              <Plus size={12} />
              <span>Custom</span>
            </button>
          )
        )}
      </div>
    </div>
  );

  if (isPractice || !studio) {
    return <div className="practice-section">{toolbar}</div>;
  }

  if (!studio.casesSlot) return null;
  return createPortal(toolbar, studio.casesSlot);
}

// -----------------------------------------------------------------------------
// Studio Split Workspace Body (Resizable Left Canvas | Tabbed Right Inspector
// + Docked Bottom Playback Bar)
// -----------------------------------------------------------------------------

export function VPBody({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const studio = useContext(StudioContext);
  const [rightTab, setRightTab] = useState<'code' | 'notes' | 'prompt'>('code');
  const [leftPct, setLeftPct] = useState(56);
  const [isDragging, setIsDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const el = splitRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(72, Math.max(35, pct)));
    };
    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  return (
    <div className={`studio-main ${isDragging ? 'is-resizing' : ''}`}>
      <div
        className="studio-split"
        ref={splitRef}
        style={{ '--left-pct': `${leftPct}%` } as React.CSSProperties}
      >
        {/* LEFT PANE: Cases Strip + Hero Animation Canvas + Compact Variables + Live Caption */}
        <div className="studio-left">
          <div
            ref={studio?.setCasesSlot}
            className={`studio-cases-slot ${studio?.hasCases ? '' : 'is-empty'}`}
          />
          <div className="studio-stage-scroll">
            <div className="vp-left">{left}</div>
          </div>
        </div>

        {/* RESIZABLE DIVIDER */}
        <div
          className="studio-resizer"
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setLeftPct(56)}
          title="Drag to resize · Double-click to reset"
          role="separator"
          aria-orientation="vertical"
        >
          <span className="studio-resizer-grip" />
        </div>

        {/* RIGHT PANE: Tabbed Code / Notes / Prompt Inspector */}
        <div className="studio-right">
          <div className="studio-right-tabs" role="tablist" aria-label="Inspector tabs">
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
              aria-selected={rightTab === 'notes'}
              className={`studio-rtab ${rightTab === 'notes' ? 'active' : ''}`}
              onClick={() => setRightTab('notes')}
            >
              <Lightbulb size={13} />
              <span>Notes</span>
            </button>
            {studio?.hasPrompt && (
              <button
                type="button"
                role="tab"
                aria-selected={rightTab === 'prompt'}
                className={`studio-rtab ${rightTab === 'prompt' ? 'active' : ''}`}
                onClick={() => setRightTab('prompt')}
              >
                <FileText size={13} />
                <span>Prompt</span>
              </button>
            )}
          </div>

          <div className="studio-right-body">
            {/* Code Tab */}
            <div className={`studio-tab-pane studio-code-pane ${rightTab === 'code' ? 'active' : ''}`}>
              <div ref={studio?.setCodeSlot} className="studio-code-slot" />
              <div
                ref={studio?.setComplexitySlot}
                className={`studio-complexity-slot ${studio?.hasComplexity ? '' : 'is-empty'}`}
              />
            </div>

            {/* Notes Tab (Approach + Algorithm Steps + Why It Works + Step Trace) */}
            <div className={`studio-tab-pane studio-scroll-pane ${rightTab === 'notes' ? 'active' : ''}`}>
              <div ref={studio?.setNotesSlot} className="studio-notes-slot" />
            </div>

            {/* Prompt Tab (Problem Statement + Examples + Constraints) */}
            <div className={`studio-tab-pane studio-scroll-pane ${rightTab === 'prompt' ? 'active' : ''}`}>
              <div ref={studio?.setPromptSlot} className="studio-prompt-slot" />
            </div>
          </div>

          {/* Invisible portal mount point for right-column children */}
          <div className="studio-portal-source" aria-hidden="true">
            {right}
          </div>
        </div>
      </div>

      {/* DOCKED BOTTOM PLAYBACK BAR */}
      <div ref={studio?.setTransportSlot} className="studio-bottom-dock" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Docked Bottom Playback Control Bar (with Scrubber & Keyboard Shortcuts)
// -----------------------------------------------------------------------------

const SPEED_LABELS = ['0.5×', '0.75×', '1×', '2×', '3×'];

export function ControlBar({
  step,
  maxSteps,
  isPlaying,
  speed,
  onStepChange,
  onPlayToggle,
  onSpeedChange,
  disabled = false
}: {
  step: number;
  maxSteps: number;
  isPlaying: boolean;
  speed: number;
  onStepChange: (newStep: number) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}) {
  const studio = useContext(StudioContext);
  const safeMax = Math.max(1, maxSteps);
  const pct = safeMax > 1 ? (step / (safeMax - 1)) * 100 : 100;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('.monaco-editor'))
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (step < safeMax - 1) onStepChange(step + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) onStepChange(step - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        onPlayToggle();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          onStepChange(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, safeMax, disabled, onStepChange, onPlayToggle]);

  const bar = (
    <div className="transport-bar" id="ctrl-container">
      <div className="ctrl-buttons">
        <button
          type="button"
          className="ctrl-icon-btn"
          disabled={disabled || step === 0}
          onClick={() => onStepChange(0)}
          title="Reset (R)"
          aria-label="Reset to first step"
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          className="btn ctrl-step-btn"
          disabled={disabled || step === 0}
          onClick={() => onStepChange(step - 1)}
          title="Previous step (←)"
        >
          <ChevronLeft size={15} />
          <span>Prev</span>
        </button>
        <button
          type="button"
          className="btn play ctrl-play-btn"
          disabled={disabled}
          onClick={onPlayToggle}
          title="Play / Pause (Space)"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          className="btn ctrl-step-btn"
          disabled={disabled || step >= safeMax - 1}
          onClick={() => onStepChange(step + 1)}
          title="Next step (→)"
        >
          <span>Next</span>
          <ChevronRight size={15} />
        </button>
        <button
          type="button"
          className="ctrl-icon-btn"
          disabled={disabled || step >= safeMax - 1}
          onClick={() => onStepChange(safeMax - 1)}
          title="Jump to end"
          aria-label="Jump to final step"
        >
          <SkipForward size={14} />
        </button>
      </div>

      <div className="transport-scrubber-group">
        <div className="scrubber-track-wrap">
          <input
            type="range"
            className="step-scrubber"
            min={0}
            max={Math.max(0, safeMax - 1)}
            value={Math.min(step, safeMax - 1)}
            disabled={disabled || safeMax <= 1}
            onChange={e => onStepChange(parseInt(e.target.value, 10))}
            style={{ '--scrub-pct': `${pct}%` } as React.CSSProperties}
            aria-label="Timeline step scrubber"
          />
        </div>
        <span className="step-counter-pill">
          {step + 1} / {safeMax}
        </span>
      </div>

      <div className="ctrl-right-meta">
        <div className="speed-grp">
          <span className="speed-lbl">Speed</span>
          <input
            type="range"
            className="speed-slider"
            min="0"
            max="4"
            step="1"
            value={speed}
            onChange={e => onSpeedChange(parseInt(e.target.value, 10))}
            aria-label="Playback speed"
          />
          <span className="speed-pill">{SPEED_LABELS[speed] ?? '1×'}</span>
        </div>
        <span className="kbd-hint" title="Keyboard shortcuts">
          ← → · Space
        </span>
      </div>
    </div>
  );

  if (studio?.transportSlot) {
    return createPortal(bar, studio.transportSlot);
  }
  return bar;
}

// -----------------------------------------------------------------------------
// Approach Banner — Portals into Right Pane "Notes" tab
// -----------------------------------------------------------------------------

export function ApproachBanner({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  const studio = useContext(StudioContext);

  useEffect(() => {
    if (!studio) return;
    return studio.registerNotes();
  }, [studio]);

  const content = (
    <div className="approach-banner">
      <div className="appr-icon">{icon}</div>
      <div className="appr-content">
        <div className="appr-label">{title}</div>
        <div className="appr-lines">
          {lines.map((line, i) => (
            <div key={i} className={`appr-line${i + 1}`}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );

  if (studio?.notesSlot) {
    return createPortal(content, studio.notesSlot);
  }
  return content;
}

// -----------------------------------------------------------------------------
// Compact Inline State Variables Strip (Left Stage)
// -----------------------------------------------------------------------------

export function StateGrid({ items }: { items: { label: string; value: React.ReactNode; changed?: boolean }[] }) {
  return (
    <div className="card state-card">
      <div className="state-card-label">State</div>
      <div className="state-grid">
        {items.map((item, i) => (
          <div key={i} className={`stbox ${item.changed ? 'changed' : ''}`}>
            <div className="st-lbl">{item.label}</div>
            <div className="st-val">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Compact Live Step Caption (Left Stage)
// -----------------------------------------------------------------------------

export function StepLogic({ html, logicClass = '' }: { html: string; logicClass?: string }) {
  const studio = useContext(StudioContext);

  useEffect(() => {
    if (!studio) return;
    return studio.registerStepLogic();
  }, [studio]);

  return (
    <div className={`step-hud-bar ${logicClass}`}>
      <span className={`step-hud-dot ${logicClass}`} />
      <div className="step-hud-text" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export function ResultBanner({ show, title, result, icon }: { show: boolean; title: string; result: string; icon?: React.ReactNode }) {
  if (!show) return null;
  return (
    <div className="result-banner show">
      <span className="res-icon">{icon || '✨'}</span>
      <div className="res-body">
        <span className="res-h3">{title}:</span>
        <span className="res-p">{result}</span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// StepCard — When StepLogic is absent (e.g. Linked Lists), renders as the sleek
// Live Step HUD below the canvas. When StepLogic is present, portals into Notes
// as the verbose trace log so the canvas stage has zero duplicate narration.
// -----------------------------------------------------------------------------

export function StepCard({ title, desc, step, maxSteps, isDone }: { title: string; desc: string; step: number; maxSteps: number; isDone?: boolean }) {
  const studio = useContext(StudioContext);

  if (studio?.hasStepLogic) {
    if (!studio.notesSlot) return null;
    return createPortal(
      <div className={`card step-card ${isDone ? 'step-card--done' : ''}`}>
        <div className="step-hdr">
          <div className="step-title-wrap">
            <span className={`step-dot ${isDone ? 'done' : ''}`} />
            <div className={`step-title ${isDone ? 'done' : ''}`}>{title}</div>
          </div>
          <div className="step-ctr">Step {step + 1} / {maxSteps}</div>
        </div>
        <div className="step-desc">{desc}</div>
      </div>,
      studio.notesSlot
    );
  }

  return (
    <div className={`step-hud-bar ${isDone ? 'success' : 'info'}`}>
      <span className={`step-hud-dot ${isDone ? 'success' : 'info'}`} />
      <div className="step-hud-text">
        <strong>{title}:</strong> {desc}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Full-Height Synced Code Panel — Portals into Right Pane "Code" tab
// -----------------------------------------------------------------------------

export function CodePanel({
  title,
  javaCode,
  pythonCode,
  activeLinesJava,
  activeLinesPy,
  highlightColor,
  highlightBorderColor
}: {
  title: string;
  javaCode: string[];
  pythonCode: string[];
  activeLinesJava: number[];
  activeLinesPy: number[];
  highlightColor?: string;
  highlightBorderColor?: string;
}) {
  const studio = useContext(StudioContext);
  const [activeTab, setActiveTab] = useState<'java' | 'python'>('java');
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const activeCode = activeTab === 'java' ? javaCode : pythonCode;
  const activeLines = activeTab === 'java' ? activeLinesJava : activeLinesPy;

  const firstActiveLine = activeLines[0];

  useEffect(() => {
    const container = bodyRef.current;
    if (!container || !firstActiveLine) return;
    const lineEl = container.querySelector(`[data-line="${firstActiveLine}"]`) as HTMLElement | null;
    if (!lineEl) return;
    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const lTop = lineEl.offsetTop;
    const lBottom = lTop + lineEl.offsetHeight;
    if (lTop < cTop + 16 || lBottom > cBottom - 16) {
      container.scrollTo({
        top: Math.max(0, lTop - container.clientHeight / 2 + lineEl.offsetHeight / 2),
        behavior: 'smooth'
      });
    }
  }, [firstActiveLine, activeTab]);

  const handleCopy = () => {
    const plain = activeCode
      .map(line => line.replace(/<[^>]*>/g, ''))
      .join('\n');
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const panel = (
    <div className="code-panel">
      <div className="cp-header">
        <div className="cp-title-wrap">
          <span className="cp-title">{title}</span>
        </div>
        <div className="cp-header-controls">
          <div className="cp-lang-tabs">
            <button
              type="button"
              className={`cp-lang-btn ${activeTab === 'java' ? 'active' : ''}`}
              onClick={() => setActiveTab('java')}
            >
              Java
            </button>
            <button
              type="button"
              className={`cp-lang-btn ${activeTab === 'python' ? 'active' : ''}`}
              onClick={() => setActiveTab('python')}
            >
              Python
            </button>
          </div>
          <button
            type="button"
            className={`cp-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <div className="cp-body" ref={bodyRef}>
        {activeCode.map((line, idx) => {
          const lineNum = idx + 1;
          const isActive = activeLines.includes(lineNum);
          return (
            <div
              key={idx}
              data-line={lineNum}
              className={`cp-line ${isActive ? 'on' : ''}`}
              style={isActive && highlightColor ? {
                background: highlightColor,
                borderLeft: `3px solid ${highlightBorderColor || '#ef4444'}`
              } : {}}
            >
              <span className="cp-ln">{lineNum}</span>
              <span className="cp-code" dangerouslySetInnerHTML={{ __html: line }}></span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (studio?.codeSlot) {
    return createPortal(panel, studio.codeSlot);
  }
  return panel;
}

export function DebugEditor({
  defaultJava,
  defaultPython,
  buggyLines
}: {
  defaultJava: string;
  defaultPython?: string;
  buggyLines?: number[];
}) {
  const [language, setLanguage] = useState<'java' | 'python'>('java');
  const [code, setCode] = useState(defaultJava);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const editorRef = React.useRef<any>(null);
  const decorationsRef = React.useRef<any>(null);

  const applyDecorations = React.useCallback((editor: any) => {
    if (!buggyLines || buggyLines.length === 0) return;
    if (decorationsRef.current) decorationsRef.current.clear();
    decorationsRef.current = editor.createDecorationsCollection(
      buggyLines.map(line => ({
        range: { startLineNumber: line, endLineNumber: line, startColumn: 1, endColumn: 1000 },
        options: {
          isWholeLine: true,
          className: 'buggy-line-highlight',
          glyphMarginClassName: 'buggy-line-glyph',
          overviewRuler: { color: '#ef4444', position: 1 }
        }
      }))
    );
  }, [buggyLines]);

  React.useEffect(() => {
    const newCode = language === 'java' ? defaultJava : (defaultPython || '');
    setCode(newCode);
  }, [language, defaultJava, defaultPython]);

  React.useEffect(() => {
    if (editorRef.current) applyDecorations(editorRef.current);
  }, [language, applyDecorations]);

  const handleRun = async () => {
    setIsRunning(true);
    setStatus('idle');
    setOutput('Running on Wandbox...');
    try {
      const compiler = language === 'java' ? 'openjdk-jdk-22+36' : 'cpython-3.14.0';
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compiler, code, save: false })
      });
      const data = await res.json();
      const out = [data.compiler_message, data.program_message, data.program_error].filter(Boolean).join('\n');
      const passed = !data.program_error && !data.compiler_message && !!data.program_message;
      setOutput(out || 'No output.');
      setStatus(passed ? 'pass' : 'fail');
    } catch (e: any) {
      setOutput('Network Error: ' + e.message);
      setStatus('fail');
    }
    setIsRunning(false);
  };

  const statusColor = status === 'pass' ? '#22c55e' : status === 'fail' ? '#ef4444' : 'var(--muted)';
  const statusLabel = status === 'pass' ? '✅ Tests Passed!' : status === 'fail' ? '❌ Still failing — keep trying!' : '';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: status === 'pass' ? '2px solid #22c55e' : status === 'fail' ? '2px solid #ef4444' : undefined }}>
      <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>✏️ Your Fix</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as 'java' | 'python')}
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 8px', fontSize: '0.8rem' }}
          >
            <option value="java">Java</option>
            {defaultPython && <option value="python">Python</option>}
          </select>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.7 : 1 }}
        >
          {isRunning ? '⏳ Running...' : '🐛 Run Tests'}
        </button>
      </div>

      <div style={{ height: '260px', background: '#1e1e1e' }}>
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={val => setCode(val || '')}
          onMount={editor => { editorRef.current = editor; applyDecorations(editor); }}
          options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "'Fira Code', monospace", padding: { top: 12 }, glyphMargin: true }}
        />
      </div>

      {(output || status !== 'idle') && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'var(--surface2)' }}>
          {statusLabel && <div style={{ fontWeight: 700, color: statusColor, marginBottom: '6px', fontSize: '0.9rem' }}>{statusLabel}</div>}
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>{output}</pre>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Right Pane "Notes" & "Complexity Footer" Components
// -----------------------------------------------------------------------------

export function AlgorithmList({ steps, activeStep }: { steps: { num: number; txt: React.ReactNode }[]; activeStep: number }) {
  const studio = useContext(StudioContext);

  useEffect(() => {
    if (!studio) return;
    return studio.registerNotes();
  }, [studio]);

  const card = (
    <div className="card">
      <div className="card-title">Algorithm Steps</div>
      <div className="algo-list">
        {steps.map((s, i) => (
          <div key={i} className={`al ${activeStep === s.num ? 'on' : ''}`}>
            <div className="al-num">{s.num}</div>
            <div className="al-txt">{s.txt}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (studio?.notesSlot) {
    return createPortal(card, studio.notesSlot);
  }
  return card;
}

export function Complexity({ time, space }: { time: string; space: string }) {
  const studio = useContext(StudioContext);

  useEffect(() => {
    if (!studio) return;
    return studio.registerComplexity();
  }, [studio]);

  const bar = (
    <div className="cplx-footer">
      <div className="cplx-chip">
        <Clock size={12} className="cplx-chip-icon" />
        <span className="cplx-chip-lbl">Time</span>
        <span className="cplx-chip-val time-c">{time}</span>
      </div>
      <span className="cplx-sep" aria-hidden="true">·</span>
      <div className="cplx-chip">
        <HardDrive size={12} className="cplx-chip-icon" />
        <span className="cplx-chip-lbl">Space</span>
        <span className="cplx-chip-val space-c">{space}</span>
      </div>
    </div>
  );

  if (studio?.complexitySlot) {
    return createPortal(bar, studio.complexitySlot);
  }
  return bar;
}

export function WhyItWorks({ paragraphs }: { paragraphs: React.ReactNode[] }) {
  const studio = useContext(StudioContext);

  useEffect(() => {
    if (!studio) return;
    return studio.registerNotes();
  }, [studio]);

  const card = (
    <div className="card">
      <div className="card-title">
        <Lightbulb size={14} style={{ marginRight: 6, color: 'var(--accent)' }} />
        Why It Works
      </div>
      {paragraphs.map((p, i) => (
        <p key={i} className="why-p" style={{ marginTop: i > 0 ? 10 : 0 }}>{p}</p>
      ))}
    </div>
  );

  if (studio?.notesSlot) {
    return createPortal(card, studio.notesSlot);
  }
  return card;
}

// -----------------------------------------------------------------------------
// Hook for managing animation playback state
// -----------------------------------------------------------------------------

export function useAnimationController(stepsLength: number, defaultSpeed: number = 2) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);

  React.useEffect(() => {
    let timer: any;
    if (isPlaying && step < stepsLength - 1) {
      const speeds = [1500, 1000, 700, 400, 200];
      timer = setTimeout(() => setStep(s => s + 1), speeds[speed]);
    } else if (step >= stepsLength - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, step, stepsLength, speed]);

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    setIsPlaying(false);
  };

  const handlePlayToggle = () => {
    if (step >= stepsLength - 1) setStep(0);
    setIsPlaying(p => !p);
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  };

  return { step, isPlaying, speed, setSpeed, handleStepChange, handlePlayToggle, reset };
}

// -----------------------------------------------------------------------------
// Practice & Fix-the-Bug Split Workspace
// -----------------------------------------------------------------------------

export interface DebugTestCase {
  input: string;
  expected: string;
  description?: string;
}

export interface DebugHint {
  level: 'vague' | 'specific' | 'near-answer';
  text: string;
}

export function PracticeWorkspace({
  problemStatement,
  examples,
  constraints,
  defaultCodeJava,
  defaultCodePython,
  examplePicker,
  activeExampleStr,
  codeInjector,
  editorOnly,
  runButtonText,
  buggyLines,
  debugTestCases,
  debugHints
}: {
  problemStatement: React.ReactNode;
  examples: { label: string; input: React.ReactNode; output: React.ReactNode; explanation?: React.ReactNode }[];
  constraints: React.ReactNode;
  defaultCodeJava: string;
  defaultCodePython?: string;
  examplePicker?: React.ReactNode;
  activeExampleStr?: string;
  codeInjector?: (code: string, lang: string, exampleStr: string) => string;
  editorOnly?: boolean;
  runButtonColor?: string;
  runButtonText?: string;
  buggyLines?: number[];
  debugTestCases?: DebugTestCase[];
  debugHints?: DebugHint[];
}) {
  const [language, setLanguage] = useState<'java' | 'python'>('java');
  const [code, setCode] = useState(defaultCodeJava);
  const [output, setOutput] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const editorRef = React.useRef<any>(null);
  const decorationsRef = React.useRef<any>(null);

  const applyBuggyDecorations = React.useCallback((editor: any) => {
    if (!buggyLines || buggyLines.length === 0) return;
    if (decorationsRef.current) decorationsRef.current.clear();
    decorationsRef.current = editor.createDecorationsCollection(
      buggyLines.map(line => ({
        range: { startLineNumber: line, endLineNumber: line, startColumn: 1, endColumn: 1000 },
        options: {
          isWholeLine: true,
          className: 'buggy-line-highlight',
          glyphMarginClassName: 'buggy-line-glyph',
          overviewRuler: { color: '#ef4444', position: 1 },
          minimap: { color: '#ef4444', position: 1 }
        }
      }))
    );
  }, [buggyLines]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    applyBuggyDecorations(editor);
  };

  React.useEffect(() => {
    if (editorRef.current) applyBuggyDecorations(editorRef.current);
  }, [language, applyBuggyDecorations]);

  const [isRunning, setIsRunning] = useState(false);

  React.useEffect(() => {
    let newCode = language === 'java' ? defaultCodeJava : (defaultCodePython || '');
    if (activeExampleStr && codeInjector) {
      newCode = codeInjector(newCode, language, activeExampleStr);
    }
    setCode(newCode);
  }, [defaultCodeJava, defaultCodePython, language]);

  React.useEffect(() => {
    if (activeExampleStr && codeInjector) {
      setCode(prev => codeInjector(prev, language, activeExampleStr));
    }
  }, [activeExampleStr, codeInjector]);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as 'java' | 'python';
    setLanguage(lang);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running on Wandbox API...');
    try {
      const compiler = language === 'java' ? 'openjdk-jdk-22+36' : 'cpython-3.14.0';
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: compiler,
          code: code,
          save: false
        })
      });
      const data = await res.json();

      let out = '';
      if (data.compiler_message) {
        out += data.compiler_message + '\n';
      }
      if (data.program_message) {
        out += data.program_message;
      }
      if (data.program_error) {
        out += '\n' + data.program_error;
      }

      if (!out && data.status === '0') {
        out = 'Success (No output)';
      }

      setOutput(out || 'Error running code.');
    } catch (e: any) {
      setOutput('Network Error (CORS or offline): ' + e.message);
    }
    setIsRunning(false);
  };

  return (
    <PracticeModeContext.Provider value={true}>
      <div className={`practice-workspace ${editorOnly ? 'editor-only' : ''}`}>
        {!editorOnly && (
          <div className="practice-left-pane">
            <ProblemStatement
              statement={problemStatement}
              examples={examples}
              constraints={constraints}
              defaultExpanded={true}
            />
            {examplePicker && (
              <div style={{ marginTop: '12px' }}>{examplePicker}</div>
            )}

            {debugTestCases && debugTestCases.length > 0 && (
              <div className="practice-section">
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '1rem' }}>🧪</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Test Cases</span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 600 }}>Buggy Output Shown</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {debugTestCases.map((tc, i) => (
                      <div key={i} style={{ borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        {tc.description && (
                          <div style={{ padding: '6px 12px', background: 'var(--surface2)', fontSize: '0.75rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                            {tc.description}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                          <div style={{ padding: '10px 14px', borderRight: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Input</div>
                            <code style={{ fontSize: '0.84rem', color: 'var(--text)', fontFamily: "'Fira Code', monospace" }}>{tc.input}</code>
                          </div>
                          <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.06)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Expected</div>
                            <code style={{ fontSize: '0.84rem', color: '#16a34a', fontFamily: "'Fira Code', monospace" }}>{tc.expected}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {debugHints && debugHints.length > 0 && (
              <div className="practice-section">
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hintsRevealed > 0 ? '14px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>💡</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Hints</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{hintsRevealed}/{debugHints.length} revealed</span>
                    </div>
                    {hintsRevealed < debugHints.length ? (
                      <button
                        type="button"
                        onClick={() => setHintsRevealed(h => h + 1)}
                        style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Show Hint {hintsRevealed + 1}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic' }}>All hints shown</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {debugHints.slice(0, hintsRevealed).map((hint, i) => {
                      const levelColor = hint.level === 'vague' ? '#f59e0b' : hint.level === 'specific' ? '#ef4444' : '#8b5cf6';
                      const levelLabel = hint.level === 'vague' ? '🟡 Vague' : hint.level === 'specific' ? '🔴 Specific' : '🟣 Near Answer';
                      return (
                        <div key={i} style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${levelColor}40`, background: `${levelColor}0d`, animation: 'fadeSlideIn 0.3s ease' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: levelColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{levelLabel} — Hint {i + 1}</div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{hint.text}</div>
                        </div>
                      );
                    })}
                    {hintsRevealed === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.83rem', padding: '8px 0' }}>Click "Show Hint 1" to get your first clue</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Pane: Monaco Editor + Output */}
        <div className="practice-right-pane">
          <div className="practice-editor-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Code Editor</span>
              <select
                value={language}
                onChange={handleLangChange}
                className="practice-lang-select"
              >
                <option value="java">Java</option>
                {defaultCodePython && <option value="python">Python</option>}
              </select>
            </div>
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning}
              className="practice-run-btn"
            >
              {isRunning ? '⏳ Running...' : (runButtonText || '▶ Run Code')}
            </button>
          </div>

          {buggyLines && buggyLines.length > 0 && (
            <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
              <span>⚠️</span>
              <span>{buggyLines.length} bug{buggyLines.length > 1 ? 's' : ''} detected — red lines are suspicious. Fix the logic and run tests.</span>
            </div>
          )}

          <div className="practice-editor-container">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', monospace",
                padding: { top: 14 },
                glyphMargin: true
              }}
            />
          </div>

          <div className="practice-terminal">
            <div className="practice-terminal-hdr">
              <span>Terminal Output</span>
              {isRunning && <span className="spinner" style={{ fontSize: '12px' }}>⚙️</span>}
            </div>
            <pre className="practice-terminal-pre">
              {output || <span style={{ color: 'var(--muted)' }}>Click 'Run Code' to execute your program...</span>}
            </pre>
          </div>
        </div>
      </div>
    </PracticeModeContext.Provider>
  );
}
