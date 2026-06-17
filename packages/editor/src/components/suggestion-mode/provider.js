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
import {
	acceptInlineDeletion,
	rejectInlineDeletion,
} from '../inline-suggestions';

/**
 * @typedef {Object} SuggestionOperation
 * @property {'attribute-set'|'inline-suggestion'|'block-insert-after'|'block-remove'|'block-move'} type
 *                                                                                                                   Operation type. `attribute-set` and `inline-suggestion` ship in
 *                                                                                                                   Phase 2; the structural variants ship in Phase 6 (issue #77434).
 * @property {string}                                                                               [attribute]      The attribute being changed (`attribute-set`) or
 *                                                                                                                   carrying the marker (`inline-suggestion`).
 * @property {'del'|'add'}                                                                          [suggestionType] Inline marker kind (`inline-suggestion` only): `del`
 *                                                                                                                   wraps existing text proposed for removal, `add` wraps proposed
 *                                                                                                                   new text.
 * @property {*}                                                                                    [before]         The baseline value (`attribute-set`).
 * @property {*}                                                                                    [after]          The proposed value (`attribute-set`).
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

/**
 * Suggestion payload schema version. v1 emitted only `attribute-set`
 * operations; v2 reserves the structural op types (`block-insert-after`,
 * `block-remove`, `block-move`) tracked in issue #77434.
 *
 * Reader rule:
 *   parsed < SCHEMA_VERSION → migrate forward, then apply.
 *   parsed === SCHEMA_VERSION → apply as-is.
 *   parsed > SCHEMA_VERSION → refuse (newer-editor notice; offer Reject only).
 *
 * Bumping this constant requires a corresponding migration step in
 * `parseSuggestionPayload`.
 */
const SCHEMA_VERSION = 2;

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
 * Operation types that mutate the block tree's structure rather than a
 * single block's attributes. These flow through a different apply/reject
 * path than `attribute-set`: Apply dispatches the corresponding block-
 * editor action (`removeBlock`, `insertBlock`, `moveBlockToPosition`),
 * Reject just clears the `metadata.suggestion` marker.
 */
