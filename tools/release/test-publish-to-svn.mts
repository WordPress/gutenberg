/**
 * Integration tests against disposable SVN repositories. Requires Node.js,
 * svn and svnadmin. Uses no WordPress.org credentials or network access.
 */
import assert from 'node:assert/strict';
import {
	spawnSync,
	type SpawnSyncOptionsWithStringEncoding,
	type SpawnSyncReturns,
} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, type TestContext } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publishToSvn } from './publish-to-svn.mts';

const SCRIPT = fileURLToPath(
	new URL( './publish-to-svn.mts', import.meta.url )
);

type Scenario =
	| 'commit-error'
	| 'reject-write'
	| 'read-error'
	| 'delayed-read'
	| 'list-error'
	| 'delayed-list'
	| 'mixed-revisions'
	| 'delayed-content'
	| 'stalled-read';

/**
 * Runs a real command, retaining its stderr without logging credential arguments.
 *
 * @param command Binary to run.
 * @param args    Command arguments.
 * @param timeout Optional command timeout in milliseconds.
 * @return The standard output.
 */
function run( command: string, args: string[], timeout?: number ): string {
	const result = spawnSync( command, args, {
		encoding: 'utf8',
		timeout,
		killSignal: 'SIGKILL',
	} );
	if ( result.stderr ) {
		console.error( result.stderr );
	}
	if ( result.error || result.status !== 0 ) {
		throw new Error(
			result.error?.message || result.stderr || 'SVN command failed.'
		);
	}
	return result.stdout;
}

/**
 * Copies the release into an SVN working copy, keeping relative symlink targets.
 *
 * @param source Prepared release directory.
 * @param target Working copy directory.
 */
function copy( source: string, target: string ): void {
	fs.cpSync( source, target, { recursive: true, verbatimSymlinks: true } );
}

/**
 * Creates one isolated repository and a command runner that can simulate server
 * failures around real SVN commands. There is no shell wrapper or PATH mutation.
 *
 * @param t Test context for temporary files and console capture.
 * @return The repository, payload, configuration and simulated SVN runner.
 */
