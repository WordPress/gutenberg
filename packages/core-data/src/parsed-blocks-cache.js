import { select } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Shared cache of blocks parsed from an entity's `content` string, keyed by
 * `kind:name:id`. Populated both eagerly by the `getEntityRecord` resolver
 * (when the sync manager parses content for transient edits) and lazily by
 * `useEntityBlockEditor`.
 *
 * A parse result is a function of the content and of the block types
 * registered at the time: a block whose type is not registered yet is
 * dropped or replaced, not kept. Both are therefore stored with the entry,
 * and a lookup only hits while both still match — the content string, and,
 * by identity, the list of registered block types, which the blocks store
 * memoizes until a type is added or removed. A record resolved before the
 * editor's assets have registered the block types — a resolver can run that
 * early — caches whatever parsing without them produced, and the editor
 * must re-parse rather than adopt it.
 */
const parsedBlocksCache = new Map();

function getCacheKey( kind, name, id ) {
	return `${ kind }:${ name }:${ id }`;
}

/**
 * Returns the registered block types, from the registry `parse` reads.
 *
 * Block types are registered on the default registry, so the validator is
 * read from there rather than from the registry hosting the entities.
 *
 * @return {Array} Registered block types.
 */
function getBlockTypesValidator() {
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
	const cached = parsedBlocksCache.get( getCacheKey( kind, name, id ) );

	if (
		cached &&
		cached.content === content &&
		cached.blockTypes === getBlockTypesValidator()
	) {
		return cached.blocks;
	}
}

/**
 * Caches the blocks parsed for an entity, remembering the content and the
 * registered block types they were parsed with.
 *
 * @param {string}        kind    Entity kind.
 * @param {string}        name    Entity name.
 * @param {string|number} id      Record ID.
 * @param {string}        content The `content` string the blocks were parsed
 *                                from.
 * @param {Array}         blocks  The parsed blocks.
 */
export function setCachedBlocks( kind, name, id, content, blocks ) {
	parsedBlocksCache.set( getCacheKey( kind, name, id ), {
		content,
		blocks,
		blockTypes: getBlockTypesValidator(),
	} );
}
