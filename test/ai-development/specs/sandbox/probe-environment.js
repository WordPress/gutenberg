/**
 * Sets the probe variable before anything reads the environment.
 *
 * `lib/environment.js` takes its snapshot when it is first imported, and ESM
 * evaluates imports before a module's own body — so a variable set in the spec
 * body would be set too late to be blanked, and the check would fail for the
 * wrong reason. Importing this first puts it in place beforehand.
 */
export const ENVIRONMENT_MARKER = 'sandbox-probe-environment-marker';

process.env.EVAL_SANDBOX_PROBE = ENVIRONMENT_MARKER;
