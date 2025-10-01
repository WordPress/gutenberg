/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Filters registered block settings, extending attributes with allowedBlocks.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( settings?.attributes?.allowedBlocks?.type ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'allowedBlocks' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			allowedBlocks: {
				type: 'array',
			},
		};
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/allowedBlocks/attribute',
	addAttribute
);
