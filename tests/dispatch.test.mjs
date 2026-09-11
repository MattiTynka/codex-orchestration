import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const skillDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = path.join(skillDirectory, 'scripts', 'codex-launch.mjs');
const workerRoutes = {
  'luna-max': { model: 'gpt-5.6-luna', effort: 'max' },
  'terra-xhigh': { model: 'gpt-5.6-terra', effort: 'xhigh' },
  'terra-max': { model: 'gpt-5.6-terra', effort: 'max' },
  'astra-medium': { model: 'gpt-6-astra', effort: 'medium' },
  'astra-high': { model: 'gpt-6-astra', effort: 'high' },
  'sol-medium': { model: 'gpt-5.6-sol', effort: 'medium' },
};

const leadRoutes = {
  lead: { model: 'gpt-6-astra', effort: 'high' },
  'lead-high': { model: 'gpt-6-astra', effort: 'high' },
};

const correctnessReviewRoutes = {
  'correctness-routine': { model: 'gpt-5.6-sol', effort: 'medium' },
  correctness: { model: 'gpt-6-astra', effort: 'medium' },
  security: { model: 'gpt-6-astra', effort: 'high' },
};

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'codex-dispatch-'));
  const repo = path.join(root, 'repo');
  const outputParent = path.join(root, 'outputs');
  const prompt = path.join(root, 'prompt.txt');
  mkdirSync(repo);
  mkdirSync(outputParent);
  writeFileSync(prompt, 'perform the bounded fixture task\n', 'utf8');
  return { root, repo, outputParent, prompt };
}

function runLauncher(args, { env = process.env } = {}) {
  return spawnSync(process.execPath, [launcher, ...args], {
    cwd: skillDirectory,
    encoding: 'utf8',
    env,
    timeout: 30_000,
    windowsHide: true,
  });
}

function assertFailure(result, message) {
  assert.notEqual(result.status, 0, message);
  assert.equal(result.error, undefined, `${message}: ${result.error?.message ?? 'spawn error'}`);
}

function readDryRun(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.error, undefined, result.error?.message);
  return JSON.parse(result.stdout);
}

function writeCodexFixture(repo) {
  const executable = path.join(repo, 'exec');
  writeFileSync(executable, String.raw`
const fs = require('node:fs');
const args = process.argv.slice(2);
const outputIndex = args.indexOf('-o');
const output = outputIndex >= 0 ? args[outputIndex + 1] : null;
let prompt = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { prompt += chunk; });
process.stdin.on('end', () => {
  const mode = process.env.CODEX_DISPATCH_FIXTURE_MODE || 'success';
  if (mode === 'failure') {
    process.stderr.write('fixture failure\n');
    process.exitCode = 7;
    return;
  }
  if (mode === 'hang') {
    process.stdout.write(JSON.stringify({ type: 'fixture', promptLength: prompt.length }) + '\n');
    setInterval(() => {}, 1000);
    return;
  }
  process.stdout.write(JSON.stringify({ type: 'fixture', promptLength: prompt.length }) + '\n');
  if (mode !== 'missing-final') fs.writeFileSync(output, 'fixture final\n', 'utf8');
});
`, 'utf8');
  return executable;
}

function workerArgs(fixture, output, route, extra = []) {
  return [
    'worker',
    '--repo', fixture.repo,
    '--prompt', fixture.prompt,
    '--output', output,
    '--route', route,
    ...extra,
  ];
}

