#!/usr/bin/env node
/*
 * Verifies that the `peerDependencies` ranges a published workspace declares
 * on other workspace packages admit the version those packages are at, and the
 * version their unreleased changelog entries will release as.
 *
 * Catching the second case in the pull request that adds the "Breaking Changes"
 * entry avoids a follow-up range bump after the release.
 */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';

// Loaded untyped so this project does not pull the release tool into its sources.
const { calculateVersionBumpFromChangelog } = createRequire( import.meta.url )(
	'../release/commands/common.js'
) as {
	calculateVersionBumpFromChangelog: (
		lines: string[],
		minimumVersionBump: 'patch' | 'minor' | 'major',
		currentVersion: string
	) => 'patch' | 'minor' | 'major' | null;
};

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
 * The version the package releases as, by the release tool's own rules, or
 * `null` when its changelog has no unreleased changes.
 *
 * @param version   Current version.
 * @param changelog Changelog contents.
 */
export function nextReleaseVersion(
	version: string,
	changelog: string
): string | null {
	const bump = calculateVersionBumpFromChangelog(
		changelog.split( '\n' ),
		'patch',
		version
	);
	return bump ? semver.inc( version, bump ) : null;
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
			const next =
				target.changelog &&
				nextReleaseVersion( current, target.changelog );
			if ( next ) {
				expected.push( [
					next,
					'the version its unreleased changelog entries will release as',
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
