// User-requested routing policy. Configured intent is distinct from observation.
export const ROUTES = Object.freeze(Object.fromEntries(Object.entries({
  lead: { model: 'gpt-6-astra', effort: 'high' },
  'lead-high': { model: 'gpt-6-astra', effort: 'high' },
  security: { model: 'gpt-6-astra', effort: 'high' },
  correctness: { model: 'gpt-6-astra', effort: 'medium' },
  'correctness-routine': { model: 'gpt-5.6-sol', effort: 'medium' },
  'astra-medium': { model: 'gpt-6-astra', effort: 'medium' },
  'astra-high': { model: 'gpt-6-astra', effort: 'high' },
  'sol-medium': { model: 'gpt-5.6-sol', effort: 'medium' },
  'terra-xhigh': { model: 'gpt-5.6-terra', effort: 'xhigh' },
  'terra-max': { model: 'gpt-5.6-terra', effort: 'max' },
  'luna-max': { model: 'gpt-5.6-luna', effort: 'max' }
}).map(([key, value]) => [key, Object.freeze(value)])));

const allowedWork = {
  trivial: ['terra-xhigh', 'terra-max', 'lead', 'lead-high'],
  tests: ['terra-xhigh', 'terra-max', 'lead', 'lead-high'],
  routine: ['sol-medium', 'astra-medium', 'astra-high', 'lead', 'lead-high'],
  challenging: ['astra-medium', 'astra-high', 'lead-high'],
  sensitive: ['astra-high', 'lead-high'],
  'test-supervision': ['luna-max'],
  design: ['astra-high']
};
const requireThat = (value, message) => { if (!value) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;

export function validateCodexRouting(person, purpose, risk = 'substantial') {
  requireThat(person && Object.hasOwn(ROUTES, person.route), 'Record a recognized Codex route');
  const route = ROUTES[person.route];
  requireThat(text(person.observation), 'Record the runtime evidence source or its absence');
  requireThat(person.requestedModel === route.model && person.effort === route.effort, 'Requested model/effort differs from the named route');
  requireThat(person.observedModel === route.model && person.observedEffort === route.effort, 'Actual model/effort is unobserved or differs from required routing');
  if (purpose === 'evaluator') requireThat(['lead', 'lead-high'].includes(person.route), 'The evaluator must use an Astra high lead route');
  else if (purpose === 'security') requireThat(person.route === 'security', 'Security review must use Astra high');
  else if (purpose === 'correctness') {
    requireThat(['routine', 'substantial', 'sensitive'].includes(risk), 'Correctness review risk must be routine, substantial, or sensitive');
    const allowed = risk === 'routine' ? ['correctness-routine', 'correctness', 'security'] : ['correctness', 'security'];
    requireThat(allowed.includes(person.route), 'Correctness review route is not allowed for the frozen risk');
  }
  else {
    requireThat(Object.hasOwn(allowedWork, person.workClass) && allowedWork[person.workClass].includes(person.route), 'Route is not allowed for the recorded work class');
    if (['test-supervision', 'design'].includes(person.workClass)) requireThat(purpose === 'worker', 'Test supervision and design require a non-author worker');
    if (['lead', 'lead-high'].includes(person.route)) {
      requireThat(purpose === 'builder', 'Direct lead implementation must be recorded as a builder, not a worker');
      requireThat(text(person.directImplementationRationale), 'An editing lead must record a direct implementation rationale');
    }
  }
}
