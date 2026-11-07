import clsx from 'clsx';
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import type { Block, BlockType } from '@wordpress/blocks';
import type { Color } from '@wordpress/global-styles-engine';
import { useMemo } from '@wordpress/element';
import {
	getColorClassName,
	getColorObjectByAttributeValues,
} from '../components/colors';
import { __experimentalGetGradientClass } from '../components/gradients';
import { transformStyles, shouldSkipSerialization } from './utils';
import {
	BACKGROUND_SUPPORT_KEY,
	getBackgroundImageClasses,
} from './background';
import { useSettings } from '../components/use-settings';
import type { PanelStyle } from '../components/global-styles/types';
import type { BlockWrapperProps, ColorAttributes, ColorSupport } from './types';

type BlockNameOrType = string | BlockType;

// The support flags each color feature; `true` reads as no flags set.
const getColorSupport = ( blockNameOrType: BlockNameOrType ) =>
	getBlockSupport( blockNameOrType, COLOR_SUPPORT_KEY ) as
		ColorSupport | null | undefined;

export const COLOR_SUPPORT_KEY = 'color';

const hasColorSupport = ( blockNameOrType: BlockNameOrType ) => {
	const colorSupport = getColorSupport( blockNameOrType );
	return (
		colorSupport &&
		( colorSupport.link === true ||
			colorSupport.gradient === true ||
			colorSupport.background !== false ||
			colorSupport.text !== false )
	);
};

const hasLinkColorSupport = ( blockType: BlockNameOrType ) => {
	const colorSupport = getColorSupport( blockType );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.link
	);
};

const hasGradientSupport = ( blockNameOrType: BlockNameOrType ) => {
	const colorSupport = getColorSupport( blockNameOrType );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.gradients
	);
};

const hasBackgroundColorSupport = ( blockType: BlockNameOrType ) => {
	const colorSupport = getColorSupport( blockType );

	return colorSupport && colorSupport.background !== false;
};

const hasTextColorSupport = ( blockType: BlockNameOrType ) => {
	const colorSupport = getColorSupport( blockType );

	return colorSupport && colorSupport.text !== false;
};

/**
 * Filters registered block settings, extending attributes to include
 * `backgroundColor` and `textColor` attribute.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
function addAttributes( settings: BlockType ): BlockType {
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
 * @param props           Additional props applied to save element.
 * @param blockNameOrType Block type.
 * @param attributes      Block attributes.
 *
 * @return Filtered props applied to save element.
 */
export function addSaveProps(
	props: BlockWrapperProps,
	blockNameOrType: BlockNameOrType,
	attributes: ColorAttributes
): BlockWrapperProps {
	if (
		! hasColorSupport( blockNameOrType ) ||
		shouldSkipSerialization( blockNameOrType, COLOR_SUPPORT_KEY )
	) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockNameOrType );

	// I'd have preferred to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const shouldSerialize = ( feature: string ) =>
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
	// Mirror of the background support: a color clipped to the text paints
	// the glyphs, not the box.
	const clipsToText =
		'text' === style?.background?.backgroundClip &&
		hasBlockSupport( blockNameOrType, [
			BACKGROUND_SUPPORT_KEY,
			'backgroundClip',
		] ) &&
		! shouldSkipSerialization(
			blockNameOrType,
			BACKGROUND_SUPPORT_KEY,
			'backgroundClip'
		);
	const hasBackground =
		( ! clipsToText && ( backgroundColor || style?.color?.background ) ) ||
		( hasGradient && ( gradient || style?.color?.gradient ) );

	const newClassName = clsx( props.className, textClass, gradientClass, {
		// Don't apply the background class if there's a custom gradient.
		// An unset class is skipped, as `!! undefined` is false.
		[ backgroundClass as string ]:
			( ! hasGradient || ! style?.color?.gradient ) && !! backgroundClass,
		'has-text-color':
			shouldSerialize( 'text' ) && ( textColor || style?.color?.text ),
		'has-background': serializeHasBackground && hasBackground,
		'has-link-color':
			shouldSerialize( 'link' ) && style?.elements?.link?.color,
	} );

	// Mirror of the full skip above. A block that serializes only the link
	// color keeps its props, and their attribute order, until one is set.
	if (
		! newClassName &&
		! shouldSerialize( 'text' ) &&
		! shouldSerialize( 'background' ) &&
		! shouldSerialize( 'gradients' )
	) {
		return props;
	}

	props.className = newClassName ? newClassName : undefined;

	return props;
}

// Mirror of the background support's per-feature skip on the front end.
function getSerializedBackgroundClasses(
	name: string,
	style: PanelStyle | undefined
) {
	const shouldSerialize = ( feature: string ) =>
		! shouldSkipSerialization( name, BACKGROUND_SUPPORT_KEY, feature );

	return getBackgroundImageClasses( {
		background: {
			backgroundImage: shouldSerialize( 'backgroundImage' )
				? style?.background?.backgroundImage
				: undefined,
			gradient: shouldSerialize( 'gradient' )
				? style?.background?.gradient
				: undefined,
			backgroundClip: shouldSerialize( 'backgroundClip' )
				? style?.background?.backgroundClip
				: undefined,
		},
	} );
}

function useBlockProps( {
	name,
	backgroundColor,
	textColor,
	gradient,
	style,
}: ColorAttributes & { name: string } ): BlockWrapperProps {
	const [ userPalette, themePalette, defaultPalette ] = useSettings(
		'color.palette.custom',
		'color.palette.theme',
		'color.palette.default'
	) as Array< Color[] | undefined >;

	const colors = useMemo(
		() => [
			...( userPalette || [] ),
			...( themePalette || [] ),
			...( defaultPalette || [] ),
		],
		[ userPalette, themePalette, defaultPalette ]
	);
	if ( ! hasColorSupport( name ) ) {
		return {};
	}

	// Each support adds `has-background` for the values it serializes, so a
	// background image still adds it when color serialization is skipped.
	const backgroundClassName = getSerializedBackgroundClasses( name, style );

	if ( shouldSkipSerialization( name, COLOR_SUPPORT_KEY ) ) {
		return backgroundClassName ? { className: backgroundClassName } : {};
	}
	const extraStyles: {
		color?: string | null;
		backgroundColor?: string | null;
	} = {};

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

	const hasColorBackgroundClass = saveProps.className
		?.split( ' ' )
		.includes( 'has-background' );

	return {
		...saveProps,
		className: clsx(
			saveProps.className,
			! hasColorBackgroundClass && backgroundClassName
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

export function addTransforms(
	result: Block,
	source: Block[],
	index: number,
	results: Block[]
) {
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
