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
import {
	hasBlockClassNameSupport,
	hasVariationClassNameSupport,
} from '../hooks/supports';

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
export function addGeneratedClassName( extraProps, blockType, attributes ) {
	const generatedClassNames = [];
	if ( hasBlockClassNameSupport( blockType ) ) {
		generatedClassNames.push( getBlockDefaultClassName( blockType.name ) );
	}
	if ( hasVariationClassNameSupport( blockType ) ) {
		const activeVariation = getActiveBlockVariation(
			blockType.name,
			attributes
		);
		if ( activeVariation ) {
			generatedClassNames.push(
				getBlockDefaultClassName( blockType.name ) +
					'-' +
					activeVariation.name
			);
		}
	}
	if ( typeof extraProps.className === 'string' ) {
		// We have some extra classes and want to add the default classname
		// We use a Set to prevent duplicate classnames.
		extraProps.className = [
			...new Set( [
				...generatedClassNames,
				...extraProps.className.split( ' ' ),
			] ),
		]
			.join( ' ' )
			.trim();
	} else if ( generatedClassNames.length ) {
		// There is no string in the className variable,
		// so we just dump the default name(s) in there.
		extraProps.className = generatedClassNames.join( ' ' );
	}

	return extraProps;
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/generated-class-name/save-props',
	addGeneratedClassName
);
