#!/usr/bin/env node
/**
 * Resolves the branches and the suite shards the performance workflow runs for a GitHub event.
 * Writes `branches` (`{ name, ref, artifact, sha?, reusable? }[]`), `shards` (`{ shard, suites }[]`),
 * `wp-version`, `plugin-files` (space separated globs from bin/plugin-files.txt) and `build-key`
 * to `$GITHUB_OUTPUT`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { sanitizeBranchName } from './lib/sanitize-branch-name.js';

/*
 * The commit trunk is compared against; must be updated on every WP major release, see
 * https://developer.wordpress.org/block-editor/explanations/architecture/performance/#update-the-reference-commit.
 */
export const REFERENCE_COMMIT = '28d414f1327652e2b49e784ddc12098768991c62';

const SHA_PATTERN = /^[0-9a-f]{40}$/;

/*
 * Suites grouped into CI jobs that run in parallel, balanced by their duration.
 * Every spec in test/performance/specs must appear exactly once.
 */
export const SHARDS = {
	'post-editor': [ 'post-editor' ],
	'site-editor': [ 'site-editor' ],
	'media-and-front-end': [
		'front-end-block-theme',
		'front-end-classic-theme',
		'media-processing',
		'media-upload',
	],
};

/**
 * @param {string[]} suites Names of the spec files in test/performance/specs, without extension.
 * @return {Array<{ shard: string, suites: string }>} Matrix entries for the CI shards.
 */
export function resolveShards( suites ) {
	const assigned = Object.values( SHARDS ).flat();
	const missing = suites.filter( ( suite ) => ! assigned.includes( suite ) );
	const unknown = assigned.filter( ( suite ) => ! suites.includes( suite ) );
	const duplicate = assigned.find(
		( suite, i ) => assigned.indexOf( suite ) !== i
	);
	if ( missing.length || unknown.length || duplicate ) {
		throw new Error(
			`SHARDS in resolve-performance-branches.mjs must list every performance suite exactly once. ` +
				`Missing: ${ missing.join( ', ' ) || 'none' }. Unknown: ${
					unknown.join( ', ' ) || 'none'
				}. Duplicate: ${ duplicate || 'none' }.`
		);
	}
	return Object.entries( SHARDS ).map( ( [ shard, shardSuites ] ) => ( {
		shard,
		suites: shardSuites.join( ',' ),
	} ) );
}

/**
 * @param {string}   name     Branch label shown in the results.
 * @param {string}   ref      Git ref to build.
 * @param {boolean=} reusable Whether a trunk push run may have built this commit already.
 */
function branch( name, ref = name, reusable = undefined ) {
	return {
		name,
		ref,
		artifact: `plugin-${ sanitizeBranchName( name ) }`,
		// Only a commit can be reused; a branch or a tag moves.
		sha: SHA_PATTERN.test( ref ) ? ref : undefined,
		reusable,
	};
}

/**
 * Identifies the recipe that turns a commit into a packaged plugin: a build is reused
 * only by a run that would produce it the same way. Hashing the whole workflow rebuilds
 * more often than strictly needed, but it never needs anyone to remember to invalidate.
 *
 * @param {string} pluginFiles Space separated globs the plugin is packaged from.
 * @param {string} workflow    Contents of the performance workflow.
 * @return {string} Key a reusable build must match to be interchangeable with a fresh one.
 */
export function computeBuildKey( pluginFiles, workflow ) {
	return createHash( 'sha256' )
		.update( [ pluginFiles, workflow ].join( '\n' ) )
		.digest( 'hex' );
}

/**
 * @param {string} readme Contents of readme.txt.
 * @return {string} The `Tested up to` version, major.minor only.
 */
export function getTestedUpToMajor( readme ) {
	const match = readme.match( /^Tested up to: (\d+\.\d+)/m );
	if ( ! match ) {
		throw new Error( 'Unable to read "Tested up to" from readme.txt.' );
	}
	return match[ 1 ];
}

/**
 * @typedef {'tag' | 'head'} RefKind
 * @typedef {(ref: string, kind: RefKind) => boolean} RefExists
 */

/**
 * @typedef ResolveOptions
 *
 * @property {string}    event          GitHub event name.
 * @property {string}    sha            Commit that triggered the workflow.
 * @property {string}    wpMajor        The `Tested up to` version from readme.txt.
 * @property {RefExists} refExists      Whether a tag or branch exists on origin.
 * @property {string=}   baseSha        Pull request base commit.
 * @property {string=}   baseRef        Pull request base branch name.
 * @property {string=}   releaseTag     Release tag name.
 * @property {string=}   inputBranches  `workflow_dispatch` branches input.
 * @property {string=}   inputWpVersion `workflow_dispatch` WP version input.
 */

/**
 * @param {ResolveOptions} options
 * @return {{ branches: Array<{ name: string, ref: string, artifact: string }>, wpVersion: string }} Resolved branches.
 */
export function resolveBranches( options ) {
	const result = resolveBranchesForEvent( options );
	const artifacts = result.branches.map( ( { artifact } ) => artifact );
	const duplicate = artifacts.find(
		( artifact, i ) => artifacts.indexOf( artifact ) !== i
	);
	if ( duplicate ) {
		throw new Error(
			`Branches must have distinct names once sanitized, "${ duplicate }" is used twice.`
		);
	}
	return result;
}

