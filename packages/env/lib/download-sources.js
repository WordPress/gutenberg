'use strict';
/**
 * External dependencies
 */
const util = require( 'util' );
const NodeGit = require( 'nodegit' );
const fs = require( 'fs' );
const got = require( 'got' );
const path = require( 'path' );

/**
 * Promisified dependencies
 */
const pipeline = util.promisify( require( 'stream' ).pipeline );
const extractZip = util.promisify( require( 'extract-zip' ) );
const rimraf = util.promisify( require( 'rimraf' ) );

/**
 * @typedef {import('./config').Config} Config
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * Download each source for each environment. If the same source is used in
 * multiple environments, it will only be downloaded once.
 *
 * @param {Config} config  The wp-env configuration object.
 * @param {Object} spinner The spinner object to show progress.
 * @return {Promise} Returns a promise which resolves when the downloads finish.
 */
module.exports = function downloadSources( config, spinner ) {
	const progresses = {};
	const getProgressSetter = ( id ) => ( progress ) => {
		progresses[ id ] = progress;
		spinner.text =
			'Downloading WordPress.\n' +
			Object.entries( progresses )
				.map(
					( [ key, value ] ) =>
						`  - ${ key }: ${ ( value * 100 ).toFixed( 0 ) }/100%`
				)
				.join( '\n' );
	};

	// Will contain a unique array of sources to download.
	const sources = [];
	const addedSources = {};
	const addSource = ( source ) => {
		if ( source && source.url && ! addedSources[ source.url ] ) {
			sources.push( source );
			addedSources[ source.url ] = true;
		}
	};

	for ( const env of Object.values( config.env ) ) {
		env.pluginSources.forEach( addSource );
		env.themeSources.forEach( addSource );
		addSource( env.coreSource );
	}

	return Promise.all(
		sources.map( ( source ) =>
			downloadSource( source, {
				onProgress: getProgressSetter( source.basename ),
				spinner,
			} )
		)
	);
};

/**
 * Downloads the given source if necessary. The specific action taken depends
 * on the source type. The source is downloaded to source.path.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadSource( source, options ) {
	if ( source.type === 'git' ) {
		await downloadGitSource( source, options );
	} else if ( source.type === 'zip' ) {
		await downloadZipSource( source, options );
	}
}

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
				spinner.info( `NodeGit: ${ message }` );
				spinner.start();
		  }
		: () => {};
	onProgress( 0 );

	const gitFetchOptions = {
		fetchOpts: {
			callbacks: {
				transferProgress( progress ) {
					// Fetches are finished when all objects are received and indexed,
					// so received objects plus indexed objects should equal twice
					// the total number of objects when done.
					onProgress(
						( progress.receivedObjects() +
							progress.indexedObjects() ) /
							( progress.totalObjects() * 2 )
					);
				},
				certificateCheck: () => 0,
				credentials: ( url, userName ) => {
					try {
						return NodeGit.Cred.sshKeyFromAgent( userName );
					} catch {
						return NodeGit.Cred.defaultNew();
					}
				},
			},
		},
	};

	log( 'Cloning or getting the repo.' );
	const repository = await NodeGit.Clone(
		source.url,
		source.clonePath,
		gitFetchOptions
	).catch( () => {
		log( 'Repo already exists, get it.' );
		return NodeGit.Repository.open( source.clonePath );
	} );

	log( 'Fetching the specified ref.' );
	const remote = await repository.getRemote( 'origin' );
	await remote.fetch( source.ref, gitFetchOptions.fetchOpts );
	await remote.disconnect();
	try {
		log( 'Checking out the specified ref.' );
		await repository.checkoutRef(
			await repository
				.getReference( 'FETCH_HEAD' )
				// Sometimes git doesn't update FETCH_HEAD for things
				// like tags so we try another method here.
				.catch(
					repository.getReference.bind( repository, source.ref )
				),
			{
				checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE,
			}
		);
	} catch ( error ) {
		log( 'Ref needs to be set as detached.' );
		await repository.setHeadDetached( source.ref );
	}

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

	log( 'Extracting to temporary directory.' );
	const tempDir = `${ source.path }.temp`;
	await extractZip( zipName, { dir: tempDir } );

	const files = (
		await Promise.all( [
			rimraf( zipName ),
			rimraf( source.path ),
			fs.promises.readdir( tempDir ),
		] )
	 )[ 2 ];

	/**
	 * The plugin container is the extracted directory which is the direct parent
	 * of the contents of the plugin. It seems a zip file can have two fairly
	 * common approaches to where the content lives:
	 * 1. The .zip is the direct container of the files. So after extraction, the
	 *    extraction directory contains plugin contents.
	 * 2. The .zip contains a directory with the same name which is the container.
	 *    So after extraction, the extraction directory contains another directory.
	 *    That subdirectory is the actual container of the plugin contents.
	 *
	 * We support both situations with the following check.
	 */
	let pluginContainer = tempDir;
	const firstSubItem = path.join( tempDir, files[ 0 ] );
	if (
		files.length === 1 &&
		( await fs.promises.lstat( firstSubItem ) ).isDirectory()
	) {
		// In this case, only one sub directory exists, so use that as the container.
		pluginContainer = firstSubItem;
	}
	await fs.promises.rename( pluginContainer, source.path );
	await rimraf( tempDir );

	onProgress( 1 );
}
