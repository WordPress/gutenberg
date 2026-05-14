/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { EDITOR_STORE_NAME } from './constants';
import { useSuggestionOverlay } from './overlay-context';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
} from '../collab-sidebar/utils';

/**
 * @typedef {Object} SuggestionOperation
 * @property {'attribute-set'} type      Operation type. Only `attribute-set`
 *                                       is implemented in Phase 2.
 * @property {string}          attribute The attribute being changed.
 * @property {*}               before    The baseline value.
 * @property {*}               after     The proposed value.
 */

/**
 * @typedef {Object} SuggestionPayload
 * @property {number}                schemaVersion Payload schema version.
 * @property {string}                blockName     Block name at capture time.
 * @property {string|null}           baseRevision  Post `modified_gmt` at
 *                                                 capture, used by Phase 3 to
 *                                                 detect stale suggestions.
 * @property {SuggestionOperation[]} operations    Ordered operations.
 */

const SCHEMA_VERSION = 1;

/**
 * Maximum byte length of a serialized suggestion payload. Mirrors
 * `GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES` in
 * `lib/compat/wordpress-6.9/block-comments.php`. The client checks before
 * submitting so a doomed request never leaves the browser; the REST
 * controller is the authoritative gate.
 */
const PAYLOAD_MAX_BYTES = 65536;

/**
 * Byte length of a serialized payload, measured the way PHP `strlen()`
 * counts (UTF-8 bytes, not chars).
 *
 * @param {SuggestionPayload} payload
 * @return {number} UTF-8 byte length of the serialized JSON.
 */
function payloadByteLength( payload ) {
	const serialized = JSON.stringify( payload );
	if ( typeof TextEncoder !== 'undefined' ) {
		return new TextEncoder().encode( serialized ).length;
	}
	// Conservative upper bound: 4 bytes per UTF-16 code unit covers all
	// possible UTF-8 expansions. Used only in test/JSDOM environments
	// without TextEncoder.
	return serialized.length * 4;
}

/**
 * Build attribute-set operations by diffing an overlay entry against its
 * captured baseline. Attributes whose value differs are emitted; unchanged
 * or absent keys are skipped.
 *
 * @param {Object} baselineAttributes Attributes captured on first edit.
 * @param {Object} overlayAttributes  Pending attribute changes.
 * @return {SuggestionOperation[]} Operations describing the suggestion.
 */
export function operationsFromOverlay( baselineAttributes, overlayAttributes ) {
	const operations = [];
	for ( const [ attribute, after ] of Object.entries(
		overlayAttributes || {}
	) ) {
		const before = baselineAttributes?.[ attribute ];
		if ( ! isAttributeEqual( before, after ) ) {
			operations.push( {
				type: 'attribute-set',
				attribute,
				before: before ?? null,
				after,
			} );
		}
	}
	return operations;
}

/**
 * Structural equality for attribute values. Handles primitives, arrays, and
 * plain objects with arbitrary key order.
 *
 * `JSON.stringify` is order-sensitive ({a:1,b:2} ≠ {b:2,a:1}), so a stringify-
 * based compare produces spurious "changed" detections when block code re-
 * emits a `style` object with reordered keys. The recursive walk avoids that.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @return {boolean} True when the values are structurally equal.
 */
function isAttributeEqual( a, b ) {
	if ( a === b ) {
		return true;
	}
	if ( a === null || a === undefined || b === null || b === undefined ) {
		return false;
	}
	// One side is a primitive (typically a string from a JSON-deserialized
	// suggestion payload) and the other is a wrapper object (typically a
	// `RichTextData` instance from the live block-editor store). Compare
	// their string representations so the same logical content reads as
	// equal across the serialization boundary — otherwise `hasAttributeConflict`
	// flags every content suggestion as stale and the apply flow short-
	// circuits to a never-visible "stale" dialog.
	const aIsObject = typeof a === 'object';
	const bIsObject = typeof b === 'object';
	if ( aIsObject !== bIsObject ) {
		return String( a ) === String( b );
	}
	if ( ! aIsObject ) {
		return false;
	}
	const aIsArray = Array.isArray( a );
	const bIsArray = Array.isArray( b );
	if ( aIsArray !== bIsArray ) {
		return false;
	}
	if ( aIsArray ) {
		if ( a.length !== b.length ) {
			return false;
		}
		for ( let i = 0; i < a.length; i++ ) {
			if ( ! isAttributeEqual( a[ i ], b[ i ] ) ) {
				return false;
			}
		}
		return true;
	}
	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );
	if ( aKeys.length !== bKeys.length ) {
		return false;
	}
	// Wrapper objects like `RichTextData` hold their content in private
	// class fields, so `Object.keys()` returns an empty array for any two
	// instances regardless of the text they wrap. Fall back to a string
	// compare so two wrappers with different content don't look equal.
	if ( aKeys.length === 0 ) {
		return String( a ) === String( b );
	}
	for ( const key of aKeys ) {
		if ( ! Object.prototype.hasOwnProperty.call( b, key ) ) {
			return false;
		}
		if ( ! isAttributeEqual( a[ key ], b[ key ] ) ) {
			return false;
		}
	}
	return true;
}

