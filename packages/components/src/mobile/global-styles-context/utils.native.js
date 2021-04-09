/**
 * External dependencies
 */
import { find, startsWith } from 'lodash';

export const BLOCK_STYLE_ATTRIBUTES = [ 'textColor', 'backgroundColor' ];

// Mapping style properties name to native
const BLOCK_STYLE_ATTRIBUTES_MAPPING = {
	textColor: 'color',
};

const PADDING = 12; // solid-border-space

export function getBlockPaddings(
	mergedStyle,
	wrapperPropsStyle,
	blockStyleAttributes
) {
	const blockPaddings = {};

	if (
		! mergedStyle.padding &&
		( wrapperPropsStyle?.backgroundColor ||
			blockStyleAttributes?.backgroundColor )
	) {
		blockPaddings.padding = PADDING;
		return blockPaddings;
	}

	// Prevent adding extra paddings to inner blocks without background colors
	if (
		mergedStyle?.padding &&
		! wrapperPropsStyle?.backgroundColor &&
		! blockStyleAttributes?.backgroundColor
	) {
		blockPaddings.padding = undefined;
	}

	return blockPaddings;
}

export function getBlockColors( blockStyleAttributes, defaultColors ) {
	const blockStyles = {};

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

	return blockStyles;
}

// To-do add tests
export function parseGradientsColorVariables( colorPalette, gradients ) {
	const colorPrefixRegex = /var\(--wp--preset--color--(.*?)\)/g;
	Object.keys( gradients ).forEach( ( key ) => {
		const value = gradients[ key ]?.gradient;
		const colorValue = value?.replace( colorPrefixRegex, ( _$1, $2 ) => {
			const mappedColor = find( colorPalette, {
				slug: $2,
			} );
			return mappedColor?.color;
		} );
		gradients[ key ].gradient = colorValue;
	} );

	return gradients;
}

export function getGlobalStyles( baseStyles ) {
	const globalStyles = {
		...baseStyles,
	};
	const colorSettings = globalStyles?.settings?.color;
	const palette = colorSettings?.palette;
	const gradients = colorSettings?.gradients;

	if ( gradients ) {
		parseGradientsColorVariables( palette, gradients );
	}

	return {
		...( palette || gradients
			? {
					__experimentalFeatures: {
						defaults: { color: { palette, gradients } },
					},
			  }
			: {} ),
		__experimentalGlobalStylesBaseStyles: globalStyles,
	};
}
