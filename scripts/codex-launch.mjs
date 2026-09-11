#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROUTES } from './routes.mjs';

const MAX_PROMPT_BYTES = 1024 * 1024;
const MAX_CAPTURED_LOG_BYTES = 16 * 1024 * 1024;
const DEFAULT_TIMEOUT_SECONDS = 1800;
const WORKER_ROUTES = Object.freeze(['luna-max', 'terra-xhigh', 'terra-max', 'astra-medium', 'astra-high', 'sol-medium']);
const WORKER_SANDBOXES = new Set(['read-only', 'workspace-write']);
const WARNING = 'This wrapper is not credential, network, or process isolation. Repository instructions, user configuration, rules, and enabled connectors still load. Use a restricted runtime and examine the effective Codex configuration before reviewing untrusted code.';

function fail(message) {
  throw new Error(message);
}

function help() {
  console.log([
    'Usage:',
    '  node codex-launch.mjs lead --repo PATH [--route lead|lead-high] [--codex EXECUTABLE] [--dry-run]',
    '  node codex-launch.mjs review --repo PATH --prompt FILE --output NEW_DIRECTORY [--kind security|correctness] [--route correctness-routine|correctness|security] [--codex EXECUTABLE] [--dry-run] [--timeout-seconds 1..7200]',
    `  node codex-launch.mjs worker --repo PATH --prompt FILE --output NEW_DIRECTORY --route ${WORKER_ROUTES.join('|')} [--sandbox read-only|workspace-write] [--codex EXECUTABLE] [--dry-run] [--timeout-seconds 1..7200]`,
    '',
    'lead defaults to Astra high; --route lead-high also selects Astra high. Both use workspace-write, on-request approvals, and at most two agent threads.',
    'review starts a brand-new independent codex exec process; it never resumes or forks a prior session.',
    'correctness defaults to Astra medium; correctness-routine selects Sol medium. Security review requires the security route (Astra high).',
    'worker starts a brand-new independent codex exec process with the requested worker route; it defaults to read-only, never resumes or forks, and keeps approvals disabled.',
    'A zero child exit code means transport completed. It is not an ACCEPT decision or release authorization; evaluate final.txt yourself.',
    '',
    `Warning: ${WARNING}`,
  ].join('\n'));
}

function parse(command, args) {
  const allowed = command === 'lead'
    ? new Set(['--repo', '--route', '--codex', '--dry-run'])
    : command === 'review'
      ? new Set(['--repo', '--prompt', '--output', '--kind', '--route', '--codex', '--dry-run', '--timeout-seconds'])
      : new Set(['--repo', '--prompt', '--output', '--route', '--sandbox', '--codex', '--dry-run', '--timeout-seconds']);
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!allowed.has(argument)) fail(`Unknown option for ${command}: ${argument}`);
    if (Object.hasOwn(values, argument)) fail(`Repeated option: ${argument}`);
    if (argument === '--dry-run') {
      values[argument] = true;
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) fail(`Expected a value after ${argument}`);
    values[argument] = value;
    index += 1;
  }
  if (!values['--repo']) fail('--repo is required');
  if ((command === 'review' || command === 'worker') && !values['--prompt']) fail('--prompt is required');
  if ((command === 'review' || command === 'worker') && !values['--output']) fail('--output is required');
  if (command === 'worker' && !values['--route']) fail('--route is required');
  return values;
}

function existingDirectory(value, label) {
  const absolute = path.resolve(value);
  let stat;
  try { stat = fs.statSync(absolute); } catch (error) { fail(`${label} is unavailable: ${error.message}`); }
  if (!stat.isDirectory()) fail(`${label} must be an existing directory`);
  return fs.realpathSync(absolute);
}

