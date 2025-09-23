/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Filters registered block settings, extending attributes to include `blockCommentId` as a global attribute.
 * This ensures that blockCommentId is always available for all blocks, similar to metadata and lock attributes.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addBlockCommentGlobalAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( 'type' in ( settings.attributes?.blockCommentId ?? {} ) ) {
		return settings;
	}

	// Gracefully handle if settings.attributes is undefined.
	settings.attributes = {
		...settings.attributes,
		blockCommentId: {
			type: 'number',
		},
	};

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/blockComment/addGlobalAttribute',
	addBlockCommentGlobalAttribute
);
