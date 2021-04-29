'use strict';
/**
 * External dependencies
 */
const util = require( 'util' );
const SimpleGit = require( 'simple-git' );
const fs = require( 'fs' );
const got = require( 'got' );
const path = require( 'path' );

/**
 * Promisified dependencies
 */
const pipeline = util.promisify( require( 'stream' ).pipeline );
const extractZip = util.promisify( require( 'extract-zip' ) );
const rimraf = util.promisify( require( 'rimraf' ) );
const copyDir = util.promisify( require( 'copy-dir' ) );

/**
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * Downloads the given source if necessary. The specific action taken depends
 * on the source type.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
module.exports = async function downloadSource( source, options ) {
	if ( source.type === 'git' ) {
		await downloadGitSource( source, options );
	} else if ( source.type === 'zip' ) {
		await downloadZipSource( source, options );
	}
};

/**
 * Clones the git repository at `source.url` into `source.path`. If the
 * repository already exists, it is updated instead.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadGitSource( source, { onProgress, spinner, debug } ) {
	const log = debug
		? ( message ) => {
				spinner.info( `SimpleGit: ${ message }` );
				spinner.start();
		  }
		: () => {};
	onProgress( 0 );

	const progressHandler = ( { progress } ) => {
		onProgress( progress / 100 );
	};

	log( 'Cloning or getting the repo.' );
	const git = SimpleGit( { progress: progressHandler } );

	const isRepo =
		fs.existsSync( source.path ) &&
		( await git.cwd( source.path ).checkIsRepo( 'root' ) );

	if ( isRepo ) {
		log( 'Repo already exists, using it.' );
	} else {
		await git.clone( source.url, source.path, {
			'--depth': '1',
			'--no-single-branch': null,
		} );
		await git.cwd( source.path );
	}

	log( 'Fetching the specified ref.' );
	await git.fetch( 'origin', source.ref, {
		'--tags': null,
	} );

	log( 'Checking out the specified ref.' );
	await git.checkout( source.ref );

	onProgress( 1 );
}

/**
 * Downloads and extracts the zip file at `source.url` into `source.path`.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadZipSource( source, { onProgress, spinner, debug } ) {
	const log = debug
		? ( message ) => {
				spinner.info( `NodeGit: ${ message }` );
				spinner.start();
		  }
		: () => {};
	onProgress( 0 );

	log( 'Downloading zip file.' );
	const zipName = `${ source.path }.zip`;
	const zipFile = fs.createWriteStream( zipName );

	const responseStream = got.stream( source.url );
	responseStream.on( 'downloadProgress', ( { percent } ) =>
		onProgress( percent )
	);
	await pipeline( responseStream, zipFile );

	log( 'Extracting to temporary folder.' );
	const dirName = `${ source.path }.temp`;
	await extractZip( zipName, { dir: dirName } );

	log( 'Copying to mounted folder and cleaning up.' );
	await Promise.all( [
		rimraf( zipName ),
		...( await fs.promises.readdir( dirName ) ).map( ( file ) =>
			copyDir( path.join( dirName, file ), source.path )
		),
	] );
	await rimraf( dirName );

	onProgress( 1 );
}
