import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import glob from 'fast-glob';
import { getSourceFileGlob, isTestSourceFile } from '../source-files.mjs';

describe( 'source file discovery', () => {
	let temporaryDirectory;

	afterEach( () => {
		if ( temporaryDirectory ) {
			rmSync( temporaryDirectory, { force: true, recursive: true } );
			temporaryDirectory = undefined;
		}
	} );

	it( 'returns a glob that expands to every supported source extension', async () => {
		temporaryDirectory = mkdtempSync(
			path.join( os.tmpdir(), 'wordpress-build-source-files-' )
		);
		const sourceDirectory = path.join( temporaryDirectory, 'src' );
		mkdirSync( sourceDirectory );

		for ( const extension of [ 'js', 'jsx', 'mjs', 'ts', 'tsx', 'css' ] ) {
			writeFileSync(
				path.join( sourceDirectory, `index.${ extension }` ),
				''
			);
		}

		const sourceFiles = await glob( getSourceFileGlob( 'src/**/*' ), {
			cwd: temporaryDirectory,
		} );

		expect( sourceFiles.sort() ).toEqual( [
			'src/index.js',
			'src/index.jsx',
			'src/index.mjs',
			'src/index.ts',
			'src/index.tsx',
		] );
	} );

	it.each( [
		'packages/example/src/test/component.jsx',
		'packages/example/src/component.test.jsx',
		'packages/example/src/component.spec.mjs',
	] )( 'identifies development-only source: %s', ( filename ) => {
		expect( isTestSourceFile( filename ) ).toBe( true );
	} );

	it( 'keeps production JSX source', () => {
		expect( isTestSourceFile( 'packages/example/src/component.jsx' ) ).toBe(
			false
		);
	} );
} );
