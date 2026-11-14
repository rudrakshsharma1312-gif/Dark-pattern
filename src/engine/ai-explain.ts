import { Detection } from '../types';

/**
 * Calls optional backend /v1/explain with a hard timeout (used by web simulator)
 */
export async function enhanceExplanationsWithTimeout(
  detections: Detection[],
  timeoutMs: number
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/v1/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detections: detections.map((d) => ({
          id: d.id,
          category: d.category,
          categoryName: d.categoryName,
          evidenceSnippet: d.evidenceSnippet,
          details: d.details,
        })),
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.explanations && Array.isArray(data.explanations)) {
        data.explanations.forEach((item: { id: string; aiExplanation: string }) => {
          const det = detections.find((d) => d.id === item.id);
          if (det && item.aiExplanation) {
            det.aiExplanation = item.aiExplanation;
          }
        });
      }
    }
  } catch {
    // Ignore timeout / network failure
  } finally {
    clearTimeout(timer);
  }
}
