import { execFileSync } from 'node:child_process';
import spawn from 'cross-spawn';

/**
 * Start a long-running watch process.
 *
 * @param {string}   command Command to execute.
 * @param {string[]} args    Command arguments.
 * @param {Object}   options Spawn options.
 * @return {Object} Child process.
 */
export function spawnWatchProcess( command, args = [], options = {} ) {
	return spawn( command, args, {
		...options,
		detached: process.platform !== 'win32',
	} );
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
