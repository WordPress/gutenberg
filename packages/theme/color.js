/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';

extend( [ namesPlugin, a11yPlugin ] );

const LIGHT_VALUES = [ 100, 98, 95, 92, 89, 87, 83, 73, 55, 48, 39, 13 ];
const DARK_VALUES = [ 1, 11, 16, 19, 22, 18, 29, 38, 43, 73, 80, 93 ];
export const PRIMARY_DEFAULT = '#3858e9';

// map showing which lightness in scale each use case should use
const COLOR_MAP = {
	bg: {
		default: 2,
		hover: 3,
		active: 4,
		input: {
			default: 0,
			disabled: 0,
		},
		muted: 1,
		strong: {
			default: 8,
			hover: 9,
		},
	},
	text: {
		default: 10,
		hover: 11,
		strong: 11,
		inverse: {
			default: 1,
			strong: 0,
		},
		muted: 9,
	},
	border: {
		default: 5,
		disabled: 4,
		input: 6,
		strong: {
			default: 6,
			hover: 7,
		},
		muted: 4,
		hover: 6,
	},
};

// generates a color palette based on a primary color
export const generateColors = ( {
	color = PRIMARY_DEFAULT,
	fun = 0,
	isDark = false,
} ) => {
	const neutral = generateNeutralColors( { color, fun, isDark } );
	const primary = generatePrimaryColors( {
		color,
		bg: neutral.bg.default,
		isDark,
	} );

	return {
		primary,
		neutral,
	};
};

const generateNeutralColors = ( {
	color = PRIMARY_DEFAULT,
	fun = 0,
	isDark = false,
} ) => {
	const base = colord( color ).toHsl();
	const lightValues = isDark ? DARK_VALUES : LIGHT_VALUES;
	const colors = lightValues.map( ( value ) =>
		colord( { ...base, s: fun, l: value } ).toHex()
	);
	return mapColors( colors, COLOR_MAP );
};

const generatePrimaryColors = ( {
	color = PRIMARY_DEFAULT,
	bg,
	isDark = false,
} ) => {
	const base = colord( color ).toHsl();
	const lightValues = isDark ? DARK_VALUES : LIGHT_VALUES;

	// if the color given has enough contrast agains the background, use that as the solid background colour and adjust the surrounding scale to proportionally move with it
	const length = lightValues.length;
	// Calculate the difference between the new value and the old value
	const diff = base.l - lightValues[ 8 ];
	// Calculate the weight for adjusting values. Closer to base colour should adjust more.
	const weight = ( index ) => 1 - Math.abs( 8 - index ) / ( length - 1 );
	// Adjust all values in the array based on their weight
	let adjustedArray = [ ...lightValues ];
	if ( colord( bg ).isReadable( base ) ) {
		adjustedArray = lightValues.map( ( value, index ) => {
			const adjustment = diff * weight( index );
			return index === 8 ? base.l : value + adjustment;
		} );
	}

	// convert colours to hex and set min and max lightness values
	const colors = adjustedArray.map( ( value ) =>
		colord( {
			...base,
			l: Math.min( Math.max( parseInt( value ), 0 ), 100 ),
		} ).toHex()
	);

	return mapColors( colors, COLOR_MAP );
};

// maps a color map to a color palette
const mapColors = ( mapFromArray, mapToObject ) => {
	const map = {};
	Object.keys( mapToObject ).forEach( ( alias ) => {
		const color = mapToObject[ alias ];
		if ( typeof color === 'object' ) {
			map[ alias ] = mapColors( mapFromArray, color );
		} else {
			map[ alias ] = mapFromArray[ parseInt( color ) ];
		}
	} );
	return map;
};
