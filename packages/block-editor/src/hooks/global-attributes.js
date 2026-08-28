import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport, GLOBAL_HTML_ATTRIBUTES } from '@wordpress/blocks';

/**
 * Filters registered block settings, extending attributes with globalAttributes
 * holding the global HTML attributes authored on the block's root element.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( settings?.attributes?.globalAttributes?.type ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'globalAttributes', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			globalAttributes: {
				type: 'object',
			},
		};
	}

	return settings;
}

/**
 * Override props assigned to save component to inject the global HTML
 * attributes, if the block supports globalAttributes. Only the attributes in
 * `GLOBAL_HTML_ATTRIBUTES` are serialized, so an unexpected key stored in the
 * block's comment delimiter is never written to the markup.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, 'globalAttributes', true ) ) {
		return extraProps;
	}

	const { globalAttributes } = attributes;

	if ( ! globalAttributes ) {
		return extraProps;
	}

	for ( const attribute of GLOBAL_HTML_ATTRIBUTES ) {
		const value = globalAttributes[ attribute ];
		if ( value !== undefined && value !== '' ) {
			extraProps[ attribute ] = value;
		}
	}

	return extraProps;
}

export default {
	addSaveProps,
	attributeKeys: [ 'globalAttributes' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'globalAttributes', true );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/global-attributes/attribute',
	addAttribute
);
