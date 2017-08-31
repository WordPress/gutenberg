/**
 * External dependencies
 */
import createSelector from 'rememo';
import uuid from 'uuid/v4';
import {
	get,
	reduce,
	castArray,
	findIndex,
	isObjectLike,
	find,
	filter,
} from 'lodash';

/**
 * Internal dependencies
 */
import { getBlockType, getBlockTypes, getUnknownTypeHandlerName } from './registration';
import { getBlockAttributes } from './parser';
import normalize from './paste/normalise-blocks';

/**
 * Returns a block object given its type and attributes.
 *
 * @param  {String} name             Block name
 * @param  {Object} blockAttributes  Block attributes
 * @return {Object}                  Block object
 */
export function createBlock( name, blockAttributes = {} ) {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	// Ensure attributes contains only values defined by block type, and merge
	// default values for missing attributes.
	const attributes = reduce( blockType.attributes, ( result, source, key ) => {
		const value = blockAttributes[ key ];
		if ( undefined !== value ) {
			result[ key ] = value;
		} else if ( source.default ) {
			result[ key ] = source.default;
		}

		return result;
	}, {} );
	if ( blockType.supportAnchor && blockAttributes.anchor ) {
		attributes.anchor = blockAttributes.anchor;
	}

	// Blocks are stored with a unique ID, the assigned type name,
	// and the block attributes.
	return {
		uid: uuid(),
		name,
		isValid: true,
		attributes,
	};
}

const getBlockTypeTransforms = createSelector( ( blockTypes, type ) => {
	return blockTypes.reduce( ( result, blockType ) => {
		if ( blockType.transforms ) {
			result = [
				...result,
				...filter( blockType.transforms.from, { type } )
					.map( ( transform ) => [ blockType, transform ] ),
			];
		}

		return result;
	}, [] );
} );

export function createBlocksFromMarkup( html ) {
	// Assign markup as body of sandboxed document
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = normalize( html );

	const rawTransforms = getBlockTypeTransforms( getBlockTypes(), 'raw' );

	// For each node in the document, check whether a block type with a raw
	// transform matches the node
	return [ ...doc.body.children ].map( ( node ) => {
		for ( let i = 0; i < rawTransforms.length; i++ ) {
			const [ blockType, transform ] = rawTransforms[ i ];
			if ( ! transform.isMatch( node ) ) {
				continue;
			}

			// Return with matched block, extracting attributes from the node
			// as defined by the block attributes schema
			return createBlock(
				blockType.name,
				transform.getAttributes
					? transform.getAttributes( node )
					: getBlockAttributes( blockType, node.outerHTML )
			);
		}

		// Assuming no match, use fallback block handler
		return createBlock( getUnknownTypeHandlerName(), {
			content: node.outerHTML,
		} );
	} );
}

/**
 * Switch a block into one or more blocks of the new block type.
 *
 * @param  {Object} block      Block object
 * @param  {string} name       Block name
 * @return {Array}             Block object
 */
export function switchToBlockType( block, name ) {
	// Find the right transformation by giving priority to the "to"
	// transformation.
	const destinationType = getBlockType( name );
	const sourceType = getBlockType( block.name );
	const transformationsFrom = get( destinationType, 'transforms.from', [] );
	const transformationsTo = get( sourceType, 'transforms.to', [] );
	const transformation =
		find( transformationsTo, t => t.type === 'block' && t.blocks.indexOf( name ) !== -1 ) ||
		find( transformationsFrom, t => t.type === 'block' && t.blocks.indexOf( block.name ) !== -1 );

	// Stop if there is no valid transformation. (How did we get here?)
	if ( ! transformation ) {
		return null;
	}

	let transformationResults = transformation.transform( block.attributes );

	// Ensure that the transformation function returned an object or an array
	// of objects.
	if ( ! isObjectLike( transformationResults ) ) {
		return null;
	}

	// If the transformation function returned a single object, we want to work
	// with an array instead.
	transformationResults = castArray( transformationResults );

	// Ensure that every block object returned by the transformation has a
	// valid block type.
	if ( transformationResults.some( ( result ) => ! getBlockType( result.name ) ) ) {
		return null;
	}

	const firstSwitchedBlock = findIndex( transformationResults, ( result ) => result.name === name );

	// Ensure that at least one block object returned by the transformation has
	// the expected "destination" block type.
	if ( firstSwitchedBlock < 0 ) {
		return null;
	}

	return transformationResults.map( ( result, index ) => ( {
		...result,
		// The first transformed block whose type matches the "destination"
		// type gets to keep the existing block's UID.
		uid: index === firstSwitchedBlock ? block.uid : result.uid,
	} ) );
}