const STRUCTURAL_OP_TYPES = new Set( [
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
 * @param {SuggestionOperation[]} operations Payload operations.
 * @return {SuggestionOperation|null} Structural op, or null when none.
 */
export function findStructuralOp( operations ) {
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
 * @param {SuggestionOperation[]} operations Payload operations.
 * @return {SuggestionOperation|null} Inline op, or null when none.
 */
export function findInlineOp( operations ) {
	if ( ! Array.isArray( operations ) ) {
		return null;
	}
	return (
		operations.find( ( op ) => op && op.type === INLINE_OP_TYPE ) ?? null
	);
}

/**
 * Build attributes that clear the `metadata.suggestion` marker on a block
 * while preserving every other metadata field. Used by Apply (after the
 * mutation lands) and by Reject (to drop the pending state).
 *
 * @param {Object} currentAttributes Block's current attributes.
 * @return {Object} Partial attributes payload safe for `updateBlockAttributes`.
 */
export function clearSuggestionMarkerAttributes( currentAttributes ) {
	const meta = currentAttributes?.metadata;
	if ( ! meta || meta.suggestion === undefined ) {
		return null;
	}
	const { suggestion: _drop, ...rest } = meta;
	return { metadata: rest };
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
	// Inserted blocks have no pre-existing attributes — the overlay's
	// baseline for a `block-insert-after` entry is `{}`, so every
	// attribute-set op rides on `before: null`. Comparing that against the
	// live (already-typed-into) block's attributes always reads as
	// divergence, which falsely fires the staleness prompt on apply. The
	// attribute-set ops describe the inserted block's content, not an
	// overwrite of pre-existing data, so there is nothing to conflict with.
	if ( findStructuralOp( operations )?.type === 'block-insert-after' ) {
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
 * Migrate a payload emitted by an older `SCHEMA_VERSION` up to the current
 * shape. v1 → v2 is a pure additive change (structural op types reserved but
 * v1 payloads never used them), so the migration just stamps the version
 * field forward — no shape rewriting is needed.
 *
 * Add a new `case` per future bump; never remove old cases, since the
 * comment-meta store may contain payloads written by every prior version.
 *
 * @param {Object} parsed Parsed JSON payload of a known older version.
 * @return {Object} Payload upgraded to the current schema.
 */
function migrateSuggestionPayload( parsed ) {
	let next = parsed;
	if ( next.schemaVersion === 1 ) {
		next = { ...next, schemaVersion: 2 };
	}
	return next;
}

/**
 * Parse a `_wp_suggestion` meta value into a typed payload. Refuses payloads
 * written by a newer editor (`schemaVersion > SCHEMA_VERSION`) so a partial
 * apply can't drop op types this consumer doesn't understand. Migrates
 * older payloads forward to the current shape.
 *
 * @param {string|undefined} raw The raw JSON string from comment meta.
 * @return {SuggestionPayload|null} Parsed payload, or null when the input is
 * malformed or the payload was written by a newer editor.
 */
export function parseSuggestionPayload( raw ) {
	if ( ! raw ) {
		return null;
	}
	let parsed;
	try {
		parsed = JSON.parse( raw );
	} catch {
		return null;
	}
	if (
		typeof parsed !== 'object' ||
		parsed === null ||
		! Array.isArray( parsed.operations )
	) {
		return null;
	}
	// Pre-versioned payloads (schemaVersion missing) are treated as v1 — the
	// only writer that emitted them was the v1 implementation.
	const version =
		typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1;
	if ( version > SCHEMA_VERSION ) {
		return null;
	}
	if ( version < SCHEMA_VERSION ) {
		return migrateSuggestionPayload( {
			...parsed,
			schemaVersion: version,
		} );
	}
	return parsed;
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
	const { updateBlockAttributes, removeBlock, moveBlockToPosition } =
		useDispatch( blockEditorStore );
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

			// Inline suggestions live as a `core/suggestion` marker in a
			// single rich-text attribute. Apply resolves the marker by comment
			// id and rewrites that one attribute: a deletion drops the marked
			// text with its marker; an addition unwraps the marker so the
			// proposed text becomes permanent. The write bypasses the
			// suggest-mode interceptor so it lands on the live block instead of
			// being reverted into the overlay.
			const inlineOp = findInlineOp( payload.operations );
			if ( inlineOp ) {
				const attributeKey = inlineOp.attribute;
				const originalValue =
					selectBlockAttributes( targetClientId )?.[ attributeKey ];
				const nextValue =
					inlineOp.suggestionType === 'add'
						? rejectInlineDeletion( originalValue, commentId )
						: acceptInlineDeletion( originalValue, commentId );
				try {
					requestInterceptorBypass( targetClientId );
					clearOverlay( targetClientId );
					updateBlockAttributes( targetClientId, {
						[ attributeKey ]: nextValue,
					} );

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
					// Roll the attribute back so the block isn't left
					// half-applied if the server rejected the status update.
					requestInterceptorBypass( targetClientId );
					updateBlockAttributes( targetClientId, {
						[ attributeKey ]: originalValue,
					} );
					createNotice(
						'error',
						error?.message ||
							__( 'Failed to save suggestion status.' ),
						{ type: 'snackbar', isDismissible: true }
					);
				}
				return;
			}

			// Structural ops (block-remove, block-insert-after; block-move
			// ships in a follow-up) can't ride the updateBlockAttributes
			// path: their apply mutates the tree rather than a single
			// block's attributes. Branch out, run the matching block-
			// editor action, and short-circuit before the attribute-set
			// rollback machinery below.
			const structuralOp = findStructuralOp( payload.operations );
			if ( structuralOp ) {
				try {
					if ( structuralOp.type === 'block-remove' ) {
						// Bypass twice: the marker-clear dispatch lands
						// first (so the live block ends without the
						// pending-remove flag should the removeBlock fail),
						// then the actual removal.
						const clearAttrs = clearSuggestionMarkerAttributes(
							selectBlockAttributes( targetClientId )
						);
						if ( clearAttrs ) {
							requestInterceptorBypass( targetClientId );
							updateBlockAttributes( targetClientId, clearAttrs );
						}
						requestInterceptorBypass( targetClientId );
						clearOverlay( targetClientId );
						removeBlock( targetClientId );
					} else if (
						structuralOp.type === 'block-insert-after' ||
						structuralOp.type === 'block-move'
					) {
						// The block is already at its proposed location
						// (the user inserted or moved it during Suggest
						// mode); apply commits the captured edits onto the
						// live block AND clears the pending marker so the
						// block loses its dimmed/outlined treatment.
						//
						// Attribute-set ops in the same payload represent
						// edits the user made between the structural
						// change and auto-save. They never reach the live
						// block on the suggester's side — the interceptor
						// reverts them into the overlay — so collaborators
						// (and the suggester after a reload) see the live
						// block in the captured shape (typically empty
						// content for a fresh paragraph). Apply must
						// materialize those edits on the live block,
						// otherwise the inserted/moved block ends up in
						// the wrong shape after acceptance.
						const currentAttributes =
							selectBlockAttributes( targetClientId );
						const withOpsApplied = applyOperations(
							currentAttributes,
							payload.operations
						);
						const markerCleared =
							clearSuggestionMarkerAttributes( withOpsApplied );
						const finalAttributes = markerCleared
							? { ...withOpsApplied, ...markerCleared }
							: withOpsApplied;
						requestInterceptorBypass( targetClientId );
						updateBlockAttributes(
							targetClientId,
							finalAttributes
						);
						clearOverlay( targetClientId );
					}

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
					createNotice(
						'error',
						error?.message ||
							__( 'Failed to save suggestion status.' ),
						{ type: 'snackbar', isDismissible: true }
					);
				}
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
			removeBlock,
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
	 * For structural suggestions (e.g. `block-remove`), also clears the
	 * `metadata.suggestion` marker on the live block so the dimmed/struck
	 * visual treatment goes away.
	 *
	 * @param {Object}            args            Reject arguments.
	 * @param {number|string}     args.commentId  Comment id of the rejected
	 *                                            suggestion.
	 * @param {string}            [args.clientId] Target block clientId, if
	 *                                            known.
	 * @param {SuggestionPayload} [args.payload]  Parsed suggestion payload —
	 *                                            inspected to detect a
	 *                                            structural op so the marker
	 *                                            can be cleared on the live
	 *                                            block.
	 * @return {Promise<void>}
	 */
	const rejectSuggestion = useCallback(
		async ( { commentId, clientId, payload } ) => {
			// Reject behavior depends on the structural op type:
			//   - block-remove: drop the marker (block stays).
			//   - block-insert-after: dispatch removeBlock to undo the
			//     suggested insertion. The marker on the live block goes
			//     away with the block itself.
			//   - block-move: clear the marker, then dispatch
			//     moveBlockToPosition to put the block back at its
			//     pre-move parent + index.
			//   - attribute-set (no structural op): no live-block change.
			const structuralOp = findStructuralOp( payload?.operations );
			if ( structuralOp && clientId ) {
				if ( structuralOp.type === 'block-insert-after' ) {
					requestInterceptorBypass( clientId );
					clearOverlay( clientId );
					removeBlock( clientId );
				} else if ( structuralOp.type === 'block-move' ) {
					const clearAttrs = clearSuggestionMarkerAttributes(
						selectBlockAttributes( clientId )
					);
					if ( clearAttrs ) {
						requestInterceptorBypass( clientId );
						updateBlockAttributes( clientId, clearAttrs );
					}
					requestInterceptorBypass( clientId );
					clearOverlay( clientId );
					moveBlockToPosition(
						clientId,
						// `moveBlockToPosition` expects '' (not null) for
						// the root.
						structuralOp.fromParentClientId ?? '',
						structuralOp.fromParentClientId ?? '',
						structuralOp.fromIndex ?? 0
					);
				} else {
					const clearAttrs = clearSuggestionMarkerAttributes(
						selectBlockAttributes( clientId )
					);
					if ( clearAttrs ) {
						requestInterceptorBypass( clientId );
						updateBlockAttributes( clientId, clearAttrs );
					}
					clearOverlay( clientId );
				}
			}

			// Inline suggestions: reject restores the block's pre-suggestion
			// content for the marked attribute — a deletion keeps the text and
			// drops the marker, an addition removes the proposed text with its
			// marker. Resolve the target the way apply does (the metadata link
			// may be absent on a fresh load) and bypass the interceptor so the
			// change lands on the live block.
			const inlineOp = findInlineOp( payload?.operations );
			if ( inlineOp ) {
				let targetClientId = clientId;
				if ( ! targetClientId ) {
					const liveIds = selectClientIdsWithDescendants?.() ?? [];
					const commentIdKey = String( commentId );
					for ( const id of liveIds ) {
						const ids = getNoteIdsFromMetadata(
							selectBlockAttributes( id )?.metadata
						);
						if (
							ids.some( ( n ) => String( n ) === commentIdKey )
						) {
							targetClientId = id;
							break;
						}
					}
				}
				if ( targetClientId ) {
					const attributeKey = inlineOp.attribute;
					const value =
						selectBlockAttributes( targetClientId )?.[
							attributeKey
						];
					const nextValue =
						inlineOp.suggestionType === 'add'
							? acceptInlineDeletion( value, commentId )
							: rejectInlineDeletion( value, commentId );
					requestInterceptorBypass( targetClientId );
					clearOverlay( targetClientId );
					updateBlockAttributes( targetClientId, {
						[ attributeKey ]: nextValue,
					} );
				}
			}

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
		[
			saveEntityRecord,
			createNotice,
			selectBlockAttributes,
			selectClientIdsWithDescendants,
			updateBlockAttributes,
			removeBlock,
			moveBlockToPosition,
			requestInterceptorBypass,
			clearOverlay,
		]
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
