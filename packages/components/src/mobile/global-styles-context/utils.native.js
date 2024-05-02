/**
 * External dependencies
 */
import { camelCase } from 'change-case';
import { Dimensions } from 'react-native';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import {
	useSettings,
	useMultipleOriginColorsAndGradients,
	SETTINGS_DEFAULTS,
} from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { default as getPxFromCssUnit } from '../utils/get-px-from-css-unit';
import { useGlobalStyles } from './index.native';

export const BLOCK_STYLE_ATTRIBUTES = [
	'textColor',
	'backgroundColor',
	'style',
	'color',
	'fontSize',
];

// Mapping style properties name to native.
const BLOCK_STYLE_ATTRIBUTES_MAPPING = {
	textColor: 'color',
	text: 'color',
	background: 'backgroundColor',
	link: 'linkColor',
	placeholder: 'placeholderColor',
};

const PADDING = 12; // $solid-border-space
const UNKNOWN_VALUE = 'undefined';
const DEFAULT_FONT_SIZE = 16;

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

	// Prevent adding extra paddings to inner blocks without background colors.
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

	// Global styles colors.
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

	// Global styles elements.
	if ( blockGlobalStyles?.elements ) {
		const linkColor = blockGlobalStyles.elements?.link?.color?.text;
		const styleKey = BLOCK_STYLE_ATTRIBUTES_MAPPING.link;

		if ( styleKey && linkColor && linkColor !== UNKNOWN_VALUE ) {
			blockStyles[ styleKey ] = linkColor;
		}
	}

	// Custom colors.
	Object.entries( blockStyleAttributes ).forEach( ( [ key, value ] ) => {
		const isCustomColor = value?.startsWith?.( '#' );
		let styleKey = key;

		if ( BLOCK_STYLE_ATTRIBUTES_MAPPING[ styleKey ] ) {
			styleKey = BLOCK_STYLE_ATTRIBUTES_MAPPING[ styleKey ];
		}

		if ( ! isCustomColor ) {
			const mappedColor = Object.values( defaultColors ?? {} ).find(
				( { slug } ) => slug === value
			);

			if ( mappedColor ) {
				blockStyles[ styleKey ] = mappedColor.color;
			}
		} else {
			blockStyles[ styleKey ] = value;
		}
	} );

	// Color placeholder.
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
	const parsedFontSizes = Object.values( fontSizes ?? {} );

	// Global styles.
	if ( blockGlobalStyles?.typography ) {
		const fontSize = blockGlobalStyles?.typography?.fontSize;
		const lineHeight = blockGlobalStyles?.typography?.lineHeight;

		if ( fontSize ) {
			if ( parseInt( fontSize, 10 ) ) {
				typographyStyles.fontSize = fontSize;
			} else {
				const mappedFontSize = parsedFontSizes.find(
					( { slug } ) => slug === fontSize
				);

				if ( mappedFontSize ) {
					typographyStyles.fontSize = mappedFontSize?.size;
				}
			}
		}

		if ( lineHeight ) {
			typographyStyles.lineHeight = lineHeight;
		}
	}

	if ( blockStyleAttributes?.fontSize && baseGlobalStyles ) {
		const mappedFontSize = parsedFontSizes.find(
			( { slug } ) => slug === blockStyleAttributes?.fontSize
		);

		if ( mappedFontSize ) {
			typographyStyles.fontSize = mappedFontSize?.size;
		}
	}

	// Custom styles.
	if ( customBlockStyles?.fontSize ) {
		typographyStyles.fontSize = customBlockStyles?.fontSize;
	}

	if ( customBlockStyles?.lineHeight ) {
		typographyStyles.lineHeight = customBlockStyles?.lineHeight;
	}

	return typographyStyles;
}

/**
 * Return a value from a certain path of the object.
 * Path is specified as an array of properties, like: [ 'parent', 'child' ].
 *
 * @param {Object} object Input object.
 * @param {Array}  path   Path to the object property.
 * @return {*} Value of the object property at the specified path.
 */
const getValueFromObjectPath = ( object, path ) => {
	let value = object;
	path.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
};