function setup( t: TestContext ) {
	const root = fs.mkdtempSync( path.join( os.tmpdir(), 'svn-test-' ) );
	t.after( () => fs.rmSync( root, { recursive: true, force: true } ) );
	const logs: string[] = [];
	t.mock.method( console, 'log', ( value: unknown ) =>
		logs.push( String( value ) )
	);
	t.mock.method( console, 'error', ( value: unknown ) =>
		logs.push( String( value ) )
	);
	const source = path.join( root, 'release with spaces' );
	fs.mkdirSync( path.join( source, 'build' ), { recursive: true } );
	fs.writeFileSync(
		path.join( source, 'gutenberg.php' ),
		'Version: 23.9.0\n'
	);
	fs.writeFileSync(
		path.join( source, 'readme.txt' ),
		'Stable tag: 23.9.0\n'
	);
	fs.writeFileSync(
		path.join( source, 'build/file with spaces.js' ),
		'release code\n'
	);
	fs.writeFileSync( path.join( source, 'changelog.txt' ), 'Release notes\n' );
	const repository = path.join( root, 'repository' );
	run( 'svnadmin', [ 'create', repository ] );
	const repoUrl = pathToFileURL( repository ).href;
	run( 'svn', [
		'mkdir',
		`${ repoUrl }/trunk`,
		`${ repoUrl }/tags`,
		'-m',
		'init',
		'-q',
	] );
	const env = {
		PLUGIN_REPO_URL: repoUrl,
		VERSION: '23.9.0',
		SVN_USERNAME: 'test',
		SVN_PASSWORD: 'test',
		SVN_VERIFY_TIMEOUT: '3',
		SVN_VERIFY_RETRY_INTERVAL: '1',
		GITHUB_STEP_SUMMARY: path.join( root, 'summary' ),
	};
	const state = {
		scenario: undefined as Scenario | undefined,
		reads: 0,
		writes: 0,
		changed: false,
	};
	const mutation = path.join( root, 'mutation' );
	const realSvn = ( args: string[], timeout?: number ) =>
		run( 'svn', args, timeout );
	const revision = () =>
		realSvn( [ 'info', '--show-item', 'revision', repoUrl ] ).trim();
	const importTag = () =>
		realSvn( [
			'import',
			source,
			`${ repoUrl }/tags/${ env.VERSION }`,
			'-m',
			'tag',
			'-q',
		] );
	const prepareTrunk = () => {
		const trunk = path.join( root, 'trunk' );
		realSvn( [ 'checkout', `${ repoUrl }/trunk`, trunk, '-q' ] );
		realSvn( [
			'checkout',
			`${ repoUrl }/tags`,
			path.join( root, 'tags' ),
			'--depth=immediates',
			'-q',
		] );
		copy( source, trunk );
		return trunk;
	};
	const failedResponse = ( stderr: string ): SpawnSyncReturns< string > => ( {
		pid: 0,
		output: [ null, '', stderr ],
		stdout: '',
		stderr,
		status: 1,
		signal: null,
	} );
	const svn = (
		args: string[],
		options: SpawnSyncOptionsWithStringEncoding
	): SpawnSyncReturns< string > => {
		const [ command ] = args;
		const { scenario } = state;
		if ( command === 'list' ) {
			if ( scenario === 'list-error' ) {
				return failedResponse( 'svn: E170001: Authorization failed' );
			}
			if ( scenario === 'delayed-list' && state.reads++ < 2 ) {
				return failedResponse( 'svn: E175012: Connection timed out' );
			}
		}
		if ( command === 'commit' || command === 'import' ) {
			state.writes++;
			if ( scenario === 'reject-write' ) {
				return failedResponse( 'svn: E170001: Authorization failed' );
			}
			const output = spawnSync( 'svn', args, options );
			if ( scenario === 'commit-error' ) {
				return {
					...output,
					status: 1,
					stderr: "svn: E160013: '/gutenberg' path not found",
				};
			}
			return output;
		}
		if ( command === 'info' || command === 'export' ) {
			if ( scenario === 'stalled-read' ) {
				return spawnSync(
					process.execPath,
					[ '-e', 'setTimeout( () => {}, 30000 )' ],
					options
				);
			}
			if ( scenario === 'read-error' ) {
				return failedResponse( 'svn: E175012: Connection timed out' );
			}
			if (
				scenario === 'delayed-read' &&
				command === 'info' &&
				state.reads++ < 2
			) {
				return failedResponse(
					'svn: E160013: Revision not yet available'
				);
			}
			if (
				scenario === 'delayed-content' &&
				command === 'info' &&
				state.reads++ === 1
			) {
				realSvn( [
					'checkout',
					`${ repoUrl }/tags/${ env.VERSION }`,
					mutation,
					'-q',
				] );
				copy( source, mutation );
				realSvn( [ 'add', '--force', mutation ] );
				realSvn( [
					'commit',
					mutation,
					'-m',
					'Release becomes available',
					'-q',
				] );
			}
		}
		const output = spawnSync( 'svn', args, options );
		if (
			scenario === 'mixed-revisions' &&
			command === 'export' &&
			! state.changed
		) {
			state.changed = true;
			realSvn( [ 'checkout', repoUrl, mutation, '-q' ] );
			copy( source, path.join( mutation, 'trunk' ) );
			fs.writeFileSync(
				path.join( mutation, 'tags', env.VERSION, 'gutenberg.php' ),
				'wrong release'
			);
			realSvn( [ 'add', '--force', mutation ] );
			realSvn( [ 'commit', mutation, '-m', 'Concurrent change', '-q' ] );
		}
		return output;
	};
	const publish = ( directory = source, mode = 'tag' ) =>
		publishToSvn( [ directory, mode ], env, svn );
	const success = async ( directory = source, mode = 'tag' ) => {
		await publish( directory, mode );
		assert.match(
			logs.join( '\n' ),
			/Verified SVN release 23\.9\.0 at revision/
		);
		assert.match(
			fs.readFileSync( env.GITHUB_STEP_SUMMARY, 'utf8' ),
			/Verified SVN release 23\.9\.0 at revision/
		);
	};
	const failure = async ( directory = source, mode = 'tag' ) => {
		await assert.rejects(
			publish( directory, mode ),
			/Could not (verify SVN release|read SVN tags)/
		);
		assert.doesNotMatch( logs.join( '\n' ), /Verified SVN release/ );
		assert.equal( fs.existsSync( env.GITHUB_STEP_SUMMARY ), false );
	};
	return {
		root,
		source,
		repoUrl,
		env,
		logs,
		state,
		realSvn,
		revision,
		importTag,
		prepareTrunk,
		publish,
		success,
		failure,
	};
}

