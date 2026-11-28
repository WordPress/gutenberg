import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';

const WATCHDOG_PATH = fileURLToPath(
	new URL( './watchdog.mjs', import.meta.url )
);

/**
 * Start a long-running watch process.
 *
 * Outside Windows, the watcher runs in its own process group so that
 * `stopWatchProcess` can stop it with its descendants. A watchdog stops that
 * group if this process dies without running its cleanup.
 *
 * @param {string}   command Command to execute.
 * @param {string[]} args    Command arguments.
 * @param {Object}   options Spawn options.
 * @return {Object} Child process.
 */
export function spawnWatchProcess( command, args = [], options = {} ) {
	const detached = process.platform !== 'win32';
	const child = spawn( command, args, { ...options, detached } );

	if ( detached && child.pid ) {
		// The watchdog has its own process group, so it outlives a signal
		// sent to this process's group, and is unreferenced, so it never
		// keeps this process alive.
		spawn( process.execPath, [ WATCHDOG_PATH, String( child.pid ) ], {
			detached: true,
			stdio: 'ignore',
		} ).unref();
	}

	return child;
}

/**
 * Stop a long-running watch process.
 *
 * @param {Object|null} child Child process.
 */
export function stopWatchProcess( child ) {
	if (
		! child?.pid ||
		child.exitCode !== null ||
		child.signalCode !== null
	) {
		return;
	}

	if ( process.platform === 'win32' ) {
		try {
			execFileSync(
				'taskkill',
				[ '/pid', String( child.pid ), '/T', '/F' ],
				{ stdio: 'ignore' }
			);
		} catch ( error ) {
			// The tree is usually gone already, since Ctrl+C reaches the
			// whole console: `taskkill` reports that with exit code 128.
			// Cleanup runs from a signal handler, so never throw.
			if ( error.status !== 128 ) {
				console.warn(
					`Could not stop the watch process tree (pid ${ child.pid }): ${ error.message }`
				);
			}
		}

		return;
	}

	try {
		// A command launcher can leave its native watcher running, so stop
		// the detached process group instead of only the direct child.
		process.kill( -child.pid, 'SIGKILL' );
	} catch ( error ) {
		if ( error.code !== 'ESRCH' ) {
			throw error;
		}
	}
}
