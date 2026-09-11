import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const skillDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceScript = path.join(skillDirectory, 'scripts', 'evidence.mjs');
const expectedRoutes = {
  lead: { model: 'gpt-6-astra', effort: 'high' },
  'correctness-routine': { model: 'gpt-5.6-sol', effort: 'medium' },
  correctness: { model: 'gpt-6-astra', effort: 'medium' },
  security: { model: 'gpt-6-astra', effort: 'high' },
  'astra-medium': { model: 'gpt-6-astra', effort: 'medium' },
  'astra-high': { model: 'gpt-6-astra', effort: 'high' },
  'luna-max': { model: 'gpt-5.6-luna', effort: 'max' },
};

function run(program, args) {
  return spawnSync(program, args, {
    cwd: skillDirectory,
    encoding: 'utf8',
    timeout: 30_000,
    windowsHide: true,
  });
}

function runEvidence(command, args) {
  const result = run(process.execPath, [evidenceScript, command, ...args]);
  assert.equal(result.error, undefined, result.error?.message);
  return result;
}

function runGit(repo, args) {
  const result = run('git', ['-C', repo, ...args]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function parseOutput(result) {
  assert.notEqual(result.stdout.trim(), '', result.stderr);
  return JSON.parse(result.stdout);
}

function routed(id, route, extra = {}) {
  const selected = expectedRoutes[route];
  return {
    id,
    route,
    requestedModel: selected.model,
    observedModel: selected.model,
    effort: selected.effort,
    observedEffort: selected.effort,
    observation: `fixture runtime observation for ${id}`,
    ...extra,
  };
}

function createFixture({ risk = 'routine', reviewRequirements, skipPostInit = false } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'codex-evidence-routing-'));
  const repo = path.join(root, 'repo');
  const runDirectory = path.join(root, 'evidence');
  const briefFile = path.join(root, 'brief.json');
  mkdirSync(repo);
  writeFileSync(path.join(repo, 'check.mjs'), 'process.exitCode = 0;\n', 'utf8');
  runGit(repo, ['init', '--quiet']);
  runGit(repo, ['config', 'user.email', 'fixture@example.test']);
  runGit(repo, ['config', 'user.name', 'Fixture']);
  runGit(repo, ['add', '--all']);
  runGit(repo, ['commit', '--quiet', '-m', 'fixture']);
  const securityInvariants = risk === 'sensitive'
    ? [{ id: 'S1', description: 'The evidence helper requires the declared security review.' }]
    : [];
  const requiredReviews = reviewRequirements ?? (risk === 'sensitive' ? ['correctness', 'security'] : ['correctness']);
  const brief = {
    schemaVersion: 1,
    task: 'Verify routing evidence through the local evidence helper',
    workMode: 'implementation',
    risk,
    riskRationale: 'The fixture verifies route-policy evidence.',
    criteria: [{ id: 'C1', description: 'The evidence helper accepts correctly routed local records.' }],
    securityInvariants,
    checks: [{
      id: 'check',
      purpose: 'Run the deterministic fixture check.',
      argv: ['node', 'check.mjs'],
      timeoutSeconds: 10,
      covers: ['C1', ...securityInvariants.map(invariant => invariant.id)],
    }],
    additionalPaths: [],
    reviewRequirements: requiredReviews,
    environment: {
      runtime: 'Node fixture runtime',
      dependencies: 'No package dependencies',
      externalServices: 'No external services',
    },
  };
  writeFileSync(briefFile, `${JSON.stringify(brief, null, 2)}\n`, 'utf8');
  const initialized = runEvidence('init', ['--repo', repo, '--run', runDirectory, '--brief', briefFile]);
  if (skipPostInit) return { root, runDirectory, initialized, risk };
  assert.equal(initialized.status, 0, initialized.stderr);
  const check = runEvidence('run', ['--run', runDirectory, '--check', 'check']);
  assert.equal(check.status, 0, check.stderr);
  const state = JSON.parse(readFileSync(path.join(runDirectory, 'state.json'), 'utf8'));
  return { root, runDirectory, state, risk };
}

