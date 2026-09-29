/**
 * Builds `gutenberg.zip`, the archive published to the WordPress.org plugin
 * repository and handed to `wordpress-develop`.
 *
 * Set `NO_CHECKS` to skip the dirty tree guard and the repository reset, which
 * is what CI does on a checkout that is already pristine. Set
 * `IS_WORDPRESS_CORE` to `true` to leave out the icons Core does not ship.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { PLUGIN_FILES } from './plugin-files.mts';

/*
 * Nothing outside Node is imported at load time: this script installs the
 * dependencies it archives with, so on a fresh checkout `node_modules` does not
 * exist yet. `createArchive` imports its two packages once `npm ci` has run.
 */

const REPO_ROOT = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const ICONS_DIR = path.join( REPO_ROOT, 'packages', 'icons', 'src' );
const ARCHIVE = path.join( REPO_ROOT, 'gutenberg.zip' );
const IS_WINDOWS = process.platform === 'win32';

type Colour = 'red' | 'blue' | 'green' | 'yellow';
const announce = ( colour: Colour, message: string ) =>
	console.log( `\n${ styleText( [ 'bold', colour ], message ) }\n` );
const error = ( message: string ) => announce( 'red', message );
const status = ( message: string ) => announce( 'blue', message );
const success = ( message: string ) => announce( 'green', message );
const warning = ( message: string ) => announce( 'yellow', message );

/**
 * Describes a thrown value. A rejection is not always an `Error`: `adm-zip`
 * rejects with a string.
 *
 * @param value The thrown value.
 * @return Something worth printing.
 */
const reason = ( value: unknown ) =>
	value instanceof Error ? value.message : String( value );

/**
 * Runs a command, letting it write straight to this process' streams.
 *
 * @param command Binary to run.
 * @param args    Arguments to pass to it.
 */
function run( command: string, args: string[] ): void {
	if ( IS_WINDOWS ) {
		/*
		 * Windows ships npm as `npm.cmd`, which Node will not launch without a
		 * shell. Handing `shell` an argument array as well is deprecated
		 * (DEP0190), and every argument here is a fixed literal, so the command
		 * line is assembled instead.
		 */
		execFileSync( [ command, ...args ].join( ' ' ), [], {
			cwd: REPO_ROOT,
			stdio: 'inherit',
			shell: true,
		} );
		return;
	}

	execFileSync( command, args, { cwd: REPO_ROOT, stdio: 'inherit' } );
}

/**
 * Runs git and captures what it printed.
 *
 * @param args Arguments to pass to git.
 * @return The trimmed standard output.
 */
function git( ...args: string[] ): string {
	return execFileSync( 'git', args, {
		cwd: REPO_ROOT,
		encoding: 'utf8',
		maxBuffer: Infinity,
	} ).trim();
}

/**
 * Refuses to build from a working tree holding changes. Release builds must be
 * traceable to a particular commit and reliably reproducible.
 */
function assertPristineTree(): void {
	let changed;
	try {
		git( 'diff', '--quiet' );
		git( 'diff', '--cached', '--quiet' );
	} catch {
		changed = true;
	}

	if ( changed ) {
		run( 'git', [ 'status' ] );
		error(
			'ERROR: Cannot build plugin zip with dirty working tree. ☝️\nCommit your changes and try again.'
		);
		process.exit( 1 );
	}
}

/**
 * Removes ignored files so the build starts from a pristine repository. The
 * removals are listed and confirmed first, so nobody loses a file they wanted.
 */
async function resetRepository(): Promise< void > {
	status( 'Resetting the repository to pristine condition. ✨' );

	const toClean = git( 'clean', '-xdf', '--dry-run' );
	if ( ! toClean ) {
		return;
	}

	console.log( toClean );
	warning( '🚨 About to delete everything above! Is this okay? 🚨' );

	const rl = readline.createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );
	const answer = await rl.question( '[y]es/[N]o: ' );
	rl.close();

	if ( ! answer.toLowerCase().startsWith( 'y' ) ) {
		error( 'Fair enough; aborting. Tidy up your repo and try again. 🙂' );
		process.exit( 1 );
	}

	status( 'Cleaning working directory... 🛀' );
	run( 'git', [ 'clean', '-xdf' ] );
}

/**
 * Deletes the icons WordPress Core does not ship. An icon ships when its manifest
 * entry belongs to at least one collection, matching the entries
 * `generateManifestPHP()` writes to `manifest.php`.
 *
 * This runs after the build so that icon collection validation still sees the
 * full library.
 */
function prunePrivateIcons(): void {
	status( 'Pruning non-public icons for WordPress Core... ✂️' );

	const manifest: { filePath: string; collections?: string[] }[] = JSON.parse(
		fs.readFileSync( path.join( ICONS_DIR, 'manifest.json' ), 'utf8' )
	);
	const shipped = new Set(
		manifest
			.filter( ( icon ) => ( icon.collections?.length ?? 0 ) > 0 )
			.map( ( icon ) => icon.filePath )
	);

	const library = fs
		.readdirSync( path.join( ICONS_DIR, 'library' ) )
		.filter( ( file ) => file.endsWith( '.svg' ) )
		.sort();

	for ( const file of library ) {
		const filePath = `library/${ file }`;
		if ( shipped.has( filePath ) ) {
			continue;
		}
		console.log( `  Deleting packages/icons/src/${ filePath }` );
		fs.rmSync( path.join( ICONS_DIR, filePath ) );
	}
}

