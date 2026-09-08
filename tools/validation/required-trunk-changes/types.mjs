/**
 * Shared JSDoc typedefs for the required trunk changes tooling.
 */

/** @typedef {{ state: 'success' | 'failure', description: string }} StatusPayload */
/** @typedef {{ state: string, description: string | null }} ContextStatus */

/**
 * @typedef PullRequest
 * @property {number}               number     PR number.
 * @property {string}               headRefOid Head commit SHA.
 * @property {boolean}              isDraft    Whether the PR is a draft.
 * @property {ContextStatus | null} status     Latest required changes status, if any.
 */

/**
 * @typedef CommandOptions
 * @property {string | undefined} headSha    Head SHA for `check`.
 * @property {string}             force      'true' forces a baseline move.
 * @property {boolean}            thenFanout Fan out after a move.
 * @property {boolean}            dryRun     Log writes without posting.
 */

export {};
