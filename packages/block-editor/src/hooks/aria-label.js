/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Filters registered block settings, extending attributes with ariaLabel using aria-label
 * of the first node.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( settings?.attributes?.ariaLabel?.type ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'ariaLabel' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			ariaLabel: {
				type: 'string',
			},
		};
	}

	return settings;
}

/**
 * Override props assigned to save component to inject aria-label, if block
 * supports ariaLabel. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( hasBlockSupport( blockType, 'ariaLabel' ) ) {
		extraProps[ 'aria-label' ] =
			attributes.ariaLabel === '' ? null : attributes.ariaLabel;
	}

	return extraProps;
}

export default {
	addSaveProps,
	attributeKeys: [ 'ariaLabel' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'ariaLabel' );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/ariaLabel/attribute',
	addAttribute
);