export function parseStylesVariables( styles, mappedValues, customValues ) {
	let stylesBase = styles;
	const variables = [ 'preset', 'custom', 'var', 'fontSize' ];

	if ( ! stylesBase ) {
		return styles;
	}

	variables.forEach( ( variable ) => {
		// Examples
		// var(--wp--preset--color--gray)
		// var(--wp--custom--body--typography--font-family)
		// var:preset|color|custom-color-2
		const regex = new RegExp( `var\\(--wp--${ variable }--(.*?)\\)`, 'g' );
		const varRegex = /\"var:preset\|color\|(.*?)\"/gm;
		const fontSizeRegex = /"fontSize":"(.*?)"/gm;

		if ( variable === 'preset' ) {
			stylesBase = stylesBase.replace( regex, ( _$1, $2 ) => {
				const path = $2.split( '--' );
				const mappedPresetValue = mappedValues[ path[ 0 ] ];
				if ( mappedPresetValue && mappedPresetValue.slug ) {
					const matchedValue = Object.values(
						mappedPresetValue.values ?? {}
					).find( ( { slug } ) => slug === path[ 1 ] );
					return matchedValue?.[ mappedPresetValue.slug ];
				}
				return UNKNOWN_VALUE;
			} );
		}
		if ( variable === 'custom' ) {
			const customValuesData = customValues ?? JSON.parse( stylesBase );
			stylesBase = stylesBase.replace( regex, ( _$1, $2 ) => {
				const path = $2.split( '--' );

				// Supports cases for variables like var(--wp--custom--color--background)
				if ( path[ 0 ] === 'color' ) {
					const colorKey = path[ path.length - 1 ];
					if ( mappedValues?.color ) {
						const matchedValue = mappedValues.color?.values?.find(
							( { slug } ) => slug === colorKey
						);
						if ( matchedValue ) {
							return `${ matchedValue?.color }`;
						}
					}
				}

				if (
					path.reduce(
						( prev, curr ) => prev && prev[ curr ],
						customValuesData
					)
				) {
					return getValueFromObjectPath( customValuesData, path );
				}

				// Check for camelcase properties.
				return getValueFromObjectPath( customValuesData, [
					...path.slice( 0, path.length - 1 ),
					camelCase( path[ path.length - 1 ] ),
				] );
			} );
		}

		if ( variable === 'var' ) {
			stylesBase = stylesBase.replace( varRegex, ( _$1, $2 ) => {
				if ( mappedValues?.color ) {
					const matchedValue = mappedValues.color?.values?.find(
						( { slug } ) => slug === $2
					);
					return `"${ matchedValue?.color }"`;
				}
				return UNKNOWN_VALUE;
			} );
		}

		if ( variable === 'fontSize' ) {
			const { width, height } = Dimensions.get( 'window' );

			stylesBase = stylesBase.replace( fontSizeRegex, ( _$1, $2 ) => {
				const parsedFontSize =
					getPxFromCssUnit( $2, {
						width,
						height,
						fontSize: DEFAULT_FONT_SIZE,
					} ) || `${ DEFAULT_FONT_SIZE }px`;

				return `"fontSize":"${ parsedFontSize }"`;
			} );
		}
	} );

	return JSON.parse( stylesBase );
}

