import { once } from 'node:events';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { spawnWatchProcess, stopWatchProcess } from '../process.mjs';

let watcher;

afterEach( () => {
	stopWatchProcess( watcher );
} );

async function waitForProcessToExit( pid ) {
	for ( let attempt = 0; attempt < 20; attempt++ ) {
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
		[ path.join( __dirname, 'fixtures/watch-process.mjs' ) ],
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
