/**
 * The confinement both agents run under.
 *
 * Two layers, because neither one covers the other's ground. Promptfoo passes
 * both straight through to the Claude Agent SDK without interpreting them, so
 * what is written here is exactly what the agent runs under.
 *
 * `sandbox` is enforced by the operating system, and covers Bash and every
 * process it starts — but only those. Writes need no rules: a sandboxed command
 * can write to the working directory and the session temp directory and nowhere
 * else, and the working directory is the workspace. Reads are the other way
 * round, allowed everywhere by default, so they are confined by denying the
 * checkout and the home directory. `allowRead` re-opens the workspace inside
 * any denied region it happens to fall in; for sandbox paths the narrower rule
 * wins.
 *
 * `permissions` covers the tools the sandbox does not: `Edit`, `Write`, and the
 * file-reading commands Claude Code recognises in Bash. These rules run the
 * opposite way round — deny is resolved before allow and specificity is
 * ignored, so a deny rule cannot carry an exception. That is why the workspace
 * lives outside every path denied here; see `paths.js`.
 *
 * A `Read` deny rule also blocks `Edit` and `Write` on the same path, so one
 * rule per directory covers both. Path rules written against `Write` itself are
 * accepted and never consulted, so they are not used.
 *
 * Neither layer bounds the environment the agent inherits; `environment.js`
 * does that.
 *
 * @see https://code.claude.com/docs/en/sandboxing
 * @see https://code.claude.com/docs/en/permissions
 */
import { homeDirectory, sourceRoot, workspace } from './paths.js';

/** Sandbox paths are plain absolute paths. */
export const sandbox = {
	enabled: true,
	autoAllowBashIfSandboxed: true,
	// No command may opt out of the sandbox. With this set, Claude cannot offer
	// to retry a blocked command outside it either.
	allowUnsandboxedCommands: false,
	// The agent has no reason to reach the network, and cannot look up the
	// answer without it. `failIfUnavailable` is left at its default, which is
	// true when the sandbox is enabled: a machine that cannot sandbox should
	// fail the run rather than quietly not sandbox it.
	network: { allowedDomains: [] },
	filesystem: {
		denyRead: [ homeDirectory, sourceRoot ],
		allowRead: [ workspace ],
	},
};

/** Permission rules need `//` for an absolute path; a single slash is relative. */
export const permissions = {
	deny: [
		`Read(//${ homeDirectory }/**)`,
		`Read(//${ sourceRoot }/**)`,
		`Edit(//${ homeDirectory }/**)`,
		`Edit(//${ sourceRoot }/**)`,
	],
};
