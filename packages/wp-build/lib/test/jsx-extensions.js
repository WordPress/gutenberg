import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe( 'JSX source extensions', () => {
	let temporaryDirectory;

	beforeEach( () => {
		temporaryDirectory = mkdtempSync(
			path.join( os.tmpdir(), 'wordpress-build-jsx-extensions-' )
		);
	} );

	afterEach( () => {
		rmSync( temporaryDirectory, { force: true, recursive: true } );
	} );

	function buildProject( sourceFilename ) {
		const sourceDirectory = path.join(
			temporaryDirectory,
			'packages/example/src'
		);
		mkdirSync( sourceDirectory, { recursive: true } );

		writeFileSync(
			path.join( temporaryDirectory, 'package.json' ),
			JSON.stringify( {
				name: 'wp-build-jsx-extensions-test',
				version: '1.0.0',
				wpPlugin: { name: 'wp_build_jsx_extensions_test' },
			} )
		);
		writeFileSync(
			path.join( temporaryDirectory, 'packages/example/package.json' ),
			JSON.stringify( {
				name: '@test/example',
				version: '1.0.0',
				module: './build-module/index.mjs',
			} )
		);
		writeFileSync(
			path.join( sourceDirectory, sourceFilename ),
			'export default <div />;\n'
		);

		return spawnSync(
			process.execPath,
			[ path.resolve( __dirname, '../build.mjs' ) ],
			{
				cwd: temporaryDirectory,
				encoding: 'utf8',
			}
		);
	}

	it( 'builds JSX from a .jsx source file', () => {
		const result = buildProject( 'index.jsx' );

		expect( result.status ).toBe( 0 );
		expect(
			existsSync(
				path.join(
					temporaryDirectory,
					'packages/example/build-module/index.mjs'
				)
			)
		).toBe( true );
	} );

	it( 'rejects JSX syntax in a .js source file', () => {
		const result = buildProject( 'index.js' );

		expect( result.status ).not.toBe( 0 );
		expect( `${ result.stdout }${ result.stderr }` ).toContain(
			'The JSX syntax extension is not currently enabled'
		);
	} );
} );