/**
 * Restores the icons `prunePrivateIcons` deleted, listing them as it goes.
 */
function restorePrivateIcons(): void {
	status( 'Restoring non-public icons... 🔁' );

	const deleted = git(
		'diff',
		'--name-only',
		'--diff-filter=D',
		'--',
		'packages/icons/src'
	);
	if ( deleted ) {
		console.log(
			deleted
				.split( '\n' )
				.map( ( file ) => `  Restoring ${ file }` )
				.join( '\n' )
		);
	}

	run( 'git', [ 'restore', 'packages/icons/src' ] );
}

/**
 * Expands a plugin file entry into a fast-glob pattern. A directory stands for
 * everything below it including dot files, which is what `zip --recurse-paths`
 * gave the shell script. An explicit glob keeps Bash's rule that `*` does not
 * match a leading dot.
 *
 * @param entry Repository-relative path or glob.
 * @return The pattern to match with, and whether it takes dot files.
 */
function toPattern( entry: string ): { pattern: string; dot: boolean } {
	const absolute = path.join( REPO_ROOT, entry );
	const isDirectory =
		fs.existsSync( absolute ) && fs.statSync( absolute ).isDirectory();
	return isDirectory
		? { pattern: `${ entry }/**`, dot: true }
		: { pattern: entry, dot: false };
}

/**
 * Collects the plugin files and writes them to `gutenberg.zip`. Entry paths are
 * repository relative and the archive holds no directory records, matching the
 * `zip --recurse-paths --no-dir-entries` invocation this replaces.
 */
async function createArchive(): Promise< void > {
	status( 'Creating archive... 🎁' );

	const { default: AdmZip } = await import( 'adm-zip' );
	const { default: glob } = await import( 'fast-glob' );

	const seen = new Set< string >();
	const zip = new AdmZip();

	for ( const entry of PLUGIN_FILES ) {
		const { pattern, dot } = toPattern( entry );
		const files = await glob( pattern, {
			cwd: REPO_ROOT,
			onlyFiles: true,
			dot,
		} );

		if ( ! files.length ) {
			warning(
				`Nothing matched ${ entry }; it is missing from the zip.`
			);
			continue;
		}

		for ( const file of files.sort() ) {
			if ( seen.has( file ) ) {
				continue;
			}
			seen.add( file );

			const directory = path.dirname( file );
			zip.addLocalFile(
				path.join( REPO_ROOT, file ),
				directory === '.' ? '' : directory,
				path.basename( file )
			);
		}
	}

	/*
	 * `zip` built the archive in a temporary sibling and renamed it on success,
	 * leaving the previous one intact when a run failed. adm-zip truncates the
	 * target first, and its writer reports a short write as a success, so the
	 * buffer goes to disk through Node.
	 */
	const temporary = `${ ARCHIVE }.${ process.pid }.tmp`;
	try {
		fs.writeFileSync( temporary, await zip.toBufferPromise() );
		fs.renameSync( temporary, ARCHIVE );
	} finally {
		// Cleaning up must not throw over whatever sent us here.
		fs.rmSync( temporary, { force: true, recursive: true } );
	}
}

async function main(): Promise< void > {
	status( '💃 Time to build the Gutenberg plugin ZIP file 🕺' );

	/*
	 * This script runs in Node, so it reads the real environment. The rules
	 * below point at the globals esbuild defines for bundled sources instead.
	 */
	// eslint-disable-next-line @wordpress/no-wp-process-env, @wordpress/wp-global-usage
	const isWordPressCore = process.env.IS_WORDPRESS_CORE === 'true';

	if ( ! process.env.NO_CHECKS ) {
		assertPristineTree();
		await resetRepository();
	}

	status( 'Installing dependencies... 📦' );
	run( 'npm', [ 'cache', 'verify' ] );
	run( 'npm', [ 'ci' ] );

	status( 'Generating build... 👷‍♀️' );
	run( 'npm', [ 'run', 'build' ] );

	// Wrapped, because a thrown value is not necessarily truthy.
	let failure: { error: unknown } | undefined;
	try {
		if ( isWordPressCore ) {
			prunePrivateIcons();
		}
		await createArchive();
	} catch ( archiveError ) {
		/*
		 * Reported here rather than rethrown, so that the icons are restored
		 * first and a restore that fails in turn cannot bury the cause.
		 */
		failure = { error: archiveError };
		error(
			`ERROR: Could not create the archive. ${ reason( archiveError ) }`
		);
	}

	if ( isWordPressCore ) {
		restorePrivateIcons();
	}

	if ( failure ) {
		throw failure.error;
	}

	success( "Done. You've built Gutenberg! 🎉 " );
}

await main();
