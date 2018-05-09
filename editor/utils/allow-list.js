/**
 * External dependencies
 */
import {
	castArray,
	isArray,
	isPlainObject,
	isString,
	mapValues,
	reduce,
} from 'lodash';

/**
 * Parses an allow list shorthand into an allow list object.
 *
 * An allow list obejct maps block types to whether or not they are explicitly
 * allowed as a parent or child. A wildcard ('*') case determines whether or
 * not parents or children are allowed *in general*.
 *
 * Some examples:
 *
 * { 'core/image': true, '*': false } specifies that only images are allowed.
 * { 'core/verse': false, '*': true } specifies that everything except verses are allowed.
 *
 * Allow lists can be represented using many shorthands. parseAllowList() turns
 * these shorthand values into a fully strucutred allow list object.
 *
 * Some examples:
 *
 * undefined -> { '*': true }
 * true -> { '*': true }
 * false -> { '*': false }
 * 'foo' -> { 'foo': true, '*': false }
 * [ 'foo', 'bar' ] -> { 'foo': true, 'bar': true, '*': false }
 * [ '!foo', 'bar', '*' ] -> { 'foo': false, 'bar': true, '*': true }
 *
 * @param {*} source An allow list shorthand or allow list object.
 *
 * @return {Object} A fully strucutred allow list object. All values will be
 *                  booleans. The '*' key is guaranteed to exist.
 */
export function parseAllowList( source ) {
	if ( source === undefined ) {
		return { '*': true };
	}

	if ( isPlainObject( source ) ) {
		return {
			...mapValues( source, ( value ) => !! value ),
			'*': !! source[ '*' ],
		};
	}

	if ( isArray( source ) || isString( source ) ) {
		return reduce( castArray( source ), ( result, value ) => {
			if ( isString( value ) && value[ 0 ] === '!' ) {
				const item = value.slice( 1 );
				result[ item ] = false;
			} else {
				result[ value ] = true;
			}
			return result;
		}, { '*': false } );
	}

	return { '*': !! source };
}
