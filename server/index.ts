import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { coachRequest } from '../src/coach-contract';
import { makeCoach } from './coach';

const app = express();
const coach = makeCoach();
app.disable('x-powered-by');
app.use(express.json({ limit: '12kb' }));
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
const recent = new Map<string, { count: number; until: number }>();
const cleanup = setInterval(() => {
  for (const [key, entry] of recent) if (Date.now() >= entry.until) recent.delete(key);
}, 60_000);
cleanup.unref();
app.post('/api/ai/coach', async (request, response) => {
  const parsed = coachRequest.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Please send a valid coach request.' });
    return;
  }
  const key = request.ip ?? 'local';
  const now = Date.now();
  const previous = recent.get(key);
  const entry = previous && previous.until > now ? previous : { count: 0, until: now + 60_000 };
  if (entry.count >= 20) {
    response.status(429).json({ error: 'The coach is busy. Please retry in a minute.' });
    return;
  }
  entry.count += 1;
  recent.set(key, entry);
  response.set('Cache-Control', 'no-store').json(await coach(parsed.data));
});
app.use('/api', (_request, response) => response.status(404).json({ error: 'Endpoint unavailable.' }));
const handleError: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) { next(error); return; }
  if (error.type === 'entity.too.large') { response.status(413).json({ error: 'This request is too large.' }); return; }
  if (error.type === 'entity.parse.failed') { response.status(400).json({ error: 'Please send valid JSON.' }); return; }
  response.status(500).json({ error: 'The server could not complete the request.' });
};
app.use(handleError);
const dist = resolve('dist');
if (existsSync(resolve(dist, 'index.html'))) app.use(express.static(dist));
const port = Number(process.env.PORT || 3001);
app.listen(port, '127.0.0.1', () => console.log('UntungLah listening at http://localhost:' + port));
