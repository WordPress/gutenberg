/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * Block context cache, implemented as a WeakMap mapping block types to a
 * WeakMap mapping attributes object to context value.
 *
 * @type {WeakMap<string,WeakMap<string,*>>}
 */
const BLOCK_CONTEXT_CACHE = new WeakMap();

/**
 * Returns a cached context object value for a given set of attributes for the
 * block type.
 *
 * @param {Record<string,*>} attributes Block attributes object.
 * @param {WPBlockType}      blockType  Block type settings.
 *
 * @return {Record<string,*>} Context value.
 */
export default function getBlockContext( attributes, blockType ) {
	if ( ! BLOCK_CONTEXT_CACHE.has( blockType ) ) {
		BLOCK_CONTEXT_CACHE.set( blockType, new WeakMap() );
	}

	const blockTypeCache = BLOCK_CONTEXT_CACHE.get( blockType );
	if ( ! blockTypeCache.has( attributes ) ) {
		const context = mapValues(
			blockType.providesContext,
			( attributeName ) => attributes[ attributeName ]
		);

		blockTypeCache.set( attributes, context );
	}

	return blockTypeCache.get( attributes );
}