test( 'reject missing arguments with usage guidance', ( t ) => {
	const root = fs.mkdtempSync( path.join( os.tmpdir(), 'svn-entrypoint-' ) );
	t.after( () => fs.rmSync( root, { recursive: true, force: true } ) );
	const alias = path.join( root, 'publisher.mts' );
	fs.symlinkSync( SCRIPT, alias );
	for ( const entry of [ SCRIPT, alias ] ) {
		const result = spawnSync( process.execPath, [ entry ], {
			encoding: 'utf8',
		} );
		assert.equal( result.status, 1 );
		assert.match( result.stderr, /Usage: / );
		assert.doesNotMatch( result.stderr, /unbound variable|test password/ );
	}
} );

test( 'reject invalid options before publication', async ( t ) => {
	const env: NodeJS.ProcessEnv = {
		PLUGIN_REPO_URL: 'file:///unused',
		VERSION: '23.9.0',
		SVN_USERNAME: 'test',
		SVN_PASSWORD: 'test password',
	};
	const svn = () => {
		assert.fail( 'Invalid options must not run SVN.' );
	};
	for ( const mode of [ '', 'invalid' ] ) {
		await assert.rejects(
			publishToSvn( [ '.', mode ], env, svn ),
			/Expected publish mode/
		);
	}
	for ( const version of [ '23.9.0-rc.1', '../23.9.0' ] ) {
		await assert.rejects(
			publishToSvn( [ '.', 'tag' ], { ...env, VERSION: version }, svn ),
			/Expected a stable release version/
		);
	}
	for ( const value of [ '0', '-1', '1.5', 'invalid', '2147484' ] ) {
		for ( const name of [
			'SVN_VERIFY_TIMEOUT',
			'SVN_VERIFY_RETRY_INTERVAL',
		] ) {
			await assert.rejects(
				publishToSvn(
					[ '.', 'tag' ],
					{ ...env, [ name ]: value },
					svn
				),
				/must be positive seconds/
			);
		}
	}
	for ( const name of [
		'PLUGIN_REPO_URL',
		'VERSION',
		'SVN_USERNAME',
		'SVN_PASSWORD',
	] ) {
		await assert.rejects(
			publishToSvn( [ '.', 'tag' ], { ...env, [ name ]: '' }, svn ),
			new RegExp( `Expected ${ name } to be set` )
		);
	}
	const root = fs.mkdtempSync( path.join( os.tmpdir(), 'svn-options-' ) );
	t.after( () => fs.rmSync( root, { recursive: true, force: true } ) );
	const file = path.join( root, 'file' );
	fs.writeFileSync( file, 'not a release directory' );
	await assert.rejects(
		publishToSvn( [ file, 'tag' ], env, svn ),
		/Expected a prepared release directory/
	);
} );

test( 'publish and verify both trunk and tag', async ( t ) => {
	const f = setup( t );
	const oldTrunk = path.join( f.root, 'old-trunk' );
	f.realSvn( [ 'checkout', `${ f.repoUrl }/trunk`, oldTrunk, '-q' ] );
	fs.writeFileSync( path.join( oldTrunk, 'removed file.js' ), 'obsolete' );
	f.realSvn( [ 'add', path.join( oldTrunk, 'removed file.js' ) ] );
	f.realSvn( [ 'commit', oldTrunk, '-m', 'old', '-q' ] );
	const trunk = f.prepareTrunk();
	fs.rmSync( path.join( trunk, 'removed file.js' ) );
	// Exercise the real CLI and its default runner as well as the injected runner.
	const result = spawnSync( process.execPath, [ SCRIPT, trunk, 'trunk' ], {
		encoding: 'utf8',
		env: { ...process.env, ...f.env },
	} );
	assert.equal( result.status, 0, result.stdout + result.stderr );
	assert.match(
		result.stdout,
		/Verified SVN release.*tags\/23\.9\.0 trunk match/
	);
	assert.equal( f.revision(), '3' );
} );

