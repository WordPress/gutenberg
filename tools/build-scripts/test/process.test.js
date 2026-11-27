import { once } from 'node:events';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { afterEach, expect, test } from 'vitest';
import { spawnWatchProcess, stopWatchProcess } from '../process.mjs';

let watcher;

afterEach( () => {
	stopWatchProcess( watcher );
} );

async function waitForProcessToExit( pid, attempts = 20 ) {
	for ( let attempt = 0; attempt < attempts; attempt++ ) {
		try {
			process.kill( pid, 0 );
		} catch ( error ) {
			if ( error.code === 'ESRCH' ) {
				return;
			}
			throw error;
		}

		await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
	}

	throw new Error( `Process ${ pid } did not exit.` );
}

test( 'terminates a watcher and its descendant process', async () => {
	watcher = spawnWatchProcess(
		process.execPath,
		[ path.join( import.meta.dirname, 'fixtures/watch-process.mjs' ) ],
		{ stdio: [ 'ignore', 'pipe', 'inherit' ] }
	);

	const [ data ] = await once( watcher.stdout, 'data' );
	const descendantPid = Number( data.toString().trim() );

	stopWatchProcess( watcher );

	await expect(
		waitForProcessToExit( watcher.pid )
	).resolves.toBeUndefined();
	await expect(
		waitForProcessToExit( descendantPid )
	).resolves.toBeUndefined();
} );

test( 'stops a watcher when its parent is killed without cleaning up', async () => {
	const parent = spawn(
		process.execPath,
		[ path.join( import.meta.dirname, 'fixtures/watch-parent.mjs' ) ],
		{ stdio: [ 'ignore', 'pipe', 'inherit' ] }
	);

	const [ data ] = await once( parent.stdout, 'data' );
	const [ watcherPid, descendantPid ] = data
		.toString()
		.trim()
		.split( ' ' )
		.map( Number );

	parent.kill( 'SIGKILL' );

	// The watchdog polls once per second.
	await expect(
		waitForProcessToExit( watcherPid, 100 )
	).resolves.toBeUndefined();
	await expect(
		waitForProcessToExit( descendantPid, 100 )
	).resolves.toBeUndefined();
}, 10_000 );