/**
 * Apply a suggestion payload's operations to a block's current attributes
 * to produce the new attributes. Pure function — no side effects.
 *
 * @param {Object}                currentAttributes Block's current attributes.
 * @param {SuggestionOperation[]} operations        Operations from the payload.
 * @return {Object} Merged attributes with suggestions applied.
 */
export function applyOperations( currentAttributes, operations ) {
	const result = { ...currentAttributes };
	for ( const op of operations ) {
		if ( op.type === 'attribute-set' ) {
			result[ op.attribute ] = op.after;
		}
	}
	return result;
}

/**
 * Report whether applying the suggestion's operations over the block's
 * current attributes would overwrite concurrent changes made by someone
 * else. A suggestion is considered conflicting only when the baseline
 * captured at suggest-time differs from the attribute's current value —
 * simply reopening the post after any auto-save doesn't qualify.
 *
 * @param {Object}                currentAttributes Block's current attributes.
 * @param {SuggestionOperation[]} operations        Operations from the payload.
 * @return {boolean} True if at least one targeted attribute has diverged.
 */
export function hasAttributeConflict( currentAttributes, operations ) {
	if ( ! Array.isArray( operations ) ) {
		return false;
	}
	for ( const op of operations ) {
		if ( op.type !== 'attribute-set' ) {
			continue;
		}
		if (
			! isAttributeEqual(
				op.before ?? null,
				currentAttributes?.[ op.attribute ] ?? null
			)
		) {
			return true;
		}
	}
	return false;
}

/**
 * Parse a `_wp_suggestion` meta value into a typed payload.
 *
 * @param {string|undefined} raw The raw JSON string from comment meta.
 * @return {SuggestionPayload|null} Parsed payload, or null if invalid.
 */
