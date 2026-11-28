#!/usr/bin/env node
/**
 * Stops a detached watch process group once the process that started it is
 * gone.
 *
 * A watch process runs in its own process group so that it can be stopped
 * together with its descendants. That also means it survives when its parent
 * is killed without the chance to clean up (SIGKILL, a crash, or a tool that
 * signals only the parent's process group), leaving watchers running in the
 * background indefinitely.
 *
 * This script is started by the same parent, in a process group of its own,
 * so that it outlives the parent. It polls for the parent to disappear, which
 * the operating system reports by reparenting this process, and then stops
 * the watch process group. It exits on its own once that group is gone.
 *
 * Usage: node watchdog.mjs <watch process group id>
 */

const POLL_INTERVAL_MS = 1000;

const groupId = Number( process.argv[ 2 ] );
const parentPid = process.ppid;

if ( ! Number.isInteger( groupId ) || groupId <= 0 ) {
	process.exit( 1 );
}

/**
 * Send a signal to the watch process group.
 *
 * @param {string|number} signal Signal to send.
 * @return {boolean} Whether the group still exists.
 */
function signalGroup( signal ) {
	try {
		process.kill( -groupId, signal );
		return true;
	} catch {
		// ESRCH: the group is gone. EPERM: the id now belongs to a process
		// group that is not ours, so ours is gone too.
		return false;
	}
}

setInterval( () => {
	if ( process.ppid !== parentPid ) {
		signalGroup( 'SIGKILL' );
		process.exit( 0 );
	}

	if ( ! signalGroup( 0 ) ) {
		process.exit( 0 );
	}
}, POLL_INTERVAL_MS );
