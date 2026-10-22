#!/usr/bin/env node
/*
 * Verifies that the `peerDependencies` ranges a published workspace declares
 * on other workspace packages admit the version those packages are at, and the
 * next breaking version when their changelog already announces a breaking change.
 *
 * Catching the second case in the pull request that adds the "Breaking Changes"
 * entry avoids a follow-up range bump after the release.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';

type Manifest = {
	name?: string;
	version?: string;
	private?: boolean;
	peerDependencies?: Record< string, string >;
};

export type Finding = {
	workspace: string;
	peer: string;
	range: string;
	version: string;
	reason: string;
};

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( __dirname, '../..' );

/**
 * Whether the `## Unreleased` section of a changelog has a `### Breaking Changes` heading.
 *
 * @param changelog Changelog contents.
 */
export function hasUnreleasedBreakingChanges( changelog: string ): boolean {
	const match = changelog.match(
		/^## Unreleased\s*$([\s\S]*?)(?=^## |$(?![\s\S]))/m
	);
	return !! match && /^### Breaking Changes\s*$/m.test( match[ 1 ] );
}

/**
 * The first version a breaking change would release as: the next major, or the
 * next minor while the package is still on 0.x.
 *
 * @param version Current version.
 */
export function nextBreakingVersion( version: string ): string | null {
	const parsed = semver.parse( version );
	if ( ! parsed ) {
		return null;
	}
	return parsed.major === 0
		? `0.${ parsed.minor + 1 }.0`
		: `${ parsed.major + 1 }.0.0`;
}

/**
 * Checks the workspace peer ranges of the given manifests.
 *
 * @param workspaces Manifests keyed by workspace path, with the changelog contents if any.
 */
export function findRangeMismatches(
	workspaces: Record< string, { manifest: Manifest; changelog?: string } >
): Finding[] {
	const byName = new Map<
		string,
		{ manifest: Manifest; changelog?: string }
	>();
	for ( const workspace of Object.values( workspaces ) ) {
		if ( workspace.manifest.name ) {
			byName.set( workspace.manifest.name, workspace );
		}
	}

	const findings: Finding[] = [];
	for ( const [ path, { manifest } ] of Object.entries( workspaces ) ) {
		if ( manifest.private ) {
			continue;
		}
		for ( const [ peer, range ] of Object.entries(
			manifest.peerDependencies ?? {}
		) ) {
			const target = byName.get( peer );
			const current = target?.manifest.version;
			if ( ! target || ! current || ! semver.validRange( range ) ) {
				continue;
			}

			const expected: [ string, string ][] = [
				[ current, 'the current version' ],
			];
			const next = nextBreakingVersion( current );
			if (
				next &&
				target.changelog &&
				hasUnreleasedBreakingChanges( target.changelog )
			) {
				expected.push( [
					next,
					'the next breaking version, announced by "Breaking Changes" in its changelog',
				] );
			}

			for ( const [ version, reason ] of expected ) {
				if ( ! semver.satisfies( version, range ) ) {
					findings.push( {
						workspace: path,
						peer,
						range,
						version,
						reason,
					} );
				}
			}
		}
	}
	return findings;
}

function readWorkspaces() {
	const workspaces: Record<
		string,
		{ manifest: Manifest; changelog?: string }
	> = {};
	const packagesDir = join( REPO_ROOT, 'packages' );
	for ( const dir of readdirSync( packagesDir ) ) {
		const manifestPath = join( packagesDir, dir, 'package.json' );
		if ( ! existsSync( manifestPath ) ) {
			continue;
		}
		const changelogPath = join( packagesDir, dir, 'CHANGELOG.md' );
		workspaces[ `packages/${ dir }` ] = {
			manifest: JSON.parse( readFileSync( manifestPath, 'utf8' ) ),
			changelog: existsSync( changelogPath )
				? readFileSync( changelogPath, 'utf8' )
				: undefined,
		};
	}
	return workspaces;
}

function run(): number {
	const findings = findRangeMismatches( readWorkspaces() );
	if ( findings.length === 0 ) {
		console.log(
			'\n   ✔ Workspace peer dependency ranges admit the versions they track.'
		);
		return 0;
	}
	for ( const f of findings ) {
		console.error(
			`\n${ f.workspace }\n  ✖ ${ f.peer }@"${ f.range }" does not admit ${ f.version }, ${ f.reason }.`
		);
	}
	console.error(
		'\n   ⚠️  Widen the peer range in `peerDependencies`, or, if the breaking change' +
			' does not affect this package, extend the range to include the new major' +
			' anyway after confirming compatibility. Add a CHANGELOG entry for the package.'
	);
	return 1;
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( resolve( process.argv[ 1 ] ) ).href
) {
	process.exitCode = run();
}
