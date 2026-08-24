/* global afterEach, expect, test */
const { spawnSync } = require( 'node:child_process' );
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require( 'node:fs' );
const { tmpdir } = require( 'node:os' );
const { dirname, join } = require( 'node:path' );

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
 * @param {Object} [repo.routes] Route name to `{ tsconfigs, dependencies, devDependencies, manifest }`.
 * @param {Array}  repo.build    References of the build solution.
 * @param {Array}  repo.root     References of the root solution.
 * @return {string} Path of the created repository root.
 */
function createRepo( { packages, routes, build, root } ) {
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

	for ( const [
		name,
		{ tsconfigs, dependencies, devDependencies, manifest = true, files },
	] of Object.entries( routes ?? {} ) ) {
		const routeDir = join( repoRoot, 'routes', name );
		mkdirSync( routeDir, { recursive: true } );
		if ( manifest ) {
			writeJson( join( routeDir, 'package.json' ), {
				name: `@wordpress/route-${ name }`,
				version: '1.0.0',
				...( dependencies && { dependencies } ),
				...( devDependencies && { devDependencies } ),
			} );
		}
		for ( const [ fileName, references ] of Object.entries( tsconfigs ) ) {
			writeJson( join( routeDir, fileName ), {
				references: references.map( ( path ) => ( { path } ) ),
			} );
		}
		for ( const file of files ?? [] ) {
			mkdirSync( join( routeDir, dirname( file ) ), {
				recursive: true,
			} );
			writeFileSync( join( routeDir, file ), 'export {};\n' );
		}
	}

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

test( 'fails when a package with TypeScript test files has no dev project', () => {
	const repoRoot = createRepo( {
		packages: { blob: { tsconfigs: { 'tsconfig.json': [] } } },
		build: [ 'packages/blob' ],
		root: [ './tsconfig.build.json' ],
	} );
	mkdirSync( join( repoRoot, 'packages/blob/test' ), { recursive: true } );
	writeFileSync( join( repoRoot, 'packages/blob/test/index.ts' ), '' );

	const result = runValidator( repoRoot );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'Missing dev project for the TypeScript test or story files of packages/blob'
	);
} );

test( 'passes when a route is registered and references its dependencies', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			routes: {
				dashboard: {
					tsconfigs: {
						'tsconfig.json': [
							'../../packages/blob/tsconfig.build.json',
						],
					},
					dependencies: { '@wordpress/blob': 'file:../..' },
				},
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'routes/dashboard',
			],
		} )
	);
	expect( stderr ).toBe( '' );
	expect( status ).toBe( 0 );
} );

test( 'fails when a route is missing from the root solution', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			routes: {
				dashboard: {
					tsconfigs: {
						'tsconfig.json': [
							'../../packages/blob/tsconfig.build.json',
						],
					},
					dependencies: { '@wordpress/blob': 'file:../..' },
				},
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [ './tsconfig.build.json', 'packages/blob' ],
		} )
	);
	expect( stderr ).toContain(
		'Missing reference to "routes/dashboard" in tsconfig.json'
	);
	expect( status ).toBe( 1 );
} );

test( 'fails when a route does not reference a dependency', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			routes: {
				dashboard: {
					tsconfigs: { 'tsconfig.json': [] },
					dependencies: { '@wordpress/blob': 'file:../..' },
				},
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'routes/dashboard',
			],
		} )
	);
	expect( stderr ).toContain(
		'Missing reference to "../../packages/blob/tsconfig.build.json" in routes/dashboard/tsconfig.json'
	);
	expect( status ).toBe( 1 );
} );

test( 'passes when a route references an unsplit dependency by directory', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: {
				hooks: { tsconfigs: { 'tsconfig.json': [] } },
				'jest-console': devOnlyPackage,
			},
			routes: {
				dashboard: {
					tsconfigs: { 'tsconfig.json': [ '../../packages/hooks' ] },
					dependencies: {
						'@wordpress/hooks': 'file:../..',
						'@wordpress/jest-console': 'file:../..',
					},
				},
			},
			build: [ 'packages/hooks' ],
			root: [
				'./tsconfig.build.json',
				'packages/jest-console',
				'routes/dashboard',
			],
		} )
	);
	expect( stderr ).toBe( '' );
	expect( status ).toBe( 0 );
} );

test( 'ignores route devDependencies and routes without a manifest', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: { blob: splitPackage },
			routes: {
				dashboard: {
					tsconfigs: { 'tsconfig.json': [] },
					devDependencies: { '@wordpress/blob': 'file:../..' },
				},
				'site-health': {
					tsconfigs: { 'tsconfig.json': [] },
					manifest: false,
				},
			},
			build: [ 'packages/blob/tsconfig.build.json' ],
			root: [
				'./tsconfig.build.json',
				'packages/blob',
				'routes/dashboard',
				'routes/site-health',
			],
		} )
	);
	expect( stderr ).toBe( '' );
	expect( status ).toBe( 0 );
} );

test( 'fails when a route has TypeScript files but no tsconfig', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: {},
			routes: {
				dashboard: {
					tsconfigs: {},
					files: [ 'route.ts' ],
				},
			},
			build: [],
			root: [ './tsconfig.build.json' ],
		} )
	);
	expect( stderr ).toContain(
		'Missing tsconfig.json for the TypeScript files of routes/dashboard'
	);
	expect( status ).toBe( 1 );
} );

test( 'passes when a route without a tsconfig has no TypeScript files', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: {},
			routes: {
				dashboard: {
					tsconfigs: {},
					files: [ 'style.scss' ],
				},
			},
			build: [],
			root: [ './tsconfig.build.json' ],
		} )
	);
	expect( stderr ).toBe( '' );
	expect( status ).toBe( 0 );
} );

test( 'fails when a route has TypeScript test files but no test project', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: {},
			routes: {
				dashboard: {
					tsconfigs: { 'tsconfig.json': [] },
					files: [ 'hooks/test/layout.test.ts' ],
				},
			},
			build: [],
			root: [ './tsconfig.build.json', 'routes/dashboard' ],
		} )
	);
	expect( stderr ).toContain(
		'Missing test project for the TypeScript test files of routes/dashboard'
	);
	expect( status ).toBe( 1 );
} );

test( 'fails when a route test project is missing from the root solution', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: {},
			routes: {
				dashboard: {
					tsconfigs: {
						'tsconfig.json': [],
						'tsconfig.test.json': [],
					},
					files: [ 'hooks/test/layout.test.ts' ],
				},
			},
			build: [],
			root: [ './tsconfig.build.json', 'routes/dashboard' ],
		} )
	);
	expect( stderr ).toContain(
		'Missing reference to "routes/dashboard/tsconfig.test.json" in tsconfig.json'
	);
	expect( status ).toBe( 1 );
} );

test( 'passes when a route test project covers the test files', () => {
	const { status, stderr } = runValidator(
		createRepo( {
			packages: {},
			routes: {
				dashboard: {
					tsconfigs: {
						'tsconfig.json': [],
						'tsconfig.test.json': [],
					},
					files: [ 'hooks/test/layout.test.ts' ],
				},
			},
			build: [],
			root: [
				'./tsconfig.build.json',
				'routes/dashboard',
				'routes/dashboard/tsconfig.test.json',
			],
		} )
	);
	expect( stderr ).toBe( '' );
	expect( status ).toBe( 0 );
} );
