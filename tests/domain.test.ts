import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  breakEven, compare, demoBusiness, emptyBusiness, profileSchema, readBusiness,
  recordSchema, rm, salesRevenue, saveBusiness, scoreQuiz, simulate, simulationInput,
  snapshot, storageKey, today, unitEconomics, validDate,
} from '../src/domain';
import { getLesson, lessons } from '../src/lessons';

test('formats Malaysian ringgit with two decimal places', () => {
  assert.equal(rm(1234.5).replace(/\s/g, ''), 'RM1,234.50');
  assert.equal(rm(0).replace(/\s/g, ''), 'RM0.00');
});

test('uses sen for revenue and sums cash outflows once', () => {
  assert.equal(salesRevenue(5, 40), 200);
  assert.equal(salesRevenue(0.1, 3), 0.3);
  assert.deepEqual(snapshot(demoBusiness().records), {
    revenue: 200, purchases: 120, expenses: 20, outflows: 140, surplus: 60,
  });
  const [, ...withoutSales] = demoBusiness().records;
  assert.equal(snapshot(withoutSales).surplus, -140);
});

test('distinguishes contribution, margin and markup', () => {
  const result = unitEconomics(5, 3);
  assert.equal(result.contribution, 2);
  assert.equal(result.margin, 40);
  assert.equal(result.markup?.toFixed(2), '66.67');
  assert.equal(unitEconomics(3, 5).contribution, -2);
  assert.equal(unitEconomics(0, 3).margin, null);
  assert.equal(unitEconomics(5, 0).markup, null);
  assert.deepEqual(unitEconomics(5, null), { contribution: null, margin: null, markup: null });
});

test('rounds break-even quantity up and handles unavailable values', () => {
  assert.equal(breakEven(20, 2), 10);
  assert.equal(breakEven(20.01, 2), 11);
  assert.equal(breakEven(0, 2), 0);
  for (const contribution of [0, -2, null, NaN, Infinity]) {
    assert.equal(breakEven(20, contribution), null);
  }
  assert.equal(breakEven(-20, 2), null);
});

test('compares price and ingredient cost scenarios with explicit quantities', () => {
  const baseline = { price: 5, cost: 3, units: 40 };
  const higherPrice = compare(baseline, { ...baseline, price: 5.5 });
  assert.deepEqual(higherPrice.original, { revenue: 200, variableCost: 120, gross: 80, perUnit: 2, margin: 40 });
  assert.equal(higherPrice.scenario.revenue, 220);
  assert.equal(higherPrice.scenario.gross, 100);
  assert.equal(higherPrice.difference, 20);
  assert.equal(compare(baseline, { ...baseline, price: 5.5, units: 30 }).difference, -5);
  assert.equal(compare(baseline, { ...baseline, cost: 3.5 }).difference, -20);
});

test('zero units produce zero totals but preserve unit economics', () => {
  assert.deepEqual(simulate({ price: 5, cost: 3, units: 0 }), {
    revenue: 0, variableCost: 0, gross: 0, perUnit: 2, margin: 40,
  });
});

test('validates prices, quantities, required fields and calendar dates', () => {
  const input = { price: 5, cost: 3, units: 40 };
  for (const price of [-1, NaN, Infinity, 5.005, undefined]) {
    assert.equal(simulationInput.safeParse({ ...input, price }).success, false);
  }
  for (const units of [-1, 1.5, Infinity, '40']) {
    assert.equal(simulationInput.safeParse({ ...input, units }).success, false);
  }
  const [sale, purchase] = demoBusiness().records;
  assert.equal(recordSchema.safeParse({ ...sale, quantity: 0 }).success, false);
  assert.equal(recordSchema.safeParse({ ...purchase, amount: -1 }).success, false);
  assert.equal(recordSchema.safeParse({ ...purchase, category: ' ' }).success, false);
  assert.equal(profileSchema.safeParse({ ...demoBusiness().profile, name: '' }).success, false);
  assert.equal(validDate.safeParse('2025-02-29').success, false);
  assert.equal(validDate.safeParse('2024-02-29').success, true);
  assert.equal(today(new Date('2026-11-19T16:01:00Z')), '2026-11-20');
});

test('round-trips the demo business, quiz attempt and completed goal', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const business = demoBusiness();
  business.attempts.push({ topic: 'pricing', score: 3, total: 3, date: today() });
  business.goals.push({ id: 'goal', title: 'Count unsold portions', topic: 'pricing', completed: true, target: '' });
  assert.deepEqual(readBusiness(storage), emptyBusiness);
  saveBusiness(storage, business);
  assert.deepEqual(readBusiness(storage), business);
  storage.setItem(storageKey, '{');
  assert.deepEqual(readBusiness(storage), emptyBusiness);
});

test('each lesson has two or three valid quiz questions and a scoring key', () => {
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, 6);
  for (const lesson of lessons) {
    assert.ok(lesson.questions.length >= 2 && lesson.questions.length <= 3);
    for (const question of lesson.questions) {
      assert.equal(question.options.length, 4);
      assert.ok(question.options[question.correct]);
      assert.ok(question.explanation.trim());
    }
    assert.equal(scoreQuiz(lesson.questions, lesson.questions.map(question => question.correct)), lesson.questions.length);
  }
  const pricing = getLesson('pricing');
  assert.equal(pricing.questions[0].options[pricing.questions[0].correct], 'RM2');
  assert.equal(scoreQuiz(pricing.questions, [1, 0, 2]), 2);
  assert.equal(scoreQuiz(pricing.questions, []), 0);
});
