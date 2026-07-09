/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getColorClassName,
	getColorObjectByAttributeValues,
} from '../components/colors';
import { __experimentalGetGradientClass } from '../components/gradients';
import { transformStyles, shouldSkipSerialization } from './utils';
import { getBackgroundImageClasses } from './background';
import { useSettings } from '../components/use-settings';

export const COLOR_SUPPORT_KEY = 'color';

const hasColorSupport = ( blockNameOrType ) => {
	const colorSupport = getBlockSupport( blockNameOrType, COLOR_SUPPORT_KEY );
	return (
		colorSupport &&
		( colorSupport.link === true ||
			colorSupport.gradient === true ||
			colorSupport.background !== false ||
			colorSupport.text !== false )
	);
};

const hasLinkColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.link
	);
};

const hasGradientSupport = ( blockNameOrType ) => {
	const colorSupport = getBlockSupport( blockNameOrType, COLOR_SUPPORT_KEY );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.gradients
	);
};

const hasBackgroundColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.background !== false;
};

const hasTextColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.text !== false;
};

/**
 * Filters registered block settings, extending attributes to include
 * `backgroundColor` and `textColor` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	if ( ! hasColorSupport( settings ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings.attributes.backgroundColor ) {
		Object.assign( settings.attributes, {
			backgroundColor: {
				type: 'string',
			},
		} );
	}
	if ( ! settings.attributes.textColor ) {
		Object.assign( settings.attributes, {
			textColor: {
				type: 'string',
			},
		} );
	}

	if ( hasGradientSupport( settings ) && ! settings.attributes.gradient ) {
		Object.assign( settings.attributes, {
			gradient: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject colors classnames.
 *
 * @param {Object}        props           Additional props applied to save element.
 * @param {Object|string} blockNameOrType Block type.
 * @param {Object}        attributes      Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( props, blockNameOrType, attributes ) {
	if (
		! hasColorSupport( blockNameOrType ) ||
		shouldSkipSerialization( blockNameOrType, COLOR_SUPPORT_KEY )
	) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockNameOrType );

	// I'd have preferred to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const shouldSerialize = ( feature ) =>
		! shouldSkipSerialization(
			blockNameOrType,
			COLOR_SUPPORT_KEY,
			feature
		);

	// Primary color classes must come before the `has-text-color`,
	// `has-background` and `has-link-color` classes to maintain backwards
	// compatibility and avoid block invalidations.
	const textClass = shouldSerialize( 'text' )
		? getColorClassName( 'color', textColor )
		: undefined;

	const gradientClass = shouldSerialize( 'gradients' )
		? __experimentalGetGradientClass( gradient )
		: undefined;

	const backgroundClass = shouldSerialize( 'background' )
		? getColorClassName( 'background-color', backgroundColor )
		: undefined;

	const serializeHasBackground =
		shouldSerialize( 'background' ) || shouldSerialize( 'gradients' );
	const hasBackground =
		backgroundColor ||
		style?.color?.background ||
		( hasGradient && ( gradient || style?.color?.gradient ) );

	const newClassName = clsx( props.className, textClass, gradientClass, {
		// Don't apply the background class if there's a custom gradient.
		[ backgroundClass ]:
			( ! hasGradient || ! style?.color?.gradient ) && !! backgroundClass,
		'has-text-color':
			shouldSerialize( 'text' ) && ( textColor || style?.color?.text ),
		'has-background': serializeHasBackground && hasBackground,
		'has-link-color':
			shouldSerialize( 'link' ) && style?.elements?.link?.color,
	} );
	props.className = newClassName ? newClassName : undefined;

	return props;
}

function useBlockProps( {
	name,
	backgroundColor,
	textColor,
	gradient,
	style,
} ) {
	const [ userPalette, themePalette, defaultPalette ] = useSettings(
		'color.palette.custom',
		'color.palette.theme',
		'color.palette.default'
	);

	const colors = useMemo(
		() => [
			...( userPalette || [] ),
			...( themePalette || [] ),
			...( defaultPalette || [] ),
		],
		[ userPalette, themePalette, defaultPalette ]
	);
	if (
		! hasColorSupport( name ) ||
		shouldSkipSerialization( name, COLOR_SUPPORT_KEY )
	) {
		return {};
	}
	const extraStyles = {};

	if (
		textColor &&
		! shouldSkipSerialization( name, COLOR_SUPPORT_KEY, 'text' )
	) {
		extraStyles.color = getColorObjectByAttributeValues(
			colors,
			textColor
		)?.color;
	}
	if (
		backgroundColor &&
		! shouldSkipSerialization( name, COLOR_SUPPORT_KEY, 'background' )
	) {
		extraStyles.backgroundColor = getColorObjectByAttributeValues(
			colors,
			backgroundColor
		)?.color;
	}

	const saveProps = addSaveProps( { style: extraStyles }, name, {
		textColor,
		backgroundColor,
		gradient,
		style,
	} );

	const hasBackgroundValue =
		backgroundColor ||
		style?.color?.background ||
		gradient ||
		style?.color?.gradient;

	return {
		...saveProps,
		className: clsx(
			saveProps.className,
			// Add background image classes in the editor, if not already handled by background color values.
			! hasBackgroundValue && getBackgroundImageClasses( style )
		),
	};
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'backgroundColor', 'textColor', 'gradient', 'style' ],
	hasSupport: hasColorSupport,
};

const MIGRATION_PATHS = {
	linkColor: [ [ 'style', 'elements', 'link', 'color', 'text' ] ],
	textColor: [ [ 'textColor' ], [ 'style', 'color', 'text' ] ],
	backgroundColor: [
		[ 'backgroundColor' ],
		[ 'style', 'color', 'background' ],
	],
	gradient: [ [ 'gradient' ], [ 'style', 'color', 'gradient' ] ],
};

export function addTransforms( result, source, index, results ) {
	const destinationBlockType = result.name;
	const activeSupports = {
		linkColor: hasLinkColorSupport( destinationBlockType ),
		textColor: hasTextColorSupport( destinationBlockType ),
		backgroundColor: hasBackgroundColorSupport( destinationBlockType ),
		gradient: hasGradientSupport( destinationBlockType ),
	};
	return transformStyles(
		activeSupports,
		MIGRATION_PATHS,
		result,
		source,
		index,
		results
	);
}

addFilter(
	'blocks.registerBlockType',
	'core/color/addAttribute',
	addAttributes
);

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/color/addTransforms',
	addTransforms
);
