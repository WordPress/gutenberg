/**
 * Source:
 * https://github.com/akiran/json2mq
 */

/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * @param {string} str
 *
 * @return {string} The hyphenated string.
 */
function camel2hyphen( str ) {
	return str
		.replace( /[A-Z]/g, function ( match ) {
			return '-' + match.toLowerCase();
		} )
		.toLowerCase();
}

/**
 * @param {string} feature
 *
 * @return {boolean} If the value is either width or height.
 */
function isDimension( feature ) {
	const re = /[height|width]$/;
	return re.test( feature );
}

/**
 * @param {Record<string, boolean | string | number>} obj
 *
 * @return {string} The media query.
 */
function obj2mq( obj = {} ) {
	let mq = '';
	const features = Object.keys( obj );

	features.forEach( ( feature, index ) => {
		let value = obj[ feature ];
		feature = camel2hyphen( feature );
		// Add px to dimension features
		if ( isDimension( feature ) && is.number( value ) ) {
			value = value + 'px';
		}

		if ( value === true ) {
			mq += feature;
		} else if ( value === false ) {
			mq += 'not ' + feature;
		} else {
			mq += '(' + feature + ': ' + value + ')';
		}
		if ( index < features.length - 1 ) {
			mq += ' and ';
		}
	} );

	return mq;
}

/**
 * Generate media query string from JSON or javascript object.
 *
 * @param {string | Object} query
 *
 * @return {string} The media query.
 */
export function json2mq( query ) {
	let mq = '';
	if ( is.string( query ) ) {
		return query;
	}
	// Handling array of media queries
	if ( query instanceof Array ) {
		query.forEach( ( q, index ) => {
			mq += obj2mq( q );
			if ( index < query.length - 1 ) {
				mq += ', ';
			}
		} );
		return mq;
	}
	// Handling single media query
	return obj2mq( query );
}
