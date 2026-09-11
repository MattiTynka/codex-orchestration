import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROUTES } from './routes.mjs';

const requireThat = (value, message) => { if (!value) throw new Error(message); };

export function observeRouting(rows, { sessionId, route, parentId }) {
  requireThat(typeof sessionId === 'string' && sessionId.length > 0, 'Expected session ID is required');
  requireThat(Object.hasOwn(ROUTES, route), 'Unknown route');
  requireThat(Array.isArray(rows), 'Expected JSONL records');
  const metas = rows.filter(row => row?.type === 'session_meta');
  requireThat(metas.length === 1 && metas[0].payload?.id === sessionId, 'Session identity missing or mismatched');
  const meta = metas[0].payload;
  const observedParent = meta.source?.subagent?.thread_spawn?.parent_thread_id ?? null;
  if (parentId !== undefined) requireThat(observedParent === parentId, 'Parent identity missing or mismatched');
  const expected = ROUTES[route];
  let contexts = 0;
  let usageEvents = 0;
  let observedModel = null;
  let observedEffort = null;
  for (const row of rows) {
    if (row?.type === 'turn_context') {
      observedModel = row.payload?.model ?? null;
      observedEffort = row.payload?.effort ?? null;
      requireThat(observedModel === expected.model, 'Observed model differs from requested route');
      requireThat(observedEffort === expected.effort, 'Observed effort differs from requested route');
      contexts += 1;
    }
    if (contexts > 0 && row?.type === 'event_msg' && row.payload?.type === 'token_count') {
      const info = row.payload.info;
      const totals = [info?.last_token_usage?.total_tokens, info?.total_token_usage?.total_tokens];
      if (totals.some(value => Number.isFinite(value) && value > 0)) usageEvents += 1;
    }
  }
  requireThat(contexts > 0, 'Runtime model/effort context is missing');
  requireThat(usageEvents > 0, 'Positive usage after a runtime context is missing');
  return { verified: true, sessionId, parentId: observedParent, cliVersion: meta.cli_version ?? null,
    route, observedModel, observedEffort, contexts, usageEvents,
    evidenceKind: 'local-session-metadata-and-usage', providerAttestation: false };
}

function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    requireThat(['--rollout', '--session', '--route', '--parent'].includes(key), 'Unknown option');
    requireThat(!Object.hasOwn(options, key) && typeof args[i + 1] === 'string' && !args[i + 1].startsWith('--'), 'Missing or duplicate option');
    options[key] = args[i + 1];
  }
  requireThat(options['--rollout'], 'Expected --rollout FILE --session ID --route ROUTE [--parent ID]');
  const file = path.resolve(options['--rollout']);
  requireThat(fs.statSync(file).isFile(), 'Rollout must be a regular file');
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid JSONL record ${index + 1}; retry after the session flushes`); }
  });
  const report = observeRouting(rows, { sessionId: options['--session'], route: options['--route'], parentId: options['--parent'] });
  process.stdout.write(`${JSON.stringify({ ...report, observation: file }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`INCOMPLETE: ${error.message}\n`); process.exitCode = 1; }
}
