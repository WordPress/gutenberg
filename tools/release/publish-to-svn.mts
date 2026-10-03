/**
 * Publishes a prepared release, then verifies every file independently of the
 * commit response. Requires Node.js and Subversion, with no shell utilities.
 */
import {
	spawnSync,
	type SpawnSyncOptionsWithStringEncoding,
	type SpawnSyncReturns,
} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

type Svn = (
	args: string[],
	options: SpawnSyncOptionsWithStringEncoding
) => SpawnSyncReturns< string >;
const spawnSvn: Svn = ( args, options ) => spawnSync( 'svn', args, options );

/**
 * Runs SVN without a shell. Never include its arguments in an error, since they
 * contain the release credentials.
 *
 * @param args    SVN arguments.
 * @param timeout Optional read deadline, in milliseconds.
 * @param execute SVN subprocess launcher.
 * @return SVN's standard output.
 */
function runSvn(
	args: string[],
	timeout: number | undefined,
	execute: Svn
): string {
	const result = execute( args, {
		encoding: 'utf8',
		timeout,
		killSignal: 'SIGKILL',
		maxBuffer: 16 * 1024 * 1024,
	} );
	if ( result.stderr ) {
		console.error( result.stderr.trimEnd() );
	}
	if ( result.error ) {
		throw new Error( `Could not run SVN: ${ result.error.message }` );
	}
	if ( result.status !== 0 ) {
		throw new Error( 'SVN command failed.' );
	}
	return result.stdout;
}

/**
 * Compares paths, bytes and symlink targets without following symlinks. File
 * permissions are ignored, as with the previous GNU diff comparison.
 *
 * @param expected Preserved release tree.
 * @param actual   Exported SVN tree.
 * @param relative Path used in mismatch diagnostics.
 * @return Whether the two trees match.
 */
function treesMatch(
	expected: string,
	actual: string,
	relative = ''
): boolean {
	// Directory entries preserve filename case even when path lookup does not.
	const expectedNames = new Set( fs.readdirSync( expected ) );
	const actualNames = new Set( fs.readdirSync( actual ) );
	const names = new Set( [ ...expectedNames, ...actualNames ] );
	let matches = true;
	for ( const name of names ) {
		const expectedPath = path.join( expected, name );
		const actualPath = path.join( actual, name );
		const label = relative ? `${ relative }/${ name }` : name;
		const expectedStat = expectedNames.has( name )
			? fs.lstatSync( expectedPath )
			: undefined;
		const actualStat = actualNames.has( name )
			? fs.lstatSync( actualPath )
			: undefined;
		if ( ! expectedStat || ! actualStat ) {
			console.error(
				`Only in ${ expectedStat ? 'expected' : 'actual' }: ${ label }`
			);
			matches = false;
		} else if ( expectedStat.isDirectory() && actualStat.isDirectory() ) {
			if ( ! treesMatch( expectedPath, actualPath, label ) ) {
				matches = false;
			}
		} else if (
			( expectedStat.isFile() &&
				actualStat.isFile() &&
				fs
					.readFileSync( expectedPath )
					.equals( fs.readFileSync( actualPath ) ) ) ||
			( expectedStat.isSymbolicLink() &&
				actualStat.isSymbolicLink() &&
				fs.readlinkSync( expectedPath ) ===
					fs.readlinkSync( actualPath ) )
		) {
			continue;
		} else {
			console.error(
				`Files expected/${ label } and actual/${ label } differ`
			);
			matches = false;
		}
	}
	return matches;
}

/**
 * Publishes once and retries only reads. The SVN function can be replaced by
 * the integration tests to simulate failed responses and delayed visibility.
 *
 * @param args    Command arguments: source directory and trunk or tag.
 * @param env     Release configuration and credentials.
 * @param execute SVN subprocess launcher.
 */
