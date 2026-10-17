import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import TokenList from '@wordpress/token-list';
import { kebabCase } from '@wordpress/kebab-case';
import { shouldSkipSerialization } from './utils';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';
import type { BlockSupportEditProps, BlockWrapperProps } from './types';

export const FONT_FAMILY_SUPPORT_KEY = 'typography.__experimentalFontFamily';

/**
 * Filters registered block settings, extending attributes to include
 * the `fontFamily` attribute.
 *
 * @param settings Original block settings
 * @return Filtered block settings
 */
function addAttributes( settings: BlockType ): BlockType {
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
 * @param props                 Additional props applied to save element
 * @param blockType             Block type
 * @param attributes            Block attributes
 * @param attributes.fontFamily Font family preset slug
 * @return Filtered props applied to save element
 */
function addSaveProps(
	props: BlockWrapperProps,
	blockType: BlockType | string,
	attributes: { fontFamily?: string }
): BlockWrapperProps {
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

function useBlockProps( {
	name,
	fontFamily,
}: {
	name: string;
	fontFamily?: string;
} ) {
	return addSaveProps( {}, name, { fontFamily } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'fontFamily' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, FONT_FAMILY_SUPPORT_KEY );
	},
};

/**
 * Resets the font family block support attribute. This can be used when
 * disabling the font family support controls for a block via a progressive
 * discovery panel.
 *
 * @param props               Block props.
 * @param props.setAttributes Function to set block's attributes.
 */
export function resetFontFamily( {
	setAttributes,
}: Pick< BlockSupportEditProps, 'setAttributes' > ) {
	setAttributes( { fontFamily: undefined } );
}

addFilter(
	'blocks.registerBlockType',
	'core/fontFamily/addAttribute',
	addAttributes
);
