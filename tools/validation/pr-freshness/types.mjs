/**
 * Shared JSDoc typedefs for the PR freshness tooling.
 */

/** @typedef {{ state: 'success' | 'failure', description: string }} StatusPayload */
/** @typedef {{ state: string, description: string | null }} ContextStatus */

/**
 * @typedef PullRequest
 * @property {number}               number     PR number.
 * @property {string}               headRefOid Head commit SHA.
 * @property {boolean}              isDraft    Whether the PR is a draft.
 * @property {string}               mergeable  MERGEABLE, CONFLICTING, or UNKNOWN.
 * @property {string}               updatedAt  ISO timestamp of last activity.
 * @property {ContextStatus | null} status     Latest freshness status, if any.
 */

/**
 * @typedef CommandOptions
 * @property {string | undefined} headSha         Head SHA for `check`.
 * @property {string}             force           'true' forces a baseline move.
 * @property {boolean}            thenFanout      Fan out after a move.
 * @property {string | undefined} mode            Fan-out mode.
 * @property {boolean}            dryRun          Log writes without posting.
 * @property {number}             bootstrapWindow Bootstrap window in days.
 */

export {};
