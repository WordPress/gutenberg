#!/usr/bin/env node

/**
 * External dependencies
 */
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

/**
 * Execute a command and return a promise.
 *
 * @param {string}   command Command to execute.
 * @param {string[]} args    Command arguments.
 * @param {Object}   options Spawn options.
 * @return {Promise<void>} Promise that resolves when command completes.
 */
function exec( command, args = [], options = {} ) {
	const silent = options.silent || false;
	const spawnOptions = { ...options };
	delete spawnOptions.silent;

	return new Promise( ( resolve, reject ) => {
		const childOptions = {
			cwd: ROOT_DIR,
			stdio: silent ? 'pipe' : 'inherit',
			shell: true,
			...spawnOptions,
		};

		const child = spawn( command, args, childOptions );

		// If silent, capture output to show only on error
		let stdout = '';
		let stderr = '';

		if ( silent ) {
			if ( child.stdout ) {
				child.stdout.on( 'data', ( data ) => {
					stdout += data.toString();
				} );
			}
			if ( child.stderr ) {
				child.stderr.on( 'data', ( data ) => {
					stderr += data.toString();
				} );
			}
		}

		child.on( 'exit', ( code ) => {
			if ( code === 0 ) {
				resolve();
			} else {
				// On error, show captured output if it was silent
				if ( silent && ( stdout || stderr ) ) {
					if ( stdout ) {
						process.stdout.write( stdout );
					}
					if ( stderr ) {
						process.stderr.write( stderr );
					}
				}
				reject(
					new Error(
						`Command failed: ${ command } ${ args.join( ' ' ) }`
					)
				);
			}
		} );

		child.on( 'error', reject );
	} );
}

/**
 * Execute a command without waiting for it to complete.
 * Used for starting watch processes.
 *
 * @param {string}   command Command to execute.
 * @param {string[]} args    Command arguments.
 * @param {Object}   options Spawn options.
 * @return {Object} Child process.
 */
function execAsync( command, args = [], options = {} ) {
	return spawn( command, args, {
		cwd: ROOT_DIR,
		stdio: 'inherit',
		shell: true,
		...options,
	} );
}

/**
 * Create and clean up a marker file to signal that the build is ready.
 * The marker file can be watched by other processes that depend on the build.
 */
const readyMarkerFile = {
	markerPath: path.join( ROOT_DIR, '.dev-ready' ),
	create() {
		fs.writeFileSync( this.markerPath, Date.now().toString() );
	},
	cleanup() {
		if ( fs.existsSync( this.markerPath ) ) {
			fs.unlinkSync( this.markerPath );
		}
	},
};

/**
 * Main dev orchestration function.
 */
