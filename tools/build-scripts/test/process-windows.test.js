import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import spawn from 'cross-spawn';
import { spawnWatchProcess, stopWatchProcess } from '../process.mjs';

vi.mock( 'node:child_process', async ( importOriginal ) => ( {
	...( await importOriginal() ),
	execFileSync: vi.fn(),
} ) );
vi.mock( 'cross-spawn', () => ( { default: vi.fn() } ) );

const platformDescriptor = Object.getOwnPropertyDescriptor(
	process,
	'platform'
);

beforeEach( () => {
	vi.clearAllMocks();
	Object.defineProperty( process, 'platform', { value: 'win32' } );
} );

afterEach( () => {
	Object.defineProperty( process, 'platform', platformDescriptor );
} );

test( 'does not detach a watcher on Windows', () => {
	spawnWatchProcess( 'tsc', [ '--watch' ], { stdio: 'inherit' } );

	expect( spawn ).toHaveBeenCalledWith( 'tsc', [ '--watch' ], {
		stdio: 'inherit',
		detached: false,
	} );
} );

test( 'uses taskkill to terminate a watcher tree on Windows', () => {
	stopWatchProcess( {
		pid: 123,
		exitCode: null,
		signalCode: null,
	} );

	expect( execFileSync ).toHaveBeenCalledWith(
		'taskkill',
		[ '/pid', '123', '/T', '/F' ],
		{ stdio: 'ignore' }
	);
} );

test( 'ignores a watcher tree that already exited on Windows', () => {
	execFileSync.mockImplementationOnce( () => {
		const error = new Error( 'Command failed: taskkill /pid 123 /T /F' );
		error.status = 128;
		throw error;
	} );

	expect( () =>
		stopWatchProcess( { pid: 123, exitCode: null, signalCode: null } )
	).not.toThrow();
} );

test( 'warns without throwing when taskkill fails on Windows', () => {
	execFileSync.mockImplementationOnce( () => {
		const error = new Error( 'Access is denied' );
		error.status = 1;
		throw error;
	} );

	expect( () =>
		stopWatchProcess( { pid: 123, exitCode: null, signalCode: null } )
	).not.toThrow();
	expect( console ).toHaveWarned();
} );
