'use strict';
/**
 * External dependencies
 */
const NodeGit = require( 'nodegit' );

/**
 * @typedef {import('./config').Source} Source
 */

/**
 * Downloads the given source if necessary. The specific action taken depends
 * on the source type.
 *
 * @param {Source} source The source to download.
 * @param {Object} options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 */
module.exports = async function downloadSource( source, options ) {
	if ( source.type === 'git' ) {
		await downloadGitSource( source, options );
	}
};

/**
 * Clones the git repository at `source.url` into `source.path`. If the
 * repository already exists, it is updated instead.
 *
 * @param {Source} source The source to download.
 * @param {Object} options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 */
async function downloadGitSource( source, { onProgress } ) {
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
			},
		},
	};

	// Clone or get the repo.
	const repository = await NodeGit.Clone(
		source.url,
		source.path,
		gitFetchOptions
	)
		// Repo already exists, get it.
		.catch( () => NodeGit.Repository.open( source.path ) );

	// Checkout the specified ref.
	const remote = await repository.getRemote( 'origin' );
	await remote.fetch( source.ref, gitFetchOptions.fetchOpts );
	await remote.disconnect();
	try {
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
		// Some commit refs need to be set as detached.
		await repository.setHeadDetached( source.ref );
	}

	onProgress( 1 );
}
