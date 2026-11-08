import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { shouldSkipSerialization } from './utils';

/**
 * Filters registered block settings, extending attributes with ariaLabel using aria-label
 * of the first node.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
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
 * @param extraProps Additional props applied to save element.
 * @param blockType  Block type.
 * @param attributes Current block attributes.
 *
 * @return Filtered props applied to save element.
 */
export function addSaveProps(
	extraProps: Record< string, unknown >,
	blockType: BlockType,
	attributes: Record< string, unknown >
): Record< string, unknown > {
	if (
		hasBlockSupport( blockType, 'ariaLabel' ) &&
		! shouldSkipSerialization( blockType, 'ariaLabel', 'ariaLabel' )
	) {
		extraProps[ 'aria-label' ] =
			attributes.ariaLabel === '' ? null : attributes.ariaLabel;
	}

	return extraProps;
}

export default {
	addSaveProps,
	attributeKeys: [ 'ariaLabel' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, 'ariaLabel' );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/ariaLabel/attribute',
	addAttribute
);
