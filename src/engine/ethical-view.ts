import { Detection, EthicalTemplate, RiskLevel } from '../types';
import templatesData from './templates.json';

export class EthicalViewEngine {
  private templates: Map<string, EthicalTemplate> = new Map();
  private originalStyles: Map<HTMLElement, string> = new Map();
  private injectedElements: HTMLElement[] = [];
  public state: 'OFF' | 'ON' = 'OFF';
  public bannerElement: HTMLElement | null = null;
  private onToggleCallback?: (state: 'OFF' | 'ON') => void;

  constructor(onToggle?: (state: 'OFF' | 'ON') => void) {
    this.onToggleCallback = onToggle;
    for (const t of templatesData.templates as EthicalTemplate[]) {
      this.templates.set(t.id, t);
    }
  }

  /**
   * Safe text interpolator: fills {placeholders} strictly with validated evidence values.
   */
  private interpolate(
    templateText: string,
    detection: Detection,
    count: number,
    riskScore: number,
    level: RiskLevel
  ): string {
    return templateText
      .replace(/{observed_seconds}/g, String(detection.details?.observedSeconds ?? 10))
      .replace(/{current_price}/g, `${detection.details?.currencySymbol ?? '$'}${detection.details?.currentPrice ?? ''}`)
      .replace(/{reference_price}/g, `${detection.details?.currencySymbol ?? '$'}${detection.details?.referencePrice ?? ''}`)
      .replace(/{stated_percent}/g, String(detection.details?.statedPercent ?? ''))
      .replace(/{calculated_percent}/g, String(detection.details?.calculatedPercent ?? ''))
      .replace(/{count}/g, String(count))
      .replace(/{risk_score}/g, String(riskScore))
      .replace(/{level}/g, level);
  }

