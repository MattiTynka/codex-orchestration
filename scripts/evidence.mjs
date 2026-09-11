#!/usr/bin/env node
// New: local evidence bookkeeping. This is not a sandbox, a security scanner,
// an authenticated review service, or permission to release an application.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateCodexRouting } from './routes.mjs';

const VERSION = 1;
const LIMIT = 16 * 1024 * 1024;
const outcomes = ['ACCEPT', 'FIX', 'RETHINK', 'INCOMPLETE'];
const hash = data => createHash('sha256').update(data).digest('hex');
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const textValue = value => typeof value === 'string' && value.trim().length > 0;
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const idValue = value => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value);
const within = (root, target) => target === root || (!path.relative(root, target).startsWith(`..${path.sep}`)
  && path.relative(root, target) !== '..' && !path.isAbsolute(path.relative(root, target)));

function noLinks(root, target, allowMissing = false) {
  requireThat(within(root, target), 'Path escapes its permitted directory');
  let cursor = root;
  for (const part of ['', ...path.relative(root, target).split(path.sep).filter(Boolean)]) {
    cursor = part ? path.join(cursor, part) : cursor;
    try { requireThat(!fs.lstatSync(cursor).isSymbolicLink(), `Symlink is not supported: ${cursor}`); }
    catch (error) { if (allowMissing && error.code === 'ENOENT') continue; throw error; }
  }
}
function readJson(file) {
  requireThat(fs.statSync(file).size <= LIMIT, 'JSON evidence is too large');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  noLinks(path.dirname(file), file, true);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function git(repo, args, optional = false) {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: LIMIT, windowsHide: true });
  if (optional && result.status !== 0) return null;
  requireThat(result.status === 0, `Git command failed: ${result.stderr || result.error?.message || args[0]}`);
  return result.stdout;
}
function repoRoot(input) {
  const root = fs.realpathSync(path.resolve(input));
  requireThat(fs.statSync(root).isDirectory(), 'Repository must be a directory');
  requireThat(fs.realpathSync(git(root, ['rev-parse', '--show-toplevel']).trim()) === root, 'Use the repository root');
  requireThat(git(root, ['config', '--bool', 'core.sparseCheckout'], true)?.trim() !== 'true', 'Sparse checkouts need an expanded external verifier');
  return root;
}
function validateBrief(brief) {
  requireThat(brief?.schemaVersion === VERSION, 'Unsupported brief schemaVersion');
  requireThat(brief.workMode === undefined || ['implementation', 'review'].includes(brief.workMode), 'workMode must be implementation or review');
  requireThat(textValue(brief.task) && textValue(brief.riskRationale), 'Task and riskRationale are required');
  requireThat(['routine', 'substantial', 'sensitive'].includes(brief.risk), 'Invalid risk class');
  for (const key of ['criteria', 'securityInvariants', 'checks', 'reviewRequirements', 'additionalPaths'])
    requireThat(Array.isArray(brief[key]), `brief.${key} must be an array`);
  requireThat(brief.criteria.length > 0 && brief.checks.length > 0, 'Acceptance criteria and required checks cannot be empty');
  const requirements = [...brief.criteria, ...brief.securityInvariants];
  requireThat(requirements.every(r => idValue(r.id) && textValue(r.description)), 'Every requirement needs an id and description');
  const ids = requirements.map(r => r.id);
  requireThat(new Set(ids).size === ids.length, 'Duplicate requirement ids');
  requireThat(new Set(brief.checks.map(c => c.id)).size === brief.checks.length, 'Duplicate check ids');
  for (const check of brief.checks) {
    requireThat(idValue(check.id) && textValue(check.purpose), 'Check id and purpose are required');
    requireThat(Array.isArray(check.argv) && check.argv.length > 0 && check.argv.every(a => typeof a === 'string' && !a.includes('\0')) && textValue(check.argv[0]), 'Check argv must contain literal command arguments');
    requireThat(Number.isInteger(check.timeoutSeconds) && check.timeoutSeconds >= 1 && check.timeoutSeconds <= 7200, 'Check timeoutSeconds must be 1..7200');
    requireThat(Array.isArray(check.covers) && check.covers.length > 0 && check.covers.every(id => ids.includes(id)), 'Every check needs valid requirement coverage');
  }
  requireThat(ids.every(id => brief.checks.some(c => c.covers.includes(id))), 'Every criterion and security invariant needs an executable required check');
  requireThat(brief.reviewRequirements.every(k => ['correctness', 'security'].includes(k)) && new Set(brief.reviewRequirements).size === brief.reviewRequirements.length, 'Invalid review requirements');
  requireThat(brief.reviewRequirements.includes('correctness'), 'Every brief requires independent correctness review');
  if (brief.risk === 'sensitive') requireThat(brief.securityInvariants.length > 0 && brief.reviewRequirements.includes('security'), 'Sensitive changes require security invariants and independent security review');
  requireThat(brief.additionalPaths.every(p => textValue(p) && !path.isAbsolute(p) && !p.split(/[\\/]/).some(v => v === '..' || v === '.git')), 'Invalid additionalPaths');
  requireThat(brief.environment && ['runtime', 'dependencies', 'externalServices'].every(k => textValue(brief.environment[k])), 'Describe runtime, dependencies, and externalServices without secrets');
}
function fileHash(file) {
  const fd = fs.openSync(file, 'r');
  const digest = createHash('sha256');
  try {
    const buffer = Buffer.allocUnsafe(65536);
    let size;
    while ((size = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) digest.update(buffer.subarray(0, size));
  } finally { fs.closeSync(fd); }
  return digest.digest('hex');
}
export function snapshot(repo, additionalPaths = []) {
  const head = git(repo, ['rev-parse', '--verify', 'HEAD'], true)?.trim() || 'UNBORN';
  const index = git(repo, ['ls-files', '--stage', '-z']);
  for (const record of index.split('\0').filter(Boolean)) {
    requireThat(!record.startsWith('160000 '), 'Submodules need separate expanded evidence; this helper refuses them');
    requireThat(/^\d+ [a-f0-9]+ 0\t/.test(record), 'Resolve unmerged index entries first');
  }
  const names = new Set(git(repo, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean));
  function expand(relative) {
    const absolute = path.resolve(repo, relative);
    requireThat(within(repo, absolute) && absolute !== repo && !path.relative(repo, absolute).split(path.sep).includes('.git'), 'Invalid additional snapshot path');
    noLinks(repo, absolute);
    const stat = fs.lstatSync(absolute);
    if (stat.isDirectory()) for (const name of fs.readdirSync(absolute)) expand(path.join(relative, name));
    else names.add(path.relative(repo, absolute).split(path.sep).join('/'));
  }
  additionalPaths.forEach(expand);
  const files = [...names].sort().map(name => {
    const absolute = path.resolve(repo, name);
    requireThat(within(repo, absolute), 'Git returned a path outside the repository');
    noLinks(repo, path.dirname(absolute), true);
    let stat;
    try { stat = fs.lstatSync(absolute); }
    catch (error) { if (error.code === 'ENOENT') return { path: name, kind: 'missing' }; throw error; }
    requireThat(stat.isFile(), `Non-regular file requires an external snapshot verifier: ${name}`);
    return { path: name, kind: 'file', executable: Boolean(stat.mode & 0o111), sha256: fileHash(absolute) };
  });
  const manifest = { head, indexSha256: hash(index), files };
  requireThat(git(repo, ['ls-files', '--stage', '-z']) === index && (git(repo, ['rev-parse', '--verify', 'HEAD'], true)?.trim() || 'UNBORN') === head, 'Repository changed while taking snapshot');
  return { schemaVersion: VERSION, digest: hash(canonical(manifest)), ...manifest };
}
function runRoot(input) {
  const original = path.resolve(input);
  requireThat(!fs.lstatSync(original).isSymbolicLink(), 'Run directory cannot be a symlink');
  return fs.realpathSync(original);
}
function newRunPath(input) {
  let parent = path.resolve(input);
  const tail = [];
  // New: resolve an existing parent first (including macOS /var aliases), then
  // enforce the outside-repository boundary against the canonical destination.
  while (!fs.existsSync(parent)) {
    tail.unshift(path.basename(parent));
    const next = path.dirname(parent);
    requireThat(next !== parent, 'Cannot resolve run-directory parent'); parent = next;
  }
  return path.join(fs.realpathSync(parent), ...tail);
}
function loadRun(input) {
  const run = runRoot(input);
  noLinks(run, path.join(run, 'state.json'));
  noLinks(run, path.join(run, 'brief.json'));
  const state = readJson(path.join(run, 'state.json'));
  const brief = readJson(path.join(run, 'brief.json'));
  requireThat(state.schemaVersion === VERSION, 'Unsupported state schemaVersion');
  validateBrief(brief);
  requireThat(hash(canonical(brief)) === state.briefSha256, 'Brief changed after initialization; start a new run');
  const repo = repoRoot(state.repo);
  requireThat(!within(repo, run), 'Evidence must be stored outside the repository');
  return { run, state, brief, repo };
}
function lock(run) {
  const file = path.join(run, 'active.lock');
  const fd = fs.openSync(file, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })); }
  catch (error) { fs.closeSync(fd); fs.unlinkSync(file); throw error; }
  return () => { fs.closeSync(fd); fs.unlinkSync(file); };
}
function commandFor(argv) {
  if (argv[0] === 'node') return [process.execPath, ...argv.slice(1)];
  // New: npm.cmd cannot be passed safely to shell:false on Windows. Run npm's JS entrypoint.
  if (process.platform === 'win32' && ['npm', 'npm.cmd'].includes(argv[0])) {
    const candidates = [path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')];
    for (const directory of (process.env.PATH || '').split(path.delimiter)) if (directory)
      candidates.push(path.join(directory, 'node_modules', 'npm', 'bin', 'npm-cli.js'));
    const npm = candidates.find(p => fs.existsSync(p));
    requireThat(npm, 'Cannot find npm-cli.js; use an explicit node + npm-cli.js argv in the brief');
    return [process.execPath, npm, ...argv.slice(1)];
  }
  requireThat(!(process.platform === 'win32' && /\.(cmd|bat)$/i.test(argv[0])), 'Use the tool JS entrypoint or a real executable on Windows');
  return argv;
}
function stopTree(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 5000 });
  else { try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* Already exited. */ } } }
}
async function runCheck(context, id) {
  const { run, brief, state, repo } = context;
  const check = brief.checks.find(c => c.id === id);
  requireThat(check, 'Unknown required check id');
  const unlock = lock(run);
  try {
    const directory = path.join(run, 'checks');
    noLinks(run, directory, true); fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    // New: invalidate the current result before starting. Historical attempt files
    // remain, but a disk-full rerun cannot fall back to an older passing pointer.
    const current = path.join(directory, `${id}.json`);
    noLinks(run, current, true);
    try { fs.unlinkSync(current); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const before = snapshot(repo, brief.additionalPaths);
    const attempt = randomUUID();
    const out = path.join(directory, `${id}-${attempt}.stdout.log`);
    const err = path.join(directory, `${id}-${attempt}.stderr.log`);
    const argv = commandFor(check.argv);
    const outFd = fs.openSync(out, 'wx', 0o600);
    let errFd;
    try { errFd = fs.openSync(err, 'wx', 0o600); }
    catch (error) { fs.closeSync(outFd); throw error; }
    let bytes = 0, termination = null, processError = null;
    const startedAt = new Date().toISOString();
    const child = spawn(argv[0], argv.slice(1), { cwd: repo, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    function capture(fd, chunk) {
      if (termination) return;
      const remaining = Math.max(0, LIMIT - bytes);
      try {
        const data = chunk.subarray(0, remaining);
        let offset = 0;
        while (offset < data.length) {
          const written = fs.writeSync(fd, data, offset, data.length - offset);
          requireThat(written > 0, 'Log write made no progress'); offset += written;
        }
        bytes += chunk.length;
        if (bytes > LIMIT) { termination = 'output-limit'; stopTree(child); }
      } catch (error) { processError = error.message; termination = 'log-write-failed'; stopTree(child); }
    }
    child.stdout.on('data', chunk => capture(outFd, chunk));
    child.stderr.on('data', chunk => capture(errFd, chunk));
    child.on('error', error => { processError = error.message; });
    const timer = setTimeout(() => { termination = 'timeout'; stopTree(child); }, check.timeoutSeconds * 1000);
    const interrupt = () => { termination = 'interrupted'; stopTree(child); };
    process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
    let result;
    try { result = await new Promise(resolve => child.on('close', (exitCode, signal) => resolve({ exitCode, signal }))); }
    finally {
      clearTimeout(timer); process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
      // New: remove owned descendants even if writing/closing an evidence stream failed.
      if (process.platform !== 'win32') stopTree(child);
      for (const fd of [outFd, errFd]) {
        try { fs.closeSync(fd); }
        catch (error) { processError = error.message; termination = 'log-close-failed'; }
      }
    }
    const after = snapshot(repo, brief.additionalPaths);
    const status = termination || processError || before.digest !== after.digest ? 'incomplete' : result.exitCode === 0 ? 'passed' : 'failed';
    const record = { schemaVersion: VERSION, checkId: id, briefSha256: state.briefSha256, argv: check.argv, resolvedArgv: argv, cwd: repo,
      startedAt, endedAt: new Date().toISOString(), beforeDigest: before.digest, afterDigest: after.digest, status, ...result,
      termination, processError, stdout: { path: path.relative(run, out), sha256: fileHash(out) }, stderr: { path: path.relative(run, err), sha256: fileHash(err) } };
    writeJson(path.join(directory, `${id}-${attempt}.json`), record);
    writeJson(current, record);
    return { check: id, status, exitCode: result.exitCode, snapshotDigest: after.digest, evidence: path.join(directory, `${id}.json`) };
  } finally { unlock(); }
}
function inspectFindings(report, issues) {
  requireThat(Array.isArray(report.findings) && Array.isArray(report.gaps) && report.gaps.every(textValue), 'Report needs findings and gaps arrays');
  if (report.gaps.length) issues.incomplete.push(...report.gaps);
  for (const finding of report.findings) {
    requireThat(idValue(finding.id) && ['open', 'resolved', 'dismissed'].includes(finding.status), 'Finding id or status is invalid');
    requireThat(['severity', 'location', 'scenario', 'evidence'].every(k => textValue(finding[k])), 'Finding needs severity, location, scenario, and evidence');
    if (finding.status === 'open') issues.fix.push(`Open finding: ${finding.id}`);
    else requireThat(textValue(finding.resolution), 'Resolved/dismissed findings require evidence-based resolution');
  }
  requireThat(outcomes.includes(report.verdict), 'Invalid report verdict');
  if (report.verdict === 'FIX') issues.fix.push('A reviewer/evaluator requests fixes');
  if (report.verdict === 'RETHINK') issues.rethink.push('A reviewer/evaluator rejects the design');
  if (report.verdict === 'INCOMPLETE') issues.incomplete.push('A reviewer/evaluator reports incomplete work');
}
function assess(context, expectedHash) {
  const { run, state, brief, repo } = context;
  const issues = { incomplete: [], fix: [], rethink: [] };
  const recordedSessions = new Set();
  if (expectedHash) requireThat(sha(expectedHash) && expectedHash === state.briefSha256, 'Protected brief hash does not match');
  requireThat(!fs.existsSync(path.join(run, 'active.lock')), 'A check is still active or an interrupted run needs recovery');
  const target = snapshot(repo, brief.additionalPaths);
  const inspectionOnly = brief.workMode === 'review';
  if (inspectionOnly && target.digest !== state.initialSnapshotDigest) issues.incomplete.push('Inspection-only candidate changed since initialization');
  function inspect(label, fn) { try { fn(); } catch (error) { issues.incomplete.push(`${label}: ${error.message}`); } }
  function read(relative) { const file = path.resolve(run, relative); noLinks(run, file); return readJson(file); }
  for (const check of brief.checks) inspect(check.id, () => {
    const record = read(path.join('checks', `${check.id}.json`));
    requireThat(record.schemaVersion === VERSION && record.checkId === check.id && record.briefSha256 === state.briefSha256 && canonical(record.argv) === canonical(check.argv) && record.cwd === repo, 'Check provenance mismatch');
    requireThat(record.beforeDigest === target.digest && record.afterDigest === target.digest, 'Check evidence is stale or the command changed source');
    for (const stream of [record.stdout, record.stderr]) {
      requireThat(stream && textValue(stream.path) && sha(stream.sha256), 'Missing log record');
      const file = path.resolve(run, stream.path); noLinks(run, file);
      requireThat(fs.statSync(file).isFile() && fileHash(file) === stream.sha256, 'Log missing or altered');
    }
    requireThat(record.termination === null && record.processError === null && record.signal === null, 'Check did not complete normally');
    if (record.status === 'failed' && Number.isInteger(record.exitCode) && record.exitCode !== 0) issues.fix.push(`Required check failed: ${check.id}`);
    else requireThat(record.status === 'passed' && record.exitCode === 0, 'Required check did not pass');
  });
  let participants;
  inspect('participants', () => {
    participants = read('participants.json');
    requireThat(Array.isArray(participants.builders) && (inspectionOnly || participants.builders.length > 0), 'Record every author; an empty roster requires explicit inspection-only mode');
    const ids = participants.builders.map(p => p.id);
    requireThat(ids.every(textValue) && new Set(ids).size === ids.length && textValue(participants.evaluator?.id), 'Participant ids are invalid');
    [...ids, participants.evaluator.id].forEach(id => recordedSessions.add(id));
    participants.builders.forEach(p => validateCodexRouting(p, 'builder'));
    requireThat(!participants.workers || Array.isArray(participants.workers), 'workers must be an array when present');
    (participants.workers || []).forEach(p => {
      requireThat(textValue(p.id), 'Worker session id is required');
      if (['test-supervision', 'design'].includes(p.workClass)) requireThat(!ids.includes(p.id), 'Test supervision and design require a non-author worker');
      recordedSessions.add(p.id);
      validateCodexRouting(p, 'worker');
    });
    validateCodexRouting(participants.evaluator, 'evaluator');
  });
  inspect('reviews', () => {
    const reviews = read('reviews.json'); requireThat(Array.isArray(reviews), 'reviews.json must be an array');
    for (const review of reviews) {
      requireThat(['correctness', 'security'].includes(review.kind), 'Unknown review kind');
      requireThat(review.briefSha256 === state.briefSha256, 'Review targets another task brief');
      requireThat(review.snapshotDigest === target.digest, 'Review targets another snapshot');
      requireThat(textValue(review.reviewerId) && review.initialContext === 'fresh', 'Initial review must use a fresh independent context');
      recordedSessions.add(review.reviewerId);
      requireThat(participants?.builders && !participants.builders.some(b => b.id === review.reviewerId), 'Reviewer is a builder or authorship is unknown');
      validateCodexRouting(review, review.kind, brief.risk);
      requireThat(Array.isArray(review.filesRead) && review.filesRead.length > 0 && review.filesRead.every(textValue), 'Record source context actually reviewed');
      const required = review.kind === 'security' ? brief.securityInvariants : brief.criteria;
      requireThat(Array.isArray(review.covers) && required.every(c => review.covers.includes(c.id)), 'Review coverage is incomplete');
      inspectFindings(review, issues);
    }
    for (const kind of brief.reviewRequirements) requireThat(reviews.some(r => r.kind === kind), `Missing required ${kind} review`);
  });
  inspect('evaluation', () => {
    const evaluation = read('evaluation.json');
    requireThat(evaluation.briefSha256 === state.briefSha256, 'Evaluation targets another task brief');
    requireThat(evaluation.snapshotDigest === target.digest && textValue(evaluation.acceptanceRationale), 'Evaluation is stale or lacks rationale');
    requireThat(evaluation.budget && Number.isInteger(evaluation.budget.agentSessions) && evaluation.budget.agentSessions >= 0 && Number.isInteger(evaluation.budget.repairCycles) && evaluation.budget.repairCycles >= 0, 'Record actual agent sessions and repair cycles');
    requireThat(evaluation.budget.agentSessions >= recordedSessions.size, 'Session count omits recorded participants');
    requireThat(evaluation.budget.actualCostUsd === null || (Number.isFinite(evaluation.budget.actualCostUsd) && evaluation.budget.actualCostUsd >= 0), 'Cost must be measured or null');
    requireThat(textValue(evaluation.budget.costSource), 'Record the cost source or why it is unavailable');
    requireThat(['passed', 'failed', 'pending', 'not-configured'].includes(evaluation.releaseGate?.status) && textValue(evaluation.releaseGate.evidence), 'Describe the external release gate separately');
    inspectFindings(evaluation, issues);
  });
  requireThat(snapshot(repo, brief.additionalPaths).digest === target.digest, 'Repository changed during assessment');
  const outcome = issues.rethink.length ? 'RETHINK' : issues.fix.length ? 'FIX' : issues.incomplete.length ? 'INCOMPLETE' : 'ACCEPT';
  return { schemaVersion: VERSION, outcome, workMode: inspectionOnly ? 'review' : 'implementation', snapshotDigest: target.digest, briefSha256: state.briefSha256,
    scope: 'local-candidate', releaseAuthorized: false, evidenceTrust: 'local files; reviews and routing are self-reported', issues };
}
function parse(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    requireThat(args[i].startsWith('--') && args[i + 1] !== undefined && !args[i + 1].startsWith('--'), 'Expected --option value pairs');
    requireThat(!Object.hasOwn(options, args[i].slice(2)), 'Duplicate option');
    options[args[i].slice(2)] = args[i + 1];
  }
  return options;
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help') {
    console.log('Node 22+ and Git required.\ninit --repo PATH --run OUTSIDE_REPO --brief JSON\nsnapshot --repo PATH [--run PATH]\nrun --run PATH --check ID\nassess --run PATH [--expected-brief-sha256 HASH]\nNo model calls, shell interpolation, installation, or deployment are performed.'); return;
  }
  const options = parse(args);
  const allowed = { init: ['repo', 'run', 'brief'], snapshot: ['repo', 'run'], run: ['run', 'check'], assess: ['run', 'expected-brief-sha256'] };
  requireThat(allowed[command] && Object.keys(options).every(k => allowed[command].includes(k)), 'Unknown command or option');
  let result;
  if (command === 'init') {
    const repo = repoRoot(options.repo), run = newRunPath(options.run), brief = readJson(options.brief);
    validateBrief(brief);
    requireThat(!within(repo, run), 'Run directory must be outside the repository');
    requireThat(!fs.existsSync(run), 'Use a new run directory; existing evidence is never overwritten by init');
    noLinks(path.parse(run).root, run, true);
    const initial = snapshot(repo, brief.additionalPaths);
    fs.mkdirSync(run, { recursive: true, mode: 0o700 });
    writeJson(path.join(run, 'brief.json'), brief);
    const state = { schemaVersion: VERSION, repo, createdAt: new Date().toISOString(), briefSha256: hash(canonical(brief)), initialSnapshotDigest: initial.digest };
    writeJson(path.join(run, 'state.json'), state);
    writeJson(path.join(run, 'initial-snapshot.json'), initial);
    result = { run, ...state };
  } else if (command === 'snapshot') {
    const context = options.run ? loadRun(options.run) : null;
    const repo = repoRoot(options.repo || context?.repo);
    requireThat(!context || context.repo === repo, 'Snapshot repo differs from the run repository');
    const current = snapshot(repo, context?.brief.additionalPaths || []);
    const manifest = context ? path.join(context.run, 'current-snapshot.json') : null;
    if (manifest) writeJson(manifest, current);
    // New: keep large file inventories out of the lead model's context by default.
    result = { schemaVersion: VERSION, digest: current.digest, head: current.head, fileCount: current.files.length, manifest };
  } else if (command === 'run') {
    result = await runCheck(loadRun(options.run), options.check);
    process.exitCode = result.status === 'passed' ? 0 : 2;
  } else {
    result = assess(loadRun(options.run), options['expected-brief-sha256']);
    process.exitCode = result.outcome === 'ACCEPT' ? 0 : 2;
  }
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  console.log(JSON.stringify({ outcome: 'INCOMPLETE', releaseAuthorized: false, error: error.message }, null, 2));
  process.exitCode = 2;
});
