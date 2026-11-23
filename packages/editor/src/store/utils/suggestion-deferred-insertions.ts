/**
 * Empty blocks a Suggestion mode session has added and not yet filled.
 *
 * Such a block is not a suggestion until it holds something: it carries no
 * marker and has no note. Saved as it is, it would reach the post as a plain
 * block nobody can accept or reject, so a save made while suggesting leaves
 * it out. Kept per editor, so the save action and the session of one editor
 * share the set and two editors on a page do not.
 */
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { STORE_NAME } from '../constants';

const deferredByEditor = new WeakMap< object, Set< string > >();

/**
 * The deferred insertions of an editor, by block client id.
 *
 * @param registry Data registry of the editor instance.
 * @return The set, created on first use.
 */
export function getDeferredInsertions( registry: any ): Set< string > {
	/*
	 * Keyed by the editor store's selectors: a store action is handed a
	 * different registry object than `useRegistry()` returns, and both
	 * resolve the store to the same selectors.
	 */
	const editor: object = registry.select( STORE_NAME ) ?? registry;
	let deferred = deferredByEditor.get( editor );
	if ( ! deferred ) {
		deferred = new Set();
		deferredByEditor.set( editor, deferred );
	}
	return deferred;
}

function withoutBlocks( blocks: any[], clientIds: Set< string > ): any[] {
	let changed = false;
	const kept = [];
	for ( const block of blocks ) {
		if ( clientIds.has( block.clientId ) ) {
			changed = true;
			continue;
		}
		const innerBlocks = block.innerBlocks?.length
			? withoutBlocks( block.innerBlocks, clientIds )
			: block.innerBlocks;
		if ( innerBlocks !== block.innerBlocks ) {
			changed = true;
			kept.push( { ...block, innerBlocks } );
		} else {
			kept.push( block );
		}
	}
	return changed ? kept : blocks;
}

/**
 * Serialize a post's blocks without the deferred insertions among them.
 *
 * @param registry Data registry of the editor instance.
 * @param blocks   The post's blocks.
 * @return The content, or null when the blocks hold no deferred insertion.
 */
export function serializeWithoutDeferredInsertions(
	registry: any,
	blocks: any[] | undefined
): string | null {
	const deferred = getDeferredInsertions( registry );
	if ( deferred.size === 0 || ! Array.isArray( blocks ) ) {
		return null;
	}
	const kept = withoutBlocks( blocks, deferred );
	return kept === blocks ? null : __unstableSerializeAndClean( kept );
}
