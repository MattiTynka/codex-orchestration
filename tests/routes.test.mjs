import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTES, validateCodexRouting } from '../scripts/routes.mjs';

const expectedRoutes = {
  lead: { model: 'gpt-6-astra', effort: 'high' },
  'lead-high': { model: 'gpt-6-astra', effort: 'high' },
  correctness: { model: 'gpt-6-astra', effort: 'medium' },
  'correctness-routine': { model: 'gpt-5.6-sol', effort: 'medium' },
  security: { model: 'gpt-6-astra', effort: 'high' },
  'astra-medium': { model: 'gpt-6-astra', effort: 'medium' },
  'astra-high': { model: 'gpt-6-astra', effort: 'high' },
  'sol-medium': { model: 'gpt-5.6-sol', effort: 'medium' },
  'terra-xhigh': { model: 'gpt-5.6-terra', effort: 'xhigh' },
  'terra-max': { model: 'gpt-5.6-terra', effort: 'max' },
  'luna-max': { model: 'gpt-5.6-luna', effort: 'max' },
};

function participant(route, overrides = {}) {
  const selected = expectedRoutes[route];
  return {
    route,
    requestedModel: selected?.model ?? 'unknown-model',
    observedModel: selected?.model ?? 'unknown-model',
    effort: selected?.effort ?? 'unknown-effort',
    observedEffort: selected?.effort ?? 'unknown-effort',
    observation: 'fixture runtime observation',
    ...overrides,
  };
}

function assertRoutingError(callback, pattern) {
  assert.throws(callback, error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, pattern);
    return true;
  });
}

test('configured routes are limited to the policy model and effort pairs', () => {
  assert.deepEqual(ROUTES, expectedRoutes);
  for (const route of ['astra-low', 'sol-high']) {
    assert.equal(Object.hasOwn(ROUTES, route), false);
    assertRoutingError(() => validateCodexRouting(participant(route), 'worker'), /recognized.*route/i);
  }
});

test('evaluators and reviewers use routes allowed for the frozen risk', () => {
  for (const route of ['lead', 'lead-high']) validateCodexRouting(participant(route), 'evaluator');
  assertRoutingError(() => validateCodexRouting(participant('correctness'), 'evaluator'), /evaluator/i);
  assertRoutingError(() => validateCodexRouting(participant('lead', { requestedModel: 'gpt-5.6-sol', observedModel: 'gpt-5.6-sol', effort: 'medium', observedEffort: 'medium' }), 'evaluator'), /Requested model\/effort/i);

  for (const route of ['correctness-routine', 'correctness', 'security']) {
    validateCodexRouting(participant(route), 'correctness', 'routine');
  }
  for (const risk of ['substantial', 'sensitive']) {
    for (const route of ['correctness', 'security']) validateCodexRouting(participant(route), 'correctness', risk);
    assertRoutingError(() => validateCodexRouting(participant('correctness-routine'), 'correctness', risk), /correctness|risk/i);
  }
  assertRoutingError(() => validateCodexRouting(participant('lead-high'), 'correctness', 'routine'), /correctness/i);

  validateCodexRouting(participant('security'), 'security', 'sensitive');
  assertRoutingError(() => validateCodexRouting(participant('correctness'), 'security', 'sensitive'), /security/i);
});

test('worker work classes accept only their assigned routes and lead exception', () => {
  for (const workClass of ['trivial', 'tests']) {
    for (const route of ['terra-xhigh', 'terra-max']) validateCodexRouting(participant(route, { workClass }), 'worker');
    validateCodexRouting(participant('lead', { workClass, directImplementationRationale: 'The bounded change is faster to complete directly.' }), 'builder');
  }
  for (const route of ['sol-medium', 'astra-medium', 'astra-high']) {
    validateCodexRouting(participant(route, { workClass: 'routine' }), 'worker');
  }
  validateCodexRouting(participant('lead', { workClass: 'routine', directImplementationRationale: 'The bounded change is faster to complete directly.' }), 'builder');
  for (const workClass of ['trivial', 'tests', 'routine', 'challenging', 'sensitive']) {
    validateCodexRouting(participant('lead-high', { workClass, directImplementationRationale: 'The high route covers this coding class.' }), 'builder');
  }
  for (const route of ['astra-medium', 'astra-high']) validateCodexRouting(participant(route, { workClass: 'challenging' }), 'worker');
  validateCodexRouting(participant('astra-high', { workClass: 'sensitive' }), 'worker');
  validateCodexRouting(participant('luna-max', { workClass: 'test-supervision' }), 'worker');
  validateCodexRouting(participant('astra-high', { workClass: 'design' }), 'worker');

  assertRoutingError(() => validateCodexRouting(participant('lead', { workClass: 'challenging', directImplementationRationale: 'Need direct work.' }), 'builder'), /work class|route/i);
  assertRoutingError(() => validateCodexRouting(participant('lead', { workClass: 'sensitive', directImplementationRationale: 'Need direct work.' }), 'builder'), /work class|route/i);
  assertRoutingError(() => validateCodexRouting(participant('lead', { workClass: 'routine' }), 'builder'), /rationale/i);
  assertRoutingError(() => validateCodexRouting(participant('lead-high', { workClass: 'routine' }), 'builder'), /rationale/i);
  for (const route of ['lead', 'lead-high']) {
    assertRoutingError(() => validateCodexRouting(participant(route, { workClass: 'routine', directImplementationRationale: 'This record is intentionally not an author.' }), 'worker'), /worker|lead|route/i);
  }
  assertRoutingError(() => validateCodexRouting(participant('terra-max', { workClass: 'routine' }), 'worker'), /work class|route/i);
  assertRoutingError(() => validateCodexRouting(participant('astra-medium', { workClass: 'sensitive' }), 'worker'), /work class|route/i);
  assertRoutingError(() => validateCodexRouting(participant('terra-max', { workClass: 'test-supervision' }), 'worker'), /work class|route/i);
  assertRoutingError(() => validateCodexRouting(participant('astra-medium', { workClass: 'design' }), 'worker'), /work class|route/i);
});

test('routing refuses null runtime observations even when configured routing is correct', () => {
  assertRoutingError(() => validateCodexRouting(participant('astra-medium', { workClass: 'routine', observedModel: null }), 'worker'), /Actual model\/effort|unobserved/i);
  assertRoutingError(() => validateCodexRouting(participant('astra-medium', { workClass: 'routine', observedEffort: null }), 'worker'), /Actual model\/effort|unobserved/i);
});
