#!/usr/bin/env node

/**
 * External dependencies
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '..' );

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
 * Track the git HEAD to detect branch switches.
 * Stale TypeScript declaration files from a previous branch cause build
 * errors, so we clean them automatically when the HEAD changes.
 */
const headTracker = {
	markerPath: path.join( ROOT_DIR, '.dev-head' ),
	getCurrentHead() {
		try {
			return fs
				.readFileSync( path.join( ROOT_DIR, '.git', 'HEAD' ), 'utf8' )
				.trim();
		} catch {
			return null;
		}
	},
	hasChanged() {
		const currentHead = this.getCurrentHead();
		if ( ! currentHead ) {
			return false;
		}
		try {
			const previousHead = fs
				.readFileSync( this.markerPath, 'utf8' )
				.trim();
			return currentHead !== previousHead;
		} catch {
			// No marker file means first run — no need to clean.
			return false;
		}
	},
	save() {
		const currentHead = this.getCurrentHead();
		if ( currentHead ) {
			fs.writeFileSync( this.markerPath, currentHead );
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
		// Step 1: Clean packages
		console.log( '🧹 Cleaning packages...' );
		await exec( 'npm', [ 'run', 'clean:packages' ], { silent: true } );

		// Step 1.5: Clean TypeScript types if git HEAD changed (e.g. branch switch).
		// Stale build-types from a previous branch cause compilation errors.
		if ( headTracker.hasChanged() ) {
			console.log(
				'\n🔄 Branch change detected — cleaning TypeScript types...'
			);
			await exec( 'npm', [ 'run', 'clean:package-types' ], {
				silent: true,
			} );
		}

		// Step 2: Build workspaces
		console.log( '\n📦 Building workspaces...' );
		await exec(
			'npm',
			[ 'run', '--if-present', '--workspaces', '--silent', 'build' ],
			{ silent: true }
		);

		// Step 2.5: Generate worker placeholders
		// This must happen before TypeScript compilation because some packages
		// (like vips) have source files that import from generated worker-code.ts
		await exec( 'node', [
			'./bin/packages/generate-worker-placeholders.mjs',
		] );

		// Step 3: Validate TypeScript version
		console.log( '\n🔍 Validating TypeScript version...' );
		await exec( 'node', [
			'./bin/packages/validate-typescript-version.js',
		] );

		// Step 4: Build TypeScript types
		console.log( '\n📘 Building TypeScript types...' );
		await exec( 'tsc', [ '--build' ] ).catch( () => {
			console.error(
				'\n❌ TypeScript compilation failed. Try cleaning up first: `npm run clean:package-types`'
			);
			throw new Error( 'TypeScript compilation failed' );
		} );

		// Save current HEAD so next run can detect branch switches.
		headTracker.save();

		// Step 5: Check build type declaration files
		console.log( '\n✅ Checking type declaration files...' );
		await exec( 'node', [
			'./bin/packages/check-build-type-declaration-files.js',
		] );

		// Step 6: Build vendors
		console.log( '\n📦 Building vendor files...' );
		await exec( 'node', [ './bin/packages/build-vendors.mjs' ] );

		const setupTime = Date.now() - startTime;
		console.log(
			`\n✅ Initial build completed! (${ Math.round(
				setupTime / 1000
			) }s)\n`
		);

		// Step 7: Start watch mode with both TypeScript and package builds
		console.log( '👀 Starting watch mode...\n' );
		console.log( '   - TypeScript compiler watching for type changes' );
		console.log( '   - Package builder watching for source changes\n' );

		// Start TypeScript watch
		let tscWatch = execAsync( 'tsc', [
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

		// Watch for branch switches while dev mode is running.
		// When the branch changes, stale build-types cause tsc errors,
		// so we kill tsc, clean types, rebuild, and restart.
		const gitHeadPath = path.join( ROOT_DIR, '.git', 'HEAD' );
		let lastHead = headTracker.getCurrentHead();
		let isRebuilding = false;

		fs.watchFile( gitHeadPath, { interval: 2000 }, async () => {
			const newHead = headTracker.getCurrentHead();
			if ( newHead === lastHead || isRebuilding ) {
				return;
			}
			lastHead = newHead;
			isRebuilding = true;

			console.log(
				'\n\n🔄 Branch switch detected — rebuilding TypeScript types...\n'
			);

			tscWatch.kill();

			try {
				await exec( 'npm', [ 'run', 'clean:package-types' ], {
					silent: true,
				} );
				await exec( 'tsc', [ '--build' ] );
				headTracker.save();
				console.log(
					'\n✅ TypeScript types rebuilt for new branch.\n'
				);
			} catch {
				console.error(
					'\n❌ TypeScript rebuild failed after branch switch.' +
						' Try restarting: npm start\n'
				);
			}

			tscWatch = execAsync( 'tsc', [
				'--build',
				'--watch',
				'--preserveWatchOutput',
			] );
			isRebuilding = false;
		} );

		// Handle process termination
		const cleanup = () => {
			console.log( '\n\n👋 Stopping watch mode...' );
			fs.unwatchFile( gitHeadPath );
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

dev();
