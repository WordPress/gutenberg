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

	writeJson( join( repoRoot, 'tsconfig.base.json' ), {
		exclude: [ '**/benchmark', '**/test/**', '**/stories/**' ],
	} );
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
		for ( const [ fileName, tsconfig ] of Object.entries( tsconfigs ) ) {
			const { references = [], ...rest } = Array.isArray( tsconfig )
				? { references: tsconfig }
				: tsconfig;
			writeJson( join( packageDir, fileName ), {
				...rest,
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

const devOnlyPackage = {
	tsconfigs: {
		'tsconfig.json': {
			extends: '../../tsconfig.dev.base.json',
			references: [],
		},
	},
};

test( 'passes when a package without a build project is in the root solution', () => {
	const result = runValidator(
		createRepo( {
			packages: { 'jest-console': devOnlyPackage },
			build: [],
			root: [ './tsconfig.build.json', 'packages/jest-console' ],
		} )
	);

	expect( result.status ).toBe( 0 );
} );

test( 'fails when a package without a build project is missing from the root solution', () => {
	const result = runValidator(
		createRepo( {
			packages: { 'jest-console': devOnlyPackage },
			build: [],
			root: [ './tsconfig.build.json' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "packages/jest-console/tsconfig.json" in tsconfig.json'
	);
} );

const storiesPackage = {
	tsconfigs: {
		'tsconfig.json': [ './tsconfig.build.json' ],
		'tsconfig.build.json': [ '../blob/tsconfig.build.json' ],
		'tsconfig.stories.json': [ '../blob/tsconfig.build.json' ],
	},
	dependencies: { '@wordpress/blob': 'file:../blob' },
};

test( 'passes when a stories project is registered and references the dependencies', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: splitPackage, components: storiesPackage },
			build: [
				'packages/blob/tsconfig.build.json',
				'packages/components/tsconfig.build.json',
			],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'packages/components',
				'packages/components/tsconfig.stories.json',
			],
		} )
	);

	expect( result.status ).toBe( 0 );
} );

test( 'fails when a stories project is missing from the root solution', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: splitPackage, components: storiesPackage },
			build: [
				'packages/blob/tsconfig.build.json',
				'packages/components/tsconfig.build.json',
			],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'packages/components',
			],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "packages/components/tsconfig.stories.json" in tsconfig.json'
	);
} );

test( 'fails when a dependency is missing from the stories project', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: splitPackage,
				components: {
					...storiesPackage,
					tsconfigs: {
						...storiesPackage.tsconfigs,
						'tsconfig.stories.json': [],
					},
				},
			},
			build: [
				'packages/blob/tsconfig.build.json',
				'packages/components/tsconfig.build.json',
			],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'packages/components',
				'packages/components/tsconfig.stories.json',
			],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "../blob/tsconfig.build.json" in packages/components/tsconfig.stories.json'
	);
} );

function typedSplitPackage( buildTypes, devTypes ) {
	return {
		tsconfigs: {
			'tsconfig.json': {
				extends: '../../tsconfig.dev.base.json',
				compilerOptions: { types: devTypes },
				references: [ './tsconfig.build.json' ],
			},
			'tsconfig.build.json': {
				compilerOptions: { types: buildTypes },
				references: [],
			},
		},
	};
}

test( 'passes when the dev project carries the build project types', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: typedSplitPackage( [ 'node' ], [ 'jest', 'node' ] ),
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).toBe( 0 );
} );

test( 'fails when the dev project misses a build project type', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: typedSplitPackage( [ 'node' ], [ 'jest' ] ) },
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing type "node" in packages/blob/tsconfig.json'
	);
} );

test( 'fails when the build project carries a test type', () => {
	const result = runValidator(
		createRepo( {
			packages: { blob: typedSplitPackage( [ 'jest' ], [ 'jest' ] ) },
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Test type "jest" in packages/blob/tsconfig.build.json'
	);
} );

test( 'checks the stories project of a package without a build project', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				icons: {
					tsconfigs: {
						'tsconfig.json': {
							extends: '../../tsconfig.dev.base.json',
							references: [],
						},
						'tsconfig.stories.json': [],
					},
				},
			},
			build: [],
			root: [ './tsconfig.build.json', 'packages/icons' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing reference to "packages/icons/tsconfig.stories.json" in tsconfig.json'
	);
} );

test( 'fails when a build project exclude omits a dev-file pattern of the base', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: {
					tsconfigs: {
						'tsconfig.json': {
							extends: '../../tsconfig.dev.base.json',
							references: [ './tsconfig.build.json' ],
						},
						'tsconfig.build.json': {
							exclude: [
								'**/benchmark',
								'**/test/**',
								'src/legacy.js',
							],
							references: [],
						},
					},
				},
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing exclude "**/stories/**" in packages/blob/tsconfig.build.json'
	);
} );

test( 'passes when a build project keeps every dev-file pattern of the base', () => {
	const result = runValidator(
		createRepo( {
			packages: {
				blob: {
					tsconfigs: {
						'tsconfig.json': {
							extends: '../../tsconfig.dev.base.json',
							references: [ './tsconfig.build.json' ],
						},
						'tsconfig.build.json': {
							exclude: [
								'**/benchmark',
								'**/test/**',
								'**/stories/**',
								'src/legacy.js',
							],
							references: [],
						},
					},
				},
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);

	expect( result.status ).toBe( 0 );
} );
