import { z } from 'zod';
import { simulationInput, topicId } from './domain';

const amount = z.number().finite().min(-1e13).max(1e13);
export const coachRequest = z.object({
  task: z.enum(['explain', 'question', 'learning']),
  business: z.object({
    type: z.string().max(100), product: z.string().max(100),
    revenue: amount, outflows: amount, surplus: amount,
    unitContribution: amount.nullable(), completed: z.array(topicId).max(6),
  }).optional(),
  simulation: z.object({ baseline: simulationInput, adjusted: simulationInput, kind: z.enum(['pricing', 'ingredient']) }).optional(),
  question: z.string().trim().min(1).max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.task === 'explain' && !value.simulation) ctx.addIssue({ code: 'custom', message: 'A simulation is required.' });
  if (value.task === 'question' && !value.question) ctx.addIssue({ code: 'custom', message: 'A question is required.' });
});
const line = z.string().trim().min(1).max(400);
export const coachResponse = z.object({
  headline: z.string().trim().min(1).max(120), explanation: z.string().trim().min(1).max(900),
  keyInsights: z.array(line).max(3), recommendations: z.array(line).min(1).max(2),
  nextLearningTopic: topicId, assumptions: z.array(line).max(3), limitations: z.array(line).max(3),
});
export type CoachRequest = z.infer<typeof coachRequest>;
export type CoachResponse = z.infer<typeof coachResponse>;
export type CoachResult = { source: 'qwen' | 'demo'; answer: CoachResponse };
