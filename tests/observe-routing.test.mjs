import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { observeRouting } from '../scripts/observe-routing.mjs';

const skillDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const observerScript = path.join(skillDirectory, 'scripts', 'observe-routing.mjs');
const sessionId = 'session-luna-001';
const parentId = 'parent-desktop-001';
const route = 'luna-max';
const expectedModel = 'gpt-5.6-luna';
const expectedEffort = 'max';

function sessionMeta(options = {}) {
  const id = options.id ?? sessionId;
  const parent = Object.hasOwn(options, 'parent') ? options.parent : parentId;
  const includeIdentity = options.includeIdentity ?? true;
  const payload = {};
  if (includeIdentity) payload.id = id;
  if (parent !== undefined) {
    payload.source = { subagent: { thread_spawn: { parent_thread_id: parent } } };
  }
  return { type: 'session_meta', payload };
}

function turnContext({ model = expectedModel, effort = expectedEffort } = {}) {
  return { type: 'turn_context', payload: { model, effort } };
}

function tokenCount({ total = 17, usageField = 'last_token_usage' } = {}) {
  return {
    type: 'event_msg',
    payload: {
      type: 'token_count',
      info: { [usageField]: { total_tokens: total } },
    },
  };
}

function validRows(options = {}) {
  return [
    sessionMeta(options),
    turnContext(options),
    tokenCount(),
    tokenCount({ total: 23, usageField: 'total_token_usage' }),
  ];
}

function observe(rows, options = {}) {
  return observeRouting(rows, {
    sessionId,
    route,
    parentId,
    ...options,
  });
}

function assertRoutingError(callback, pattern) {
  assert.throws(callback, error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, pattern);
    return true;
  });
}

function usageEventCount(report) {
  return Array.isArray(report.usageEvents) ? report.usageEvents.length : report.usageEvents;
}

test('observeRouting verifies session, parent, model, effort, and positive usage', () => {
  const report = observe(validRows());
  assert.equal(report.verified, true);
  assert.equal(report.sessionId, sessionId);
  assert.equal(report.observedModel, expectedModel);
  assert.equal(report.observedEffort, expectedEffort);
  assert.equal(usageEventCount(report), 2);
});

test('observeRouting accepts token usage from either supported usage field', () => {
  for (const usageField of ['last_token_usage', 'total_token_usage']) {
    const report = observe([
      sessionMeta(),
      turnContext(),
      tokenCount({ usageField }),
    ]);
    assert.equal(report.verified, true);
    assert.equal(usageEventCount(report), 1);
  }
});

test('observeRouting rejects model and effort mismatches', () => {
  assertRoutingError(
    () => observe(validRows({ model: 'gpt-6-astra' })),
    /model|route/i,
  );
  assertRoutingError(
    () => observe(validRows({ effort: 'high' })),
    /effort/i,
  );
});

test('observeRouting ties the Terra xhigh route to its exact runtime pair', () => {
  const terraSessionId = 'session-terra-xhigh-001';
  const terraRoute = 'terra-xhigh';
  const terraModel = 'gpt-5.6-terra';
  const terraEffort = 'xhigh';
  const rows = [
    sessionMeta({ id: terraSessionId, parent: undefined }),
    turnContext({ model: terraModel, effort: terraEffort }),
    tokenCount(),
  ];
  const report = observeRouting(rows, { sessionId: terraSessionId, route: terraRoute });
  assert.equal(report.verified, true);
  assert.equal(report.observedModel, terraModel);
  assert.equal(report.observedEffort, terraEffort);
  assertRoutingError(
    () => observeRouting([
      sessionMeta({ id: terraSessionId, parent: undefined }),
      turnContext({ model: terraModel, effort: 'max' }),
      tokenCount(),
    ], { sessionId: terraSessionId, route: terraRoute }),
    /effort/i,
  );
});

test('observeRouting rejects mismatched or missing session and parent identity', () => {
  assertRoutingError(
    () => observe(validRows({ id: 'different-session' })),
    /session/i,
  );
  assertRoutingError(
    () => observe(validRows({ parent: 'different-parent' })),
    /parent/i,
  );
  assertRoutingError(
    () => observe(validRows({ includeIdentity: false })),
    /session|identity/i,
  );
  assertRoutingError(
    () => observe(validRows({ parent: undefined })),
    /parent|identity/i,
  );
});

test('observeRouting rejects missing context, missing positive usage, and usage before context', () => {
  assertRoutingError(
    () => observe([sessionMeta(), tokenCount()]),
    /context|turn_context/i,
  );
  assertRoutingError(
    () => observe([sessionMeta(), turnContext()]),
    /usage|token/i,
  );
  assertRoutingError(
    () => observe([sessionMeta(), tokenCount(), turnContext()]),
    /usage|token/i,
  );
  const laterUsage = observe([sessionMeta(), tokenCount(), turnContext(), tokenCount()]);
  assert.equal(laterUsage.verified, true);
  assert.equal(usageEventCount(laterUsage), 1);
  assertRoutingError(
    () => observe([sessionMeta(), turnContext(), tokenCount({ total: 0 })]),
    /usage|positive|token/i,
  );
});

test('observeRouting rejects mixed turn contexts even when usage is present', () => {
  assertRoutingError(
    () => observe([
      sessionMeta(),
      turnContext(),
      tokenCount(),
      turnContext({ model: 'gpt-6-astra' }),
      tokenCount(),
    ]),
    /model|context|consistent/i,
  );
});

test('observe-routing CLI rejects malformed JSONL records', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'codex-observe-'));
  const rollout = path.join(root, 'rollout.jsonl');
  try {
    writeFileSync(rollout, '{"type":"session_meta"}\nnot-json\n', 'utf8');
    const result = spawnSync(process.execPath, [
      observerScript,
      '--rollout', rollout,
      '--session', sessionId,
      '--route', route,
    ], {
      cwd: skillDirectory,
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    });
    assert.equal(result.status, 1, result.stdout);
    assert.equal(result.error, undefined, result.error?.message);
    assert.match(result.stderr, /Invalid JSONL record 2/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
