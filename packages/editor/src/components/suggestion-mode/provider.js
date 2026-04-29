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
	// equal across the serialization boundary.
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
	const { getBlockAttributes: selectBlockAttributes } =
		useSelect( blockEditorStore );
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
					// Merge into existing metadata rather than replacing so
					// other fields like bindings, name, and block identifiers
					// are preserved.
					const existingMeta =
						selectBlockAttributes( clientId )?.metadata ?? {};
					updateBlockAttributes( clientId, {
						metadata: {
							...existingMeta,
							noteId: savedRecord.id,
						},
					} );
				}

				createNotice( 'success', __( 'Suggestion submitted.' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
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
	 * Apply a suggestion to the live block, then persist the lifecycle
	 * status to the comment meta. On a server failure the block is rolled
	 * back so the UI is never left in a half-applied state.
	 *
	 * @param {Object}            args           Apply arguments.
	 * @param {number|string}     args.commentId Comment id holding the
	 *                                           suggestion (`_wp_suggestion`
	 *                                           meta).
	 * @param {string}            args.clientId  Block client id of the apply
	 *                                           target.
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

			if (
				payload.baseRevision &&
				postModified &&
				payload.baseRevision !== postModified
			) {
				createNotice(
					'warning',
					__(
						'Post content has changed since this suggestion. Review carefully.'
					),
					{ type: 'snackbar', isDismissible: true }
				);
			}

			const currentAttributes = selectBlockAttributes( clientId );
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
				requestInterceptorBypass( clientId );
				clearOverlay( clientId );
				updateBlockAttributes( clientId, newAttributes );

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
				requestInterceptorBypass( clientId );
				updateBlockAttributes( clientId, rollbackPayload );
				createNotice(
					'error',
					error?.message || __( 'Failed to save suggestion status.' ),
					{ type: 'snackbar', isDismissible: true }
				);
			}
		},
		[
			postModified,
			saveEntityRecord,
			updateBlockAttributes,
			selectBlockAttributes,
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

	return { createSuggestion, applySuggestion, rejectSuggestion };
}

export { SCHEMA_VERSION, PAYLOAD_MAX_BYTES, payloadByteLength };
