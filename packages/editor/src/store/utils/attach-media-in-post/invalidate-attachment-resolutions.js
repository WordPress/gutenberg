import { store as coreStore } from '@wordpress/core-data';

/**
 * Clears the cached lists of media, so anything showing media by post asks the
 * server again.
 *
 * It goes through the cached queries one by one because the ones that matter
 * belong to other components and have their own filters and pages: clearing a
 * single exact query would miss them, and clearing every `getEntityRecords`
 * query would take unrelated things with it.
 *
 * `@wordpress/media-utils` has its own copy of this for when its modals close.
 * Kept separate rather than shared across packages for one caller.
 *
 * @param {Object} registry A `@wordpress/data` registry.
 */
export default function invalidateAttachmentResolutions( registry ) {
	const resolvers = registry.select( coreStore ).getCachedResolvers();

	// These behave like a Map, with the selector's arguments as the key.
	const entityRecordResolutions = resolvers.getEntityRecords;

	entityRecordResolutions?.forEach( ( _value, args ) => {
		if ( args[ 0 ] === 'postType' && args[ 1 ] === 'attachment' ) {
			registry
				.dispatch( coreStore )
				.invalidateResolution( 'getEntityRecords', args );
		}
	} );
}
