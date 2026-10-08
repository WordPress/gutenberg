/**
 * Finders over a payload's operations and over a block tree, by note id.
 * Pure: the tree is read through the accessors the caller passes in.
 */
import { getNoteIdsFromMetadata } from '../../collab-sidebar/utils';
import type { SuggestionOperation } from './payload';

/**
 * Operation types that mutate the block tree's structure rather than a
 * single block's attributes. These flow through a different apply/reject
 * path than `attribute-set`: Apply dispatches the corresponding block-
 * editor action (`removeBlock`, `insertBlock`, `moveBlockToPosition`),
 * Reject just clears the `metadata.suggestion` marker.
 */
export const STRUCTURAL_OP_TYPES = new Set( [
	'block-remove',
	'block-insert-after',
	'block-move',
] );

/**
 * Locate the structural operation in a suggestion payload. v2 payloads carry
 * at most one structural op per suggestion (the auto-save loop persists each
 * structural mutation as its own note); attribute-set ops can ride along
 * inside the same payload but the structural op leads.
 *
 * @param operations Payload operations.
 * @return Structural op, or null when none.
 */
export function findStructuralOp(
	operations: SuggestionOperation[] | null | undefined
): SuggestionOperation | null {
	if ( ! Array.isArray( operations ) ) {
		return null;
	}
	for ( const op of operations ) {
		if ( op && STRUCTURAL_OP_TYPES.has( op.type ) ) {
			return op;
		}
	}
	return null;
}

/**
 * Operation type for an inline suggestion: a `core/suggestion` marker anchored
 * in a single rich-text attribute. The marked range is never stored — it is
 * re-derived from the in-content marker by id (the comment id) on read — so the
 * op only records which attribute carries the marker and the marker kind.
 */
export const INLINE_OP_TYPE = 'inline-suggestion';

/**
 * Locate the inline-suggestion operation in a payload. A payload describes at
 * most one inline suggestion (each is its own note/comment), so the first match
 * is returned.
 *
 * @param operations Payload operations.
 * @return Inline op, or null when none.
 */
export function findInlineOp(
	operations: SuggestionOperation[] | null | undefined
): SuggestionOperation | null {
	if ( ! Array.isArray( operations ) ) {
		return null;
	}
	return (
		operations.find( ( op ) => op && op.type === INLINE_OP_TYPE ) ?? null
	);
}

/**
 * Op type for a change to a post field (today only the title) rather than a
 * block attribute. Its note has no block anchor.
 */
export const POST_ATTRIBUTE_OP_TYPE = 'post-attribute-set';

/**
 * The post-level operations in a payload.
 *
 * @param operations Operations from a payload.
 * @return The `post-attribute-set` operations, possibly empty.
 */
export function findPostAttributeOps(
	operations: SuggestionOperation[] | null | undefined
): SuggestionOperation[] {
	if ( ! Array.isArray( operations ) ) {
		return [];
	}
	return operations.filter( ( op ) => op?.type === POST_ATTRIBUTE_OP_TYPE );
}

/**
 * Find the block whose `metadata.noteId` links it to a note.
 *
 * `thread.blockClientId` is derived by matching `metadata.noteId` on blocks
 * currently in the editor. If the Suggest author never auto-saved the post
 * after the comment was created, or reloaded before the save landed, the
 * linkage won't exist yet and callers fall back to this scan. The field is an
 * array post-#75147 (several notes per block), so the shared normalization
 * helper is used instead of strict equality.
 *
 * @param clientIds          Live client ids, in tree order.
 * @param getBlockAttributes Attribute reader for a client id.
 * @param commentId          Note id to find.
 * @return The linked block's client id, or undefined.
 */
export function findBlockByNoteId(
	clientIds: string[],
	getBlockAttributes: ( clientId: string ) => Record< string, any > | null,
	commentId: number | string
): string | undefined {
	const commentIdKey = String( commentId );
	for ( const id of clientIds ) {
		const ids = getNoteIdsFromMetadata(
			getBlockAttributes( id )?.metadata
		);
		if (
			ids.some( ( n: number | string ) => String( n ) === commentIdKey )
		) {
			return id;
		}
	}
	return undefined;
}
