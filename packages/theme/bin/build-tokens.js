/**
 * External dependencies
 */
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Build script for design tokens.
 *
 * This script:
 * 1. Compiles and runs the primitive token generator
 * 2. Compiles the terrazzo config and runs the Terrazzo build
 * 3. Cleans up temporary files
 */

const TEMP_FILES = [
	'scripts/generate-primitive-tokens/index.mjs',
	'terrazzo.config.mjs',
];

function cleanup() {
	TEMP_FILES.forEach( ( file ) => {
		const filePath = path.join( process.cwd(), file );
		if ( fs.existsSync( filePath ) ) {
			fs.unlinkSync( filePath );
		}
	} );
}

// Ensure cleanup happens even if the process exits unexpectedly
process.on( 'exit', cleanup );
process.on( 'SIGINT', () => {
	cleanup();
	process.exit( 130 );
} );
process.on( 'SIGTERM', () => {
	cleanup();
	process.exit( 143 );
} );

try {
	// Step 1: Compile the primitive token generator
	console.log( '🔨 Compiling primitive token generator...' );
	execSync(
		'npx esbuild scripts/generate-primitive-tokens/index.ts --bundle --platform=node --format=esm --packages=external --outfile=scripts/generate-primitive-tokens/index.mjs',
		{
			stdio: 'inherit',
			cwd: process.cwd(),
		}
	);

	// Step 2: Run the primitive token generator
	console.log( '🎨 Generating primitive tokens...' );
	execSync( 'node scripts/generate-primitive-tokens/index.mjs', {
		stdio: 'inherit',
		cwd: process.cwd(),
	} );

	// Step 3: Compile the terrazzo config
	console.log( '🔨 Compiling terrazzo config...' );
	execSync(
		'npx esbuild terrazzo.config.ts --bundle --platform=node --format=esm --packages=external --outfile=terrazzo.config.mjs',
		{
			stdio: 'inherit',
			cwd: process.cwd(),
		}
	);

	// Step 4: Run terrazzo build
	console.log( '🏗️  Running terrazzo build...' );
	execSync( 'npx tz build --config terrazzo.config.mjs', {
		stdio: 'inherit',
		cwd: process.cwd(),
	} );

	console.log( '✅ Token build complete!' );
} catch ( error ) {
	console.error( '❌ Build failed:', error.message );
	process.exit( 1 );
} finally {
	cleanup();
}