export function parseSuggestionPayload( raw ) {
	if ( ! raw ) {
		return null;
	}
	try {
		const parsed = JSON.parse( raw );
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			Array.isArray( parsed.operations )
		) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Comment-meta backed suggestions provider. The provider shape is stable so
 * a future Yjs-backed provider can swap in without touching the UI.
 *
 * Storage: a `note` comment with the suggestion payload serialized to
 * the `_wp_suggestion` comment meta. Linkage to a block reuses the existing
 * `metadata.noteId` block attribute.
 *
 * @return {{
 *   createSuggestion: Function,
 *   applySuggestion:  Function,
 *   rejectSuggestion: Function,
 * }} Suggestions API.
 */
export function useSuggestionsProvider() {
	const { postId, postModified } = useSelect( ( select ) => {
		const editor = select( EDITOR_STORE_NAME );
		const id = editor?.getCurrentPostId?.() ?? null;
		const postType = editor?.getCurrentPostType?.() ?? null;
		const record =
			id && postType
				? select( coreStore ).getEditedEntityRecord(
						'postType',
						postType,
						id
				  )
				: null;
		return {
			postId: id,
			postModified: record?.modified_gmt ?? null,
		};
	}, [] );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createNotice } = useDispatch( noticesStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const {
		getBlockAttributes: selectBlockAttributes,
		getClientIdsWithDescendants: selectClientIdsWithDescendants,
	} = useSelect( blockEditorStore );
	const { requestInterceptorBypass, clearOverlay } = useSuggestionOverlay();

	const createSuggestion = useCallback(
		async ( { clientId, blockName, operations } ) => {
			if ( ! postId ) {
				throw new Error( 'No post id available for suggestion.' );
			}
			if ( ! operations || operations.length === 0 ) {
				return null;
			}

			const payload = /** @type {SuggestionPayload} */ ( {
				schemaVersion: SCHEMA_VERSION,
				blockName,
				baseRevision: postModified,
				operations,
			} );

			if ( payloadByteLength( payload ) > PAYLOAD_MAX_BYTES ) {
				const error = new Error(
					__( 'Suggestion is too large to save.' )
				);
				createNotice( 'error', error.message, {
					type: 'snackbar',
					isDismissible: true,
				} );
				throw error;
			}

			try {
				const savedRecord = await saveEntityRecord(
					'root',
					'comment',
					{
						post: postId,
						content: '',
						status: 'hold',
						type: 'note',
						parent: 0,
						meta: {
							_wp_suggestion: JSON.stringify( payload ),
						},
					},
					{ throwOnError: true }
				);

				if ( savedRecord?.id ) {
					// Append to the noteId array so a fresh suggestion on a
					// block whose previous note(s) have been applied or
					// rejected coexists with them rather than overwriting
					// the link. Other metadata fields like bindings and name
					// are preserved by `addNoteIdToMetadata`.
					const existingMeta =
						selectBlockAttributes( clientId )?.metadata ?? {};
					updateBlockAttributes( clientId, {
						metadata: addNoteIdToMetadata(
							existingMeta,
							savedRecord.id
						),
					} );
				}

				return savedRecord;
			} catch ( error ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to submit suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[
			postId,
			postModified,
			saveEntityRecord,
			updateBlockAttributes,
			selectBlockAttributes,
			createNotice,
		]
	);

	/**
	 * Update an existing suggestion's payload (auto-save path). Replaces
	 * the `_wp_suggestion` meta on the comment without changing its author,
	 * status, or thread identity, so the user sees a single note
	 * accumulating edits rather than a new note per save burst.
	 *
	 * @param {Object}                args            Update arguments.
	 * @param {number|string}         args.commentId  Comment id of the
	 *                                                existing suggestion.
	 * @param {string}                args.blockName  Block name (recorded
	 *                                                on the payload).
	 * @param {SuggestionOperation[]} args.operations Latest operations.
	 * @return {Promise<Object>} The saved comment record.
	 */
	const updateSuggestion = useCallback(
		async ( { commentId, blockName, operations } ) => {
			if ( ! commentId ) {
				throw new Error( 'No comment id for suggestion update.' );
			}

			const payload = /** @type {SuggestionPayload} */ ( {
				schemaVersion: SCHEMA_VERSION,
				blockName,
				baseRevision: postModified,
				operations,
			} );

			if ( payloadByteLength( payload ) > PAYLOAD_MAX_BYTES ) {
				const error = new Error(
					__( 'Suggestion is too large to save.' )
				);
				createNotice( 'error', error.message, {
					type: 'snackbar',
					isDismissible: true,
				} );
				throw error;
			}

			try {
				return await saveEntityRecord(
					'root',
					'comment',
					{
						id: commentId,
						meta: {
							_wp_suggestion: JSON.stringify( payload ),
						},
					},
					{ throwOnError: true }
				);
			} catch ( error ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to update suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[ postModified, saveEntityRecord, createNotice ]
	);

	/**
	 * Delete a suggestion. The auto-saver calls this when the overlay is
	 * fully reverted to baseline — the user retracted their edit, so the
	 * note no longer carries a meaningful suggestion.
	 *
	 * @param {Object}        args           Delete arguments.
	 * @param {number|string} args.commentId Comment id to trash.
	 * @return {Promise<void>}
	 */
	const deleteSuggestion = useCallback(
		async ( { commentId } ) => {
			if ( ! commentId ) {
				return;
			}
			try {
				await saveEntityRecord(
					'root',
					'comment',
					{ id: commentId, status: 'trash' },
					{ throwOnError: true }
				);
			} catch ( error ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to remove suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[ saveEntityRecord, createNotice ]
	);

	/**
	 * Apply a suggestion to the live block, then persist the lifecycle
	 * status to the comment meta. On a server failure the block is rolled
	 * back so the UI is never left in a half-applied state.
	 *
	 * @param {Object}            args           Apply arguments.
	 * @param {number|string}     args.commentId Comment id holding the
	 *                                           suggestion (`_wp_suggestion`
	 *                                           meta).
	 * @param {string}            args.clientId  Block client id of the apply
	 *                                           target. May be undefined if
	 *                                           the acting user opened the
	 *                                           post fresh and the metadata
	 *                                           linkage was never persisted —
	 *                                           the apply path then scans the
	 *                                           live tree by `metadata.noteId`.
	 * @param {SuggestionPayload} args.payload   Parsed payload (from
	 *                                           `parseSuggestionPayload`).
	 * @return {Promise<void>}
	 */
	const applySuggestion = useCallback(
		async ( { commentId, clientId, payload } ) => {
			if ( ! payload || ! Array.isArray( payload.operations ) ) {
				createNotice( 'error', __( 'Invalid suggestion payload.' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
				return;
			}

			// `thread.blockClientId` is derived by matching `metadata.noteId`
			// on blocks currently in the editor. If the Suggest author never
			// auto-saved the post after the comment was created — or the
			// author reloaded before the save landed — the metadata linkage
			// won't exist yet and the caller will pass `clientId: undefined`.
			// Fall back to scanning the live block tree for a block whose
			// `metadata.noteId` includes the comment id (the field is an
			// array post-#75147 to support multiple notes per block, so use
			// the shared normalization helper instead of strict equality).
			let targetClientId = clientId;
			if ( ! targetClientId ) {
				const liveIds = selectClientIdsWithDescendants?.() ?? [];
				const commentIdKey = String( commentId );
				for ( const id of liveIds ) {
					const ids = getNoteIdsFromMetadata(
						selectBlockAttributes( id )?.metadata
					);
					if ( ids.some( ( n ) => String( n ) === commentIdKey ) ) {
						targetClientId = id;
						break;
					}
				}
			}

			if ( ! targetClientId ) {
				createNotice(
					'error',
					__(
						'Could not find the block this suggestion applies to.'
					),
					{ type: 'snackbar', isDismissible: true }
				);
				return;
			}

			const currentAttributes = selectBlockAttributes( targetClientId );
			const newAttributes = applyOperations(
				currentAttributes,
				payload.operations
			);

			// Build a rollback payload that covers exactly the keys this
			// apply touched. `updateBlockAttributes` is a partial merge —
			// passing `currentAttributes` alone would leave keys that the
			// apply newly added stuck on the block (set to their `after`
			// value), since they have no entry in the original attributes
			// to override them. Listing each touched key with its original
			// value (or `undefined` when the key was added by this apply)
			// restores the block cleanly.
			const rollbackPayload = {};
			for ( const op of payload.operations ) {
				if ( op.type !== 'attribute-set' ) {
					continue;
				}
				rollbackPayload[ op.attribute ] =
					Object.prototype.hasOwnProperty.call(
						currentAttributes ?? {},
						op.attribute
					)
						? currentAttributes[ op.attribute ]
						: undefined;
			}

			try {
				// Bypass the suggest-mode interceptor for this dispatch so
				// the applied attributes actually land on the live block
				// instead of being reverted into the overlay. Clearing the
				// overlay entry resets the per-block suggestion tracking,
				// so any subsequent user edit captures a fresh baseline
				// from the post-apply attributes. Outside Suggest mode the
				// interceptor isn't running and these calls are no-ops.
				requestInterceptorBypass( targetClientId );
				clearOverlay( targetClientId );
				updateBlockAttributes( targetClientId, newAttributes );

				await saveEntityRecord(
					'root',
					'comment',
					{
						id: commentId,
						status: 'approved',
						meta: { _wp_suggestion_status: 'applied' },
					},
					{ throwOnError: true }
				);

				createNotice( 'snackbar', __( 'Suggestion applied.' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			} catch ( error ) {
				// Roll back the block change so the UI isn't left in a
				// half-applied state if the server rejected the update.
				requestInterceptorBypass( targetClientId );
				updateBlockAttributes( targetClientId, rollbackPayload );
				createNotice(
					'error',
					error?.message || __( 'Failed to save suggestion status.' ),
					{ type: 'snackbar', isDismissible: true }
				);
			}
		},
		[
			saveEntityRecord,
			updateBlockAttributes,
			selectBlockAttributes,
			selectClientIdsWithDescendants,
			createNotice,
			requestInterceptorBypass,
			clearOverlay,
		]
	);

	/**
	 * Reject a suggestion by setting the comment's lifecycle status. The
	 * comment itself stays as a thread (status `approved`) so the
	 * conversation persists as evidence that the suggestion was reviewed.
	 *
	 * @param {Object}        args           Reject arguments.
	 * @param {number|string} args.commentId Comment id of the rejected
	 *                                       suggestion.
	 * @return {Promise<void>}
	 */
	const rejectSuggestion = useCallback(
		async ( { commentId } ) => {
			try {
				await saveEntityRecord(
					'root',
					'comment',
					{
						id: commentId,
						status: 'approved',
						meta: { _wp_suggestion_status: 'rejected' },
					},
					{ throwOnError: true }
				);

				createNotice( 'snackbar', __( 'Suggestion rejected.' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			} catch ( error ) {
				createNotice(
					'error',
					error?.message || __( 'Failed to reject suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
			}
		},
		[ saveEntityRecord, createNotice ]
	);

	return {
		createSuggestion,
		updateSuggestion,
		deleteSuggestion,
		applySuggestion,
		rejectSuggestion,
	};
}

export { SCHEMA_VERSION, PAYLOAD_MAX_BYTES, payloadByteLength };
