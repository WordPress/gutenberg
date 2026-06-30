#!/usr/bin/env node

/**
 * External dependencies
 */
import spawn from 'cross-spawn';
import { fileURLToPath } from 'url';
import path from 'path';

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
 * Main build orchestration function.
 */
async function build() {
	const skipTypes = process.argv.includes( '--skip-types' );

	console.log( '🔨 Starting build process...\n' );

	const startTime = Date.now();

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

		if ( ! skipTypes ) {
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
		}

		console.log( '\n📦 Building vendor files...' );
		await exec( 'node', [
			path.join( __dirname, 'packages/build-vendors.mjs' ),
		] );

		console.log( '\n📦 Building packages (production mode)...' );
		const buildArgs = process.argv
			.slice( 2 )
			.filter( ( arg ) => arg !== '--skip-types' );
		await exec( 'wp-build', buildArgs, {
			env: { ...process.env, NODE_ENV: 'production' },
		} );

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