test( 'accept an identical existing trunk release without a write', async ( t ) => {
	const f = setup( t );
	const trunk = f.prepareTrunk();
	await f.success( trunk, 'trunk' );
	const before = f.revision();
	f.state.writes = 0;
	await f.success( trunk, 'trunk' );
	assert.equal( f.revision(), before );
	assert.equal( f.state.writes, 0 );
} );

test( 'recover after a committed release reports failure', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'commit-error';
	await f.success( f.prepareTrunk(), 'trunk' );
	assert.match( f.logs.join( '\n' ), /E160013/ );
	assert.equal( f.state.writes, 1 );
} );

test( 'accept an identical existing tag without a write', async ( t ) => {
	const f = setup( t );
	f.importTag();
	const before = f.revision();
	await f.success();
	assert.equal( f.revision(), before );
	assert.equal( f.state.writes, 0 );
} );

for ( const difference of [ 'missing', 'changed', 'extra' ] ) {
	test( `reject ${ difference } files despite matching version headers`, async ( t ) => {
		const f = setup( t );
		f.importTag();
		if ( difference === 'missing' ) {
			fs.writeFileSync(
				path.join( f.source, 'missing.js' ),
				'not deployed'
			);
		} else if ( difference === 'changed' ) {
			fs.writeFileSync(
				path.join( f.source, 'build/file with spaces.js' ),
				'different code'
			);
		} else {
			fs.rmSync( path.join( f.source, 'build/file with spaces.js' ) );
		}
		await f.failure();
		assert.match(
			f.logs.join( '\n' ),
			/Only in (expected|actual)|Files expected\/.+ and actual\/.+ differ/
		);
		assert.equal( f.state.writes, 0 );
	} );
}

test( 'reject binary content differences', async ( t ) => {
	const f = setup( t );
	const file = path.join( f.source, 'build/binary.dat' );
	fs.writeFileSync( file, Buffer.from( [ 0, 255, 1 ] ) );
	f.importTag();
	await f.success();
	fs.rmSync( f.env.GITHUB_STEP_SUMMARY );
	f.logs.length = 0;
	fs.writeFileSync( file, Buffer.from( [ 0, 254, 1 ] ) );
	await f.failure();
	assert.match(
		f.logs.join( '\n' ),
		/Files expected\/build\/binary.dat and actual\/build\/binary.dat differ/
	);
} );

test( 'reject differently cased filenames', async ( t ) => {
	// This case also runs without SVN on a case-insensitive host filesystem.
	const root = fs.mkdtempSync(
		path.join( os.tmpdir(), 'svn-filename-case-' )
	);
	t.after( () => fs.rmSync( root, { recursive: true, force: true } ) );
	const source = path.join( root, 'release' );
	fs.mkdirSync( source );
	fs.writeFileSync( path.join( source, 'Expected.js' ), 'same bytes' );
	const logs: string[] = [];
	t.mock.method( console, 'log', ( value: unknown ) =>
		logs.push( String( value ) )
	);
	t.mock.method( console, 'error', ( value: unknown ) =>
		logs.push( String( value ) )
	);
	const env = {
		PLUGIN_REPO_URL: 'file:///unused',
		VERSION: '23.9.0',
		SVN_USERNAME: 'test',
		SVN_PASSWORD: 'test',
		SVN_VERIFY_TIMEOUT: '1',
		SVN_VERIFY_RETRY_INTERVAL: '1',
	};
	const svn = ( args: string[] ): SpawnSyncReturns< string > => {
		let stdout = '';
		if ( args[ 0 ] === 'list' ) {
			stdout = '23.9.0/\n';
		} else if ( args[ 0 ] === 'info' ) {
			stdout = '1\n';
		} else if ( args[ 0 ] === 'export' ) {
			const actual = args[ args.indexOf( '--no-auth-cache' ) - 1 ];
			fs.mkdirSync( actual );
			fs.writeFileSync(
				path.join( actual, 'expected.js' ),
				'same bytes'
			);
		} else {
			assert.fail( `Unexpected SVN command: ${ args[ 0 ] }` );
		}
		return {
			pid: 0,
			output: [ null, stdout, '' ],
			stdout,
			stderr: '',
			status: 0,
			signal: null,
		};
	};
	await assert.rejects(
		publishToSvn( [ source, 'tag' ], env, svn ),
		/Could not verify SVN release/
	);
	assert.match( logs.join( '\n' ), /Only in expected: Expected.js/ );
	assert.match( logs.join( '\n' ), /Only in actual: expected.js/ );
	assert.doesNotMatch( logs.join( '\n' ), /Verified SVN release/ );
} );

