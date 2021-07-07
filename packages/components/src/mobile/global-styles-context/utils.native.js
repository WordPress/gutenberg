/**
 * External dependencies
 */
import { find, startsWith } from 'lodash';

export const BLOCK_STYLE_ATTRIBUTES = [
	'textColor',
	'backgroundColor',
	'style',
];

// Mapping style properties name to native
const BLOCK_STYLE_ATTRIBUTES_MAPPING = {
	textColor: 'color',
	text: 'color',
	background: 'backgroundColor',
	link: 'linkColor',
	placeholder: 'placeholderColor',
};

const PADDING = 12; // $solid-border-space
const UNKNOWN_VALUE = 'undefined';

export function getBlockPaddings(
	mergedStyle,
	wrapperPropsStyle,
	blockStyleAttributes,
	blockColors
) {
	const blockPaddings = {};

	if (
		! mergedStyle.padding &&
		( wrapperPropsStyle?.backgroundColor ||
			blockStyleAttributes?.backgroundColor ||
			blockColors?.backgroundColor )
	) {
		blockPaddings.padding = PADDING;
		return blockPaddings;
	}

	// Prevent adding extra paddings to inner blocks without background colors
	if (
		mergedStyle?.padding &&
		! wrapperPropsStyle?.backgroundColor &&
		! blockStyleAttributes?.backgroundColor &&
		! blockColors?.backgroundColor
	) {
		blockPaddings.padding = undefined;
	}

	return blockPaddings;
}

export function getBlockColors(
	blockStyleAttributes,
	defaultColors,
	blockName,
	baseGlobalStyles
) {
	const blockStyles = {};
	const customBlockStyles = blockStyleAttributes?.style?.color || {};
	const blockGlobalStyles = baseGlobalStyles?.blocks?.[ blockName ];

	// Global styles colors
	if ( blockGlobalStyles?.color ) {
		Object.entries( blockGlobalStyles.color ).forEach(
			( [ key, value ] ) => {
				const styleKey = BLOCK_STYLE_ATTRIBUTES_MAPPING[ key ];

				if ( styleKey && value !== UNKNOWN_VALUE ) {
					const color = customBlockStyles[ key ] ?? value;
					blockStyles[ styleKey ] = color;
				}
			}
		);
	} else if ( baseGlobalStyles?.styles?.color?.text ) {
		blockStyles[ BLOCK_STYLE_ATTRIBUTES_MAPPING.text ] =
			baseGlobalStyles?.styles?.color?.text;
	}

	// Global styles elements
	if ( blockGlobalStyles?.elements ) {
		const linkColor = blockGlobalStyles.elements?.link?.color?.text;
		const styleKey = BLOCK_STYLE_ATTRIBUTES_MAPPING.link;

		if ( styleKey && linkColor && linkColor !== UNKNOWN_VALUE ) {
			blockStyles[ styleKey ] = linkColor;
		}
	}

	// Custom colors
	Object.entries( blockStyleAttributes ).forEach( ( [ key, value ] ) => {
		const isCustomColor = startsWith( value, '#' );
		let styleKey = key;

		if ( BLOCK_STYLE_ATTRIBUTES_MAPPING[ styleKey ] ) {
			styleKey = BLOCK_STYLE_ATTRIBUTES_MAPPING[ styleKey ];
		}

		if ( ! isCustomColor ) {
			const mappedColor = find( defaultColors, {
				slug: value,
			} );

			if ( mappedColor ) {
				blockStyles[ styleKey ] = mappedColor.color;
			}
		} else {
			blockStyles[ styleKey ] = value;
		}
	} );

	// Color placeholder
	if ( blockStyles?.color ) {
		blockStyles[ BLOCK_STYLE_ATTRIBUTES_MAPPING.placeholder ] =
			blockStyles.color;
	}

	return blockStyles;
}

export function parseColorVariables( styles, colorPalette ) {
	const stylesBase = styles;
	const colorPrefixRegex = /var\(--wp--preset--color--(.*?)\)/g;

	return stylesBase
		? JSON.parse(
				stylesBase?.replace( colorPrefixRegex, ( _$1, $2 ) => {
					const mappedColor = find( colorPalette, {
						slug: $2,
					} );
					return mappedColor?.color;
				} )
		  )
		: styles;
}

export function getGlobalStyles( rawStyles, rawFeatures, colors, gradients ) {
	const parsedGradients = parseColorVariables(
		JSON.stringify( gradients ),
		colors
	);
	const globalStyles = parseColorVariables( rawStyles, colors );
	const parsedExperimentalFeatures = parseColorVariables(
		rawFeatures,
		colors
	);

	return {
		colors,
		gradients: parsedGradients,
		__experimentalFeatures: {
			color: {
				palette: parsedExperimentalFeatures?.color?.palette,
				gradients: parsedExperimentalFeatures?.color?.gradients,
			},
		},
		__experimentalGlobalStylesBaseStyles: globalStyles,
	};
}