async function dev() {
	console.log( '🔨 Starting development build...\n' );

	const startTime = Date.now();

	// Clean up marker file from previous runs
	readyMarkerFile.cleanup();

	try {
		/*
		 * Step 0: Verify node_modules is in sync with package-lock.json.
		 *
		 * GUTENBERG_CHECK_INSTALLED_DEPS controls when this runs:
		 *   - `BEFORE_BUILD` (default): pre-build gate.
		 *   - `NEVER`: skip entirely (sticky opt-out for power users).
		 */
		if ( process.env.GUTENBERG_CHECK_INSTALLED_DEPS === 'NEVER' ) {
			console.log(
				'🔍 Skipping dependency check (GUTENBERG_CHECK_INSTALLED_DEPS=NEVER).'
			);
		} else {
			console.log( '🔍 Checking dependencies...' );
			await exec( 'npm', [
				'run',
				'check-installed-deps',
				'--workspace',
				'@wordpress/validation-tools',
				'--silent',
			] ).catch( () => {
				throw new Error( 'Run `npm install` to update.' );
			} );
		}

		console.log( '\n🧹 Cleaning packages...' );
		await exec( 'npm', [ 'run', 'clean:packages' ], { silent: true } );

		console.log( '\n📦 Building workspaces...' );
		await exec(
			'npm',
			[ 'run', '--if-present', '--workspaces', '--silent', 'build' ],
			{ silent: true }
		);

		// This must happen before TypeScript compilation because some packages
		// (like vips) have source files that import from generated worker-code.ts
		await exec( 'node', [
			path.join( __dirname, 'packages/generate-worker-placeholders.mjs' ),
		] );

		console.log( '\n📘 Building TypeScript types...\n' );
		const tsStartTime = Date.now();
		await exec( 'tsgo', [ '--build' ] ).catch( () => {
			console.error(
				'\n❌ TypeScript compilation failed. Try cleaning up first: `npm run clean:package-types`'
			);
			throw new Error( 'TypeScript compilation failed' );
		} );
		const buildTime = Date.now() - tsStartTime;
		console.log( `   ✔ Built TypeScript types (${ buildTime }ms)` );

		console.log( '\n✅ Checking type declaration files...' );
		await exec( 'node', [
			path.join(
				__dirname,
				'packages/check-build-type-declaration-files.cjs'
			),
		] );

		console.log( '\n📦 Building vendor files...' );
		await exec( 'node', [
			path.join( __dirname, 'packages/build-vendors.mjs' ),
		] );

		const setupTime = Date.now() - startTime;
		console.log(
			`\n✅ Initial build completed! (${ Math.round(
				setupTime / 1000
			) }s)\n`
		);

		console.log( '👀 Starting watch mode...\n' );
		console.log( '   - TypeScript compiler watching for type changes' );
		console.log( '   - Package builder watching for source changes\n' );

		// Start TypeScript watch
		const tscWatch = execAsync( 'tsgo', [
			'--build',
			'--watch',
			'--preserveWatchOutput',
		] );

		// Start package build watch and wait for initial build to complete
		// before signaling ready. wp-build outputs "Watching for changes..."
		// when its initial build is done.
		const buildWatch = spawn( 'wp-build', [ '--watch' ], {
			cwd: ROOT_DIR,
			stdio: [ 'inherit', 'pipe', 'inherit' ],
			shell: true,
			env: { ...process.env, NODE_ENV: 'development' },
		} );

		// Handle process termination
		const cleanup = () => {
			console.log( '\n\n👋 Stopping watch mode...' );
			tscWatch.kill();
			buildWatch.kill();
			readyMarkerFile.cleanup();
			process.exit( 0 );
		};

		process.on( 'SIGINT', cleanup );
		process.on( 'SIGTERM', cleanup );

		// Wait for wp-build to complete its initial build, then signal ready.
		// Using .then() ensures cleanup handlers are registered before awaiting,
		// so early termination still triggers cleanup.
		let isReady = false;
		buildWatch.stdout.on( 'data', async ( data ) => {
			const output = data.toString();
			process.stdout.write( output );
			if ( ! isReady && output.includes( 'Watching for changes' ) ) {
				isReady = true;

				// Build blocks manifests after initial build completes
				const blocksDirs = [
					{
						input: 'build/scripts/block-library',
						output: 'build/scripts/block-library/blocks-manifest.php',
					},
					{
						input: 'build/scripts/edit-widgets/blocks',
						output: 'build/scripts/edit-widgets/blocks/blocks-manifest.php',
					},
					{
						input: 'build/scripts/widgets/blocks',
						output: 'build/scripts/widgets/blocks/blocks-manifest.php',
					},
				];
				for ( const { input, output: outputPath } of blocksDirs ) {
					await exec(
						'wp-scripts',
						[
							'build-blocks-manifest',
							`--input=${ input }`,
							`--output=${ outputPath }`,
						],
						{ silent: true }
					);
				}

				readyMarkerFile.create();
			}
		} );

		// Keep the process running
		await new Promise( () => {} );
	} catch ( error ) {
		console.error( '\n❌ Dev build failed:', error.message );
		process.exit( 1 );
	}
}

/**
 * Warn if a webpack process is watching this checkout. A stale webpack
 * dev server (e.g. left over from a previous setup) can clobber the
 * non-minified index.js files in build/scripts/ with webpack chunk
 * format, breaking the editor when SCRIPT_DEBUG is enabled.
 *
 * Best-effort and intentionally non-fatal: webpack processes that
 * happen to be running for an unrelated project shouldn't block
 * `npm run dev`. Match against this checkout's path (with trailing /)
 * to avoid false positives on sibling directories.
 */
function checkForConflictingProcesses() {
	try {
		const ps = execSync( 'ps aux', { encoding: 'utf-8' } );
		const repoPathPrefix = ROOT_DIR + '/';
		const webpackLines = ps
			.split( '\n' )
			.filter(
				( line ) =>
					/webpack/.test( line ) &&
					! /grep/.test( line ) &&
					! line.includes( String( process.pid ) ) &&
					line.includes( repoPathPrefix )
			);

		if ( webpackLines.length === 0 ) {
			return;
		}

		const pids = webpackLines
			.map( ( line ) => line.trim().split( /\s+/ )[ 1 ] )
			.filter( Boolean );

		console.warn(
			`\n⚠️  Found ${ pids.length } webpack process(es) that look like they may be watching this checkout:\n`
		);
		for ( const line of webpackLines ) {
			console.warn( `   ${ line.trim() }` );
		}
		console.warn(
			`\nA stale webpack dev server can overwrite esbuild output in build/scripts/`
		);
		console.warn(
			`with webpack chunk format, breaking the editor when SCRIPT_DEBUG is enabled.`
		);
		console.warn(
			`If things look wrong, kill them with:  kill -9 ${ pids.join(
				' '
			) }\n`
		);
	} catch {
		// If ps fails, just continue — this is a best-effort check.
	}
}

checkForConflictingProcesses();
dev();
