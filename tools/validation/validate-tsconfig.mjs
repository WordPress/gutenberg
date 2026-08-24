#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, basename, join, relative, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import glob from 'glob';
import JSONC from 'jsonc-parser';

let hasErrors = false;

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const repoRoot = resolve( process.argv[ 2 ] ?? resolve( __dirname, '../..' ) );

function readTsconfig( tsconfigPath ) {
	return JSONC.parse( readFileSync( tsconfigPath, 'utf8' ) );
}

/**
 * Resolves a project reference the way TypeScript does: a directory resolves
 * to the `tsconfig.json` it contains.
 *
 * @param {string} baseDir       Directory the reference is written in.
 * @param {string} referencePath Reference path, relative to `baseDir`.
 * @return {string} Absolute path of the referenced tsconfig file.
 */
function resolveReference( baseDir, referencePath ) {
	const resolved = resolve( baseDir, referencePath );
	return resolved.endsWith( '.json' )
		? resolved
		: join( resolved, 'tsconfig.json' );
}

function referencedProjects( tsconfigPath ) {
	const baseDir = dirname( tsconfigPath );
	return new Set(
		( readTsconfig( tsconfigPath ).references ?? [] ).map( ( reference ) =>
			resolveReference( baseDir, reference.path )
		)
	);
}

function reportError( message ) {
	console.error( message );
	hasErrors = true;
}

/*
 * The build solution compiles package sources; the root solution adds the
 * per-package dev projects covering test and story files.
 */
const buildSolutionPath = resolve( repoRoot, 'tsconfig.build.json' );
const rootSolutionPath = resolve( repoRoot, 'tsconfig.json' );
const buildSolutionReferences = referencedProjects( buildSolutionPath );
const rootSolutionReferences = referencedProjects( rootSolutionPath );

/*
 * Without this reference `npm run typecheck` still exits cleanly, but the
 * sources of packages without a dev project silently drop out.
 */
if ( ! rootSolutionReferences.has( buildSolutionPath ) ) {
	reportError(
		'Missing reference to "./tsconfig.build.json" in tsconfig.json'
	);
}

/* Ambient types only test files may use. */
const TEST_TYPES = new Set( [ 'jest', 'gutenberg-test-env' ] );

/*
 * A package exclude replaces the inherited one, so a build project that sets
 * its own must keep every dev-file pattern the base config excludes.
 */
const baseConfigPath = resolve( repoRoot, 'tsconfig.base.json' );
const REQUIRED_BUILD_EXCLUDES = existsSync( baseConfigPath )
	? ( readTsconfig( baseConfigPath ).exclude ?? [] ).filter( ( pattern ) =>
			/test|stories|story/.test( pattern )
	  )
	: [];

const packagesWithTypes = glob
	.sync( 'packages/*/tsconfig.json', { cwd: repoRoot } )
	.map( ( tsconfigPath ) => basename( dirname( tsconfigPath ) ) );

/**
 * Whether a project extends the shared dev configuration, which packages use
 * for the files they never publish declarations for.
 *
 * @param {string} tsconfigPath Absolute path of the project.
 * @return {boolean} Whether the project is a dev project.
 */
function isDevProject( tsconfigPath ) {
	const extended = readTsconfig( tsconfigPath ).extends;
	return (
		typeof extended === 'string' &&
		basename( extended ) === 'tsconfig.dev.base.json'
	);
}

/**
 * Returns the projects of a package: src, dev files, and, where stories are
 * type checked against sources without jest types, `tsconfig.stories.json`.
 *
 * @param {string} packageName Package directory name.
 * @return {{srcProject: string|undefined, devProject: string|undefined, storiesProject: string|undefined}} Absolute paths.
 */
function packageProjects( packageName ) {
	const packageDir = resolve( repoRoot, 'packages', packageName );
	const buildProject = join( packageDir, 'tsconfig.build.json' );
	const defaultProject = join( packageDir, 'tsconfig.json' );
	const storiesConfig = join( packageDir, 'tsconfig.stories.json' );
	const storiesProject = existsSync( storiesConfig )
		? storiesConfig
		: undefined;

	if ( existsSync( buildProject ) ) {
		return {
			srcProject: buildProject,
			devProject: defaultProject,
			storiesProject,
		};
	}

	/*
	 * A package that emits no declarations needs no build project: its
	 * default project checks src along with the dev files.
	 */
	if ( isDevProject( defaultProject ) ) {
		return {
			srcProject: undefined,
			devProject: defaultProject,
			storiesProject,
		};
	}

	const testProject = join( packageDir, 'tsconfig.test.json' );
	return {
		srcProject: join( packageDir, 'tsconfig.json' ),
		devProject: existsSync( testProject ) ? testProject : undefined,
		storiesProject,
	};
}

