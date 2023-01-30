/**
 * External dependencies
 */
import { isEmpty, mapValues, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Removed falsy values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from falsy values
 */
export const cleanEmptyObject = ( object ) => {
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}
	const cleanedNestedObjects = Object.fromEntries(
		Object.entries( mapValues( object, cleanEmptyObject ) ).filter(
			( [ , value ] ) => Boolean( value )
		)
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

/**
 * Converts a path to an array of its fragments.
 * Supports strings, numbers and arrays:
 *
 * 'foo' => [ 'foo' ]
 * 2 => [ '2' ]
 * [ 'foo', 'bar' ] => [ 'foo', 'bar' ]
 *
 * @param {string|number|Array} path Path
 * @return {Array} Normalized path.
 */
function normalizePath( path ) {
	if ( Array.isArray( path ) ) {
		return path;
	} else if ( typeof path === 'number' ) {
		return [ path.toString() ];
	}

	return [ path ];
}

/**
 * Clones an object.
 * Non-object values are returned unchanged.
 *
 * @param {*} object Object to clone.
 * @return {*} Cloned object, or original literal non-object value.
 */
function cloneObject( object ) {
	if ( typeof object === 'object' ) {
		return {
			...Object.fromEntries(
				Object.entries( object ).map( ( [ key, value ] ) => [
					key,
					cloneObject( value ),
				] )
			),
		};
	}

	return object;
}

/**
 * Perform an immutable set.
 * Handles nullish initial values.
 * Clones all nested objects in the specified object.
 *
 * @param {Object}              object Object to set a value in.
 * @param {number|string|Array} path   Path in the object to modify.
 * @param {*}                   value  New value to set.
 * @return {Object} Cloned object with the new value set.
 */
export function immutableSet( object, path, value ) {
	const normalizedPath = normalizePath( path );
	const newObject = object ? cloneObject( object ) : {};

	normalizedPath.reduce( ( acc, key, i ) => {
		if ( acc[ key ] === undefined ) {
			acc[ key ] = {};
		}
		if ( i === normalizedPath.length - 1 ) {
			acc[ key ] = value;
		}
		return acc[ key ];
	}, newObject );

	return newObject;
}

export function transformStyles(
	activeSupports,
	migrationPaths,
	result,
	source,
	index,
	results
) {
	// If there are no active supports return early.
	if (
		Object.values( activeSupports ?? {} ).every(
			( isActive ) => ! isActive
		)
	) {
		return result;
	}
	// If the condition verifies we are probably in the presence of a wrapping transform
	// e.g: nesting paragraphs in a group or columns and in that case the styles should not be transformed.
	if ( results.length === 1 && result.innerBlocks.length === source.length ) {
		return result;
	}
	// For cases where we have a transform from one block to multiple blocks
	// or multiple blocks to one block we apply the styles of the first source block
	// to the result(s).
	let referenceBlockAttributes = source[ 0 ]?.attributes;
	// If we are in presence of transform between more than one block in the source
	// that has more than one block in the result
	// we apply the styles on source N to the result N,
	// if source N does not exists we do nothing.
	if ( results.length > 1 && source.length > 1 ) {
		if ( source[ index ] ) {
			referenceBlockAttributes = source[ index ]?.attributes;
		} else {
			return result;
		}
	}
	let returnBlock = result;
	Object.entries( activeSupports ).forEach( ( [ support, isActive ] ) => {
		if ( isActive ) {
			migrationPaths[ support ].forEach( ( path ) => {
				const styleValue = get( referenceBlockAttributes, path );
				if ( styleValue ) {
					returnBlock = {
						...returnBlock,
						attributes: immutableSet(
							returnBlock.attributes,
							path,
							styleValue
						),
					};
				}
			} );
		}
	} );
	return returnBlock;
}

/**
 * Check whether serialization of specific block support feature or set should
 * be skipped.
 *
 * @param {string|Object} blockType  Block name or block type object.
 * @param {string}        featureSet Name of block support feature set.
 * @param {string}        feature    Name of the individual feature to check.
 *
 * @return {boolean} Whether serialization should occur.
 */
export function shouldSkipSerialization( blockType, featureSet, feature ) {
	const support = getBlockSupport( blockType, featureSet );
	const skipSerialization = support?.__experimentalSkipSerialization;

	if ( Array.isArray( skipSerialization ) ) {
		return skipSerialization.includes( feature );
	}

	return skipSerialization;
}
