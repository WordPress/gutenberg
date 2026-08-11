import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { describe, expect, it } from 'vitest';
import config from '../lib/';

const execFileAsync = promisify( execFile );
const testDirectory = path.dirname( fileURLToPath( import.meta.url ) );

describe( 'prettier config tests', () => {
	it( 'should be an object', () => {
		expect( config ).not.toBeNull();
		expect( typeof config ).toBe( 'object' );
	} );

	it( 'should resolve file-specific options from the root config', async () => {
		const repositoryRoot = path.resolve( testDirectory, '../../..' );
		// Resolve prettier from this file
		const prettierPath = require.resolve( 'prettier' );
		const resolveConfigScript = `
			const prettier = require( ${ JSON.stringify( prettierPath ) } );
			Promise.all(
				process.argv
					.slice( 1 )
					.map( ( file ) => prettier.resolveConfig( file ) )
			).then( ( configs ) => {
				process.stdout.write( JSON.stringify( configs ) );
			} );
		`;
		const { stdout } = await execFileAsync(
			process.execPath,
			[
				'-e',
				resolveConfigScript,
				path.join( repositoryRoot, 'test.css' ),
				path.join( repositoryRoot, 'changelog.txt' ),
			],
			{ cwd: repositoryRoot }
		);
		const [ styleConfig, changelogConfig ] = JSON.parse( stdout );

		expect( styleConfig ).toEqual(
			expect.objectContaining( {
				singleQuote: false,
				parenSpacing: false,
			} )
		);
		expect( changelogConfig ).toEqual(
			expect.objectContaining( {
				parser: 'markdown',
			} )
		);
	} );
} );
