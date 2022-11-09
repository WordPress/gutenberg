/**
 * External dependencies
 */
import { isEmpty, mapValues, get, setWith, clone, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockSupport, getBlockType, createBlock } from '@wordpress/blocks';

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

export function flattenBlocks( blocks ) {
	return blocks.flatMap( ( block ) => [
		block,
		...flattenBlocks( block.innerBlocks ),
	] );
}

export function replaceContentsInBlocks( sourceBlocks, contentBlocks ) {
	const [ contentBlock, ...restContentBlocks ] = contentBlocks;
	return sourceBlocks.map( ( block ) => {
		if ( block.name !== contentBlock.name ) {
			return createBlock(
				block.name,
				block.attributes,
				replaceContentsInBlocks( block.innerBlocks, contentBlocks )
			);
		}

		const blockTypeAttributes = getBlockType( block.name ).attributes;
		return createBlock(
			block.name,
			Object.keys( block.attributes ).reduce(
				( attributes, attributeName ) => {
					if (
						blockTypeAttributes[ attributeName ]
							.__experimentalRole === 'content'
					) {
						attributes[ attributeName ] =
							contentBlock.attributes[ attributeName ];
					} else {
						attributes[ attributeName ] =
							block.attributes[ attributeName ];
					}
					return attributes;
				},
				{}
			),
			replaceContentsInBlocks( block.innerBlocks, restContentBlocks )
		);
	} );
}

export function areBlocksAlike( sourceBlocks, targetBlocks ) {
	if ( sourceBlocks.length !== targetBlocks.length ) {
		return false;
	}

	for ( let index = 0; index < sourceBlocks.length; index += 1 ) {
		const sourceBlock = sourceBlocks[ index ];
		const targetBlock = targetBlocks[ index ];

		if ( sourceBlock.name !== targetBlock.name ) {
			return false;
		}

		const blockTypeAttributes = getBlockType( sourceBlock.name ).attributes;

		if (
			Object.keys( blockTypeAttributes ).some(
				( attribute ) =>
					attribute !== 'templateLock' &&
					blockTypeAttributes[ attribute ].__experimentalRole !==
						'content' &&
					! isEqual(
						sourceBlock.attributes[ attribute ],
						targetBlock.attributes[ attribute ]
					)
			)
		) {
			return false;
		}

		if (
			! areBlocksAlike( sourceBlock.innerBlocks, targetBlock.innerBlocks )
		) {
			return false;
		}
	}

	return true;
}
