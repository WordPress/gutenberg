/* global afterEach, expect, test */

/**
 * External dependencies
 */
const { spawnSync } = require( 'node:child_process' );
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require( 'node:fs' );
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

function runValidator( packageRoot ) {
	return spawnSync( process.execPath, [ validatorPath, packageRoot ], {
		encoding: 'utf8',
		env: {
			...process.env,
			WORDPRESS_PACKAGE_NPM_CACHE: join(
				tmpdir(),
				'wordpress-package-npm-cache'
			),
		},
	} );
}

test( 'passes for a package with clean packed contents', () => {
	const packageRoot = createPackage( {
		files: {
			'index.js': "export const value = 'ok';\n",
			'index.d.ts': 'export declare const value: string;\n',
			'styles.css': '.test {}\n',
		},
		packageJson: {
			files: [ 'index.js', 'index.d.ts', 'styles.css' ],
			exports: {
				'.': {
					types: './index.d.ts',
					default: './index.js',
				},
				'./styles.css': './styles.css',
			},
		},
	} );

	const result = runValidator( packageRoot );

	expect( result.status ).toBe( 0 );
	expect( result.stdout ).toMatch(
		/Validated \d+ packed files for test-package\./
	);
} );

test.each( [ 'index.test.js', 'index.story.js' ] )(
	'fails when packed contents include %s',
	( disallowedPath ) => {
		const packageRoot = createPackage( {
			files: {
				'index.js': "export const value = 'ok';\n",
				[ disallowedPath ]: "import './index.js';\n",
			},
			packageJson: {
				files: [ 'index.js', disallowedPath ],
				exports: './index.js',
			},
		} );

		const result = runValidator( packageRoot );

		expect( result.status ).not.toBe( 0 );
		expect( result.stderr ).toContain(
			`The package tarball includes disallowed files:\n- ${ disallowedPath }`
		);
	}
);

test( 'fails when an exported target is missing from the package', () => {
	const packageRoot = createPackage( {
		files: {
			'index.js': "export const value = 'ok';\n",
		},
		packageJson: {
			files: [ 'index.js' ],
			exports: {
				'.': {
					types: './index.d.ts',
					default: './index.js',
				},
			},
		},
	} );

	const result = runValidator( packageRoot );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toMatch(
		/The package tarball is missing exported targets:\n- index\.d\.ts/
	);
} );
