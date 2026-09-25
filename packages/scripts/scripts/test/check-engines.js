import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rimrafSync } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );
const scriptPath = path.resolve( currentDirectory, '..', 'check-engines.js' );

describe( 'check-engines script', () => {
	let workingDirectory;

	const runWithPackage = ( packageJson, cwd = workingDirectory ) => {
		fs.writeFileSync(
			path.join( workingDirectory, 'package.json' ),
			JSON.stringify( { name: 'check-engines-fixture', ...packageJson } )
		);
		return spawnSync( process.execPath, [ scriptPath ], {
			cwd,
			encoding: 'utf8',
		} );
	};

	beforeEach( () => {
		workingDirectory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-check-engines-' )
		);
	} );

	afterEach( () => {
		rimrafSync( workingDirectory );
	} );

	it( 'passes when only the node engine is declared', () => {
		const result = runWithPackage( { engines: { node: '>=0.0.1' } } );

		expect( result.stderr ).toBe( '' );
		expect( result.status ).toBe( 0 );
	} );

	it( 'falls back to the engines of this package', () => {
		const result = runWithPackage( {} );

		expect( result.stderr ).toBe( '' );
		expect( result.status ).toBe( 0 );
	} );

	it( 'ignores engines it cannot check', () => {
		const result = runWithPackage( {
			engines: { node: '>=0.0.1', vscode: '^1.0.0' },
		} );

		expect( result.stderr ).toBe( '' );
		expect( result.status ).toBe( 0 );
	} );

	it( 'fails when the node version is not satisfied', () => {
		const result = runWithPackage( { engines: { node: '>=9999.0.0' } } );

		expect( result.status ).toBe( 1 );
	} );

	it( 'reads engines from the nearest package.json', () => {
		const subdirectory = path.join( workingDirectory, 'src' );
		fs.mkdirSync( subdirectory );

		const result = runWithPackage(
			{ engines: { node: '>=9999.0.0' } },
			subdirectory
		);

		expect( result.status ).toBe( 1 );
	} );
} );
