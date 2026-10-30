/**
 * What specs import to write assertions.
 *
 * `lib/` is the harness itself — the providers, the sandbox, the workspace.
 * This is the vocabulary a spec uses to say what it expects, kept apart the
 * way `test/e2e` keeps its fixtures from its configuration.
 */
export { assertRead, assertNotRead } from './reads.js';
