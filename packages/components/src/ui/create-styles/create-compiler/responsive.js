/**
 * Internal dependencies
 */
import { breakpoints } from './utils';

// https://github.com/system-ui/theme-ui/blob/master/packages/css/src/index.ts#L224
/**
 * A utility function that generates responsive styles if the value is an array.
 *
 * @param {import('@emotion/serialize').ObjectInterpolation<any>} styles A styles object
 * @param {(key: string, value: any) => any} [getScaleValue]
 * @return {import('@emotion/serialize').ObjectInterpolation<any>} An adjusted styles object with responsive styles (if applicable).
 */
export const responsive = (
	styles = {},
	getScaleValue = ( _, value ) => value
) => {
	/** @type {import('@emotion/serialize').ObjectInterpolation<any>} */
	const next = {};
	const mediaQueries = [
		null,
		...breakpoints.map( ( n ) => `@media screen and (min-width: ${ n })` ),
	];

	for ( const k in styles ) {
		const key = k;
		const value = styles[ key ];

		if ( value === null ) continue;

		if ( ! Array.isArray( value ) ) {
			next[ key ] = value;
			continue;
		}

		for (
			let i = 0;
			i < value.slice( 0, mediaQueries.length ).length;
			i++
		) {
			const media = mediaQueries[ i ];
			if ( ! media ) {
				next[ key ] = getScaleValue( key, value[ i ] );
				continue;
			}
			next[ media ] = next[ media ] || {};
			if ( value[ i ] === null ) continue;
			// @ts-ignore One line above we ensure that it is not null
			next[ media ][ key ] = getScaleValue( key, value[ i ] );
		}
	}

	return next;
};
