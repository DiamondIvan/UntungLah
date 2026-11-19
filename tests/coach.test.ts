import assert from 'node:assert/strict';
import { test } from 'node:test';
import OpenAI from 'openai';
import { makeCoach, parseModelAnswer } from '../server/coach';
import { coachRequest, coachResponse, type CoachRequest, type CoachResponse } from '../src/coach-contract';

const request: CoachRequest = {
  task: 'explain',
  simulation: {
    kind: 'pricing',
    baseline: { price: 5, cost: 3, units: 40 },
    adjusted: { price: 5.5, cost: 3, units: 40 },
  },
};
const answer: CoachResponse = {
  headline: 'Try a small batch',
  explanation: 'Contribution rises by RM20 under the assumed sales volume.',
  keyInsights: ['Gross contribution excludes operating expenses.'],
  recommendations: ['Record how many portions sell during a short trial.'],
  nextLearningTopic: 'pricing',
  assumptions: ['Both scenarios assume 40 packs sold.'],
  limitations: ['Real demand may change.'],
};

function mockProvider(content: string, onRequest?: (body: string) => void) {
  return new OpenAI({
    apiKey: 'test-only',
    baseURL: 'https://example.invalid/v1',
    maxRetries: 0,
    fetch: async (_url, init) => {
      onRequest?.(String(init?.body));
      return Response.json({ choices: [{ message: { content } }] });
    },
  });
}

test('requires simulation or question context for the relevant coach tasks', () => {
  assert.equal(coachRequest.safeParse(request).success, true);
  assert.equal(coachRequest.safeParse({ task: 'explain' }).success, false);
  assert.equal(coachRequest.safeParse({ task: 'question', question: '  ' }).success, false);
  assert.equal(coachRequest.safeParse({ task: 'question', question: 'x'.repeat(501) }).success, false);
  assert.equal(coachRequest.safeParse({ task: 'question', question: 'How should I track sales?' }).success, true);
  const parsed = coachRequest.parse({ ...request, records: [{ description: 'Unnecessary record' }] });
  assert.ok(!Object.hasOwn(parsed, 'records'));
});

test('returns a schema-valid, grounded demo when Qwen configuration is absent', async () => {
  const response = await makeCoach({})(request);
  assert.equal(response.source, 'demo');
  assert.ok(coachResponse.safeParse(response.answer).success);
  assert.match(response.answer.explanation.replace(/\s/g, ''), /RM80\.00.*RM100\.00.*RM20\.00/);
});

test('validates both plain and fenced JSON model responses', () => {
  const json = JSON.stringify(answer);
  assert.deepEqual(parseModelAnswer(json), answer);
  assert.deepEqual(parseModelAnswer(['```json', json, '```'].join('\n')), answer);
  assert.throws(() => parseModelAnswer('I need more details.'));
  assert.throws(() => parseModelAnswer(JSON.stringify({ ...answer, nextLearningTopic: 'unknown' })));
  assert.throws(() => parseModelAnswer(JSON.stringify({ ...answer, recommendations: [] })));
});

test('sends server-calculated scenario metrics and identifies a valid provider response', async () => {
  let payload = '';
  const provider = mockProvider(JSON.stringify(answer), body => { payload = body; });
  const response = await makeCoach({ QWEN_MODEL: 'mock-model' }, provider)(request);
  const sentContext = JSON.parse(JSON.parse(payload).messages[1].content);
  assert.equal(sentContext.metrics.original.gross, 80);
  assert.equal(sentContext.metrics.scenario.gross, 100);
  assert.equal(sentContext.metrics.difference, 20);
  assert.deepEqual(response, { source: 'qwen', answer });
});

test('falls back when the provider returns malformed or invalid structured data', async () => {
  for (const content of ['{', JSON.stringify({ headline: 'Incomplete answer' })]) {
    const response = await makeCoach({ QWEN_MODEL: 'mock-model' }, mockProvider(content))(request);
    assert.equal(response.source, 'demo');
    assert.ok(coachResponse.safeParse(response.answer).success);
  }
});
