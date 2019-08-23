/**
 * External dependencies
 */
import PALETTE from '@automattic/color-studio';
import colorMetaData from '@automattic/color-studio/dist/colors.meta.json';
import colorUtil from 'color';
import { kebabCase, orderBy } from 'lodash';

const primitiveColors = [ 'Black', 'White' ];
const primaryColors = [
	'Blue',
	'Celadon',
	'Gray',
	'Green',
	'Orange',
	'Pink',
	'Purple',
	'Red',
	'Yellow',
];
const specialtyColors = [ 'Jetpack Green', 'WordPress Blue', 'WooCommerce Purple' ];

/**
 * Retrieves a color value from the A8C color palette
 * Data file:
 * https://github.com/Automattic/color-studio/blob/master/dist/colors.json
 *
 * @param {string} colorValue The desired color value from the palette
 * @return {string} The hex color value
 */
export function getColor( colorValue ) {
	return PALETTE.colors[ colorValue ];
}

export function getColorMetaData() {
	const { colors } = colorMetaData;

	const colorMeta = colors.reduce( ( collection, set ) => {
		set.forEach( ( item ) => {
			const name = item._meta.baseName || item.name;
			if ( ! collection[ name ] ) {
				collection[ name ] = { ...item, colors: [] };
			}
			collection[ name ].colors = [ ...collection[ name ].colors, item ];
		} );

		return collection;
	}, {} );

	return colorMeta;
}

export function getColorSet( setCollection ) {
	const next = getColorMetaData();
	const collection = Object.keys( next ).reduce( ( set, name ) => {
		const value = next[ name ];
		if ( setCollection.includes( name ) ) {
			const _color = {
				...value,
				colors: value.colors.filter( ( item ) => ! item._meta.alias ),
			};
			return [ ...set, _color ];
		}
		return set;
	}, [] );

	return orderBy( collection, [ 'name' ], [ 'asc' ] );
}

export function getColorSets() {
	const primitive = {
		title: 'Primitive',
		colors: getColorSet( primitiveColors ),
	};

	const primary = {
		title: 'Primary',
		colors: getColorSet( primaryColors ),
	};

	const specialty = {
		title: 'Specialty',
		colors: getColorSet( specialtyColors ),
	};

	return { primitive, primary, specialty };
}

export function getColorCollection() {
	const colorCollection = [
		...getColorSet( primitiveColors ),
		...getColorSet( primaryColors ),
		...getColorSet( specialtyColors ),
	];

	return colorCollection;
}

export function getColorByName( name ) {
	const colorCollection = getColorCollection();
	return colorCollection.find( ( color ) => color.name === name );
}

export function shouldUseLightText( color ) {
	return colorUtil( color ).luminosity() * 100 < 30;
}

export function getContrastScore( color ) {
	const isLightText = shouldUseLightText( color );
	const textColor = isLightText ? 'white' : 'black';

	return colorUtil( color )
		.contrast( colorUtil( textColor ) )
		.toFixed( 2 );
}

export function getWCAGScore( color ) {
	const ratio = getContrastScore( color );

	if ( ratio >= 7.0 ) {
		return 'AAA';
	}
	if ( ratio >= 4.5 ) {
		return 'AA';
	}
	if ( ratio >= 3.0 ) {
		return 'AA+';
	}

	return 'F';
}

export function getColorId( color = {} ) {
	const { name } = color;
	return kebabCase( name || '' );
}
