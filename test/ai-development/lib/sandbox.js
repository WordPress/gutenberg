/**
 * The tested agent's working environment.
 *
 * Promptfoo does not have its own sandbox environment - it passes these
 * options through to the Claude Agent SDK without interpreting them. For what
 * bounds the environment the agent inherits, see `environment.js`.
 *
 * @see https://code.claude.com/docs/en/sandboxing
 * @see https://code.claude.com/docs/en/permissions
 */
import path from 'node:path';
import {
	homeDirectory,
	sourceRoot,
	temporaryDirectory,
	workspace,
} from './paths.js';

/**
 * Enforced by the operating system, and covers Bash and every process it
 * starts.
 */
export const sandbox = {
	enabled: true,
	autoAllowBashIfSandboxed: true,
	// No command may opt out of the sandbox. With this set, Claude cannot offer
	// to retry a blocked command outside it either.
	allowUnsandboxedCommands: false,
	// Prevent the agent from reaching the internet. `strictAllowlist` makes an
	// empty list a deterministic denial; without it, a host outside the list
	// prompts instead, and a headless run resolves that prompt as an allow.
	network: { allowedDomains: [], strictAllowlist: true },
	credentials: {
		// Promptfoo captures this key before applying `config.env`, then adds it
		// back to the SDK child. Deny it at the Bash sandbox boundary as well.
		envVars: [ { name: 'ANTHROPIC_API_KEY', mode: 'deny' } ],
	},
	// Writes need no rules. A sandboxed command can write to the working
	// directory and the session temp directory and nowhere else, and the
	// working directory is the workspace.
	filesystem: {
		// Reads are allowed everywhere by default, so they are confined by
		// denying: the home directory, the checkout, and the temp directory
		// around the workspace, which `allowRead` then re-opens because for
		// sandbox paths the narrower rule wins. Denying `/` instead does not
		// work: it takes the system libraries with it, and a profile no
		// command can run under does not survive to enforce anything.
		denyRead: [ homeDirectory, sourceRoot, temporaryDirectory ],
		allowRead: [ workspace ],
	},
};

/**
 * An absolute host directory as a permission rule denying a tool inside it.
 *
 * Rule patterns need `//` to mean the filesystem root — a single slash anchors
 * at the settings source instead — and Claude Code matches them in POSIX form:
 * on Windows `C:\Users\alice` matches as `/c/Users/alice`, with the drive
 * letter lowercased and every separator a forward slash. Composing the rule
 * from the OS path directly would produce a pattern that matches nothing
 * there.
 *
 * @see https://code.claude.com/docs/en/permissions
 *
 * @param {string} tool      Tool the rule denies, `Read` or `Edit`.
 * @param {string} directory Absolute path the rule covers.
 * @return {string} The rule.
 */
export function pathRule( tool, directory ) {
	const posixDirectory = directory
		.replaceAll( '\\', '/' )
		.replace( /^([A-Za-z]):/, ( _, drive ) => `/${ drive.toLowerCase() }` )
		.replace( /^\//, '' );
	return `${ tool }(//${ posixDirectory }/**)`;
}

/**
 * Builds deny rules without enclosing the agent's own working directory.
 *
 * The system temporary directory normally sits inside the home directory on
 * Windows. Permission denies take precedence over allows, so denying that home
 * directory would also deny the workspace inside it.
 *
 * @param {string[]} directories      Host directories the agent must not read.
 * @param {string}   workingDirectory The agent's working directory.
 * @param {Object}   pathApi          Platform path implementation.
 * @return {string[]} Permission rules for directories outside the workspace.
 */
export function permissionRules(
	directories,
	workingDirectory,
	pathApi = path
) {
	const outsideWorkspace = directories.filter( ( directory ) => {
		const relative = pathApi.relative( directory, workingDirectory );
		return (
			relative === '..' ||
			relative.startsWith( `..${ pathApi.sep }` ) ||
			pathApi.isAbsolute( relative )
		);
	} );

	return [
		...outsideWorkspace.map( ( directory ) =>
			pathRule( 'Read', directory )
		),
		...outsideWorkspace.map( ( directory ) =>
			pathRule( 'Edit', directory )
		),
	];
}

/**
 * Covers the tools the sandbox does not: `Edit`, `Write`, and the file-reading
 * commands Claude Code recognises in Bash.
 */
export const permissions = {
	// Deny is resolved before allow and specificity is ignored, so a deny rule
	// cannot carry an exception. Omit any region that contains the workspace;
	// the SDK's working-directory boundary still refuses paths outside it.
	//
	// A `Read` deny also blocks `Edit` and `Write` on the same path, but only on
	// recent Claude Code, so the `Edit` rules are not redundant. Rules written
	// against `Write` itself are accepted and never consulted.
	deny: permissionRules( [ homeDirectory, sourceRoot ], workspace ),
};
