import { store as coreStore } from '@wordpress/core-data';

/**
 * Invalidates every cached `getEntityRecords` resolution for the `attachment`
 * post type, so views listing media by parent re-resolve against the server.
 *
 * `invalidateResolution` clears only the exact query passed to it, which is no
 * use here: the queries that need clearing are other components' — the Gallery
 * block's dynamic mode, the inserter's attached-media tab — with their own
 * filters and pagination. `invalidateResolutionForStoreSelector` goes too far
 * the other way and clears every `getEntityRecords` resolution in the store,
 * unrelated entity types included. So this walks the cached resolutions and
 * clears just the `[ 'postType', 'attachment', … ]` ones.
 *
 * `@wordpress/media-utils` has its own copy of this, used when its modals close.
 * Duplicated rather than shared: it is a dozen lines over `core-data`'s public
 * API and belongs to neither package, and exporting it across a package boundary
 * would mean a private-API contract with a single consumer.
 *
 * @param {Object} registry A `@wordpress/data` registry.
 */
export default function invalidateAttachmentResolutions( registry ) {
	const resolvers = registry.select( coreStore ).getCachedResolvers();

	// Typed as a plain record, but the values are `EquivalentKeyMap` instances,
	// which iterate like a Map with the selector's arguments as the key.
	const entityRecordResolutions = resolvers.getEntityRecords;

	entityRecordResolutions?.forEach( ( _value, args ) => {
		if ( args[ 0 ] === 'postType' && args[ 1 ] === 'attachment' ) {
			registry
				.dispatch( coreStore )
				.invalidateResolution( 'getEntityRecords', args );
		}
	} );
}
