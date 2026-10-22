#!/usr/bin/env node
/*
 * Verifies that a `peerDependencies` range on another workspace package
 * accepts that package's current version, so a major release of a package
 * cannot silently fall outside the range its peers declare.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { globSync } from 'glob';
import semver from 'semver';

type Manifest = {
	name?: string;
	version?: string;
	peerDependencies?: Record< string, string >;
};

export type Finding = {
	workspace: string;
	peer: string;
	range: string;
	version: string;
};

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( __dirname, '../..' );

/**
 * Finds peer ranges that exclude the current version of the workspace they
 * name. Peers that are not workspaces, and ranges semver cannot parse (such as
 * a `file:` specifier), are ignored.
 *
 * @param manifests Parsed `package.json` files of every workspace.
 */
export function findStaleWorkspacePeerRanges(
	manifests: Manifest[]
): Finding[] {
	const versions = new Map< string, string >();
	for ( const { name, version } of manifests ) {
		if ( name && version ) {
			versions.set( name, version );
		}
	}

	const findings: Finding[] = [];
	for ( const { name, peerDependencies } of manifests ) {
		for ( const [ peer, range ] of Object.entries(
			peerDependencies ?? {}
		) ) {
			const version = versions.get( peer );
			if (
				version &&
				semver.validRange( range ) &&
				! semver.satisfies( version, range, {
					includePrerelease: true,
				} )
			) {
				findings.push( {
					workspace: name ?? '(unnamed)',
					peer,
					range,
					version,
				} );
			}
		}
	}
	return findings;
}

function readWorkspaceManifests(): Manifest[] {
	const patterns = (
		JSON.parse( readFileSync( join( REPO_ROOT, 'package.json' ), 'utf8' ) )
			.workspaces as string[]
	 ).map( ( pattern ) => `${ pattern }/package.json` );

	const ignore = patterns
		.filter( ( pattern ) => pattern.startsWith( '!' ) )
		.map( ( pattern ) => pattern.slice( 1 ) );
	const include = patterns.filter(
		( pattern ) => ! pattern.startsWith( '!' )
	);

	return globSync( include, { cwd: REPO_ROOT, ignore } ).map(
		( file ) =>
			JSON.parse(
				readFileSync( join( REPO_ROOT, file ), 'utf8' )
			) as Manifest
	);
}

export function run(): number {
	const findings = findStaleWorkspacePeerRanges( readWorkspaceManifests() );

	if ( findings.length === 0 ) {
		console.log(
			'\n   ✔ All workspace peer ranges accept the current version of the package they name.'
		);
		return 0;
	}

	for ( const { workspace, peer, range, version } of findings ) {
		console.error(
			`\n${ workspace }\n  ✖ peer ${ peer } "${ range }" excludes the current version ${ version }`
		);
	}
	console.error(
		`\n   ⚠️  ${ findings.length } stale workspace peer ranges.` +
			'\n   Widen each range to include the current version once the new release is' +
			' compatible, or fix the incompatibility first.'
	);
	return 1;
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( resolve( process.argv[ 1 ] ) ).href
) {
	process.exitCode = run();
}
