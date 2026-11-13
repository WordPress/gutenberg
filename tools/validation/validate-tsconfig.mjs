#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, basename, join, relative, resolve, sep } from 'path';
import { existsSync, readFileSync } from 'fs';
import { globSync } from 'glob';
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

/*
 * Ambient types only test files may use. Keep the retired Jest names here so
 * build projects cannot reintroduce them.
 */
const TEST_TYPES = new Set( [
	'jest',
	'gutenberg-test-env',
	'gutenberg-vitest-test-env',
	'vitest/globals',
] );

/*
 * A package exclude replaces the inherited one, so a build project that sets
 * its own must keep every dev-file pattern the base config excludes.
 */
const baseConfigPath = fileURLToPath(
	import.meta.resolve( '@wordpress/monorepo-tools/tsconfig/base.json' )
);
/*
 * The base config anchors its patterns with `${configDir}` so each project
 * excludes its own files. Package projects spell the same patterns relative to
 * themselves, so drop that prefix before comparing.
 */
const REQUIRED_BUILD_EXCLUDES = existsSync( baseConfigPath )
	? ( readTsconfig( baseConfigPath ).exclude ?? [] )
			.map( ( pattern ) => pattern.replace( /^\$\{configDir\}\//, '' ) )
			.filter( ( pattern ) => /test|stories|story/.test( pattern ) )
	: [];

const packagesWithTypes = globSync( 'packages/*/tsconfig.json', {
	cwd: repoRoot,
} )
	.sort()
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
		typeof extended === 'string' && basename( extended ) === 'dev.base.json'
	);
}

/**
 * Returns the projects of a package: src, dev files, and, where stories are
 * type checked against sources without test types, `tsconfig.stories.json`.
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
		globSync( '**/{test,tests,__tests__,stories}/**/*.{ts,tsx,mts,cts}', {
			cwd: resolve( repoRoot, 'packages', packageName ),
			ignore: [ 'node_modules/**', 'build/**', 'build-*/**' ],
		} ).length > 0 ||
		globSync( '**/*.story.{ts,tsx,mts,cts}', {
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
			'gutenberg-vitest-test-env',
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
 * Route and widget projects emit nothing and no other project references them,
 * so only the root solution registration puts them under `npm run typecheck`.
 */
const entriesWithTypes = globSync( '{routes,widgets}/*/tsconfig.json', {
	cwd: repoRoot,
	posix: true,
} )
	.sort()
	.map( ( tsconfigPath ) => dirname( tsconfigPath ) );

/*
 * Registration is only enforced for entries with a tsconfig.json, so an entry
 * without one would keep its TypeScript files out of the type check silently.
 */
const entryNames = globSync( '{routes,widgets}/*/', {
	cwd: repoRoot,
	posix: true,
} )
	.sort()
	.map( ( entryDir ) => entryDir.replace( /\/$/, '' ) );

for ( const entryName of entryNames ) {
	if ( entriesWithTypes.includes( entryName ) ) {
		continue;
	}
	const hasTypeScriptFiles =
		globSync( '**/*.{ts,tsx,mts,cts}', {
			cwd: resolve( repoRoot, entryName ),
			ignore: [ 'node_modules/**', 'build/**' ],
		} ).length > 0;
	if ( hasTypeScriptFiles ) {
		reportError(
			`Missing tsconfig.json for the TypeScript files of ${ entryName }`
		);
	}
}

for ( const entryName of entriesWithTypes ) {
	const entryDir = resolve( repoRoot, entryName );
	const entryProject = join( entryDir, 'tsconfig.json' );
	const entryTestProject = join( entryDir, 'tsconfig.test.json' );

	if ( ! rootSolutionReferences.has( entryProject ) ) {
		reportError( `Missing reference to "${ entryName }" in tsconfig.json` );
	}

	/*
	 * The entry project excludes test directories, so TypeScript test files
	 * are only checked when a registered test project covers them.
	 */
	const hasTestFiles =
		globSync( '**/{test,tests,__tests__}/**/*.{ts,tsx,mts,cts}', {
			cwd: entryDir,
			ignore: [ 'node_modules/**', 'build/**' ],
		} ).length > 0;
	if ( hasTestFiles && ! existsSync( entryTestProject ) ) {
		reportError(
			`Missing test project for the TypeScript test files of ${ entryName }`
		);
	}
	if (
		existsSync( entryTestProject ) &&
		! rootSolutionReferences.has( entryTestProject )
	) {
		reportError(
			`Missing reference to "${ entryName }/tsconfig.test.json" in tsconfig.json`
		);
	}

	const packageJsonPath = join( entryDir, 'package.json' );
	if ( ! existsSync( packageJsonPath ) ) {
		continue;
	}
	const references = referencedProjects( entryProject );
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
					entryDir,
					dependencyProject
				) }" in ${ relative( repoRoot, entryProject ) }`
			);
		}
	}
}

/*
 * A reference into another package is a build-graph edge, so it must be backed
 * by a declared dependency, or removed dependencies leave stale references.
 */
const workspaceProjects = globSync(
	'{packages,routes,widgets}/*/tsconfig*.json',
	{
		cwd: repoRoot,
		posix: true,
	}
).sort();

for ( const projectPath of workspaceProjects ) {
	const workspaceDir = dirname( projectPath );
	const packageJsonPath = resolve( repoRoot, workspaceDir, 'package.json' );
	if ( ! existsSync( packageJsonPath ) ) {
		continue;
	}
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	const declared = new Set( [
		...Object.keys( packageJson.dependencies ?? {} ),
		...Object.keys( packageJson.devDependencies ?? {} ),
		...Object.keys( packageJson.peerDependencies ?? {} ),
		...Object.keys( packageJson.optionalDependencies ?? {} ),
	] );

	for ( const reference of referencedProjects(
		resolve( repoRoot, projectPath )
	) ) {
		const referenceFromRoot = relative( repoRoot, reference )
			.split( sep )
			.join( '/' );
		if ( ! referenceFromRoot.startsWith( 'packages/' ) ) {
			continue;
		}
		const referencedPackage = referenceFromRoot.split( '/' )[ 1 ];
		if ( workspaceDir === `packages/${ referencedPackage }` ) {
			continue;
		}
		if ( ! declared.has( `@wordpress/${ referencedPackage }` ) ) {
			reportError(
				`Reference to "packages/${ referencedPackage }" in ${ projectPath } without a dependency on "@wordpress/${ referencedPackage }". Remove the reference, or add the dependency to package.json.`
			);
		}
	}
}

process.exit( hasErrors ? 1 : 0 );
