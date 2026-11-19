import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cashInput, cashPlan, growthInput, parseFields, payback, priceLadder, profitEstimate, scoreSort, unitCost, unitCostInput } from '../src/calculators';
import { demoBusiness, emptyBusiness, operatingEstimate, readBusiness, snapshot } from '../src/domain';
import { sortExercise } from '../src/lessons';

test('cost per unit matches the Mak Cik lesson and is unavailable at zero units', () => {
  assert.deepEqual(unitCost({ ingredients: 90, packaging: 10, other: 10, units: 50 }), { total: 110, perUnit: 2.2, perUnitSen: 2.2 });
  assert.equal(unitCost({ ingredients: 120, packaging: 0, other: 0, units: 40 }).perUnit, 3);
  assert.equal(unitCost({ ingredients: 10, packaging: 0, other: 0, units: 3 }).perUnitSen, 3.33);
  assert.equal(unitCost({ ingredients: 10, packaging: 0, other: 0, units: 0 }).perUnit, null);
});

test('price ladder reproduces the pricing lesson table', () => {
  const rows = priceLadder({ price: 4.5, cost: 2.7, units: 50 });
  assert.deepEqual(rows.map(row => [row.price, row.perUnit]), [[4, 1.3], [4.5, 1.8], [5, 2.3]]);
  assert.deepEqual(priceLadder({ price: 0.2, cost: 0, units: 1 }).map(row => row.price), [0.2, 0.7]);
});

test('profit estimate and break-even follow the profit lesson', () => {
  assert.deepEqual(profitEstimate({ price: 4.5, units: 50, cost: 2.2, operating: 35 }), {
    revenue: 225, goodsSold: 110, gross: 115, operating: 80, breakEvenUnits: 16,
  });
  assert.equal(profitEstimate({ price: 2, units: 10, cost: 2, operating: 5 }).breakEvenUnits, null);
});

test('cash plan shows the closing balance and any shortfall', () => {
  assert.deepEqual(cashPlan({ opening: 200, inflows: 225, supplier: 80, other: 35 }), { closing: 310, shortfall: 0 });
  assert.deepEqual(cashPlan({ opening: 100, inflows: 200, supplier: 150, other: 0 }), { closing: 150, shortfall: 0 });
  assert.deepEqual(cashPlan({ opening: 50, inflows: 0, supplier: 70.5, other: 0 }), { closing: -20.5, shortfall: 20.5 });
});

test('equipment payback rounds days up and flags unaffordable or unprofitable purchases', () => {
  assert.deepEqual(payback({ equipment: 300, extraUnits: 10, profitPerUnit: 2.3, extraDailyCost: 3, savings: 400 }), { dailyGain: 20, days: 15, savingsLeft: 100, affordable: true });
  assert.equal(payback({ equipment: 300, extraUnits: 1, profitPerUnit: 2, extraDailyCost: 2, savings: 400 }).days, null);
  assert.equal(payback({ equipment: 300, extraUnits: 10, profitPerUnit: 2.3, extraDailyCost: 0, savings: 250 }).affordable, false);
});

test('validates calculator fields and scores the sorting activity', () => {
  assert.equal(parseFields(unitCostInput, { ingredients: '90', packaging: '', other: '10', units: '50' }).success, false);
  assert.equal(parseFields(unitCostInput, { ingredients: '90', packaging: '10', other: '10', units: '2.5' }).success, false);
  assert.equal(parseFields(cashInput, { opening: '-1', inflows: '0', supplier: '0', other: '0' }).success, false);
  assert.equal(parseFields(growthInput, { equipment: '300', extraUnits: '10', profitPerUnit: '2.30', extraDailyCost: '3', savings: '400' }).success, true);
  assert.equal(scoreSort(sortExercise, sortExercise.map(item => item.answer)), sortExercise.length);
  assert.equal(scoreSort(sortExercise, []), 0);
});

test('demo business matches the curriculum example', () => {
  const business = demoBusiness();
  assert.deepEqual(snapshot(business.records), { revenue: 225, purchases: 80, expenses: 35, outflows: 115, surplus: 110 });
  assert.deepEqual(operatingEstimate(business), { units: 50, revenue: 225, goodsSold: 110, gross: 115, expenses: 35, operating: 80 });
  assert.equal(operatingEstimate({ ...business, profile: { ...business.profile!, cost: null } }), null);
  assert.equal(operatingEstimate(emptyBusiness), null);
});

test('older saved workspaces load with empty lesson steps', () => {
  const { steps: _steps, ...older } = demoBusiness();
  const loaded = readBusiness({ getItem: () => JSON.stringify(older) });
  assert.deepEqual(loaded.steps, { learned: [], practised: [] });
  assert.equal(loaded.records.length, 4);
});
