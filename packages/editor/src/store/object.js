/**
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * Returns an object against which it is safe to perform mutating operations,
 * given the original object and its current working copy.
 *
 * @param {Object} original Original object.
 * @param {Object} working  Working object.
 *
 * @return {Object} Mutation-safe object.
 */
export function getMutateSafeObject( original, working ) {
	if ( original === working ) {
		return { ...original };
	}

	return working;
}

/**
 * Given two objects, returns the minimal object shape of the difference of
 * values contained in RHS and not LHS, recursively. Returns RHS reference if
 * result of difference would be the same as the RHS object.
 *
 * @param {Object} lhs Original object to compare against.
 * @param {Object} rhs New object from which to generate difference.
 *
 * @return {Object} Minimal difference.
 */
export function diff( lhs, rhs ) {
	let diffed = rhs;
	for ( const key in rhs ) {
		let value = rhs[ key ];
		if ( isPlainObject( value ) && isPlainObject( lhs[ key ] ) ) {
			// Recurse to generate diff of child values.
			value = diff( lhs[ key ], value );

			// If a diff of the child value is non-empty, it's inferred to be
			// non-equal and should replace the value in the returned diff.
			// Otherwise, if equal, fall through to delete from diff.
			if ( Object.keys( value ).length ) {
				diffed = getMutateSafeObject( rhs, diffed );
				diffed[ key ] = value;
				continue;
			}
		} else if ( value !== lhs[ key ] ) {
			// To preserve reference, invert the iteration to _keep_ values
			// which are different, and mutate only to delete equal values.
			continue;
		}

		diffed = getMutateSafeObject( rhs, diffed );
		delete diffed[ key ];
	}

	return diffed;
}

/**
 * Given objects, returns the combined object shape of the merging of their
 * values. Returns the reference of the first object if all objects are the
 * same.
 *
 * @param {...Object} objects Objects to merge.
 *
 * @return {Object} Merged object.
 */
export function merge( ...objects ) {
	const firstObject = objects[ 0 ];
	return objects.reduce( ( merged, object ) => {
		for ( const key in object ) {
			let value = object[ key ];
			if ( isPlainObject( merged[ key ] ) && isPlainObject( value ) ) {
				value = merge( merged[ key ], value );
			}

			if ( merged[ key ] !== value ) {
				merged = getMutateSafeObject( firstObject, merged );
				merged[ key ] = value;
			}
		}

		return merged;
	}, firstObject );
}
