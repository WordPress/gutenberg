/**
 * External dependencies
 */
import {
	pickBy,
	isEmpty,
	isObject,
	identity,
	mapValues,
	forEach,
	get,
	setWith,
	clone,
	every,
} from 'lodash';

/**
 * Removed falsy values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from falsy values
 */
export const cleanEmptyObject = ( object ) => {
	if ( ! isObject( object ) || Array.isArray( object ) ) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

export function immutableSet( object, path, value ) {
	return setWith( object ? clone( object ) : {}, path, value, clone );
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
	if ( every( activeSupports, ( isActive ) => ! isActive ) ) {
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
	forEach( activeSupports, ( isActive, support ) => {
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
