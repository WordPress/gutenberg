/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import TokenList from '@wordpress/token-list';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { shouldSkipSerialization } from './utils';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';
import { unlock } from '../lock-unlock';

export const FONT_FAMILY_SUPPORT_KEY = 'typography.__experimentalFontFamily';
const { kebabCase } = unlock( componentsPrivateApis );

/**
 * Filters registered block settings, extending attributes to include
 * the `fontFamily` attribute.
 *
 * @param {Object} settings Original block settings
 * @return {Object}         Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, FONT_FAMILY_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes.fontFamily ) {
		Object.assign( settings.attributes, {
			fontFamily: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject font family.
 *
 * @param {Object} props      Additional props applied to save element
 * @param {Object} blockType  Block type
 * @param {Object} attributes Block attributes
 * @return {Object}           Filtered props applied to save element
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, FONT_FAMILY_SUPPORT_KEY ) ) {
		return props;
	}

	if (
		shouldSkipSerialization(
			blockType,
			TYPOGRAPHY_SUPPORT_KEY,
			'fontFamily'
		)
	) {
		return props;
	}

	if ( ! attributes?.fontFamily ) {
		return props;
	}

	// Use TokenList to dedupe classes.
	const classes = new TokenList( props.className );
	classes.add( `has-${ kebabCase( attributes?.fontFamily ) }-font-family` );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

function useBlockProps( { name, fontFamily } ) {
	return addSaveProps( {}, name, { fontFamily } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fontFamily' ],
	hasSupport( name ) {
		return hasBlockSupport( name, FONT_FAMILY_SUPPORT_KEY );
	},
};

/**
 * Resets the font family block support attribute. This can be used when
 * disabling the font family support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetFontFamily( { setAttributes } ) {
	setAttributes( { fontFamily: undefined } );
}

addFilter(
	'blocks.registerBlockType',
	'core/fontFamily/addAttribute',
	addAttributes
);