/**
 * Returns every project the src project reaches, following the references it
 * makes to other projects of the same package, as package solutions do.
 *
 * @param {string} srcProject  Absolute path of the src project.
 * @param {string} packageName Package directory name.
 * @return {Set<string>} Absolute paths of the referenced projects.
 */
function srcProjectReferences( srcProject, packageName ) {
	const packageDir = resolve( repoRoot, 'packages', packageName );
	const collected = new Set();
	const pending = [ srcProject ];

	while ( pending.length > 0 ) {
		for ( const reference of referencedProjects( pending.pop() ) ) {
			if ( collected.has( reference ) ) {
				continue;
			}
			collected.add( reference );
			if ( ! relative( packageDir, reference ).startsWith( '..' ) ) {
				pending.push( reference );
			}
		}
	}

	return collected;
}

/**
 * Whether the package has TypeScript test or story files anywhere, which
 * only a dev project checks. The single build project never sees them.
 *
 * @param {string} packageName Package directory name.
 * @return {boolean} Whether dev files exist.
 */
function hasDevFiles( packageName ) {
	return (
		glob.sync( '**/{test,tests,__tests__,stories}/**/*.{ts,tsx}', {
			cwd: resolve( repoRoot, 'packages', packageName ),
			ignore: [ 'node_modules/**', 'build/**', 'build-*/**' ],
		} ).length > 0 ||
		glob.sync( '**/*.story.{ts,tsx}', {
			cwd: resolve( repoRoot, 'packages', packageName ),
			ignore: [ 'node_modules/**', 'build/**', 'build-*/**' ],
		} ).length > 0
	);
}

for ( const packageName of packagesWithTypes ) {
	const { srcProject, devProject, storiesProject } =
		packageProjects( packageName );

	if ( ! devProject && hasDevFiles( packageName ) ) {
		reportError(
			`Missing dev project for the TypeScript test or story files of packages/${ packageName }`
		);
	}

	if ( srcProject && ! buildSolutionReferences.has( srcProject ) ) {
		reportError(
			`Missing reference to "${ relative(
				repoRoot,
				srcProject
			) }" in tsconfig.build.json`
		);
	}

	if ( devProject && ! rootSolutionReferences.has( devProject ) ) {
		reportError(
			`Missing reference to "${ relative(
				repoRoot,
				devProject
			) }" in tsconfig.json`
		);
	}

	if ( storiesProject && ! rootSolutionReferences.has( storiesProject ) ) {
		reportError(
			`Missing reference to "${ relative(
				repoRoot,
				storiesProject
			) }" in tsconfig.json`
		);
	}

	if ( srcProject && devProject && isDevProject( devProject ) ) {
		const buildExclude = readTsconfig( srcProject ).exclude;
		if ( buildExclude ) {
			for ( const pattern of REQUIRED_BUILD_EXCLUDES ) {
				if ( ! buildExclude.includes( pattern ) ) {
					reportError(
						`Missing exclude "${ pattern }" in ${ relative(
							repoRoot,
							srcProject
						) }`
					);
				}
			}
		}
	}

	/*
	 * Tests import the sources, so a dev project must see every ambient type
	 * the build project sees, and the build must not see any test type.
	 */
	if ( srcProject && devProject && isDevProject( devProject ) ) {
		const buildTypes =
			readTsconfig( srcProject ).compilerOptions?.types ?? [];
		const devTypes = readTsconfig( devProject ).compilerOptions?.types ?? [
			'jest',
		];
		for ( const type of buildTypes ) {
			if ( TEST_TYPES.has( type ) ) {
				reportError(
					`Test type "${ type }" in ${ relative(
						repoRoot,
						srcProject
					) }`
				);
			} else if ( ! devTypes.includes( type ) ) {
				reportError(
					`Missing type "${ type }" in ${ relative(
						repoRoot,
						devProject
					) }`
				);
			}
		}
	}

	let packageJson;
	try {
		packageJson = JSON.parse(
			readFileSync(
				resolve( repoRoot, `packages/${ packageName }/package.json` ),
				'utf8'
			)
		);
	} catch ( e ) {
		console.error(
			`Error parsing package.json for package ${ packageName }`
		);
		throw e;
	}

	/*
	 * Only what the src project reaches counts: a reference that lives in
	 * the dev project alone leaves the package build without it. Packages
	 * without a build project check their dependencies in the dev project.
	 */
	const dependingProject = srcProject ?? devProject;
	const references = srcProjectReferences( dependingProject, packageName );
	// The stories project includes the sources, so it needs the same references.
	const storiesReferences = storiesProject
		? srcProjectReferences( storiesProject, packageName )
		: null;

	if ( packageJson.dependencies ) {
		for ( const dependency of Object.keys( packageJson.dependencies ) ) {
			if ( dependency.startsWith( '@wordpress/' ) ) {
				const dependencyPackageName = dependency.slice(
					'@wordpress/'.length
				);
				if ( ! packagesWithTypes.includes( dependencyPackageName ) ) {
					continue;
				}
				const dependencyProject = packageProjects(
					dependencyPackageName
				).srcProject;
				if ( ! dependencyProject ) {
					continue;
				}
				if ( ! references.has( dependencyProject ) ) {
					reportError(
						`Missing reference to "${ relative(
							resolve( repoRoot, 'packages', packageName ),
							dependencyProject
						) }" in ${ relative( repoRoot, dependingProject ) }`
					);
				}
				if (
					storiesReferences &&
					! storiesReferences.has( dependencyProject )
				) {
					reportError(
						`Missing reference to "${ relative(
							resolve( repoRoot, 'packages', packageName ),
							dependencyProject
						) }" in ${ relative( repoRoot, storiesProject ) }`
					);
				}
			}
		}
	}
}

