/* global afterEach, expect, test, describe */

/**
 * External dependencies
 */
const { spawnSync } = require( 'node:child_process' );
const {
	mkdtempSync,
	mkdirSync,
	rmSync,
	writeFileSync,
	readFileSync,
} = require( 'node:fs' );
const { tmpdir } = require( 'node:os' );
const { dirname, join } = require( 'node:path' );

const scriptPath = join( __dirname, 'normalize-declaration-extensions.mjs' );
const temporaryRoots = [];

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		rmSync( root, { force: true, recursive: true } );
	}
} );

/**
 * Creates a temporary `packages` directory containing a single package.
 *
 * @param {Object} options               Options.
 * @param {Object} options.files         Map of relative path -> file contents.
 * @param {Object} [options.packageJson] Extra package.json fields.
 * @return {{ packagesDir: string, read: (relativePath: string) => string }} Handles.
 */
function createPackagesDir( { files, packageJson = {} } ) {
	const root = mkdtempSync( join( tmpdir(), 'normalize-declarations-' ) );
	temporaryRoots.push( root );

	const packageDir = join( root, 'packages', 'sample' );
	mkdirSync( packageDir, { recursive: true } );

	writeFileSync(
		join( packageDir, 'package.json' ),
		JSON.stringify(
			{ name: '@wordpress/sample', version: '1.0.0', ...packageJson },
			null,
			'\t'
		) + '\n'
	);

	for ( const [ path, contents ] of Object.entries( files ) ) {
		const filePath = join( packageDir, path );
		mkdirSync( dirname( filePath ), { recursive: true } );
		writeFileSync( filePath, contents );
	}

	return {
		packagesDir: join( root, 'packages' ),
		read: ( relativePath ) =>
			readFileSync( join( packageDir, relativePath ), 'utf8' ),
	};
}

function run( packagesDir ) {
	return spawnSync( 'node', [ scriptPath, packagesDir ], {
		encoding: 'utf8',
	} );
}

describe( 'normalize-declaration-extensions', () => {
	test( 'appends .js to extensionless relative specifiers in ESM packages', () => {
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: {
				'build-types/index.d.ts':
					"export { privateApis } from './private-apis';\n" +
					"export type * from './types';\n",
				'build-types/private-apis.d.ts':
					'export declare const x: number;\n',
				'build-types/types.d.ts': 'export type T = string;\n',
			},
		} );

		const { status } = run( packagesDir );

		expect( status ).toBe( 0 );
		expect( read( 'build-types/index.d.ts' ) ).toBe(
			"export { privateApis } from './private-apis.js';\n" +
				"export type * from './types.js';\n"
		);
	} );

	test( 'rewrites a directory specifier to /index.js', () => {
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: {
				'build-types/index.d.ts': "export * from './nested';\n",
				'build-types/nested/index.d.ts': 'export type T = number;\n',
			},
		} );

		run( packagesDir );

		expect( read( 'build-types/index.d.ts' ) ).toBe(
			"export * from './nested/index.js';\n"
		);
	} );

	test( 'matches the target declaration kind (.d.mts -> .mjs)', () => {
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: {
				'build-types/index.d.ts': "export * from './tokens';\n",
				'build-types/tokens.d.mts': 'export declare const t: number;\n',
			},
		} );

		run( packagesDir );

		expect( read( 'build-types/index.d.ts' ) ).toBe(
			"export * from './tokens.mjs';\n"
		);
	} );

	test( 'rewrites dynamic and inline import() specifiers', () => {
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: {
				'build-types/index.d.ts':
					"export declare const c: import('./context').Ctx;\n",
				'build-types/context.d.ts': 'export type Ctx = unknown;\n',
			},
		} );

		run( packagesDir );

		expect( read( 'build-types/index.d.ts' ) ).toBe(
			"export declare const c: import('./context.js').Ctx;\n"
		);
	} );

	test( 'leaves specifiers with an existing extension untouched', () => {
		const original =
			"export { a } from './a.js';\n" +
			"import './styles.css';\n" +
			"export type { T } from './b.mjs';\n";
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: {
				'build-types/index.d.ts': original,
				'build-types/a.d.ts': 'export declare const a: number;\n',
				'build-types/b.d.mts': 'export type T = string;\n',
			},
		} );

		run( packagesDir );

		expect( read( 'build-types/index.d.ts' ) ).toBe( original );
	} );

	test( 'does not touch bare (package) specifiers', () => {
		const original =
			"export { compose } from '@wordpress/compose';\n" +
			"import { useState } from 'react';\n";
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: { 'build-types/index.d.ts': original },
		} );

		run( packagesDir );

		expect( read( 'build-types/index.d.ts' ) ).toBe( original );
	} );

	test( 'skips packages that are not "type": "module"', () => {
		const original = "export { x } from './x';\n";
		const { packagesDir, read } = createPackagesDir( {
			packageJson: {},
			files: {
				'build-types/index.d.ts': original,
				'build-types/x.d.ts': 'export declare const x: number;\n',
			},
		} );

		run( packagesDir );

		expect( read( 'build-types/index.d.ts' ) ).toBe( original );
	} );

	test( 'is idempotent', () => {
		const { packagesDir, read } = createPackagesDir( {
			packageJson: { type: 'module' },
			files: {
				'build-types/index.d.ts': "export { x } from './x';\n",
				'build-types/x.d.ts': 'export declare const x: number;\n',
			},
		} );

		run( packagesDir );
		const afterFirst = read( 'build-types/index.d.ts' );
		run( packagesDir );
		const afterSecond = read( 'build-types/index.d.ts' );

		expect( afterFirst ).toBe( "export { x } from './x.js';\n" );
		expect( afterSecond ).toBe( afterFirst );
	} );
} );
