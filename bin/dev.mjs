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

		// Step 2: Build workspaces
		console.log( '\n📦 Building workspaces...' );
		await exec(
			'npm',
			[ 'run', '--if-present', '--workspaces', '--silent', 'build' ],
			{ silent: true }
		);

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
		const tscWatch = execAsync( 'tsc', [
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
		const onStdoutData = ( data ) => {
			const output = data.toString();
			process.stdout.write( output );
			if ( output.includes( 'Watching for changes' ) ) {
				buildWatch.stdout.off( 'data', onStdoutData );
				readyMarkerFile.create();
			}
		};
		buildWatch.stdout.on( 'data', onStdoutData );

		// Keep the process running
		await new Promise( () => {} );
	} catch ( error ) {
		console.error( '\n❌ Dev build failed:', error.message );
		process.exit( 1 );
	}
}

dev();
