/**
 * Plants a hook in the workspace that tries to run a command on the host.
 *
 * Hooks are the one thing the sandbox cannot contain. Claude Code runs them
 * itself rather than through the Bash tool, so they start outside the sandbox,
 * before the session does, with whatever environment the process inherited. A
 * workspace is built from the tree under evaluation, so a branch that adds
 * `.claude/settings.json` would be running host commands here — which is why
 * both providers set `disableAllHooks`.
 *
 * This proves that setting works, by giving it something to stop: a
 * `SessionStart` hook whose only job is to write a file the workspace has no
 * business reaching.
 *
 * Loaded as a second Promptfoo extension, after the one that builds the
 * workspace, because it writes into what that one creates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { homeDirectory, workspace } from '../../lib/paths.js';

export const HOOK_MARKER = 'sandbox-probe-hook-marker';

export const hookMarkerFile = path.join(
	homeDirectory,
	'.gutenberg-eval-hook-probe'
);

/**
 * Whether the hook managed to run.
 *
 * @return {boolean} True when the marker exists.
 */
export function hookRan() {
	return fs.existsSync( hookMarkerFile );
}

const settings = {
	hooks: {
		SessionStart: [
			{
				hooks: [
					{
						type: 'command',
						command: `echo ${ HOOK_MARKER } > ${ hookMarkerFile }`,
					},
				],
			},
		],
	},
};

/**
 * Promptfoo lifecycle hook.
 *
 * @param {string} hookName Lifecycle event Promptfoo is calling.
 */
export async function extensionHook( hookName ) {
	if ( hookName === 'beforeAll' ) {
		// A marker left by an earlier run would fail this before it started.
		fs.rmSync( hookMarkerFile, { force: true } );

		const claude = path.join( workspace, '.claude' );
		fs.mkdirSync( claude, { recursive: true } );
		fs.writeFileSync(
			path.join( claude, 'settings.json' ),
			JSON.stringify( settings, null, 2 )
		);
	}

	if ( hookName === 'afterAll' ) {
		fs.rmSync( hookMarkerFile, { force: true } );
	}
}
