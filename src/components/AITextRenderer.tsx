import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Sparkles, ExternalLink } from 'lucide-react';

interface AITextRendererProps {
  content: string;
  animateReveal?: boolean;
  showCopyButton?: boolean;
  copyLabel?: string;
  onKeywordAction?: (keyword: string) => void;
  className?: string;
  compact?: boolean;
}

const KEYWORD_DEFINITIONS: Record<string, string> = {
  urgency: 'Time-pressure messaging intended to accelerate purchase decisions.',
  countdown: 'A timer indicating a limited window; checked across a 10s interval.',
  timer: 'Time display monitored for static or resetting behavior.',
  discount: 'Promotional savings claim audited against stated reference pricing.',
  shaming: 'Opt-out wording framed to induce guilt or social pressure.',
  'pre-selected': 'Optional add-on enabled by default prior to user confirmation.',
  warranty: 'Optional protection plan checked for pre-selection near checkout.',
  insurance: 'Optional coverage item audited for automatic opt-in.',
  subscription: 'Recurring billing option checked for default enrollment.',
  checkout: 'Purchase action boundary where consent controls are evaluated.',
};

const HIGHLIGHT_REGEX = new RegExp(
  `\\b(${Object.keys(KEYWORD_DEFINITIONS).join('|')})\\b`,
  'gi'
);

/**
 * Lightweight syntax highlighter for fenced code blocks (JSON / Markdown / JS / TS).
 * Returns pure React nodes with zero HTML injection.
 */
function renderHighlightedCodeLine(line: string, lineIdx: number): React.ReactNode {
  // Tokenize JSON keys, strings, numbers, booleans, and markdown markers
  const tokenRegex = /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?|\b(?:const|let|return|export|import|from|if|else)\b)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    let colorClass = 'text-[#E2E8F0]';
    if (token.endsWith(':')) {
      colorClass = 'text-[#E6B85C]'; // JSON key
    } else if (token.startsWith('"')) {
      colorClass = 'text-[#86EFAC]'; // String literal
    } else if (/^-?\d/.test(token)) {
      colorClass = 'text-[#FCD34D]'; // Number
    } else if (token === 'true' || token === 'false' || token === 'null') {
      colorClass = 'text-[#FDBA74]'; // Boolean / null
    } else {
      colorClass = 'text-[#FB7185]'; // Keyword
    }

    parts.push(
      <span key={`t-${lineIdx}-${tokenIdx++}`} className={colorClass}>
        {token}
      </span>
    );
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return (
    <div key={`line-${lineIdx}`} className="leading-relaxed whitespace-pre">
      {parts.length > 0 ? parts : ' '}
    </div>
  );
}

/**
 * Interactive Code Block with copy button and syntax highlighting.
 */
export const AICodeBlock: React.FC<{ code: string; language?: string }> = ({
  code,
  language = 'text',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback ignored if clipboard unavailable
    }
  };

  const lines = code.split('\n');

  return (
    <div className="my-2.5 rounded-[14px] overflow-hidden border border-[var(--line-card)] bg-gradient-to-br from-[#141821] to-[#0A0C10] text-[#E5E7EB] shadow-sm">
      <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between text-[11px] bg-white/[0.04]">
        <span className="font-mono text-[#E6B85C] uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#6EE7B7]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[11px] font-mono tabular">
        <code>{lines.map((line, i) => renderHighlightedCodeLine(line, i))}</code>
      </pre>
    </div>
  );
};

/**
 * Animated Skeleton Loading State while AI responses are generated.
 */
export const AISkeletonLoader: React.FC<{
  title?: string;
  subtitle?: string;
  secondsLeft?: number;
  onFastForward?: () => void;
}> = ({ title = 'Generating AI Audit Summary', subtitle, secondsLeft = 0, onFastForward }) => {
  return (
    <div className="py-5 px-4 rounded-[20px] chrome-card flex flex-col gap-4 ai-reveal-enter">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--bg-emblem-from)] to-[var(--bg-emblem-to)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-[var(--ink-900)] leading-tight">
              {title}
            </h3>
            {subtitle && <p className="text-[11px] text-[var(--ink-500)] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {secondsLeft > 0 && (
          <span className="text-xs font-mono font-semibold text-[var(--ink-900)] tabular shrink-0">
            {secondsLeft}s
          </span>
        )}
      </div>

      {/* Skeleton lines */}
      <div className="space-y-2.5">
        <div className="h-3 rounded-full ai-skeleton-bar w-11/12" />
        <div className="h-3 rounded-full ai-skeleton-bar w-4/5" />
        <div className="h-3 rounded-full ai-skeleton-bar w-3/5" />
      </div>

      {/* Skeleton finding preview */}
      <div className="p-3 rounded-[14px] glass-recessed space-y-2">
        <div className="h-2.5 rounded-full ai-skeleton-bar w-1/3" />
        <div className="h-2.5 rounded-full ai-skeleton-bar w-5/6" />
      </div>

      {secondsLeft > 0 && onFastForward && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onFastForward}
            className="text-xs text-[var(--accent)] underline underline-offset-4 hover:opacity-75 cursor-pointer font-medium"
          >
            Skip observation wait (fast-forward)
          </button>
        </div>
      )}
    </div>
  );
};