test('worker dry-run selects every permitted worker route and exact argv', () => {
  const fixture = createFixture();
  try {
    for (const [route, selected] of Object.entries(workerRoutes)) {
      const output = path.join(fixture.outputParent, `dry-${route}`);
      const payload = readDryRun(runLauncher([...workerArgs(fixture, output, route), '--dry-run']));
      assert.equal(payload.command, 'worker');
      assert.equal(payload.route, route);
      assert.equal(payload.sandbox, 'read-only');
      assert.equal(payload.requestedModel, selected.model);
      assert.equal(payload.requestedEffort, selected.effort);
      assert.deepEqual(payload.argv, [
        'exec',
        '--model', selected.model,
        '--sandbox', 'read-only',
        '-c', `model_reasoning_effort=${JSON.stringify(selected.effort)}`,
        '-c', 'approval_policy="never"',
        '-c', 'agents.enabled=false',
        '--json', '-', '-o', path.join(output, 'final.txt'),
      ]);
    }

    const writableOutput = path.join(fixture.outputParent, 'dry-workspace-write');
    const writable = readDryRun(runLauncher([
      ...workerArgs(fixture, writableOutput, 'luna-max', ['--sandbox', 'workspace-write']),
      '--dry-run',
    ]));
    assert.equal(writable.sandbox, 'workspace-write');
    assert.equal(writable.argv[4], 'workspace-write');
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('worker requires a supported route and sandbox', () => {
  const fixture = createFixture();
  try {
    const missingRoute = runLauncher([
      'worker', '--repo', fixture.repo, '--prompt', fixture.prompt,
      '--output', path.join(fixture.outputParent, 'missing-route'), '--dry-run',
    ]);
    assertFailure(missingRoute, 'missing route should fail');
    assert.match(missingRoute.stderr, /--route is required/);

    for (const route of ['lead', 'lead-high', 'security', 'correctness', 'correctness-routine', 'astra-low', 'sol-high', 'unknown-route']) {
      const invalidRoute = runLauncher([
        ...workerArgs(fixture, path.join(fixture.outputParent, `invalid-${route}`), route),
        '--dry-run',
      ]);
      assertFailure(invalidRoute, `route ${route} should fail`);
      assert.match(invalidRoute.stderr, /--route must be one of/);
    }

    const invalidSandbox = runLauncher([
      ...workerArgs(fixture, path.join(fixture.outputParent, 'invalid-sandbox'), 'luna-max', ['--sandbox', 'interactive']),
      '--dry-run',
    ]);
    assertFailure(invalidSandbox, 'invalid sandbox should fail');
    assert.match(invalidSandbox.stderr, /--sandbox must be read-only or workspace-write/);

    const duplicateRoute = runLauncher([
      ...workerArgs(fixture, path.join(fixture.outputParent, 'duplicate-route'), 'luna-max', ['--route', 'terra-max']),
      '--dry-run',
    ]);
    assertFailure(duplicateRoute, 'worker route must not repeat');
    assert.match(duplicateRoute.stderr, /Repeated option/);

    const unknown = runLauncher([
      ...workerArgs(fixture, path.join(fixture.outputParent, 'unknown-option'), 'luna-max', ['--kind', 'correctness']),
      '--dry-run',
    ]);
    assertFailure(unknown, 'worker-only command rejects unknown options');
    assert.match(unknown.stderr, /Unknown option for worker/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('lead defaults to Astra high and also accepts the explicit high lead route', () => {
  const fixture = createFixture();
  try {
    const defaultPayload = readDryRun(runLauncher(['lead', '--repo', fixture.repo, '--dry-run']));
    assert.equal(defaultPayload.command, 'lead');
    assert.equal(defaultPayload.route, 'lead');
    assert.equal(defaultPayload.requestedModel, leadRoutes.lead.model);
    assert.equal(defaultPayload.requestedEffort, leadRoutes.lead.effort);

    for (const [route, selected] of Object.entries(leadRoutes)) {
      const payload = readDryRun(runLauncher(['lead', '--repo', fixture.repo, '--route', route, '--dry-run']));
      assert.equal(payload.command, 'lead');
      assert.equal(payload.route, route);
      assert.equal(payload.requestedModel, selected.model);
      assert.equal(payload.requestedEffort, selected.effort);
      assert.deepEqual(payload.argv, [
        '--model', selected.model,
        '--sandbox', 'workspace-write',
        '-c', `model_reasoning_effort=${JSON.stringify(selected.effort)}`,
        '-c', 'approval_policy="on-request"',
        '-c', 'agents.max_concurrent_threads_per_session=2',
      ]);
    }

    for (const route of ['security', 'correctness', 'astra-high', 'unknown-route']) {
      const rejected = runLauncher(['lead', '--repo', fixture.repo, '--route', route, '--dry-run']);
      assertFailure(rejected, `lead route ${route} should fail`);
      assert.match(rejected.stderr, /route|lead/i);
    }

    const duplicate = runLauncher(['lead', '--repo', fixture.repo, '--route', 'lead', '--route', 'lead-high', '--dry-run']);
    assertFailure(duplicate, 'duplicate lead route should fail');
    assert.match(duplicate.stderr, /Repeated option/);

    const unknown = runLauncher(['lead', '--repo', fixture.repo, '--kind', 'correctness', '--dry-run']);
    assertFailure(unknown, 'unknown lead option should fail');
    assert.match(unknown.stderr, /Unknown option for lead/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('review selects the permitted route for each kind, stays read-only, and rejects worker-only flags', () => {
  const fixture = createFixture();
  try {
    const review = readDryRun(runLauncher([
      'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
      '--output', path.join(fixture.outputParent, 'review-default'), '--dry-run',
    ]));
    assert.equal(review.command, 'review');
    assert.equal(review.kind, 'correctness');
    assert.equal(review.route, 'correctness');
    assert.equal(review.sandbox, 'read-only');
    assert.equal(review.requestedModel, correctnessReviewRoutes.correctness.model);
    assert.equal(review.requestedEffort, correctnessReviewRoutes.correctness.effort);
    assert.ok(review.argv.includes('agents.enabled=false'));

    for (const [route, selected] of Object.entries(correctnessReviewRoutes)) {
      const invocation = readDryRun(runLauncher([
        'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
        '--output', path.join(fixture.outputParent, `review-correctness-${route}`),
        '--kind', 'correctness', '--route', route, '--dry-run',
      ]));
      assert.equal(invocation.kind, 'correctness');
      assert.equal(invocation.route, route);
      assert.equal(invocation.sandbox, 'read-only');
      assert.equal(invocation.requestedModel, selected.model);
      assert.equal(invocation.requestedEffort, selected.effort);
    }

    for (const route of ['lead', 'lead-high', 'astra-medium', 'astra-high', 'sol-medium', 'terra-xhigh', 'terra-max', 'luna-max']) {
      const rejected = runLauncher([
        'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
        '--output', path.join(fixture.outputParent, `review-correctness-${route}`),
        '--kind', 'correctness', '--route', route, '--dry-run',
      ]);
      assertFailure(rejected, `correctness review route ${route} should fail`);
      assert.match(rejected.stderr, /correctness|route/i);
    }

    const security = readDryRun(runLauncher([
      'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
      '--output', path.join(fixture.outputParent, 'review-security-default'), '--kind', 'security', '--dry-run',
    ]));
    assert.equal(security.kind, 'security');
    assert.equal(security.route, 'security');
    assert.equal(security.sandbox, 'read-only');
    assert.equal(security.requestedModel, correctnessReviewRoutes.security.model);
    assert.equal(security.requestedEffort, correctnessReviewRoutes.security.effort);

    for (const route of ['correctness-routine', 'correctness', 'astra-medium', 'sol-medium']) {
      const rejected = runLauncher([
        'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
        '--output', path.join(fixture.outputParent, `review-security-${route}`),
        '--kind', 'security', '--route', route, '--dry-run',
      ]);
      assertFailure(rejected, `security review route ${route} should fail`);
      assert.match(rejected.stderr, /security|route/i);
    }

    for (const [flag, value] of [['--sandbox', 'workspace-write'], ['--unknown', 'value']]) {
      const rejected = runLauncher([
        'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
        '--output', path.join(fixture.outputParent, `review-${flag.slice(2)}`), flag, value,
      ]);
      assertFailure(rejected, `${flag} must be rejected for review`);
      assert.match(rejected.stderr, new RegExp(`Unknown option for review: ${flag.replace('-', '\\-')}`));
    }

    for (const duplicate of [
      ['--kind', 'correctness', '--kind', 'security'],
      ['--route', 'correctness', '--route', 'security'],
    ]) {
      const rejected = runLauncher([
        'review', '--repo', fixture.repo, '--prompt', fixture.prompt,
        '--output', path.join(fixture.outputParent, `review-duplicate-${duplicate[0].slice(2)}`),
        ...duplicate,
      ]);
      assertFailure(rejected, `${duplicate[0]} must not repeat`);
      assert.match(rejected.stderr, /Repeated option/);
    }
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('worker refuses output directories inside the repository', () => {
  const fixture = createFixture();
  try {
    const inside = path.join(fixture.repo, 'worker-output');
    const result = runLauncher([...workerArgs(fixture, inside, 'luna-max'), '--dry-run']);
    assertFailure(result, 'repository output should fail');
    assert.match(result.stderr, /Worker output must be outside the repository/);
    assert.equal(existsSync(inside), false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('worker transport completion preserves null runtime identity fields', () => {
  const fixture = createFixture();
  try {
    const executable = writeCodexFixture(fixture.repo);
    const output = path.join(fixture.outputParent, 'success');
    const result = runLauncher([
      ...workerArgs(fixture, output, 'luna-max'),
      '--codex', process.execPath,
      '--timeout-seconds', '10',
    ]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.error, undefined, result.error?.message);
    const printed = JSON.parse(result.stdout);
    const completion = JSON.parse(readFileSync(path.join(output, 'completion.json'), 'utf8'));
    assert.equal(printed.completion.transportCompleted, true);
    assert.equal(completion.transportCompleted, true);
    assert.equal(completion.reason, 'completed-transport');
    assert.equal(completion.finalPresent, true);
    assert.equal(completion.requestedModel, workerRoutes['luna-max'].model);
    assert.equal(completion.requestedEffort, workerRoutes['luna-max'].effort);
    assert.equal(completion.observedModel, null);
    assert.equal(completion.observedEffort, null);
    assert.equal(completion.requiresEvaluation, true);
    assert.equal(readFileSync(path.join(output, 'final.txt'), 'utf8'), 'fixture final\n');
    assert.match(readFileSync(path.join(output, 'events.jsonl'), 'utf8'), /"type":"fixture"/);
    assert.ok(executable.endsWith(path.join('repo', 'exec')));
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('worker fails when the child omits final output or exits nonzero', () => {
  for (const [mode, reason] of [['missing-final', 'missing-final'], ['failure', 'child-failure']]) {
    const fixture = createFixture();
    try {
      writeCodexFixture(fixture.repo);
      const output = path.join(fixture.outputParent, mode);
      const result = runLauncher([
        ...workerArgs(fixture, output, 'terra-max'),
        '--codex', process.execPath,
        '--timeout-seconds', '10',
      ], { env: { ...process.env, CODEX_DISPATCH_FIXTURE_MODE: mode } });
      assertFailure(result, `${mode} should fail`);
      const completion = JSON.parse(readFileSync(path.join(output, 'completion.json'), 'utf8'));
      assert.equal(completion.transportCompleted, false);
      assert.equal(completion.reason, reason);
      assert.equal(completion.observedModel, null);
      assert.equal(completion.observedEffort, null);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});

test('review fake process covers success, nonzero exit, and timeout', () => {
  const scenarios = [
    ['success', 0, 'completed-transport'],
    ['failure', 1, 'child-failure'],
    ['hang', 1, 'timeout'],
  ];
  for (const [mode, expectedStatus, expectedReason] of scenarios) {
    const fixture = createFixture();
    try {
      writeCodexFixture(fixture.repo);
      const output = path.join(fixture.outputParent, `review-${mode}`);
      const result = runLauncher([
        'review',
        '--repo', fixture.repo,
        '--prompt', fixture.prompt,
        '--output', output,
        '--kind', 'correctness',
        '--codex', process.execPath,
        '--timeout-seconds', mode === 'hang' ? '1' : '10',
      ], { env: { ...process.env, CODEX_DISPATCH_FIXTURE_MODE: mode } });
      assert.equal(result.status, expectedStatus, `${mode}: ${result.stderr}`);
      const completion = JSON.parse(readFileSync(path.join(output, 'completion.json'), 'utf8'));
      assert.equal(completion.command, 'review');
      assert.equal(completion.kind, 'correctness');
      assert.equal(completion.sandbox, 'read-only');
      assert.equal(completion.reason, expectedReason);
      assert.equal(completion.route, 'correctness');
      assert.equal(completion.requestedModel, 'gpt-6-astra');
      assert.equal(completion.requestedEffort, 'medium');
      assert.equal(completion.observedModel, null);
      assert.equal(completion.observedEffort, null);
      assert.equal(completion.timedOut, mode === 'hang');
      if (mode === 'success') assert.equal(completion.finalPresent, true);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});
