/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';

export default {
	name: 'core/entity',
	label: __( 'Entity' ),
	getValues( { select, clientId, bindings } ) {
		const { getBlockAttributes } = select( 'core/block-editor' );

		// Get the nav link's id attribute
		const blockAttributes = getBlockAttributes( clientId );
		const entityId = blockAttributes?.id;

		if ( ! entityId ) {
			return {};
		}

		// Get the key from binding args - no key means invalid binding
		const urlBinding = bindings.url;
		if ( ! urlBinding?.args?.key ) {
			return {};
		}

		const key = urlBinding.args.key;

		// For now, only support 'url' key
		if ( key !== 'url' ) {
			return {};
		}

		const { getEntityRecord } = select( coreDataStore );

		// Get the entity type and kind from block attributes
		const { type, kind } = blockAttributes || {};

		let value = '';

		// Handle post types
		if ( kind === 'post-type' ) {
			const post = getEntityRecord(
				'postType',
				type || 'post',
				entityId
			);
			value = post?.link || '';
		}
		// Handle taxonomies
		else if ( kind === 'taxonomy' ) {
			// Convert 'tag' back to 'post_tag' for API calls
			// See https://github.com/WordPress/gutenberg/issues/71979.
			const taxonomySlug = type === 'tag' ? 'post_tag' : type;
			const term = getEntityRecord( 'taxonomy', taxonomySlug, entityId );
			value = term?.link || '';
		}

		// TODO: Add validation to ensure required attributes exist
		// TODO: Add error handling for invalid entity types or missing data
		// TODO: Consider property mapping between posts and terms for future keys
		// TODO: Support additional keys beyond 'url' in the future

		return {
			url: value,
		};
	},
	canUserEditValue() {
		// This binding source provides read-only URLs derived from entity data
		// Users cannot manually edit these values as they are automatically
		// generated from the linked post/term's permalink
		return false;
	},
};