export const AITextRenderer: React.FC<AITextRendererProps> = ({
  content,
  animateReveal = false,
  showCopyButton = false,
  copyLabel = 'Copy',
  onKeywordAction,
  className = '',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [revealedWordCount, setRevealedWordCount] = useState<number>(() =>
    animateReveal ? 0 : Number.MAX_SAFE_INTEGER
  );

  const words = useMemo(() => content.split(/(\s+)/), [content]);

  useEffect(() => {
    if (!animateReveal) {
      setRevealedWordCount(Number.MAX_SAFE_INTEGER);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setRevealedWordCount(Number.MAX_SAFE_INTEGER);
      return;
    }

    setRevealedWordCount(2);
    const stepSize = Math.max(2, Math.ceil(words.length / 18));
    const timer = setInterval(() => {
      setRevealedWordCount((prev) => {
        if (prev + stepSize >= words.length) {
          clearInterval(timer);
          return Number.MAX_SAFE_INTEGER;
        }
        return prev + stepSize;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [content, animateReveal, words.length]);

  const displayedText =
    revealedWordCount >= words.length
      ? content
      : words.slice(0, revealedWordCount).join('');

  const isTyping = animateReveal && revealedWordCount < words.length;

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard fallback ignored
    }
  };

  // Render inline markdown (**bold**, *italic*, `code`, [link](url), and clickable keywords)
  const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
    const inlineRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    const segments: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let idx = 0;

    const renderWithKeywords = (plain: string, subKey: string): React.ReactNode[] => {
      const nodes: React.ReactNode[] = [];
      let kwLast = 0;
      let kwMatch: RegExpExecArray | null;
      const re = new RegExp(HIGHLIGHT_REGEX.source, 'gi');
      let kwIdx = 0;

      while ((kwMatch = re.exec(plain)) !== null) {
        if (kwMatch.index > kwLast) {
          nodes.push(plain.slice(kwLast, kwMatch.index));
        }
        const word = kwMatch[0];
        const normalized = word.toLowerCase();
        const isSelected = activeKeyword === normalized;

        nodes.push(
          <button
            key={`${subKey}-kw-${kwIdx++}`}
            type="button"
            onClick={() => {
              setActiveKeyword(isSelected ? null : normalized);
              onKeywordAction?.(normalized);
            }}
            className={`inline font-medium underline decoration-dotted underline-offset-3 transition-colors cursor-pointer rounded px-0.5 ${
              isSelected
                ? 'bg-[#E6B85C] text-[#111318] decoration-transparent'
                : 'text-[var(--accent)] decoration-[var(--accent-border)] hover:bg-[var(--accent-soft)]'
            }`}
            title={KEYWORD_DEFINITIONS[normalized]}
          >
            {word}
          </button>
        );
        kwLast = re.lastIndex;
      }

      if (kwLast < plain.length) {
        nodes.push(plain.slice(kwLast));
      }
      return nodes;
    };

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        segments.push(
          ...renderWithKeywords(text.slice(lastIdx, match.index), `${keyPrefix}-p-${idx++}`)
        );
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        segments.push(
          <strong key={`${keyPrefix}-b-${idx++}`} className="font-semibold text-[var(--ink-900)]">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        segments.push(
          <em key={`${keyPrefix}-i-${idx++}`} className="italic text-[var(--ink-700)]">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        segments.push(
          <code
            key={`${keyPrefix}-c-${idx++}`}
            className="px-1.5 py-0.5 rounded-md bg-[var(--code-inline-bg)] border border-[var(--code-inline-border)] font-mono text-[11px] text-[var(--code-inline-text)]"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('[')) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          segments.push(
            <a
              key={`${keyPrefix}-a-${idx++}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[var(--accent)] underline underline-offset-3 hover:opacity-75"
            >
              <span>{linkMatch[1]}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }
      }

      lastIdx = inlineRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      segments.push(...renderWithKeywords(text.slice(lastIdx), `${keyPrefix}-end-${idx++}`));
    }

    return segments;
  };

  // Block-level Markdown parser (headings, fenced code, tables, lists, blockquotes, hr, paragraphs)
  const renderMarkdownBlocks = (raw: string): React.ReactNode[] => {
    const lines = raw.split('\n');
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockIdx = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Blank line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Fenced code block
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        blocks.push(
          <AICodeBlock key={`code-${blockIdx++}`} code={codeLines.join('\n')} language={lang} />
        );
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        blocks.push(
          <hr key={`hr-${blockIdx++}`} className="my-3 border-[var(--line-subtle)]" />
        );
        i++;
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const sizeClass =
          level === 1
            ? 'text-base font-bold mt-2 mb-1.5'
            : level === 2
            ? 'text-sm font-bold mt-2.5 mb-1'
            : 'text-xs font-semibold mt-2 mb-1';
        blocks.push(
          <div
            key={`h-${blockIdx++}`}
            className={`font-display tracking-tight chrome-text-gradient ${sizeClass}`}
          >
            {headingText}
          </div>
        );
        i++;
        continue;
      }

      // Blockquote
      if (line.trim().startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        blocks.push(
          <blockquote
            key={`q-${blockIdx++}`}
            className="my-2 px-3.5 py-2.5 rounded-[12px] glass-recessed text-xs italic text-[var(--ink-700)]"
          >
            {renderInline(quoteLines.join(' '), `q-${blockIdx}`)}
          </blockquote>
        );
        continue;
      }

      // Markdown table
      if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
        const headerCells = line
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
        i += 2; // skip header & separator
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(
            lines[i]
              .split('|')
              .map((c) => c.trim())
              .filter(Boolean)
          );
          i++;
        }
        blocks.push(
          <div
            key={`tbl-${blockIdx++}`}
            className="my-2.5 overflow-x-auto rounded-[12px] border border-[var(--line-card)] bg-[var(--bg-table)]"
          >
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-[var(--bg-sunken)] border-b border-[var(--line-card)] text-[var(--ink-900)]">
                  {headerCells.map((cell, ci) => (
                    <th key={ci} className="py-2 px-3 font-semibold">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-subtle)] text-[var(--ink-700)]">
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 tabular">
                        {renderInline(cell, `tbl-${blockIdx}-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Unordered list
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        blocks.push(
          <ul key={`ul-${blockIdx++}`} className="my-1.5 space-y-1.5">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[var(--ink-700)] leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-85 shrink-0" />
                <span>{renderInline(item, `ul-${blockIdx}-${idx}`)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        blocks.push(
          <ol key={`ol-${blockIdx++}`} className="my-1.5 space-y-1.5">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[var(--ink-700)] leading-relaxed">
                <span className="font-mono text-[11px] font-semibold text-[var(--accent)] tabular shrink-0 mt-0.5">
                  {idx + 1}.
                </span>
                <span>{renderInline(item, `ol-${blockIdx}-${idx}`)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Default paragraph
      const paraLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].trim().startsWith('|') &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i])
      ) {
        paraLines.push(lines[i]);
        i++;
      }

      blocks.push(
        <p
          key={`p-${blockIdx++}`}
          className={`${compact ? 'text-xs' : 'text-[13px]'} text-[var(--ink-700)] leading-[1.65]`}
        >
          {renderInline(paraLines.join(' '), `p-${blockIdx}`)}
          {isTyping && blockIdx === 1 && (
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-[var(--accent)] opacity-80 animate-pulse rounded-xs"
            />
          )}
        </p>
      );
    }

    return blocks;
  };

  return (
    <div className={`relative ai-reveal-enter ${className}`}>
      {showCopyButton && (
        <div className="flex justify-end mb-1.5">
          <button
            type="button"
            onClick={handleCopyResponse}
            className="glass-control px-2.5 py-1 rounded-full text-[11px] font-medium text-[var(--ink-900)] inline-flex items-center gap-1 cursor-pointer"
            title="Copy AI response"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[var(--mint-ink)]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[var(--ink-500)]" />
                <span>{copyLabel}</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="space-y-2">{renderMarkdownBlocks(displayedText)}</div>

      {/* Inline keyword glossary popover when user clicks a highlighted term */}
      {activeKeyword && KEYWORD_DEFINITIONS[activeKeyword] && (
        <div className="mt-2.5 p-2.5 rounded-[12px] bg-[var(--bg-surface-solid)] border border-[var(--line-card)] text-[11px] text-[var(--ink-700)] flex items-start justify-between gap-2 ai-reveal-enter">
          <div>
            <span className="font-semibold text-[var(--accent)] capitalize mr-1.5">
              {activeKeyword}:
            </span>
            <span>{KEYWORD_DEFINITIONS[activeKeyword]}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveKeyword(null)}
            className="text-[var(--ink-500)] hover:text-[var(--ink-900)] font-medium shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
