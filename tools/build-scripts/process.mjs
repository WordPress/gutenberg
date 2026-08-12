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

	try {
		if ( process.platform === 'win32' ) {
			execFileSync(
				'taskkill',
				[ '/pid', String( child.pid ), '/T', '/F' ],
				{ stdio: 'ignore' }
			);
		} else {
			// A command launcher can leave its native watcher running, so stop
			// the detached process group instead of only the direct child.
			process.kill( -child.pid, 'SIGKILL' );
		}
	} catch ( error ) {
		if ( error.code !== 'ESRCH' ) {
			throw error;
		}
	}
}
