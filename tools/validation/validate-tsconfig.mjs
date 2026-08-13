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

const packagesWithTypes = glob
	.sync( 'packages/*/tsconfig.json', { cwd: repoRoot } )
	.map( ( tsconfigPath ) => basename( dirname( tsconfigPath ) ) );

/**
 * Returns the projects a package builds its declarations from and, if any,
 * type checks its dev files with. Packages that are not split yet build from
 * `tsconfig.json` and may carry a separate `tsconfig.test.json`.
 *
 * @param {string} packageName Package directory name.
 * @return {{srcProject: string, devProject: string|undefined}} Absolute paths.
 */
function packageProjects( packageName ) {
	const packageDir = resolve( repoRoot, 'packages', packageName );
	const buildProject = join( packageDir, 'tsconfig.build.json' );

	if ( existsSync( buildProject ) ) {
		return {
			srcProject: buildProject,
			devProject: join( packageDir, 'tsconfig.json' ),
		};
	}

	const testProject = join( packageDir, 'tsconfig.test.json' );
	return {
		srcProject: join( packageDir, 'tsconfig.json' ),
		devProject: existsSync( testProject ) ? testProject : undefined,
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

for ( const packageName of packagesWithTypes ) {
	const { srcProject, devProject } = packageProjects( packageName );

	if ( ! buildSolutionReferences.has( srcProject ) ) {
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
	 * the dev project alone leaves the package build without it.
	 */
	const references = srcProjectReferences( srcProject, packageName );

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
				if ( ! references.has( dependencyProject ) ) {
					reportError(
						`Missing reference to "${ relative(
							resolve( repoRoot, 'packages', packageName ),
							dependencyProject
						) }" in ${ relative( repoRoot, srcProject ) }`
					);
				}
			}
		}
	}
}

process.exit( hasErrors ? 1 : 0 );
