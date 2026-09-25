import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import TokenList from '@wordpress/token-list';
import { kebabCase } from '@wordpress/kebab-case';
import { shouldSkipSerialization } from './utils';
import { TYPOGRAPHY_SUPPORT_KEY } from './typography';

export const TEXT_SHADOW_SUPPORT_KEY = 'typography.textShadow';

interface TextShadowAttributes {
	textShadow?: string;
}

interface SaveProps {
	className?: string;
	[ key: string ]: unknown;
}

/**
 * Filters registered block settings, extending attributes to include
 * the `textShadow` attribute.
 *
 * @param settings Original block settings.
 * @return Filtered block settings.
 */
function addAttributes( settings: BlockType ) {
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
 * @param props      Additional props applied to save element.
 * @param blockType  Block type.
 * @param attributes Block attributes.
 * @return Filtered props applied to save element.
 */
function addSaveProps(
	props: SaveProps,
	blockType: string | BlockType,
	attributes: TextShadowAttributes | undefined
) {
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
	classes.add( `has-${ kebabCase( attributes.textShadow ) }-text-shadow` );
	const newClassName = classes.value;
	props.className = newClassName ? newClassName : undefined;

	return props;
}

function useBlockProps( {
	name,
	textShadow,
}: TextShadowAttributes & { name: string } ) {
	return addSaveProps( {}, name, { textShadow } );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'textShadow' ],
	hasSupport( name: string ) {
		return hasBlockSupport( name, TEXT_SHADOW_SUPPORT_KEY );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/textShadow/addAttribute',
	addAttributes
);
