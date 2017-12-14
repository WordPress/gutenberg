/**
 * External dependencies
 */
import {
	some,
	isEqual,
	isMatchWith,
	isPlainObject,
} from 'lodash';

/**
 * Returns true if an object matches all {key: value} filters deeply.
 *
 * @param  {Object}        object  An object to test against filters.
 * @param  {(Object|null)} filters An object with one or more {key: value} filters.
 *
 *                                 If null or otherwise empty, then no match is necessary.
 *                                 If not empty, the object must match all {key: value} filters.
 *
 *                                 Each filter may optionally include an array of acceptable values.
 *                                 e.g., { foo: [ 'a', 'b' ] } matches a 'foo' property value 'a' or 'b'.
 *                                 e.g., { foo: { a: [ 'b', 'c' ] } } matches a 'foo.a' property value 'b' or 'c'.
 *
 *                                 Each filter may optionally use a regular expression to test acceptable values.
 *                                 e.g., { foo: /^a|b$/ } matches a 'foo' property value 'a' or 'b'.
 *                                 e.g., { foo: { a: /^b|c$/ } } matches a 'foo.a' property value 'b' or 'c'.
 *
 * @return {Boolean}               True if object matches all required {key: value} filters deeply.
 */
export function objectMatches( object, filters ) {
	return isMatchWith( object, filters, ( value, where ) => {
		if ( isPlainObject( where ) ) {
			return objectMatches( value, where );
		}
		if ( where instanceof RegExp ) {
			return where.test( String( value ) );
		}
		if ( Array.isArray( where ) && ! Array.isArray( value ) ) {
			return some( where, otr => isEqual( value, otr ) ); // Over the rainbow.
		}
		return isEqual( value, where );
	} );
}
