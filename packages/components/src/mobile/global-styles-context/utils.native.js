/**
 * External dependencies
 */
import { find, startsWith, get, camelCase, has } from 'lodash';

export const BLOCK_STYLE_ATTRIBUTES = [
	'textColor',
	'backgroundColor',
	'style',
	'color',
	'fontSize',
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

export function getBlockTypography(
	blockStyleAttributes,
	fontSizes,
	blockName,
	baseGlobalStyles
) {
	const typographyStyles = {};
	const customBlockStyles = blockStyleAttributes?.style?.typography || {};
	const blockGlobalStyles = baseGlobalStyles?.blocks?.[ blockName ];

	// Global styles
	if ( blockGlobalStyles?.typography ) {
		const fontSize = blockGlobalStyles?.typography?.fontSize;
		const lineHeight = blockGlobalStyles?.typography?.lineHeight;

		if ( fontSize ) {
			if ( parseInt( fontSize, 10 ) ) {
				typographyStyles.fontSize = fontSize;
			} else {
				const mappedFontSize = find( fontSizes, {
					slug: fontSize,
				} );

				if ( mappedFontSize ) {
					typographyStyles.fontSize = mappedFontSize?.size;
				}
			}
		}

		if ( lineHeight ) {
			typographyStyles.lineHeight = lineHeight;
		}
	}

	if ( blockStyleAttributes?.fontSize ) {
		const mappedFontSize = find( fontSizes, {
			slug: blockStyleAttributes?.fontSize,
		} );

		if ( mappedFontSize ) {
			typographyStyles.fontSize = mappedFontSize?.size;
		}
	}

	// Custom styles
	if ( customBlockStyles?.fontSize ) {
		typographyStyles.fontSize = customBlockStyles?.fontSize;
	}

	if ( customBlockStyles?.lineHeight ) {
		typographyStyles.lineHeight = customBlockStyles?.lineHeight;
	}

	return typographyStyles;
}

export function parseStylesVariables( styles, mappedValues, customValues ) {
	let stylesBase = styles;
	const variables = [ 'preset', 'custom' ];

	if ( ! stylesBase ) {
		return styles;
	}

	variables.forEach( ( variable ) => {
		// Examples
		// var(--wp--preset--color--gray)
		// var(--wp--custom--body--typography--font-family)
		const regex = new RegExp( `var\\(--wp--${ variable }--(.*?)\\)`, 'g' );

		if ( variable === 'preset' ) {
			stylesBase = stylesBase.replace( regex, ( _$1, $2 ) => {
				const path = $2.split( '--' );
				const mappedPresetValue = mappedValues[ path[ 0 ] ];
				if ( mappedPresetValue && mappedPresetValue.slug ) {
					const matchedValue = find( mappedPresetValue.values, {
						slug: path[ 1 ],
					} );
					return matchedValue?.[ mappedPresetValue.slug ];
				}
				return UNKNOWN_VALUE;
			} );
		}
		if ( variable === 'custom' ) {
			const customValuesData = customValues ?? JSON.parse( stylesBase );
			stylesBase = stylesBase.replace( regex, ( _$1, $2 ) => {
				const path = $2.split( '--' );
				if ( has( customValuesData, path ) ) {
					return get( customValuesData, path );
				}

				// Check for camelcase properties
				return get( customValuesData, [
					...path.slice( 0, path.length - 1 ),
					camelCase( path[ path.length - 1 ] ),
				] );
			} );
		}
	} );

	return JSON.parse( stylesBase );
}

export function getMappedValues( features, palette ) {
	const typography = features?.typography;
	const colors = { ...palette?.theme, ...palette?.user };
	const fontSizes = {
		...typography?.fontSizes?.theme,
		...typography?.fontSizes?.user,
	};
	const mappedValues = {
		color: {
			values: colors,
			slug: 'color',
		},
		'font-size': {
			values: fontSizes,
			slug: 'size',
		},
	};
	return mappedValues;
}

export function getGlobalStyles( rawStyles, rawFeatures ) {
	const features = rawFeatures ? JSON.parse( rawFeatures ) : {};
	const mappedValues = getMappedValues( features, features?.color?.palette );
	const colors = parseStylesVariables(
		JSON.stringify( features?.color ),
		mappedValues
	);
	const gradients = parseStylesVariables(
		JSON.stringify( features?.color?.gradients ),
		mappedValues
	);
	const customValues = parseStylesVariables(
		JSON.stringify( features?.custom ),
		mappedValues
	);
	const globalStyles = parseStylesVariables(
		rawStyles,
		mappedValues,
		customValues
	);

	return {
		colors,
		gradients,
		__experimentalFeatures: {
			color: {
				palette: colors?.palette,
				gradients,
				text: features?.color?.text ?? true,
				background: features?.color?.background ?? true,
			},
			typography: {
				fontSizes: features?.typography?.fontSizes,
				customLineHeight: features?.custom?.[ 'line-height' ],
			},
		},
		__experimentalGlobalStylesBaseStyles: globalStyles,
	};
}