/**
 * @param {ResolveOptions} options
 */
function resolveBranchesForEvent( options ) {
	const { event, sha, wpMajor, refExists } = options;

	switch ( event ) {
		case 'pull_request':
			// The base is pinned to the commit the PR is based on, not the branch tip, so
			// both branches match what the merge commit was built from.
			return {
				branches: [
					branch( sha ),
					branch(
						options.baseRef || '',
						options.baseSha,
						/*
						 * Every push to trunk builds its own commit, so the base of a
						 * trunk PR has usually been built already. Other base branches
						 * are never built by a push run.
						 */
						options.baseRef === 'trunk' || undefined
					),
				],
				wpVersion: '',
			};

		case 'push':
			return {
				branches: [ branch( sha ), branch( REFERENCE_COMMIT ) ],
				wpVersion: wpMajor,
			};

		case 'release': {
			const tag = options.releaseTag || '';
			const version = tag.replace( /^v/, '' );
			if ( ! /^\d+\.\d+\.\d+(-rc\.\d+)?$/.test( version ) ) {
				throw new Error(
					`Release tag '${ tag }' does not resolve to a valid Gutenberg plugin version.`
				);
			}
			const [ major, minor ] = version.split( '.' ).map( Number );
			const current = `release/${ major }.${ minor }`;
			const previousBase10 = major * 10 + minor - 1;
			const previous = `release/${ Math.floor( previousBase10 / 10 ) }.${
				previousBase10 % 10
			}`;
			const wp = `wp/${ wpMajor }`;
			for ( const [ ref, kind, description ] of [
				[ tag, 'tag', 'release tag' ],
				[ current, 'head', 'current release branch' ],
				[ previous, 'head', 'previous release branch' ],
				[ wp, 'head', 'WordPress branch' ],
			] ) {
				if ( ! refExists( ref, kind ) ) {
					throw new Error(
						`Expected ${ description } '${ ref }' to exist in the Gutenberg repository.`
					);
				}
			}
			return {
				branches: [
					branch( wp ),
					branch( previous ),
					branch( current ),
				],
				wpVersion: wpMajor,
			};
		}

		case 'workflow_dispatch': {
			const names = ( options.inputBranches || '' )
				.split( ',' )
				.map( ( name ) => name.trim() )
				.filter( Boolean );
			if ( names.length < 2 ) {
				throw new Error( 'Need at least two branches to compare.' );
			}
			return {
				branches: names.map( ( name ) => branch( name ) ),
				wpVersion: options.inputWpVersion || '',
			};
		}

		default:
			throw new Error( `Unsupported event: ${ event }` );
	}
}

function main() {
	const env = process.env;
	if ( ! env.GITHUB_OUTPUT ) {
		throw new Error(
			'GITHUB_OUTPUT is not set; this script runs in GitHub Actions.'
		);
	}
	const { branches, wpVersion } = resolveBranches( {
		event: env.GITHUB_EVENT_NAME || '',
		sha: env.GITHUB_SHA || '',
		wpMajor: getTestedUpToMajor( fs.readFileSync( 'readme.txt', 'utf8' ) ),
		refExists: ( ref, kind ) => {
			try {
				execFileSync(
					'git',
					[
						'ls-remote',
						'--exit-code',
						kind === 'tag' ? '--tags' : '--heads',
						'origin',
						ref,
					],
					{
						stdio: 'ignore',
					}
				);
				return true;
			} catch {
				return false;
			}
		},
		baseSha: env.BASE_SHA,
		baseRef: env.BASE_REF,
		releaseTag: env.RELEASE_TAG,
		inputBranches: env.INPUT_BRANCHES,
		inputWpVersion: env.INPUT_WP_VERSION,
	} );

	const shards = resolveShards(
		fs
			.readdirSync( path.join( 'test', 'performance', 'specs' ) )
			.filter( ( file ) => file.endsWith( '.spec.js' ) )
			.map( ( file ) => path.basename( file, '.spec.js' ) )
	);

	const pluginFiles = fs
		.readFileSync( path.join( 'bin', 'plugin-files.txt' ), 'utf8' )
		.split( '\n' )
		.map( ( line ) => line.trim() )
		.filter( ( line ) => line && ! line.startsWith( '#' ) )
		.join( ' ' );

	const buildKey = computeBuildKey(
		pluginFiles,
		fs.readFileSync(
			path.join( '.github', 'workflows', 'performance.yml' ),
			'utf8'
		)
	);

	console.log(
		JSON.stringify(
			{ branches, shards, wpVersion, pluginFiles, buildKey },
			null,
			2
		)
	);
	fs.appendFileSync(
		env.GITHUB_OUTPUT,
		[
			`branches=${ JSON.stringify( branches ) }`,
			`shards=${ JSON.stringify( shards ) }`,
			`wp-version=${ wpVersion }`,
			`plugin-files=${ pluginFiles }`,
			`build-key=${ buildKey }`,
			'',
		].join( '\n' )
	);
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
) {
	main();
}