/*
 * Route projects emit nothing and no other project references them, so only
 * the root solution registration puts them under `npm run typecheck`.
 */
const routesWithTypes = glob
	.sync( 'routes/*/tsconfig.json', { cwd: repoRoot } )
	.map( ( tsconfigPath ) => basename( dirname( tsconfigPath ) ) );

/*
 * Registration is only enforced for routes with a tsconfig.json, so a route
 * without one would keep its TypeScript files out of the type check silently.
 */
const routeNames = glob
	.sync( 'routes/*/', { cwd: repoRoot } )
	.map( ( routeDir ) => basename( routeDir ) );

for ( const routeName of routeNames ) {
	if ( routesWithTypes.includes( routeName ) ) {
		continue;
	}
	const hasTypeScriptFiles =
		glob.sync( '**/*.{ts,tsx}', {
			cwd: resolve( repoRoot, 'routes', routeName ),
			ignore: [ 'node_modules/**', 'build/**' ],
		} ).length > 0;
	if ( hasTypeScriptFiles ) {
		reportError(
			`Missing tsconfig.json for the TypeScript files of routes/${ routeName }`
		);
	}
}

for ( const routeName of routesWithTypes ) {
	const routeDir = resolve( repoRoot, 'routes', routeName );
	const routeProject = join( routeDir, 'tsconfig.json' );
	const routeTestProject = join( routeDir, 'tsconfig.test.json' );

	if ( ! rootSolutionReferences.has( routeProject ) ) {
		reportError(
			`Missing reference to "routes/${ routeName }" in tsconfig.json`
		);
	}

	/*
	 * The route project excludes test directories, so TypeScript test files
	 * are only checked when a registered test project covers them.
	 */
	const hasTestFiles =
		glob.sync( '**/{test,tests,__tests__}/**/*.{ts,tsx}', {
			cwd: routeDir,
			ignore: [ 'node_modules/**', 'build/**' ],
		} ).length > 0;
	if ( hasTestFiles && ! existsSync( routeTestProject ) ) {
		reportError(
			`Missing test project for the TypeScript test files of routes/${ routeName }`
		);
	}
	if (
		existsSync( routeTestProject ) &&
		! rootSolutionReferences.has( routeTestProject )
	) {
		reportError(
			`Missing reference to "routes/${ routeName }/tsconfig.test.json" in tsconfig.json`
		);
	}

	const packageJsonPath = join( routeDir, 'package.json' );
	if ( ! existsSync( packageJsonPath ) ) {
		continue;
	}
	const references = referencedProjects( routeProject );
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	for ( const dependency of Object.keys( packageJson.dependencies ?? {} ) ) {
		if ( ! dependency.startsWith( '@wordpress/' ) ) {
			continue;
		}
		const dependencyPackageName = dependency.slice( '@wordpress/'.length );
		if ( ! packagesWithTypes.includes( dependencyPackageName ) ) {
			continue;
		}
		const dependencyProject = packageProjects(
			dependencyPackageName
		).srcProject;
		if ( ! dependencyProject ) {
			continue;
		}
		if ( ! references.has( dependencyProject ) ) {
			reportError(
				`Missing reference to "${ relative(
					routeDir,
					dependencyProject
				) }" in ${ relative( repoRoot, routeProject ) }`
			);
		}
	}
}

process.exit( hasErrors ? 1 : 0 );
