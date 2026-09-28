import { select } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Shared cache of blocks parsed from an entity's `content` string. Populated
 * both eagerly by the `getEntityRecord` resolver (when the sync manager
 * parses content for transient edits) and lazily by `useEntityBlockEditor`.
 *
 * A parse result is a function of the content and of the block types
 * registered at the time: a block whose type is not registered yet is
 * dropped or replaced, not kept. The cache is therefore two levels — the
 * outer one keyed by the registered block types list, the inner one by
 * `kind:name:id`, holding the blocks with the `content` string they were
 * parsed from as the remaining validator. A record resolved before the
 * editor's assets have registered the block types — a resolver can run
 * that early — lands under a list that registration then replaces.
 *
 * The outer level is a WeakMap keyed by the list itself: the blocks store
 * memoizes it until a type is added or removed, then produces a new one and
 * drops the old, taking every entry parsed against it with it. Nothing is
 * invalidated by hand and nothing stale is retained.
 */
const caches = new WeakMap();

function getCacheKey( kind, name, id ) {
	return `${ kind }:${ name }:${ id }`;
}

/**
 * Returns the registered block types, from the registry `parse` reads.
 *
 * Block types are registered on the default registry, so the cache is
 * partitioned by that registry's list rather than one from the registry
 * hosting the entities.
 *
 * @return {Array} Registered block types.
 */
function getBlockTypes() {
	return select( blocksStore ).getBlockTypes();
}

/**
 * Returns the blocks cached for an entity, if they were parsed from the
 * given content with the block types registered right now.
 *
 * @param {string}        kind    Entity kind.
 * @param {string}        name    Entity name.
 * @param {string|number} id      Record ID.
 * @param {string}        content The record's current `content` string.
 *
 * @return {Array|undefined} The cached blocks, or undefined without a valid
 *                           entry.
 */
export function getCachedBlocks( kind, name, id, content ) {
	const cached = caches
		.get( getBlockTypes() )
		?.get( getCacheKey( kind, name, id ) );

	if ( cached && cached.content === content ) {
		return cached.blocks;
	}
}

/**
 * Caches the blocks parsed for an entity, under the block types they were
 * parsed with.
 *
 * @param {string}        kind    Entity kind.
 * @param {string}        name    Entity name.
 * @param {string|number} id      Record ID.
 * @param {string}        content The `content` string the blocks were parsed
 *                                from.
 * @param {Array}         blocks  The parsed blocks.
 */
export function setCachedBlocks( kind, name, id, content, blocks ) {
	const blockTypes = getBlockTypes();
	let cache = caches.get( blockTypes );

	if ( ! cache ) {
		cache = new Map();
		caches.set( blockTypes, cache );
	}

	cache.set( getCacheKey( kind, name, id ), { content, blocks } );
}