  /**
   * Applies Ethical View annotations to the DOM.
   * Product Guarantees Enforced:
   * 1. Never changes price text.
   * 2. Never mutates input values or checkboxes.
   * 3. Never blocks buttons or purchase controls.
   */
  public apply(
    detections: Detection[],
    container: HTMLElement = document.body,
    riskScore: number = 0,
    riskLevel: RiskLevel = 'Low'
  ): boolean {
    if (this.state === 'ON') {
      this.restore();
    }

    try {
      this.originalStyles.clear();
      this.injectedElements = [];

      // 1. Insert Ethical View Banner (ET-BANNER-01) at the top of the container
      const bannerTemplate = this.templates.get('ET-BANNER-01');
      if (bannerTemplate) {
        const banner = document.createElement('div');
        banner.setAttribute('data-dg-owner', 'ethical-view');
        banner.setAttribute('data-dg-id', 'ET-BANNER-01');
        banner.className =
          'w-full bg-[#E8E3F8] border border-[#B9ABE8] text-[#1F2A37] px-4 py-3 rounded-xl mb-4 flex flex-wrap items-center justify-between gap-3 text-sm shadow-sm transition-all';

        const bannerText = this.interpolate(
          bannerTemplate.text,
          detections[0] || ({} as any),
          detections.length,
          riskScore,
          riskLevel
        );

        // Safe DOM creation using textContent (no innerHTML with untrusted strings)
        const textWrapper = document.createElement('div');
        textWrapper.className = 'flex items-center gap-2 font-medium';
        const shieldIcon = document.createElement('span');
        shieldIcon.textContent = '🛡️';
        const textSpan = document.createElement('span');
        textSpan.textContent = bannerText;
        textWrapper.appendChild(shieldIcon);
        textWrapper.appendChild(textSpan);

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'flex items-center gap-2';

        const showOriginalBtn = document.createElement('button');
        showOriginalBtn.type = 'button';
        showOriginalBtn.className =
          'px-3 py-1.5 bg-white text-[#1F2A37] border border-[#C9D4E0] hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer';
        showOriginalBtn.textContent = 'Show original';
        showOriginalBtn.onclick = () => this.restore();

        actionsWrapper.appendChild(showOriginalBtn);
        banner.appendChild(textWrapper);
        banner.appendChild(actionsWrapper);

        container.prepend(banner);
        this.bannerElement = banner;
        this.injectedElements.push(banner);
      }

      // 2. Annotate each detected element
      for (const det of detections) {
        const targetEl = container.querySelector<HTMLElement>(`[data-dg-ref="${det.candidateRef}"]`);
        if (!targetEl) continue;

        const template = this.templates.get(det.templateId) || this.templates.get('ET-SIGNAL-01');
        if (!template) continue;

        // Capture original inline style for safe restore
        this.originalStyles.set(targetEl, targetEl.style.cssText);

        // Add subtle non-blocking outline based on severity
        const outlineColor =
          det.severity === 3 ? '#E8A0B5' : det.severity === 2 ? '#F1A98F' : '#EBD27A';
        targetEl.style.outline = `2px solid ${outlineColor}`;
        targetEl.style.outlineOffset = '3px';
        targetEl.style.borderRadius = targetEl.style.borderRadius || '6px';

        // Create caption or comparison badge
        const noteEl = document.createElement('div');
        noteEl.setAttribute('data-dg-owner', 'ethical-view');
        noteEl.setAttribute('data-dg-id', template.id);

        const styleColors =
          template.style === 'warning'
            ? 'bg-[#FCE0D6] border-[#F1A98F] text-[#8A3A1F]'
            : template.style === 'info'
            ? 'bg-[#DCEBFA] border-[#9CC5EE] text-[#1D4E89]'
            : 'bg-[#EDF2F8] border-[#C9D4E0] text-[#1F2A37]';

        noteEl.className = `mt-1 mb-1 px-3 py-1.5 border rounded-lg text-xs leading-relaxed flex items-start gap-1.5 font-sans ${styleColors} shadow-2xs pointer-events-auto`;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'shrink-0 mt-0.5 text-xs';
        iconSpan.textContent = template.style === 'warning' ? '⚠️' : 'ℹ️';

        const contentSpan = document.createElement('div');
        contentSpan.className = 'flex-1';
        contentSpan.textContent = this.interpolate(
          template.text,
          det,
          detections.length,
          riskScore,
          riskLevel
        );

        noteEl.appendChild(iconSpan);
        noteEl.appendChild(contentSpan);

        // Insert relative to target element
        if (template.placement === 'before' && targetEl.parentNode) {
          targetEl.parentNode.insertBefore(noteEl, targetEl);
        } else if (targetEl.parentNode) {
          targetEl.parentNode.insertBefore(noteEl, targetEl.nextSibling);
        }

        this.injectedElements.push(noteEl);
      }

      this.state = 'ON';
      this.onToggleCallback?.('ON');
      return true;
    } catch (err) {
      console.error('Failed to apply Ethical View; auto-restoring DOM:', err);
      this.restore();
      return false;
    }
  }

  /**
   * 100% Reversible: removes all injected nodes and restores original styles.
   */
  public restore(): void {
    // 1. Remove all Ethical View nodes
    const injectedNodes = document.querySelectorAll('[data-dg-owner="ethical-view"]');
    injectedNodes.forEach((node) => node.remove());

    // 2. Restore saved styles on targeted elements
    for (const [el, originalStyle] of this.originalStyles.entries()) {
      if (document.contains(el)) {
        el.style.cssText = originalStyle;
      }
    }

    this.originalStyles.clear();
    this.injectedElements = [];
    this.bannerElement = null;
    this.state = 'OFF';
    this.onToggleCallback?.('OFF');
  }

  public toggle(
    detections: Detection[],
    container: HTMLElement = document.body,
    riskScore: number = 0,
    riskLevel: RiskLevel = 'Low'
  ): 'OFF' | 'ON' {
    if (this.state === 'ON') {
      this.restore();
      return 'OFF';
    } else {
      this.apply(detections, container, riskScore, riskLevel);
      return this.state;
    }
  }
}
