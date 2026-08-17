/* global afterEach, expect, test */
const { spawnSync } = require( 'node:child_process' );
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require( 'node:fs' );
const { tmpdir } = require( 'node:os' );
const { join } = require( 'node:path' );

const validatorPath = join( __dirname, 'validate-tsconfig.mjs' );
const temporaryRoots = [];

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		rmSync( root, { force: true, recursive: true } );
	}
} );

function writeJson( path, contents ) {
	writeFileSync( path, JSON.stringify( contents, null, '\t' ) + '\n' );
}

/**
 * Creates a repository root holding a build solution, a root solution and the
 * given packages.
 *
 * @param {Object} repo          Repository description.
 * @param {Object} repo.packages Package name to `{ tsconfigs, dependencies }`.
 * @param {Array}  repo.build    References of the build solution.
 * @param {Array}  repo.root     References of the root solution.
 * @return {string} Path of the created repository root.
 */
function createRepo( { packages, build, root } ) {
	const repoRoot = mkdtempSync( join( tmpdir(), 'validate-tsconfig-' ) );
	temporaryRoots.push( repoRoot );

	writeJson( join( repoRoot, 'tsconfig.build.json' ), {
		references: build.map( ( path ) => ( { path } ) ),
	} );
	writeJson( join( repoRoot, 'tsconfig.json' ), {
		references: root.map( ( path ) => ( { path } ) ),
	} );

	for ( const [ name, { tsconfigs, dependencies } ] of Object.entries(
		packages
	) ) {
		const packageDir = join( repoRoot, 'packages', name );
		mkdirSync( packageDir, { recursive: true } );
		writeJson( join( packageDir, 'package.json' ), {
			name: `@wordpress/${ name }`,
			version: '1.0.0',
			...( dependencies && { dependencies } ),
		} );
		for ( const [ fileName, references ] of Object.entries( tsconfigs ) ) {
			writeJson( join( packageDir, fileName ), {
				references: references.map( ( path ) => ( { path } ) ),
			} );
		}
	}

	return repoRoot;
}

function runValidator( repoRoot ) {
	return spawnSync( process.execPath, [ validatorPath, repoRoot ], {
		encoding: 'utf8',
	} );
}

const splitPackage = {
	tsconfigs: {
		'tsconfig.json': [ './tsconfig.build.json' ],
		'tsconfig.build.json': [],
	},
};

test( 'passes when both projects of a split package are referenced', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).toBe( 0 );
} );

test( 'fails when the dev project is missing from the root solution', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "packages/blob/tsconfig.json" in tsconfig.json'
	);
} );

test( 'fails when the build project is missing from the build solution', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			build: [ 'packages/blob' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "packages/blob/tsconfig.build.json" in tsconfig.build.json'
	);
} );

test( 'fails when a test project is missing from the root solution', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				theme: {
					tsconfigs: {
						'tsconfig.json': [],
						'tsconfig.test.json': [],
					},
				},
			},
			build: [ 'packages/theme' ],
			root: [ './tsconfig.build.json' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "packages/theme/tsconfig.test.json" in tsconfig.json'
	);
} );

test( 'fails when a dependency is referenced through its dev project', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: splitPackage,
				blocks: {
					tsconfigs: { 'tsconfig.json': [ '../blob' ] },
					dependencies: { '@wordpress/blob': 'file:../blob' },
				},
			},
			build: [ 'packages/blob/tsconfig.build.json', 'packages/blocks' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "../blob/tsconfig.build.json" in packages/blocks/tsconfig.json'
	);
} );

test( 'points a split package at its build project for a missing reference', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: splitPackage,
				blocks: {
					tsconfigs: {
						'tsconfig.json': [ './tsconfig.build.json' ],
						'tsconfig.build.json': [],
					},
					dependencies: { '@wordpress/blob': 'file:../blob' },
				},
			},
			build: [
				'packages/blob/tsconfig.build.json',
				'packages/blocks/tsconfig.build.json',
			],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'packages/blocks',
			],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "../blob/tsconfig.build.json" in packages/blocks/tsconfig.build.json'
	);
} );

test( 'passes when a dependency is referenced through its build project', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: splitPackage,
				blocks: {
					tsconfigs: {
						'tsconfig.json': [ '../blob/tsconfig.build.json' ],
					},
					dependencies: { '@wordpress/blob': 'file:../blob' },
				},
			},
			build: [ 'packages/blob/tsconfig.build.json', 'packages/blocks' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).toBe( 0 );
} );

test( 'fails when a dependency is referenced only by the dev project', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: splitPackage,
				blocks: {
					tsconfigs: {
						'tsconfig.json': [
							'./tsconfig.build.json',
							'../blob/tsconfig.build.json',
						],
						'tsconfig.build.json': [],
					},
					dependencies: { '@wordpress/blob': 'file:../blob' },
				},
			},
			build: [
				'packages/blob/tsconfig.build.json',
				'packages/blocks/tsconfig.build.json',
			],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'packages/blocks',
			],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "../blob/tsconfig.build.json" in packages/blocks/tsconfig.build.json'
	);
} );

test( 'passes when a package solution reaches the dependency through a sub project', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: splitPackage,
				theme: {
					tsconfigs: {
						'tsconfig.json': [ './tsconfig.src.json' ],
						'tsconfig.src.json': [ '../blob/tsconfig.build.json' ],
					},
					dependencies: { '@wordpress/blob': 'file:../blob' },
				},
			},
			build: [ 'packages/blob/tsconfig.build.json', 'packages/theme' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).toBe( 0 );
} );

test( 'fails when the root solution does not reference the build solution', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ 'packages/blob' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "./tsconfig.build.json" in tsconfig.json'
	);
} );
