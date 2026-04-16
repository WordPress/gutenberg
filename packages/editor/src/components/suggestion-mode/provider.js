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

function isAttributeEqual( a, b ) {
	if ( a === b ) {
		return true;
	}
	if ( a === null || a === undefined || b === null || b === undefined ) {
		return false;
	}
	if ( typeof a !== 'object' || typeof b !== 'object' ) {
		return false;
	}
	try {
		return JSON.stringify( a ) === JSON.stringify( b );
	} catch {
		return false;
	}
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
			// `metadata.noteId` matches the comment id.
			let targetClientId = clientId;
			if ( ! targetClientId ) {
				const liveIds = selectClientIdsWithDescendants?.() ?? [];
				for ( const id of liveIds ) {
					if (
						selectBlockAttributes( id )?.metadata?.noteId ===
						commentId
					) {
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

			try {
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
				updateBlockAttributes( targetClientId, currentAttributes );
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
		]
	);

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

export { SCHEMA_VERSION };
