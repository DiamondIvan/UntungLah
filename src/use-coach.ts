import { useRef, useState } from 'react';
import { coachResponse, type CoachRequest, type CoachResult } from './coach-contract';

export type CoachOutcome = { key: string; result?: CoachResult; error?: string };

export function useCoach() {
  const cache = useRef(new Map<string, CoachResult>());
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<CoachOutcome>();
  async function ask(input: CoachRequest): Promise<CoachOutcome | undefined> {
    if (pending.current) return undefined;
    const key = JSON.stringify(input);
    const cached = cache.current.get(key);
    if (cached) {
      setLatest({ key, result: cached });
      return { key, result: cached };
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
      return { key, result };
    } catch {
      const failed = { key, error: 'The coach couldn’t respond. Check your connection and try again.' };
      setLatest(failed);
      return failed;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { busy, latest, ask };
}
