import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const validatorPath = fileURLToPath(
	new URL( './validate-package-contents.mjs', import.meta.url )
);
const temporaryRoots = [];

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		rmSync( root, { force: true, recursive: true } );
	}
} );

function createPackage( { files, packageJson } ) {
	const root = mkdtempSync( join( tmpdir(), 'validate-package-contents-' ) );
	temporaryRoots.push( root );

	for ( const [ path, contents ] of Object.entries( files ) ) {
		const filePath = join( root, path );
		mkdirSync( dirname( filePath ), { recursive: true } );
		writeFileSync( filePath, contents );
	}

	writeFileSync(
		join( root, 'package.json' ),
		JSON.stringify(
			{
				name: 'test-package',
				version: '1.0.0',
				...packageJson,
			},
			null,
			'\t'
		) + '\n'
	);

	return root;
}

function runValidator( packageRoot, args = [] ) {
	return spawnSync(
		process.execPath,
		[ validatorPath, packageRoot, ...args ],
		{
			encoding: 'utf8',
			env: {
				...process.env,
				WORDPRESS_PACKAGE_NPM_CACHE: join(
					tmpdir(),
					'wordpress-package-npm-cache'
				),
			},
		}
	);
}

test( 'passes for a package with clean packed contents and resolvable types', () => {
	const packageRoot = createPackage( {
		files: {
			'index.cjs': "exports.value = 'ok';\n",
			'index.d.ts': 'export declare const value: string;\n',
		},
		packageJson: {
			files: [ 'index.cjs', 'index.d.ts' ],
			main: './index.cjs',
			types: './index.d.ts',
			exports: {
				'.': {
					types: './index.d.ts',
					default: './index.cjs',
				},
			},
		},
	} );

	const result = runValidator( packageRoot );

	assert.equal( result.status, 0, result.stderr );
	assert.match(
		result.stdout,
		/Validated \d+ packed files for test-package\./
	);
} );

test( 'fails when packed contents include test files', () => {
	const packageRoot = createPackage( {
		files: {
			'index.cjs': "exports.value = 'ok';\n",
			'index.d.ts': 'export declare const value: string;\n',
			'index.test.js': "require( './index.cjs' );\n",
		},
		packageJson: {
			files: [ 'index.cjs', 'index.d.ts', 'index.test.js' ],
			main: './index.cjs',
			types: './index.d.ts',
			exports: {
				'.': {
					types: './index.d.ts',
					default: './index.cjs',
				},
			},
		},
	} );

	const result = runValidator( packageRoot );

	assert.notEqual( result.status, 0 );
	assert.match(
		result.stderr,
		/The package tarball includes disallowed files:\n- index\.test\.js/
	);
} );

test( 'fails when an entry point excluded from attw has a missing package target', () => {
	const packageRoot = createPackage( {
		files: {
			'index.cjs': "exports.value = 'ok';\n",
			'index.d.ts': 'export declare const value: string;\n',
		},
		packageJson: {
			files: [ 'index.cjs', 'index.d.ts' ],
			main: './index.cjs',
			types: './index.d.ts',
			exports: {
				'.': {
					types: './index.d.ts',
					default: './index.cjs',
				},
				'./styles.css': './styles.css',
			},
		},
	} );

	const result = runValidator( packageRoot, [
		'--attw-exclude-entrypoint',
		'./styles.css',
	] );

	assert.notEqual( result.status, 0 );
	assert.match(
		result.stderr,
		/The package tarball is missing targets for entry points excluded from attw:\n- styles\.css/
	);
} );

test( 'fails when an exported types target is missing from the packed package', () => {
	const packageRoot = createPackage( {
		files: {
			'feature.d.mts': 'export declare const value: string;\n',
			'feature.mjs': "export const value = 'ok';\n",
			'index.cjs': "exports.value = 'ok';\n",
			'index.d.ts': 'export declare const value: string;\n',
		},
		packageJson: {
			files: [
				'feature.d.mts',
				'feature.mjs',
				'index.cjs',
				'index.d.ts',
			],
			main: './index.cjs',
			types: './index.d.ts',
			exports: {
				'.': {
					types: './index.d.ts',
					default: './index.cjs',
				},
				'./feature': {
					types: './feature.d.ts',
					import: './feature.mjs',
				},
			},
		},
	} );

	const result = runValidator( packageRoot, [
		'--attw-profile',
		'node16',
		'--attw-ignore-rule',
		'false-cjs',
		'--attw-ignore-rule',
		'false-esm',
		'--attw-ignore-rule',
		'cjs-resolves-to-esm',
	] );

	assert.notEqual( result.status, 0 );
	assert.match( result.stderr, /Resolution failed/ );
	assert.match( result.stderr, /Used fallback condition/ );
} );
