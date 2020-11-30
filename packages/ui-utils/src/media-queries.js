/**
 * Source:
 * https://github.com/akiran/json2mq
 */

/**
 * Internal dependencies
 */
import { is } from './is';
import { camel2hyphen } from './strings';

/**
 * @param {string} feature
 * @return {boolean}
 */
function isDimension( feature ) {
	const re = /[height|width]$/;
	return re.test( feature );
}

/**
 * @param {Record<string, boolean | string | number>} obj
 * @return {string}
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
 *
 * @param {string | Object} query
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
