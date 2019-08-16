/**
 * External dependencies
 */
const commandExistsSync = require( 'command-exists' ).sync;
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

env.WP_DEVELOP_DIR = cwd() + '/wordpress';

if ( commandExistsSync( 'git' ) ) {
	execSync( 'git clone --depth=1 git://develop.git.wordpress.org/ wordpress', { stdio: 'inherit' } );
	buildWordPress();
} else {
	stdout.write( "Git isn't availabe. Switching to downloading a zip version.\n" );
	const tmpZip = normalize( tmpdir() + '/wordpress-develop.zip' );
	const tmpZipWriter = createWriteStream( tmpZip );

	// Set up the unzipper to unzip the archive when it finishes downloading.
	tmpZipWriter.on( 'finish', () => {
		const unzipper = new DecompressZip( tmpZip );

		unzipper.on( 'extract', buildWordPress );

		stdout.write( 'Extracing...\n' );

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
	execSync( 'npm install', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	execSync( 'npm run env:start', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	execSync( 'npm run build:dev', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	execSync( 'npm run env:install', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );

	// Mount Gutenberg into the WordPress install.
	execSync( 'npm run env connect', { stdio: 'inherit' } );
	execSync( 'npm run env cli plugin activate gutenberg', { stdio: 'inherit' } );
}
