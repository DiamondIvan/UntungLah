import { useRef, useState } from 'react';
import { coachResponse, type CoachRequest, type CoachResult } from './coach-contract';

export function useCoach() {
  const cache = useRef(new Map<string, CoachResult>());
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<{ key: string; result?: CoachResult; error?: string }>();
  async function ask(input: CoachRequest) {
    if (pending.current) return;
    const key = JSON.stringify(input);
    const cached = cache.current.get(key);
    if (cached) {
      setLatest({ key, result: cached });
      return;
    }
    pending.current = true;
    setBusy(true);
    setLatest(undefined);
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key,
        signal: AbortSignal.timeout(14_000),
      });
      if (!response.ok) throw new Error('Request failed');
      const payload = await response.json();
      const answer = coachResponse.parse(payload.answer);
      if (payload.source !== 'qwen' && payload.source !== 'demo') throw new Error('Invalid source');
      const result: CoachResult = { source: payload.source, answer };
      if (result.source === 'qwen') {
        if (cache.current.size >= 20) cache.current.clear();
        cache.current.set(key, result);
      }
      setLatest({ key, result });
    } catch {
      setLatest({ key, error: 'The coach couldn’t respond. Check your connection and try again.' });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { busy, latest, ask };
}