function assertNoSymlinkAncestors(target, label) {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  let cursor = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    try {
      if (fs.lstatSync(cursor).isSymbolicLink()) fail(`Refusing symlink in ${label} path: ${cursor}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function executable(value) {
  const result = value ?? 'codex';
  if (!result || result.includes('\0')) fail('Codex executable must be a non-empty executable name or path');
  if (process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(result)) {
    fail('Refusing .cmd or .bat executables; provide the actual Codex executable for shell-free launch');
  }
  return result;
}

function route(name) {
  const selected = ROUTES[name];
  if (!selected || typeof selected.model !== 'string' || typeof selected.effort !== 'string') {
    fail(`Required Codex route is unavailable: ${name}`);
  }
  return selected;
}

function workerRoute(name) {
  if (!WORKER_ROUTES.includes(name)) fail(`--route must be one of ${WORKER_ROUTES.join(', ')}`);
  return route(name);
}

function workerSandbox(value) {
  const selected = value ?? 'read-only';
  if (!WORKER_SANDBOXES.has(selected)) fail('--sandbox must be read-only or workspace-write');
  return selected;
}

function configValue(key, value) {
  return `${key}=${JSON.stringify(value)}`;
}

function leadInvocation(options) {
  const routeName = options['--route'] ?? 'lead';
  if (!['lead', 'lead-high'].includes(routeName)) fail('--route must be lead or lead-high for a lead session');
  const selected = route(routeName);
  const cwd = existingDirectory(options['--repo'], 'Repository');
  const program = executable(options['--codex']);
  const argv = [
    '--model', selected.model,
    '--sandbox', 'workspace-write',
    '-c', configValue('model_reasoning_effort', selected.effort),
    '-c', configValue('approval_policy', 'on-request'),
    '-c', 'agents.max_concurrent_threads_per_session=2',
  ];
  return { cwd, route: routeName, executable: program, argv, requestedModel: selected.model, requestedEffort: selected.effort };
}

function independentInvocation(options, command) {
  const isReview = command === 'review';
  const kind = isReview ? options['--kind'] ?? 'correctness' : undefined;
  if (isReview && kind !== 'security' && kind !== 'correctness') fail('--kind must be security or correctness');
  const routeName = options['--route'] ?? kind;
  if (isReview) {
    const allowedRoutes = kind === 'security' ? ['security'] : ['correctness-routine', 'correctness', 'security'];
    if (!allowedRoutes.includes(routeName)) fail(`--route for ${kind} review must be one of ${allowedRoutes.join(', ')}`);
  }
  const selected = isReview ? route(routeName) : workerRoute(routeName);
  const sandbox = isReview ? 'read-only' : workerSandbox(options['--sandbox']);
  const label = isReview ? 'Review' : 'Worker';
  const cwd = existingDirectory(options['--repo'], 'Repository');

  const prompt = path.resolve(options['--prompt']);
  assertNoSymlinkAncestors(prompt, 'prompt');
  let promptStat;
  try { promptStat = fs.lstatSync(prompt); } catch (error) { fail(`Prompt file is unavailable: ${error.message}`); }
  if (promptStat.isSymbolicLink() || !promptStat.isFile()) fail('Prompt must be a regular file, not a symlink or special file');
  if (promptStat.size > MAX_PROMPT_BYTES) fail(`Prompt exceeds the ${MAX_PROMPT_BYTES}-byte limit`);

  const output = path.resolve(options['--output']);
  assertNoSymlinkAncestors(output, 'output');
  if (isWithin(cwd, output)) fail(`${label} output must be outside the repository`);
  if (fs.existsSync(output)) fail(`${label} output directory must not already exist`);
  const outputParent = path.dirname(output);
  let parentStat;
  try { parentStat = fs.statSync(outputParent); } catch (error) { fail(`${label} output parent is unavailable: ${error.message}`); }
  if (!parentStat.isDirectory()) fail(`${label} output parent must be an existing directory`);

  const rawTimeout = options['--timeout-seconds'] ?? String(DEFAULT_TIMEOUT_SECONDS);
  if (!/^[0-9]+$/.test(rawTimeout)) fail('--timeout-seconds must be an integer from 1 through 7200');
  const timeoutSeconds = Number(rawTimeout);
  if (timeoutSeconds < 1 || timeoutSeconds > 7200) fail('--timeout-seconds must be an integer from 1 through 7200');

  const program = executable(options['--codex']);
  const paths = {
    output,
    prompt: path.join(output, 'prompt.txt'),
    invocation: path.join(output, 'invocation.json'),
    events: path.join(output, 'events.jsonl'),
    stderr: path.join(output, 'stderr.log'),
    final: path.join(output, 'final.txt'),
    completion: path.join(output, 'completion.json'),
  };
  const argv = [
    'exec',
    '--model', selected.model,
    '--sandbox', sandbox,
    '-c', configValue('model_reasoning_effort', selected.effort),
    '-c', configValue('approval_policy', 'never'),
    '-c', 'agents.enabled=false',
    '--json', '-', '-o', paths.final,
  ];
  return {
    command,
    kind,
    route: routeName,
    sandbox,
    cwd,
    executable: program,
    argv,
    paths,
    promptSource: prompt,
    timeoutSeconds,
    requestedModel: selected.model,
    requestedEffort: selected.effort,
  };
}

function writePrivate(file, data) {
  fs.writeFileSync(file, data, { mode: 0o600, flag: 'wx' });
}

function readPromptPacket(file) {
  assertNoSymlinkAncestors(file, 'prompt');
  const noFollow = fs.constants.O_NOFOLLOW ?? 0;
  const descriptor = fs.openSync(file, fs.constants.O_RDONLY | noFollow);
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile()) fail('Prompt must remain a regular file while it is read');
    if (stat.size > MAX_PROMPT_BYTES) fail(`Prompt exceeds the ${MAX_PROMPT_BYTES}-byte limit`);
    const packet = fs.readFileSync(descriptor);
    if (packet.length > MAX_PROMPT_BYTES) fail(`Prompt exceeds the ${MAX_PROMPT_BYTES}-byte limit`);
    return packet;
  } finally {
    fs.closeSync(descriptor);
  }
}

function terminateProcessTree(child, force = false) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      shell: false,
      windowsHide: true,
      stdio: 'ignore',
      timeout: 5000,
    });
    return;
  }
  try { process.kill(-child.pid, force ? 'SIGKILL' : 'SIGTERM'); } catch { /* The process group may already be gone. */ }
}

async function runLead(invocation) {
  return await new Promise((resolve, reject) => {
    let interruptedBy = null;
    let forceTimer;
    const child = spawn(invocation.executable, invocation.argv, {
      cwd: invocation.cwd,
      // An interactive process must remain in the terminal's foreground session.
      detached: false,
      shell: false,
      stdio: 'inherit',
      windowsHide: false,
    });
    const interrupt = (signal) => {
      interruptedBy ??= signal;
      try { child.kill(signal); } catch { /* The interactive child may already be gone. */ }
      if (!forceTimer) {
        forceTimer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 750);
        forceTimer.unref();
      }
    };
    const onSigint = () => interrupt('SIGINT');
    const onSigterm = () => interrupt('SIGTERM');
    process.once('SIGINT', onSigint);
    process.once('SIGTERM', onSigterm);
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (forceTimer) clearTimeout(forceTimer);
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTERM', onSigterm);
      if (code === 0 && !interruptedBy) resolve();
      else if (interruptedBy) reject(new Error(`Codex lead process was interrupted by ${interruptedBy}`));
      else reject(new Error(`Codex lead process failed${code === null ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

function reasonFor(result) {
  if (result.spawnError) return 'spawn-error';
  if (result.interruptedBy) return 'interrupted';
  if (result.timedOut) return 'timeout';
  if (result.logWriteError) return 'log-write-failed';
  if (result.outputLimitExceeded) return 'output-limit';
  if (result.childExitCode !== 0) return 'child-failure';
  if (!result.finalPresent) return 'missing-final';
  return 'completed-transport';
}

async function runIndependent(invocation) {
  // Read one bounded, regular-file packet before creating any evidence artifacts.
  const prompt = readPromptPacket(invocation.promptSource);
  fs.mkdirSync(invocation.paths.output, { mode: 0o700 });
  fs.chmodSync(invocation.paths.output, 0o700);
  writePrivate(invocation.paths.prompt, prompt);
  const invocationRecord = {
    schemaVersion: 1,
    command: invocation.command,
    kind: invocation.kind,
    route: invocation.route,
    sandbox: invocation.sandbox,
    executable: invocation.executable,
    argv: invocation.argv,
    cwd: invocation.cwd,
    promptSource: invocation.promptSource,
    requestedModel: invocation.requestedModel,
    requestedEffort: invocation.requestedEffort,
    observedModel: null,
    observedEffort: null,
    timeoutSeconds: invocation.timeoutSeconds,
    maxCapturedLogBytes: MAX_CAPTURED_LOG_BYTES,
    startedAt: new Date().toISOString(),
    warning: WARNING,
  };
  writePrivate(invocation.paths.invocation, `${JSON.stringify(invocationRecord, null, 2)}\n`);
  const eventsDescriptor = fs.openSync(invocation.paths.events, 'wx', 0o600);
  let stderrDescriptor;
  try {
    stderrDescriptor = fs.openSync(invocation.paths.stderr, 'wx', 0o600);
  } catch (error) {
    fs.closeSync(eventsDescriptor);
    throw error;
  }

  const result = await new Promise((resolve) => {
    let capturedBytes = 0;
    let outputLimitExceeded = false;
    let timedOut = false;
    let spawnError = null;
    let logWriteError = null;
    let interruptedBy = null;
    let settled = false;

    const child = spawn(invocation.executable, invocation.argv, {
      cwd: invocation.cwd,
      detached: process.platform !== 'win32',
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    function stop() {
      terminateProcessTree(child, true);
    }

    function capture(descriptor, chunk) {
      if (outputLimitExceeded || logWriteError) return;
      const available = MAX_CAPTURED_LOG_BYTES - capturedBytes;
      const data = chunk.subarray(0, Math.max(0, available));
      try {
        let offset = 0;
        while (offset < data.length) {
          const written = fs.writeSync(descriptor, data, offset, data.length - offset);
          if (written <= 0) throw new Error('Log write made no progress');
          offset += written;
          capturedBytes += written;
        }
      } catch (error) {
        logWriteError = error instanceof Error ? error.message : String(error);
        stop();
        return;
      }
      if (data.length < chunk.length) {
        outputLimitExceeded = true;
        stop();
      }
    }

    child.stdout.on('data', (chunk) => capture(eventsDescriptor, chunk));
    child.stderr.on('data', (chunk) => capture(stderrDescriptor, chunk));
    child.stdin.on('error', () => { /* A child may exit before consuming the prompt. */ });
    child.stdin.end(prompt);

    const timeout = setTimeout(() => {
      timedOut = true;
      stop();
    }, invocation.timeoutSeconds * 1000);
    timeout.unref();

    const onSigint = () => { interruptedBy ??= 'SIGINT'; stop(); };
    const onSigterm = () => { interruptedBy ??= 'SIGTERM'; stop(); };
    process.once('SIGINT', onSigint);
    process.once('SIGTERM', onSigterm);
    child.once('error', (error) => { spawnError = error.message; stop(); });
    // `close` can be held open by a descendant that inherited stdout/stderr.
    // Kill the independent process group as soon as its leader exits.
    child.once('exit', () => stop());
    child.once('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      process.removeListener('SIGINT', onSigint);
      process.removeListener('SIGTERM', onSigterm);
      stop();
      for (const descriptor of [eventsDescriptor, stderrDescriptor]) {
        try { fs.closeSync(descriptor); }
        catch (error) { logWriteError ??= error instanceof Error ? error.message : String(error); }
      }
      resolve({ childExitCode: code, childSignal: signal, capturedBytes, outputLimitExceeded, timedOut, spawnError, logWriteError, interruptedBy });
    });
  });

  let finalPresent = false;
  try {
    const finalStat = fs.lstatSync(invocation.paths.final);
    finalPresent = finalStat.isFile() && !finalStat.isSymbolicLink() && finalStat.size > 0;
    if (finalPresent) fs.chmodSync(invocation.paths.final, 0o600);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const completed = result.childExitCode === 0
    && !result.spawnError
    && !result.timedOut
    && !result.interruptedBy
    && !result.logWriteError
    && !result.outputLimitExceeded
    && finalPresent;
  const completion = {
    schemaVersion: 1,
    command: invocation.command,
    kind: invocation.kind,
    route: invocation.route,
    sandbox: invocation.sandbox,
    transportCompleted: completed,
    reason: reasonFor({ ...result, finalPresent }),
    childExitCode: result.childExitCode,
    childSignal: result.childSignal,
    spawnError: result.spawnError,
    logWriteError: result.logWriteError,
    interruptedBy: result.interruptedBy,
    timedOut: result.timedOut,
    outputLimitExceeded: result.outputLimitExceeded,
    capturedLogBytes: result.capturedBytes,
    capturedLogsComplete: !result.outputLimitExceeded && !result.logWriteError,
    finalPresent,
    requestedModel: invocation.requestedModel,
    requestedEffort: invocation.requestedEffort,
    observedModel: null,
    observedEffort: null,
    authorization: null,
    requiresEvaluation: true,
    completedAt: new Date().toISOString(),
    warning: WARNING,
  };
  writePrivate(invocation.paths.completion, `${JSON.stringify(completion, null, 2)}\n`);
  console.log(JSON.stringify({ output: invocation.paths.output, completion }, null, 2));
  if (!completed) {
    const task = invocation.command === 'review' ? 'Independent review' : `Worker route ${invocation.route}`;
    fail(`${task} did not complete: ${completion.reason}. See ${invocation.paths.completion}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === '--help' || args[0] === 'help') {
    help();
    return;
  }
  const command = args[0];
  if (command !== 'lead' && command !== 'review' && command !== 'worker') fail(`Unknown command: ${command}`);
  const options = parse(command, args.slice(1));
  const invocation = command === 'lead' ? leadInvocation(options) : independentInvocation(options, command);
  if (options['--dry-run']) {
    console.log(JSON.stringify({
      dryRun: true,
      command,
      kind: invocation.kind,
      route: invocation.route,
      sandbox: invocation.sandbox,
      cwd: invocation.cwd,
      executable: invocation.executable,
      argv: invocation.argv,
      paths: invocation.paths,
      requestedModel: invocation.requestedModel,
      requestedEffort: invocation.requestedEffort,
      warning: WARNING,
    }, null, 2));
    return;
  }
  if (command === 'lead') await runLead(invocation);
  else await runIndependent(invocation);
}

const originalUmask = process.umask(0o077);
try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  process.umask(originalUmask);
}
