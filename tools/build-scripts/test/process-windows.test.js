import { execFileSync } from 'node:child_process';
import spawn from 'cross-spawn';
import { spawnWatchProcess, stopWatchProcess } from '../process.mjs';

jest.mock( 'node:child_process', () => ( {
	...jest.requireActual( 'node:child_process' ),
	execFileSync: jest.fn(),
} ) );
jest.mock( 'cross-spawn', () => jest.fn() );

const platformDescriptor = Object.getOwnPropertyDescriptor(
	process,
	'platform'
);

beforeEach( () => {
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
