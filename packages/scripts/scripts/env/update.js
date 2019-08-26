/**
 * External dependencies
 */
const { sync: commandExistsSync } = require( 'command-exists' );
const request = require( 'request' );
const DecompressZip = require( 'decompress-zip' );

/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env, cwd, stdout } = require( 'process' );
const { normalize } = require( 'path' );
const { createWriteStream } = require( 'fs' );
const { tmpdir } = require( 'os' );

env.WP_DEVELOP_DIR = normalize( cwd() + '/wordpress' );

if ( commandExistsSync( 'git' ) ) {
	execSync( 'git pull', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
	buildWordPress();
} else {
	stdout.write( "Git isn't available. Switching to downloading a zip version.\n" );
	const tmpZip = normalize( tmpdir() + '/wordpress-develop.zip' );
	const tmpZipWriter = createWriteStream( tmpZip );

	// Set up the unzipper to unzip the archive when it finishes downloading.
	tmpZipWriter.on( 'finish', () => {
		const unzipper = new DecompressZip( tmpZip );

		unzipper.on( 'extract', buildWordPress );

		stdout.write( 'Extracting...\n' );

		unzipper.extract( {
			path: env.WP_DEVELOP_DIR,
			strip: 1,
			filter: ( file ) => file.type !== 'Directory',
		} );
	} );

	stdout.write( 'Downloading...\n' );
	// Download the archive.
	request( 'https://github.com/WordPress/wordpress-develop/archive/master.zip' ).pipe( tmpZipWriter );
}

/**
 * Runs the appropriate build/install commands in the WordPress directory.
 */
function buildWordPress() {
	execSync( 'npm install', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
	execSync( 'npm run env:start', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
	if ( env.LOCAL_DIR === 'build' ) {
		execSync( 'npm run build', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
	} else {
		execSync( 'npm run build:dev', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
	}

	// Ensure the plugin is still mounted.
	execSync( 'npm run env connect', { stdio: 'inherit' } );
}
