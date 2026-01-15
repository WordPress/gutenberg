#!/usr/bin/env node

/**
 * External dependencies
 */
import spawn from 'cross-spawn';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import glob from 'fast-glob';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '..' );
const PACKAGES_DIR = path.join( ROOT_DIR, 'packages' );

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
 * Generate placeholder files for worker code in packages that define wpWorkers.
 * This must run before TypeScript compilation because vips-worker.ts imports worker-code.ts.
 */
async function generateWorkerPlaceholders() {
	const packageJsonPaths = await glob(
		path.join( PACKAGES_DIR, '*', 'package.json' ).replace( /\\/g, '/' )
	);

	for ( const packageJsonPath of packageJsonPaths ) {
		try {
			const packageJsonContent = await readFile( packageJsonPath, 'utf8' );
			const packageJson = JSON.parse( packageJsonContent );

			if ( packageJson.wpWorkers ) {
				const packageDir = path.dirname( packageJsonPath );
				const workerCodeFile = path.join( packageDir, 'src', 'worker-code.ts' );

				try {
					await access( workerCodeFile );
					// File exists, no need to create placeholder
				} catch {
					// File doesn't exist, create placeholder
					const placeholderContent = `/**
 * Worker code for inline Blob URL creation.
 *
 * This file is a placeholder that gets overwritten by the build process.
 * If you see this placeholder content at runtime, run \`npm run build\` first.
 *
 * @package gutenberg
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const workerCode = '/* Placeholder - run npm run build to generate actual worker code */';
`;
					await mkdir( path.dirname( workerCodeFile ), { recursive: true } );
					await writeFile( workerCodeFile, placeholderContent );
				}
			}
		} catch {
			// Skip packages with invalid package.json
		}
	}
}

/**
 * Main build orchestration function.
 */
async function build() {
	const skipTypes = process.argv.includes( '--skip-types' );

	console.log( '🔨 Starting build process...\n' );

	const startTime = Date.now();

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

		// Step 2.5: Generate worker placeholders
		// This must happen before TypeScript compilation because some packages
		// (like vips) have source files that import from generated worker-code.ts
		console.log( '\n🔧 Generating worker placeholders...' );
		await generateWorkerPlaceholders();

		if ( ! skipTypes ) {
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
		}

		// Step 6: Build vendors
		console.log( '\n📦 Building vendor files...' );
		await exec( 'node', [ './bin/packages/build-vendors.mjs' ] );

		// Step 7: Build packages
		console.log( '\n📦 Building packages (production mode)...' );
		const buildArgs = process.argv
			.slice( 2 )
			.filter( ( arg ) => arg !== '--skip-types' );
		await exec( 'wp-build', buildArgs, {
			env: { ...process.env, NODE_ENV: 'production' },
		} );

		// Step 7.5: Build blocks manifests
		console.log( '\n📦 Building blocks manifests...' );
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
		for ( const { input, output } of blocksDirs ) {
			await exec(
				'wp-scripts',
				[
					'build-blocks-manifest',
					`--input=${ input }`,
					`--output=${ output }`,
				],
				{ silent: true }
			);
		}

		// Step 8: Build workspace :wp targets
		console.log( '\n📦 Building workspace :wp targets...' );
		await exec(
			'npm',
			[ 'run', '--if-present', '--workspaces', '--silent', 'build:wp' ],
			{ silent: true }
		);

		const totalTime = Date.now() - startTime;
		console.log(
			`\n🎉 Build completed successfully! (${ Math.round(
				totalTime / 1000
			) }s total)`
		);
	} catch ( error ) {
		console.error( '\n❌ Build failed:', error.message );
		process.exit( 1 );
	}
}

build();
