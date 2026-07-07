/* global afterEach, expect, test */

/**
 * External dependencies
 */
const { spawnSync } = require( 'node:child_process' );
const {
	mkdtempSync,
	mkdirSync,
	readdirSync,
	rmSync,
	writeFileSync,
} = require( 'node:fs' );
const { tmpdir } = require( 'node:os' );
const { dirname, join } = require( 'node:path' );

const validatorPath = join( __dirname, 'validate-package-contents.mjs' );
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

function runValidator( packageRoot, args = [], envOverrides = {} ) {
	const env = {
		...process.env,
		WORDPRESS_PACKAGE_NPM_CACHE: join(
			tmpdir(),
			'wordpress-package-npm-cache'
		),
		...envOverrides,
	};

	for ( const [ name, value ] of Object.entries( env ) ) {
		if ( value === undefined ) {
			delete env[ name ];
		}
	}

	return spawnSync(
		process.execPath,
		[ validatorPath, packageRoot, ...args ],
		{
			encoding: 'utf8',
			env,
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

	expect( result.status ).toBe( 0 );
	expect( result.stdout ).toMatch(
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

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toMatch(
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

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toMatch(
		/The package tarball is missing targets for entry points excluded from attw:\n- styles\.css/
	);
} );

test( 'fails when an entry point excluded from attw is not exported', () => {
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

	const result = runValidator( packageRoot, [
		'--attw-exclude-entrypoint',
		'./styles.css',
	] );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toMatch(
		/The package exports do not include entry points excluded from attw:\n- \.\/styles\.css/
	);
} );

test( 'cleans the pack directory when npm pack fails to spawn', () => {
	const tempRoot = mkdtempSync(
		join( tmpdir(), 'validate-package-contents-tmp-' )
	);
	temporaryRoots.push( tempRoot );
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

	const result = runValidator( packageRoot, [], {
		PATH: '',
		TMPDIR: tempRoot,
		npm_execpath: undefined,
	} );

	expect( result.status ).not.toBe( 0 );
	expect(
		readdirSync( tempRoot ).filter( ( path ) =>
			path.startsWith( 'wordpress-package-contents-' )
		)
	).toEqual( [] );
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

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toMatch( /Resolution failed/ );
	expect( result.stderr ).toMatch( /Used fallback condition/ );
} );