export function getMappedValues( features, palette ) {
	const typography = features?.typography;
	const colors = [
		...( palette?.theme || [] ),
		...( palette?.custom || [] ),
		...( palette?.default || [] ),
	];

	const fontSizes = {
		...typography?.fontSizes?.theme,
		...typography?.fontSizes?.custom,
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

/**
 * Returns the normalized fontSizes to include the sizePx value for each of the different sizes.
 *
 * @param {Object} fontSizes found in global styles.
 * @return {Object} normalized sizes.
 */
function normalizeFontSizes( fontSizes ) {
	if ( ! fontSizes ) {
		return fontSizes;
	}

	const dimensions = Dimensions.get( 'window' );
	const normalizedFontSizes = {};
	const keysToProcess = [];

	// Check if 'theme' or 'custom' keys exist and add them to keysToProcess array
	if ( fontSizes?.theme ) {
		keysToProcess.push( 'theme' );
	}
	if ( fontSizes?.custom ) {
		keysToProcess.push( 'custom' );
	}

	// If neither 'theme' nor 'custom' exist, add 'default' if it exists
	if ( keysToProcess.length === 0 && fontSizes?.default ) {
		keysToProcess.push( 'default' );
	}

	keysToProcess.forEach( ( key ) => {
		normalizedFontSizes[ key ] = fontSizes[ key ].map(
			( fontSizeObject ) => {
				fontSizeObject.sizePx = getPxFromCssUnit( fontSizeObject.size, {
					width: dimensions.width,
					height: dimensions.height,
					fontSize: DEFAULT_FONT_SIZE,
				} );
				return fontSizeObject;
			}
		);
	} );

	return normalizedFontSizes;
}

export function useMobileGlobalStylesColors( type = 'colors' ) {
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	const availableThemeColors = colorGradientSettings?.[ type ]?.reduce(
		( colors, origin ) => colors.concat( origin?.[ type ] ),
		[]
	);
	// Default editor colors/gradients if it's not a block-based theme.
	const defaultPaletteSetting =
		type === 'colors' ? 'color.palette' : 'color.gradients';
	const [ defaultPaletteValue ] = useSettings( defaultPaletteSetting );
	// In edge cases, the default palette might be undefined. To avoid
	// exceptions across the editor in that case, we explicitly return
	// the default editor colors.
	const defaultPalette = defaultPaletteValue ?? SETTINGS_DEFAULTS.colors;

	return availableThemeColors.length >= 1
		? availableThemeColors
		: defaultPalette;
}

export function getColorsAndGradients(
	defaultEditorColors = [],
	defaultEditorGradients = [],
	rawFeatures
) {
	const features = rawFeatures ? JSON.parse( rawFeatures ) : {};

	return {
		__experimentalGlobalStylesBaseStyles: null,
		__experimentalFeatures: {
			color: {
				...( ! features?.color
					? {
							text: true,
							background: true,
							palette: {
								default: defaultEditorColors,
							},
							gradients: {
								default: defaultEditorGradients,
							},
					  }
					: features?.color ),
				defaultPalette: defaultEditorColors?.length > 0,
				defaultGradients: defaultEditorGradients?.length > 0,
			},
		},
	};
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

	const fontSizes = normalizeFontSizes( features?.typography?.fontSizes );

	return {
		__experimentalFeatures: {
			color: {
				palette: colors?.palette,
				gradients,
				text: features?.color?.text ?? true,
				background: features?.color?.background ?? true,
				defaultPalette: features?.color?.defaultPalette ?? true,
				defaultGradients: features?.color?.defaultGradients ?? true,
			},
			typography: {
				fontSizes,
				customLineHeight: features?.custom?.[ 'line-height' ],
			},
			spacing: features?.spacing,
		},
		__experimentalGlobalStylesBaseStyles: globalStyles,
	};
}

/**
 * Determine and apply appropriate color scheme based on global styles or device's light/dark mode.
 *
 * The function first attempts to retrieve the editor's background color from global styles.
 * If the detected background color is light, light styles are applied, and dark styles otherwise.
 * If no custom background color is defined, styles are applied using the device's dark/light setting.
 *
 * @param {Object} baseStyle - An object representing the base (light theme) styles for the editor.
 * @param {Object} darkStyle - An object representing the additional styles to apply when the editor is in dark mode.
 *
 * @return {Object} - The combined style object that should be applied to the editor.
 */
export const useEditorColorScheme = ( baseStyle, darkStyle ) => {
	const globalStyles = useGlobalStyles();

	const deviceColorScheme = usePreferredColorSchemeStyle(
		baseStyle,
		darkStyle
	);

	const editorColors = globalStyles?.baseColors?.color;
	const editorBackgroundColor = editorColors?.background;

	const isBackgroundColorDefined =
		typeof editorBackgroundColor !== 'undefined' &&
		editorBackgroundColor !== 'undefined';

	if ( isBackgroundColorDefined ) {
		const isEditorBackgroundDark = colord( editorBackgroundColor ).isDark();
		return isEditorBackgroundDark
			? { ...baseStyle, ...darkStyle }
			: baseStyle;
	}

	return deviceColorScheme;
};
