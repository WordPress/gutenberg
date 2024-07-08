/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	getBlockDefaultClassName,
	getActiveBlockVariation,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { hasVariationClassNameSupport } from '../hooks/supports';

/**
 * Override props assigned to save component to inject generated className if
 * block supports it. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addGeneratedVariationClassName(
	extraProps,
	blockType,
	attributes
) {
	// Adding the generated className.
	if ( hasVariationClassNameSupport( blockType ) ) {
		const activeVariation = getActiveBlockVariation(
			blockType.name,
			attributes
		);

		if ( ! activeVariation ) {
			return extraProps;
		}

		const variationName = `${ blockType.name }/${ activeVariation.name }`;

		if ( typeof extraProps.className === 'string' ) {
			// We have some extra classes and want to add the default classname
			extraProps.className = [
				...new Set( [
					getBlockDefaultClassName( variationName ),
					...extraProps.className.split( ' ' ),
				] ),
			]
				.join( ' ' )
				.trim();
		} else {
			// There is no string in the className variable,
			// so we just dump the default name in there.
			extraProps.className = getBlockDefaultClassName( variationName );
		}
	}

	return extraProps;
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/generated-variation-class-name/save-props',
	addGeneratedVariationClassName
);