function writeCompleteRecords(fixture, {
  builderId = 'builder-session',
  workerId = 'test-supervisor-session',
  workerClass = 'test-supervision',
  workerRoute = 'luna-max',
  correctnessRoute = fixture.risk === 'routine' ? 'correctness-routine' : 'correctness',
  reviewerId = 'correctness-reviewer-session',
} = {}) {
  const snapshotDigest = fixture.state.initialSnapshotDigest;
  const briefSha256 = fixture.state.briefSha256;
  writeFileSync(path.join(fixture.runDirectory, 'participants.json'), `${JSON.stringify({
    builders: [routed(builderId, 'astra-medium', { workClass: 'routine' })],
    workers: [routed(workerId, workerRoute, { workClass: workerClass })],
    evaluator: routed('evaluator-session', 'lead'),
  }, null, 2)}\n`, 'utf8');
  const reviews = [{
    kind: 'correctness',
    reviewerId,
    initialContext: 'fresh',
    ...routed('correctness-review-record', correctnessRoute),
    briefSha256,
    snapshotDigest,
    filesRead: ['check.mjs'],
    covers: ['C1'],
    verdict: 'ACCEPT',
    findings: [],
    gaps: [],
  }];
  if (fixture.risk === 'sensitive') {
    reviews.push({
      kind: 'security',
      reviewerId: 'security-reviewer-session',
      initialContext: 'fresh',
      ...routed('security-review-record', 'security'),
      briefSha256,
      snapshotDigest,
      filesRead: ['check.mjs'],
      covers: ['S1'],
      verdict: 'ACCEPT',
      findings: [],
      gaps: [],
    });
  }
  const reviewsFile = path.join(fixture.runDirectory, 'reviews.json');
  writeFileSync(reviewsFile, `${JSON.stringify(reviews, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(fixture.runDirectory, 'evaluation.json'), `${JSON.stringify({
    briefSha256,
    snapshotDigest,
    verdict: 'ACCEPT',
    acceptanceRationale: 'The fixture records all required local evidence.',
    findings: [],
    gaps: [],
    budget: {
      agentSessions: fixture.risk === 'sensitive' ? 5 : 4,
      repairCycles: 0,
      actualCostUsd: null,
      costSource: 'No billed cost is measured for a local fixture.',
    },
    releaseGate: {
      status: 'passed',
      evidence: 'Fixture-only external-gate record.',
    },
  }, null, 2)}\n`, 'utf8');
  return { reviewsFile };
}

test('evidence accepts a routine correctness review and nonauthor Luna test supervision only with matching observations', () => {
  const fixture = createFixture();
  try {
    writeCompleteRecords(fixture);
    const result = runEvidence('assess', ['--run', fixture.runDirectory]);
    assert.equal(result.status, 0, result.stderr);
    const assessment = parseOutput(result);
    assert.equal(assessment.outcome, 'ACCEPT');
    assert.equal(assessment.briefSha256, fixture.state.briefSha256);
    assert.equal(assessment.snapshotDigest, fixture.state.initialSnapshotDigest);
    assert.equal(assessment.releaseAuthorized, false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('evidence initialization rejects a routine brief without an independent correctness review', () => {
  const fixture = createFixture({ reviewRequirements: [], skipPostInit: true });
  try {
    assert.equal(fixture.initialized.status, 2, fixture.initialized.stderr);
    const outcome = parseOutput(fixture.initialized);
    assert.equal(outcome.outcome, 'INCOMPLETE');
    assert.match(outcome.error, /routine|correctness review/i);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('evidence does not accept a routine run after its required correctness review is removed', () => {
  const fixture = createFixture();
  try {
    const { reviewsFile } = writeCompleteRecords(fixture);
    writeFileSync(reviewsFile, '[]\n', 'utf8');
    const result = runEvidence('assess', ['--run', fixture.runDirectory]);
    assert.equal(result.status, 2, result.stderr);
    const assessment = parseOutput(result);
    assert.equal(assessment.outcome, 'INCOMPLETE');
    assert.ok(assessment.issues.incomplete.some(issue => /reviews: Missing required correctness review/.test(issue)));
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('evidence rejects test-supervision and design workers when their session is also an author', () => {
  for (const [workClass, route] of [['test-supervision', 'luna-max'], ['design', 'astra-high']]) {
    const fixture = createFixture();
    try {
      writeCompleteRecords(fixture, { builderId: 'shared-author-session', workerId: 'shared-author-session', workerClass: workClass, workerRoute: route });
      const result = runEvidence('assess', ['--run', fixture.runDirectory]);
      assert.equal(result.status, 2, result.stderr);
      const assessment = parseOutput(result);
      assert.equal(assessment.outcome, 'INCOMPLETE');
      assert.equal(assessment.releaseAuthorized, false);
      assert.ok(assessment.issues.incomplete.some(issue => issue.startsWith('participants:')));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});

test('evidence applies the frozen substantial and sensitive risk to correctness routing', () => {
  for (const risk of ['substantial', 'sensitive']) {
    const fixture = createFixture({ risk });
    try {
      writeCompleteRecords(fixture, { correctnessRoute: 'correctness-routine' });
      const result = runEvidence('assess', ['--run', fixture.runDirectory]);
      assert.equal(result.status, 2, result.stderr);
      const assessment = parseOutput(result);
      assert.equal(assessment.outcome, 'INCOMPLETE');
      assert.ok(assessment.issues.incomplete.some(issue => /reviews: Correctness review route is not allowed for the frozen risk/.test(issue)));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});

test('evidence keeps a reviewer independent and bound to the frozen brief after a passing record', () => {
  const fixture = createFixture();
  try {
    const { reviewsFile } = writeCompleteRecords(fixture);
    const baseline = runEvidence('assess', ['--run', fixture.runDirectory]);
    assert.equal(baseline.status, 0, baseline.stderr);

    const reviews = JSON.parse(readFileSync(reviewsFile, 'utf8'));
    reviews[0].reviewerId = 'builder-session';
    writeFileSync(reviewsFile, `${JSON.stringify(reviews, null, 2)}\n`, 'utf8');
    const selfReview = runEvidence('assess', ['--run', fixture.runDirectory]);
    assert.equal(selfReview.status, 2, selfReview.stderr);
    const selfReviewAssessment = parseOutput(selfReview);
    assert.ok(selfReviewAssessment.issues.incomplete.some(issue => /reviews: Reviewer is a builder or authorship is unknown/.test(issue)));

    reviews[0].reviewerId = 'correctness-reviewer-session';
    reviews[0].briefSha256 = '0'.repeat(64);
    writeFileSync(reviewsFile, `${JSON.stringify(reviews, null, 2)}\n`, 'utf8');
    const staleBrief = runEvidence('assess', ['--run', fixture.runDirectory]);
    assert.equal(staleBrief.status, 2, staleBrief.stderr);
    const staleBriefAssessment = parseOutput(staleBrief);
    assert.ok(staleBriefAssessment.issues.incomplete.some(issue => /reviews: Review targets another task brief/.test(issue)));
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
