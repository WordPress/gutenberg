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

export function parseVariables( styles, mappedValues ) {
	const stylesBase = styles;
	// Examples
	// var(--wp--preset--color--gray)
	// var(--wp--preset--font-size--normal)
	// var(--wp--custom--line-height--body)
	const variablePrefixRegex = /var\(--wp--(.*?)--(.*?)--(.*?)\)/g;

	return stylesBase
		? JSON.parse(
				stylesBase?.replace(
					variablePrefixRegex,
					( _$1, _$2, $3, $4 ) => {
						const mappedValue = mappedValues[ $3 ];
						if ( mappedValue && mappedValue.slug ) {
							const matchedValue = find( mappedValue.values, {
								slug: $4,
							} );
							return matchedValue?.[ mappedValue.slug ];
						} else if ( mappedValue ) {
							return mappedValue.values?.[ $4 ];
						}
						return UNKNOWN_VALUE;
					}
				)
		  )
		: styles;
}

export function getMappedValues( features, colors ) {
	return {
		color: {
			values: colors,
			slug: 'color',
		},
		'font-size': {
			values: features?.typography?.fontSizes?.theme,
			slug: 'size',
		},
		'line-height': {
			values: features?.custom?.[ 'line-height' ],
		},
	};
}

export function getGlobalStyles( rawStyles, rawFeatures, colors, gradients ) {
	const features = JSON.parse( rawFeatures );
	const mappedValues = getMappedValues( features, colors );
	const parsedGradients = parseVariables(
		JSON.stringify( gradients ),
		mappedValues
	);
	const globalStyles = parseVariables( rawStyles, mappedValues );
	const parsedExperimentalFeatures = parseVariables(
		rawFeatures,
		mappedValues
	);

	return {
		colors,
		gradients: parsedGradients,
		__experimentalFeatures: {
			color: {
				palette: parsedExperimentalFeatures?.color?.palette,
				gradients: parsedExperimentalFeatures?.color?.gradients,
			},
			typography: {
				fontSizes: features?.typography?.fontSizes,
				custom: {
					'line-height': features?.custom?.[ 'line-height' ],
				},
			},
		},
		__experimentalGlobalStylesBaseStyles: globalStyles,
	};
}
