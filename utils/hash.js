/**
 * External dependencies
 */
import tinycolor from 'tinycolor2';
import hashString from 'hash-string';
import {
	reduce,
	some,
} from 'lodash';

export function hash( collection ) {
	if ( ! some( collection ) ) {
		return undefined;
	}
	return hashString(
		reduce( collection, ( memo, value ) => memo + value, '' )
	).toString( 36 );
}

export function hashColor( color ) {
	const tinyColor = tinycolor( color );
	const colorName = tinyColor.toName();
	if ( colorName ) {
		return colorName;
	}
	return hash( { color } );
}