test( 'reject symlink target differences even when target contents match', async ( t ) => {
	const f = setup( t );
	fs.writeFileSync(
		path.join( f.source, 'same-content.js' ),
		'release code\n'
	);
	const link = path.join( f.source, 'alias.js' );
	fs.symlinkSync( 'build/file with spaces.js', link );
	f.importTag();
	await f.success();
	fs.rmSync( f.env.GITHUB_STEP_SUMMARY );
	f.logs.length = 0;
	fs.rmSync( link );
	fs.symlinkSync( 'same-content.js', link );
	await f.failure();
	assert.match(
		f.logs.join( '\n' ),
		/Files expected\/alias.js and actual\/alias.js differ/
	);
} );

test( 'a matching tag cannot hide an incomplete trunk release', async ( t ) => {
	const f = setup( t );
	const trunk = f.prepareTrunk();
	f.importTag();
	await f.failure( trunk, 'trunk' );
} );

test( 'a rejected write remains a failure and retries only reads with exponential backoff', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'reject-write';
	f.env.SVN_VERIFY_TIMEOUT = '4';
	await f.failure();
	assert.match( f.logs.join( '\n' ), /Authorization failed/ );
	const retries = [
		...f.logs
			.join( '\n' )
			.matchAll(
				/Release not yet verified\. Retrying in (\d+) seconds; (\d+) seconds remain\./g
			),
	];
	assert.ok( retries.length > 0 );
	let delay = 1;
	for ( const [ , wait, remaining ] of retries ) {
		assert.equal( Number( wait ), Math.min( delay, Number( remaining ) ) );
		delay = Math.min( delay * 2, 4 );
	}
	assert.equal( f.state.writes, 1 );
} );

test( 'a successful write cannot hide failed verification reads', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'read-error';
	await f.failure();
	assert.match( f.logs.join( '\n' ), /Connection timed out/ );
	assert.equal( f.state.writes, 1 );
} );

test( 'retry verification until SVN reads become available', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'delayed-read';
	f.env.SVN_VERIFY_TIMEOUT = '10';
	await f.success( f.prepareTrunk(), 'trunk' );
	assert.ok( f.state.reads >= 3 );
	assert.equal( f.state.writes, 1 );
} );

test( 'recover tag-only imports without changing trunk', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'commit-error';
	const trunkRevision = () =>
		f.realSvn( [
			'info',
			'--show-item',
			'last-changed-revision',
			`${ f.repoUrl }/trunk`,
		] );
	const before = trunkRevision();
	await f.success();
	assert.equal( trunkRevision(), before );
	assert.equal( f.state.writes, 1 );
} );

test( 'failed tag lookup cannot trigger publication', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'list-error';
	const before = f.revision();
	await f.failure();
	assert.equal( f.revision(), before );
	assert.equal( f.state.writes, 0 );
} );

test( 'retry a transient tag lookup before publication', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'delayed-list';
	f.env.SVN_VERIFY_TIMEOUT = '10';
	await f.success();
	assert.ok( f.state.reads >= 3 );
	assert.equal( f.state.writes, 1 );
} );

test( 'never combine matching trees from different revisions', async ( t ) => {
	const f = setup( t );
	const trunk = f.prepareTrunk();
	f.importTag();
	f.state.scenario = 'mixed-revisions';
	await f.failure( trunk, 'trunk' );
	assert.equal( f.state.changed, true );
} );

test( 'retry content differences against a fresh revision', async ( t ) => {
	const f = setup( t );
	f.importTag();
	fs.writeFileSync( path.join( f.source, 'new.js' ), 'new file' );
	f.state.scenario = 'delayed-content';
	f.env.SVN_VERIFY_TIMEOUT = '10';
	await f.success();
	assert.ok( f.state.reads >= 2 );
	assert.equal( f.state.writes, 0 );
} );

test( 'bound a stalled SVN read by the verification deadline', async ( t ) => {
	const f = setup( t );
	f.state.scenario = 'stalled-read';
	const started = performance.now();
	await f.failure();
	assert.ok( performance.now() - started < 10_000 );
	assert.equal( f.state.writes, 1 );
} );
