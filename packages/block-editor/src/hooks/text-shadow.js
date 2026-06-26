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

export const TEXT_SHADOW_SUPPORT_KEY = 'typography.textShadow';
const { kebabCase } = unlock( componentsPrivateApis );

/**
 * Filters registered block settings, extending attributes to include
 * the `textShadow` attribute.
 *
 * @param {Object} settings Original block settings.
 * @return {Object}         Filtered block settings.
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, TEXT_SHADOW_SUPPORT_KEY ) ) {
		return settings;
	}

	// Allow blocks to specify a default value if needed.
	if ( ! settings.attributes.textShadow ) {
		Object.assign( settings.attributes, {
			textShadow: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject the text shadow preset
 * class name.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 * @return {Object}           Filtered props applied to save element.
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, TEXT_SHADOW_SUPPORT_KEY ) ) {
		return props;
	}

	if (
		shouldSkipSerialization(
			blockType,
			TYPOGRAPHY_SUPPORT_KEY,
			'textShadow'
		)
	) {
		return props;
	}

	if ( ! attributes?.textShadow ) {
		return props;
	}

	// Use TokenList to dedupe classes.
	const classes = new TokenList( props.className );
	classes.add( `has-${ kebabCase( attributes?.textShadow ) }-text-shadow` );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

function useBlockProps( { name, textShadow } ) {
	return addSaveProps( {}, name, { textShadow } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'textShadow' ],
	hasSupport( name ) {
		return hasBlockSupport( name, TEXT_SHADOW_SUPPORT_KEY );
	},
};

/**
 * Resets the text shadow block support attribute. This can be used when
 * disabling the text shadow support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetTextShadow( { setAttributes } ) {
	setAttributes( { textShadow: undefined } );
}

addFilter(
	'blocks.registerBlockType',
	'core/textShadow/addAttribute',
	addAttributes
);
