/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Convert a list of colors to an object of R, G, and B values.
 *
 * @param {string[]} colors Array of RBG color strings.
 *
 * @return {Object} R, G, and B values.
 */
export function getValuesFromColors( colors = [] ) {
	const values = { r: [], g: [], b: [], a: [] };

	colors.forEach( ( color ) => {
		const rgbColor = colord( color ).toRgb();
		values.r.push( rgbColor.r / 255 );
		values.g.push( rgbColor.g / 255 );
		values.b.push( rgbColor.b / 255 );
		values.a.push( rgbColor.a );
	} );

	return values;
}
