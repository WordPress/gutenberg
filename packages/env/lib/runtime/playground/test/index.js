import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const childProcess = require( 'node:child_process' );
const fs = require( 'node:fs' ).promises;
const PlaygroundRuntime = require( '../index' );

afterEach( () => {
	vi.restoreAllMocks();
} );

describe( 'Playground runtime', () => {
	it( 'passes database constants to the Playground process at startup', async () => {
		const databasePath = "/wordpress/data with spaces/a=b'ž.sqlite";
		const config = {
			workDirectoryPath: '/wp-env',
			env: {
				development: {
					pluginSources: [],
					themeSources: [],
					mappings: {},
					config: { DB_PATH: databasePath },
				},
			},
		};
		const spawn = vi.spyOn( childProcess, 'spawn' ).mockReturnValue( {
			pid: 12345,
			on: vi.fn(),
			unref: vi.fn(),
		} );
		vi.spyOn( fs, 'mkdir' ).mockResolvedValue();
		vi.spyOn( fs, 'writeFile' ).mockResolvedValue();
		vi.spyOn( fs, 'open' ).mockResolvedValue( {
			fd: 42,
			close: vi.fn().mockResolvedValue(),
		} );
		const runtime = new PlaygroundRuntime();
		vi.spyOn( runtime, '_waitForServer' ).mockResolvedValue();

		await runtime.start( config, { spinner: {} } );

		expect( spawn ).toHaveBeenCalledOnce();
		const [ , args ] = spawn.mock.calls[ 0 ];
		const defineIndex = args.indexOf( '--define' );
		expect( args.slice( defineIndex, defineIndex + 3 ) ).toEqual( [
			'--define',
			'DB_PATH',
			databasePath,
		] );
	} );
} );
