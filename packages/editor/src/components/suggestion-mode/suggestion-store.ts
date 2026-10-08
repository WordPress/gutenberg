/**
 * Where suggestions are persisted. This is the swap point for a different
 * backend (a Yjs document, say): everything above it works with payloads and
 * comment ids and never sees the storage shape.
 *
 * The comment-meta store keeps each suggestion as a `note` comment on the
 * post, with the payload serialized to the `_wp_suggestion` meta and the
 * reviewer's decision in `_wp_suggestion_status`. It reads and writes through
 * core-data only: no block tree access, no notices.
 */
import { useMemo } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { PAYLOAD_MAX_BYTES, payloadByteLength } from './operations';
import type { SuggestionPayload } from './operations';

/**
 * Keep in sync with the `_wp_suggestion_status` enum declared in
 * `block-comments.php`.
 */
export type SuggestionLifecycleStatus = 'applied' | 'rejected';

export interface SuggestionStore {
	/**
	 * Create a pending note carrying the payload.
	 *
	 * @param postId  Post the note belongs to.
	 * @param payload Suggestion payload.
	 * @return The saved comment record.
	 */
	createNote: (
		postId: number,
		payload: SuggestionPayload
	) => Promise< any >;
	/**
	 * Replace the payload on an existing note without changing its author,
	 * status, or thread identity.
	 *
	 * @param commentId Comment id.
	 * @param payload   Suggestion payload.
	 * @return The saved comment record.
	 */
	updateNote: (
		commentId: number | string,
		payload: SuggestionPayload
	) => Promise< any >;
	/**
	 * Trash a note.
	 *
	 * @param commentId Comment id.
	 */
	trashNote: ( commentId: number | string ) => Promise< void >;
	/**
	 * Record the reviewer's decision. The note stays as a thread (status
	 * `approved`) so the conversation persists as evidence that the suggestion
	 * was reviewed.
	 *
	 * @param commentId Comment id.
	 * @param status    The decision.
	 * @return The saved comment record.
	 */
	setLifecycleStatus: (
		commentId: number | string,
		status: SuggestionLifecycleStatus
	) => Promise< any >;
	/**
	 * The note as currently loaded, if it is.
	 *
	 * @param commentId Comment id.
	 * @return The comment record, or undefined.
	 */
	getNote: ( commentId: number | string ) => any;
}

/**
 * Refuse a payload the REST controller would reject, before the request
 * leaves the browser.
 *
 * @param payload Payload about to be written.
 */
function assertPayloadFits( payload: SuggestionPayload ) {
	if ( payloadByteLength( payload ) > PAYLOAD_MAX_BYTES ) {
		throw new Error( __( 'Suggestion is too large to save.' ) );
	}
}

/**
 * The comment-meta backed store for a registry.
 *
 * @param registry Data registry holding the core-data store.
 * @return The store.
 */
export function createCommentMetaSuggestionStore(
	registry: any
): SuggestionStore {
	const save = ( record: Record< string, any > ) =>
		registry
			.dispatch( coreStore )
			.saveEntityRecord( 'root', 'comment', record, {
				throwOnError: true,
			} );

	return {
		async createNote( postId, payload ) {
			assertPayloadFits( payload );
			return await save( {
				post: postId,
				content: '',
				status: 'hold',
				type: 'note',
				parent: 0,
				meta: {
					_wp_suggestion: JSON.stringify( payload ),
				},
			} );
		},

		async updateNote( commentId, payload ) {
			assertPayloadFits( payload );
			return await save( {
				id: commentId,
				meta: {
					_wp_suggestion: JSON.stringify( payload ),
				},
			} );
		},

		async trashNote( commentId ) {
			await save( { id: commentId, status: 'trash' } );
		},

		async setLifecycleStatus( commentId, status ) {
			return await save( {
				id: commentId,
				status: 'approved',
				meta: { _wp_suggestion_status: status },
			} );
		},

		getNote( commentId ) {
			return registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', commentId );
		},
	};
}

/**
 * The suggestion store for the current registry.
 *
 * @return The store.
 */
export function useSuggestionStore(): SuggestionStore {
	const registry = useRegistry();
	return useMemo(
		() => createCommentMetaSuggestionStore( registry ),
		[ registry ]
	);
}