export async function publishToSvn(
	args: string[],
	env: NodeJS.ProcessEnv = process.env,
	execute: Svn = spawnSvn
): Promise< void > {
	if ( args.length !== 2 ) {
		throw new Error( 'Usage: publish-to-svn <source-dir> <trunk|tag>' );
	}
	const [ source, mode ] = args;
	if ( mode !== 'trunk' && mode !== 'tag' ) {
		throw new Error( 'Expected publish mode trunk or tag.' );
	}
	for ( const name of [
		'PLUGIN_REPO_URL',
		'VERSION',
		'SVN_USERNAME',
		'SVN_PASSWORD',
	] ) {
		if ( ! env[ name ] ) {
			throw new Error( `Expected ${ name } to be set.` );
		}
	}
	const repoUrl = env.PLUGIN_REPO_URL!;
	const version = env.VERSION!;
	if ( ! /^[0-9]+\.[0-9]+\.[0-9]+$/.test( version ) ) {
		throw new Error( 'Expected a stable release version.' );
	}
	const timeout = env.SVN_VERIFY_TIMEOUT || '900';
	const interval = env.SVN_VERIFY_RETRY_INTERVAL || '30';
	if (
		! [ timeout, interval ].every(
			( value ) =>
				/^[1-9][0-9]*$/.test( value ) &&
				Number.isSafeInteger( Number( value ) * 1000 ) &&
				Number( value ) * 1000 <= 2_147_483_647
		)
	) {
		throw new Error(
			'SVN verification timeout and retry interval must be positive seconds within the Node.js timer limit.'
		);
	}
	const verifyTimeout = Number( timeout ) * 1000;
	const retryInterval = Number( interval ) * 1000;
	const svn = ( command: string[], readTimeout?: number ) =>
		runSvn( command, readTimeout, execute );
	const sourceDir = fs.realpathSync( source );
	if ( ! fs.statSync( sourceDir ).isDirectory() ) {
		throw new Error( 'Expected a prepared release directory.' );
	}
	const svnArgs = [
		'--no-auth-cache',
		'--non-interactive',
		'--username',
		env.SVN_USERNAME!,
		'--password',
		env.SVN_PASSWORD!,
	];
	const tagUrl = `${ repoUrl }/tags/${ version }`;
	const verificationDir = fs.mkdtempSync(
		path.join( os.tmpdir(), 'svn-release-' )
	);
	const expected = path.join( verificationDir, 'expected' );
	const actual = path.join( verificationDir, 'actual' );

	/**
	 * Bounds each remote read by the time left in the current retry window.
	 *
	 * @param deadline End of the retry window, in performance.now() milliseconds.
	 * @param command  SVN read arguments.
	 * @return SVN's standard output.
	 */
	function readSvn( deadline: number, command: string[] ): string {
		const remaining = Math.ceil( deadline - performance.now() );
		if ( remaining <= 0 ) {
			throw new Error( 'SVN verification deadline reached.' );
		}
		return svn(
			[
				...command,
				...svnArgs,
				'--config-option=servers:global:http-timeout=60',
			],
			remaining
		);
	}

	/**
	 * Retries a read with exponential backoff, capped by one verification window.
	 *
	 * @param operation Read or comparison to attempt.
	 * @param message   Retry diagnostic.
	 * @param failure   Error after the window expires.
	 */
	async function retry(
		operation: ( deadline: number ) => boolean,
		message: string,
		failure: string
	): Promise< void > {
		const deadline = performance.now() + verifyTimeout;
		let delay = retryInterval;
		while ( performance.now() < deadline ) {
			try {
				if ( operation( deadline ) ) {
					return;
				}
			} catch ( error ) {
				console.error(
					error instanceof Error ? error.message : 'SVN read failed.'
				);
			}
			const remaining = deadline - performance.now();
			if ( remaining <= 0 ) {
				break;
			}
			const wait = Math.min( delay, remaining );
			console.log(
				`${ message } Retrying in ${ Math.ceil( wait / 1000 ) } seconds; ${ Math.ceil( remaining / 1000 ) } seconds remain.`
			);
			await setTimeout( wait );
			delay = Math.min( delay * 2, verifyTimeout );
		}
		throw new Error( failure );
	}

	try {
		// Preserve the exact payload before SVN can change the working copy.
		fs.cpSync( sourceDir, expected, {
			recursive: true,
			verbatimSymlinks: true,
			filter: ( file ) => path.basename( file ) !== '.svn',
		} );
		let tagExists = false;
		await retry(
			( deadline ) => {
				// A failed parent lookup must never be mistaken for an absent tag.
				const tags = readSvn( deadline, [
					'list',
					`${ repoUrl }/tags`,
				] );
				tagExists = tags.split( /\r?\n/ ).includes( `${ version }/` );
				return true;
			},
			'Could not read SVN tags.',
			`Could not read SVN tags within ${ timeout } seconds. No publication was attempted. Check SVN access, then rerun the workflow.`
		);

		if ( tagExists ) {
			console.log(
				`SVN tag tags/${ version } already exists. Verifying its contents before accepting the release.`
			);
		} else {
			let command: string[];
			if ( mode === 'trunk' ) {
				console.log( svn( [ 'add', '--force', sourceDir ] ) );
				const status = svn( [ 'status', sourceDir ] );
				for ( const line of status.split( /\r?\n/ ) ) {
					if ( line.startsWith( '!' ) ) {
						console.log( svn( [ 'rm', line.slice( 8 ) ] ) );
					}
				}
				const tagDir = path.join(
					path.dirname( sourceDir ),
					'tags',
					version
				);
				console.log( svn( [ 'copy', sourceDir, tagDir ] ) );
				command = [
					'commit',
					sourceDir,
					tagDir,
					'-m',
					`Releasing version ${ version }`,
				];
			} else {
				command = [
					'import',
					sourceDir,
					tagUrl,
					'-m',
					`Committing version ${ version }`,
				];
			}
			try {
				console.log(
					svn( [
						...command,
						...svnArgs,
						'--config-option=servers:global:http-timeout=600',
					] )
				);
			} catch {
				console.log(
					'::warning::SVN reported a publish error. Checking the repository to determine whether the release was committed.'
				);
			}
		}

		await retry(
			( deadline ) => {
				const revision = readSvn( deadline, [
					'info',
					'--show-item',
					'revision',
					repoUrl,
				] ).trim();
				if ( ! /^[0-9]+$/.test( revision ) ) {
					throw new Error( 'SVN did not return a valid revision.' );
				}
				const paths = [ `tags/${ version }` ];
				if ( mode === 'trunk' ) {
					paths.push( 'trunk' );
				}
				// Pin every export in this attempt to the same revision. Never
				// repeat a write whose response may have been lost.
				for ( const remotePath of paths ) {
					fs.rmSync( actual, { recursive: true, force: true } );
					readSvn( deadline, [
						'export',
						'--quiet',
						'--ignore-externals',
						'--ignore-keywords',
						'-r',
						revision,
						`${ repoUrl }/${ remotePath }@${ revision }`,
						actual,
					] );
					if ( ! treesMatch( expected, actual ) ) {
						console.error(
							`SVN ${ remotePath } at revision ${ revision } does not match the prepared release.`
						);
						return false;
					}
				}
				console.log(
					`Verified SVN release ${ version } at revision ${ revision }: ${ paths.join( ' ' ) } match the prepared release.`
				);
				if ( env.GITHUB_STEP_SUMMARY ) {
					fs.appendFileSync(
						env.GITHUB_STEP_SUMMARY,
						`Verified SVN release ${ version } at revision ${ revision }. All files in ${ paths.join( ' ' ) } match the prepared release.\n`
					);
				}
				return true;
			},
			'Release not yet verified.',
			`Could not verify SVN release ${ version } within ${ timeout } seconds. Inspect the SVN tag and trunk against the prepared release before retrying publication.`
		);
	} finally {
		fs.rmSync( verificationDir, { recursive: true, force: true } );
	}
}

if ( import.meta.main ) {
	try {
		await publishToSvn( process.argv.slice( 2 ) );
	} catch ( error ) {
		console.error(
			`::error::${ error instanceof Error ? error.message : 'SVN publication failed.' }`
		);
		process.exitCode = 1;
	}
}
