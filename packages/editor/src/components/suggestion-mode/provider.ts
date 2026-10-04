import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store/constants';
import {
	useSuggestionOverlay,
	POST_TITLE_OVERLAY_KEY,
} from './overlay-context';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
	removeNoteIdFromMetadata,
} from '../collab-sidebar/utils';
import { ALL_NOTES_SIDEBAR, SIDEBARS } from '../collab-sidebar/constants';
import {
	acceptInlineDeletion,
	rejectInlineDeletion,
	acceptInlineAddition,
	rejectInlineAddition,
	acceptInlineReplacement,
	rejectInlineReplacement,
	acceptInlineFormat,
	rejectInlineFormat,
} from '../inline-suggestions';
import { unlock } from '../../lock-unlock';
import {
	PAYLOAD_MAX_BYTES,
	applyOperations,
	applyPostOperations,
	buildSuggestionPayload,
	findBlockByNoteId,
	findInlineOp,
	findPostAttributeOps,
	findStructuralOp,
	parseSuggestionPayload,
	payloadByteLength,
	planStructuralApply,
	planStructuralReject,
	rollbackAttributesFor,
} from './operations';
import type {
	BlockPlan,
	PlanStep,
	SuggestionOperation,
	SuggestionPayload,
} from './operations';
import { withDecisionInFlight } from './decision-state';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Comment-meta backed suggestions provider. The provider shape is stable so
 * a future Yjs-backed provider can swap in without touching the UI.
 *
 * Storage: a `note` comment with the suggestion payload serialized to
 * the `_wp_suggestion` comment meta. Linkage to a block reuses the existing
 * `metadata.noteId` block attribute.
 *
 * @return Suggestions API.
 */
export function useSuggestionsProvider() {
	const { postId, postModified } = useSelect( ( select ) => {
		const editor: any = select( STORE_NAME );
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
			postModified: ( record as any )?.modified_gmt ?? null,
		};
	}, [] );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createNotice } = useDispatch( noticesStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const {
		updateBlockAttributes,
		removeBlock,
		insertBlock,
		moveBlockToPosition,
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const {
		getBlockAttributes: selectBlockAttributes,
		getClientIdsWithDescendants: selectClientIdsWithDescendants,
	} = useSelect( blockEditorStore );
	const { requestInterceptorBypass, clearOverlay, clearOverlayForComment } =
		useSuggestionOverlay();
	const registry = useRegistry();

	/**
	 * Dispatch a planned set of block-tree effects.
	 *
	 * @param plan The plan.
	 */
	const runPlan = useCallback(
		( plan: BlockPlan ) => {
			const run = ( step: PlanStep ) => {
				switch ( step.step ) {
					case 'bypass':
						requestInterceptorBypass( step.clientId );
						break;
					case 'clearOverlay':
						clearOverlay( step.clientId );
						break;
					case 'updateBlockAttributes':
						updateBlockAttributes( step.clientId, step.attributes );
						break;
					case 'removeBlock':
						removeBlock( step.clientId, step.selectPrevious );
						break;
					case 'insertBlock':
						insertBlock(
							step.block,
							step.index,
							step.rootClientId,
							step.updateSelection
						);
						break;
					case 'moveBlockToPosition':
						moveBlockToPosition(
							step.clientId,
							step.fromRootClientId,
							step.toRootClientId,
							step.index
						);
						break;
				}
			};
			plan.steps.forEach( run );
			if ( plan.batched.length > 0 ) {
				registry.batch( () => plan.batched.forEach( run ) );
			}
		},
		[
			requestInterceptorBypass,
			clearOverlay,
			updateBlockAttributes,
			removeBlock,
			insertBlock,
			moveBlockToPosition,
			registry,
		]
	);

	/**
	 * The block a note targets: the one the caller resolved, or the one whose
	 * `metadata.noteId` links to the note.
	 *
	 * @param clientId  Block client id, if the caller resolved one.
	 * @param commentId Comment id.
	 * @return The target client id, or undefined.
	 */
	const resolveTarget = useCallback(
		( clientId: string | undefined, commentId: number | string ) =>
			clientId ||
			findBlockByNoteId(
				selectClientIdsWithDescendants?.() ?? [],
				selectBlockAttributes,
				commentId
			),
		[ selectClientIdsWithDescendants, selectBlockAttributes ]
	);

	const createSuggestion = useCallback(
		async ( {
			clientId,
			blockName,
			operations,
		}: {
			clientId: string;
			blockName: string;
			operations: SuggestionOperation[];
		} ) => {
			if ( ! postId ) {
				throw new Error( 'No post id available for suggestion.' );
			}
			if ( ! operations || operations.length === 0 ) {
				return null;
			}

			const payload = buildSuggestionPayload( {
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
				const savedRecord: any = await saveEntityRecord(
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

				// A post-level suggestion has no block to link.
				if ( savedRecord?.id && clientId !== POST_TITLE_OVERLAY_KEY ) {
					// Append to the noteId array so a fresh suggestion on a
					// block whose previous note(s) have been applied or
					// rejected coexists with them rather than overwriting
					// the link. Other metadata fields like bindings and name
					// are preserved by `addNoteIdToMetadata`.
					const existingMeta =
						selectBlockAttributes( clientId )?.metadata ?? {};
					/*
					 * The linkage is system bookkeeping, not a user edit: it
					 * must never be captured by undo history. Left
					 * persistent, the first Ctrl+Z after making a suggestion
					 * pops this write instead of the suggestion, leaving the
					 * marker in place.
					 */
					markNextChangeAsNotPersistent?.( { history: 'ignore' } );
					updateBlockAttributes( clientId, {
						metadata: addNoteIdToMetadata(
							existingMeta,
							savedRecord.id
						),
					} );
				}

				if ( savedRecord?.id ) {
					// Surface the new note: when a non-notes sidebar (e.g.
					// post or block settings) is open, switch it to the
					// notes sidebar so the suggestion is immediately
					// visible. A closed sidebar stays closed.
					const activeArea = getActiveComplementaryArea( 'core' );
					if ( activeArea && ! SIDEBARS.includes( activeArea ) ) {
						enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
					}
				}

				return savedRecord;
			} catch ( error: any ) {
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
			markNextChangeAsNotPersistent,
			selectBlockAttributes,
			createNotice,
			getActiveComplementaryArea,
			enableComplementaryArea,
		]
	);

	/**
	 * Update an existing suggestion's payload (auto-save path). Replaces
	 * the `_wp_suggestion` meta on the comment without changing its author,
	 * status, or thread identity, so the user sees a single note
	 * accumulating edits rather than a new note per save burst.
	 *
	 * @param args            Update arguments.
	 * @param args.commentId  Comment id of the existing suggestion.
	 * @param args.blockName  Block name (recorded on the payload).
	 * @param args.operations Latest operations.
	 * @return The saved comment record.
	 */
	const updateSuggestion = useCallback(
		async ( {
			commentId,
			blockName,
			operations,
		}: {
			commentId: number | string;
			blockName: string;
			operations: SuggestionOperation[];
		} ) => {
			if ( ! commentId ) {
				throw new Error( 'No comment id for suggestion update.' );
			}

			const payload = buildSuggestionPayload( {
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
			} catch ( error: any ) {
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
	 * @param args           Delete arguments.
	 * @param args.commentId Comment id to trash.
	 * @param args.clientId  Block that links to the note, if known. Its
	 *                       `metadata.noteId` entry is removed so the post
	 *                       does not save a reference to a trashed note.
	 */
	const deleteSuggestion = useCallback(
		async ( {
			commentId,
			clientId,
		}: {
			commentId: number | string | null;
			clientId?: string;
		} ) => {
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

				const metadata = clientId
					? selectBlockAttributes( clientId )?.metadata
					: undefined;
				if (
					clientId &&
					getNoteIdsFromMetadata( metadata ).includes(
						Number( commentId )
					)
				) {
					// Bookkeeping, like the link written on create: keep it
					// out of undo history.
					markNextChangeAsNotPersistent?.( { history: 'ignore' } );
					updateBlockAttributes( clientId, {
						metadata: cleanEmptyObject(
							removeNoteIdFromMetadata(
								metadata,
								Number( commentId )
							)
						),
					} );
				}
			} catch ( error: any ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to remove suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[
			saveEntityRecord,
			createNotice,
			selectBlockAttributes,
			updateBlockAttributes,
			markNextChangeAsNotPersistent,
		]
	);

	/**
	 * Apply a suggestion to the live block, then persist the lifecycle
	 * status to the comment meta. On a server failure the block is rolled
	 * back so the UI is never left in a half-applied state.
	 *
	 * @param args           Apply arguments.
	 * @param args.commentId Comment id holding the suggestion
	 *                       (`_wp_suggestion` meta).
	 * @param args.clientId  Block client id of the apply target. May be
	 *                       undefined if the acting user opened the post
	 *                       fresh and the metadata linkage was never
	 *                       persisted — the apply path then scans the live
	 *                       tree by `metadata.noteId`.
	 * @param args.payload   Parsed payload (from `parseSuggestionPayload`).
	 * @param args.silent    Suppress the success snackbar. Set when
	 *                       resolving the other half of a grouped suggestion
	 *                       so one gesture reports once.
	 */
	const applyOneSuggestion = useCallback(
		async ( {
			commentId,
			clientId,
			payload,
			silent,
		}: {
			commentId: number | string;
			clientId?: string;
			payload: SuggestionPayload | null;
			silent?: boolean;
		} ) => {
			if ( ! payload || ! Array.isArray( payload.operations ) ) {
				createNotice( 'error', __( 'Invalid suggestion payload.' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
				return false;
			}

			/*
			 * A post-level suggestion (the title) has no block: accept writes
			 * the proposed fields with `editPost`, which the Suggest mode
			 * capture never intercepts, so no bypass is needed. Rolled back
			 * if the decision fails to save, like the attribute path below.
			 */
			const postOps = findPostAttributeOps( payload.operations );
			if ( postOps.length > 0 ) {
				const editor = registry.select( STORE_NAME ) as any;
				const { editPost } = registry.dispatch( STORE_NAME ) as any;
				const previous: Record< string, any > = {};
				for ( const op of postOps ) {
					previous[ op.attribute ] = editor.getEditedPostAttribute(
						op.attribute
					);
				}
				try {
					editPost( applyPostOperations( postOps ) );
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
					clearOverlayForComment( POST_TITLE_OVERLAY_KEY, commentId );
					if ( ! silent ) {
						createNotice( 'success', __( 'Suggestion applied.' ), {
							type: 'snackbar',
							isDismissible: true,
						} );
					}
				} catch ( error: any ) {
					editPost( previous );
					createNotice(
						'error',
						error?.message ||
							__( 'Failed to save suggestion status.' ),
						{ type: 'snackbar', isDismissible: true }
					);
					return false;
				}
				return true;
			}

			const targetClientId = resolveTarget( clientId, commentId );

			if ( ! targetClientId ) {
				createNotice(
					'error',
					__(
						'Could not find the block this suggestion applies to.'
					),
					{ type: 'snackbar', isDismissible: true }
				);
				return false;
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
				let nextValue;
				if ( inlineOp.suggestionType === 'add' ) {
					nextValue = acceptInlineAddition(
						originalValue,
						commentId
					);
				} else if ( inlineOp.suggestionType === 'replace' ) {
					nextValue = acceptInlineReplacement(
						originalValue,
						commentId
					);
				} else if ( inlineOp.suggestionType === 'format' ) {
					// Accepting a format suggestion unwraps the marker, leaving
					// the proposed formatting (already carried on the run) in
					// place — the same shape as accepting an addition.
					nextValue = acceptInlineFormat( originalValue, commentId );
				} else {
					nextValue = acceptInlineDeletion(
						originalValue,
						commentId
					);
				}
				try {
					requestInterceptorBypass( targetClientId );
					/*
					 * An inline suggestion never lives in the overlay, but the
					 * same block can hold a pending attribute suggestion that
					 * does. Clear only an entry this comment owns: the entry is
					 * the attribute note's sole anchor, so an unconditional
					 * clear here hands that note to the orphan collector and
					 * wipes the proposed value off the canvas (F-14).
					 */
					clearOverlayForComment( targetClientId, commentId );
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

					if ( ! silent ) {
						createNotice( 'success', __( 'Suggestion applied.' ), {
							type: 'snackbar',
							isDismissible: true,
						} );
					}
				} catch ( error: any ) {
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
					return false;
				}
				return true;
			}

			// Structural ops (block-remove, block-insert-after, block-move)
			// can't ride the updateBlockAttributes path: their apply mutates
			// the tree rather than a single block's attributes. Branch out,
			// run the planned block-editor actions, and short-circuit before
			// the attribute-set rollback machinery below.
			const structuralOp = findStructuralOp( payload.operations );
			if ( structuralOp ) {
				try {
					/*
					 * Persist the decision BEFORE touching the tree. The
					 * attribute-set path below can mutate first and roll
					 * back on failure because restoring attributes is
					 * exact; a structural rollback is not — re-inserting a
					 * removed block would have to restore its position,
					 * nested children, selection, and overlay entry. Saving
					 * first costs one round-trip of latency and gives the
					 * same invariant for free: a failed save leaves the
					 * editor exactly as it was.
					 */
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

					const plan = planStructuralApply(
						structuralOp,
						payload.operations,
						targetClientId,
						registry.select( blockEditorStore )
					);
					if ( plan ) {
						runPlan( plan );
					}

					if ( ! silent ) {
						createNotice( 'success', __( 'Suggestion applied.' ), {
							type: 'snackbar',
							isDismissible: true,
						} );
					}
				} catch ( error: any ) {
					createNotice(
						'error',
						error?.message ||
							__( 'Failed to save suggestion status.' ),
						{ type: 'snackbar', isDismissible: true }
					);
					return false;
				}
				return true;
			}

			const currentAttributes = selectBlockAttributes( targetClientId );
			const newAttributes = applyOperations(
				currentAttributes,
				payload.operations
			);
			const rollbackPayload = rollbackAttributesFor(
				currentAttributes,
				payload.operations
			);

			try {
				// Bypass the suggest-mode interceptor for this dispatch so
				// the applied attributes actually land on the live block
				// instead of being reverted into the overlay. Outside Suggest
				// mode the interceptor isn't running and this is a no-op.
				requestInterceptorBypass( targetClientId );
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

				// Reset the per-block suggestion tracking only once the
				// decision is saved, so a failed save keeps the overlay
				// entry and the suggestion can be applied again. The next
				// edit then captures a fresh baseline from the post-apply
				// attributes.
				clearOverlay( targetClientId );

				if ( ! silent ) {
					createNotice( 'success', __( 'Suggestion applied.' ), {
						type: 'snackbar',
						isDismissible: true,
					} );
				}
			} catch ( error: any ) {
				// Roll back the block change so the UI isn't left in a
				// half-applied state if the server rejected the update.
				requestInterceptorBypass( targetClientId );
				updateBlockAttributes( targetClientId, rollbackPayload );
				createNotice(
					'error',
					error?.message || __( 'Failed to save suggestion status.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				return false;
			}
			return true;
		},
		[
			saveEntityRecord,
			updateBlockAttributes,
			selectBlockAttributes,
			resolveTarget,
			runPlan,
			createNotice,
			requestInterceptorBypass,
			clearOverlay,
			clearOverlayForComment,
			registry,
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
	 * @param args           Reject arguments.
	 * @param args.commentId Comment id of the rejected suggestion.
	 * @param args.clientId  Target block clientId, if known.
	 * @param args.payload   Parsed suggestion payload — inspected to detect
	 *                       a structural op so the marker can be cleared on
	 *                       the live block.
	 * @param args.silent    Suppress the success snackbar. Set when
	 *                       resolving the other half of a grouped
	 *                       suggestion.
	 */
	const rejectOneSuggestion = useCallback(
		async ( {
			commentId,
			clientId,
			payload,
			silent,
		}: {
			commentId: number | string;
			clientId?: string;
			payload?: SuggestionPayload | null;
			silent?: boolean;
		} ) => {
			/*
			 * A post-level suggestion never touched the post: reject only
			 * records the decision and drops the proposed value from the
			 * overlay so the field shows the real title again.
			 */
			if ( findPostAttributeOps( payload?.operations ).length > 0 ) {
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
					clearOverlayForComment( POST_TITLE_OVERLAY_KEY, commentId );
					if ( ! silent ) {
						createNotice( 'success', __( 'Suggestion rejected.' ), {
							type: 'snackbar',
							isDismissible: true,
						} );
					}
				} catch ( error: any ) {
					createNotice(
						'error',
						error?.message || __( 'Failed to reject suggestion.' ),
						{ type: 'snackbar', isDismissible: true }
					);
					return false;
				}
				return true;
			}

			// Inline suggestions: reject restores the block's pre-suggestion
			// content for the marked attribute — a deletion keeps the text and
			// drops the marker, an addition removes the proposed text with its
			// marker. Resolve the target the way apply does (the metadata link
			// may be absent on a fresh load) and bypass the interceptor so the
			// change lands on the live block.
			const inlineOp = findInlineOp( payload?.operations );
			if ( inlineOp ) {
				const targetClientId = resolveTarget( clientId, commentId );
				if ( targetClientId ) {
					const attributeKey = inlineOp.attribute;
					const originalValue =
						selectBlockAttributes( targetClientId )?.[
							attributeKey
						];
					let nextValue;
					if ( inlineOp.suggestionType === 'add' ) {
						nextValue = rejectInlineAddition(
							originalValue,
							commentId
						);
					} else if ( inlineOp.suggestionType === 'replace' ) {
						nextValue = rejectInlineReplacement(
							originalValue,
							commentId
						);
					} else if ( inlineOp.suggestionType === 'format' ) {
						/*
						 * Rejecting a format suggestion restores the original
						 * run captured at suggest-time (`beforeHTML`),
						 * discarding both the proposed formatting and the
						 * marker.
						 */
						nextValue = rejectInlineFormat(
							originalValue,
							commentId,
							inlineOp.beforeHTML
						);
					} else {
						nextValue = rejectInlineDeletion(
							originalValue,
							commentId
						);
					}
					try {
						requestInterceptorBypass( targetClientId );
						// Guarded for the same reason as the apply path above:
						// a co-resident attribute suggestion owns this block's
						// overlay entry and must survive an inline decision.
						clearOverlayForComment( targetClientId, commentId );
						updateBlockAttributes( targetClientId, {
							[ attributeKey ]: nextValue,
						} );

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

						if ( ! silent ) {
							createNotice(
								'success',
								__( 'Suggestion rejected.' ),
								{ type: 'snackbar', isDismissible: true }
							);
						}
					} catch ( error: any ) {
						// Roll the attribute back so the content isn't left
						// inconsistent with a still-pending comment if the
						// server rejected the status update. Mirrors the
						// apply-path rollback.
						requestInterceptorBypass( targetClientId );
						updateBlockAttributes( targetClientId, {
							[ attributeKey ]: originalValue,
						} );
						createNotice(
							'error',
							error?.message ||
								__( 'Failed to reject suggestion.' ),
							{ type: 'snackbar', isDismissible: true }
						);
						return false;
					}
					return true;
				}
			}

			// A structural op undoes its live-block change (see
			// `planStructuralReject`); an attribute-set payload made no
			// live-block change, so only the overlay entry holding the
			// proposed value is cleared.
			const structuralOp = findStructuralOp( payload?.operations );

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

				/*
				 * Undo the live-block change only once the decision is
				 * persisted. A structural change can't be rolled back
				 * faithfully (position, children, selection, and the
				 * overlay entry would all have to be restored), so the
				 * tree is left untouched until the save succeeds — a
				 * failed reject then leaves the editor exactly as it was.
				 */
				if ( structuralOp && clientId ) {
					runPlan(
						planStructuralReject(
							structuralOp,
							clientId,
							registry.select( blockEditorStore )
						)
					);
				} else if ( clientId ) {
					/*
					 * An attribute-only suggestion lives entirely in the
					 * overlay: the live block never took the proposed value,
					 * so there is nothing to roll back, but the overlay entry
					 * must go or it keeps rendering the rejected value and
					 * feeds it into the next proposal. Guarded, because the
					 * entry may already belong to a newer suggestion.
					 */
					clearOverlayForComment( clientId, commentId );
				}

				if ( ! silent ) {
					createNotice( 'success', __( 'Suggestion rejected.' ), {
						type: 'snackbar',
						isDismissible: true,
					} );
				}
			} catch ( error: any ) {
				createNotice(
					'error',
					error?.message || __( 'Failed to reject suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				return false;
			}
			return true;
		},
		[
			saveEntityRecord,
			createNotice,
			selectBlockAttributes,
			resolveTarget,
			runPlan,
			updateBlockAttributes,
			requestInterceptorBypass,
			clearOverlayForComment,
			registry,
		]
	);

	/**
	 * Collect the OTHER pending suggestions that belong to the same
	 * replacement group as the one being resolved.
	 *
	 * A `replaceBlocks` — the block switcher's transform, "Group", a paste
	 * over a selection — is captured as a removal plus an insertion, and the
	 * interceptor stamps both halves with a shared `metadata.suggestion
	 * .groupId`. They are one logical change: accepting the insertion alone
	 * leaves the original block behind as a duplicate, and rejecting it alone
	 * leaves a hole where the original used to be. The group is resolved from
	 * the live tree rather than from the payload so it survives a reload,
	 * where every clientId in a stored payload is stale but the marker on each
	 * block still carries the group id and its own `metadata.noteId`.
	 *
	 * @param args           Arguments.
	 * @param args.commentId Comment being resolved.
	 * @param args.payload   Its parsed payload.
	 * @return Partner suggestions, or an empty array when this one is not
	 * grouped.
	 */
	const findGroupPartners = useCallback(
		( {
			commentId,
			payload,
		}: {
			commentId: number | string;
			payload?: SuggestionPayload | null;
		} ) => {
			const groupId = findStructuralOp( payload?.operations )?.groupId;
			if ( ! groupId ) {
				return [];
			}
			const partners: Array< {
				commentId: number | string;
				clientId: string;
				payload: SuggestionPayload | null;
			} > = [];
			const seen = new Set( [ String( commentId ) ] );
			const liveIds = selectClientIdsWithDescendants?.() ?? [];
			for ( const id of liveIds ) {
				const metadata = selectBlockAttributes( id )?.metadata;
				if ( metadata?.suggestion?.groupId !== groupId ) {
					continue;
				}
				for ( const noteId of getNoteIdsFromMetadata( metadata ) ) {
					if ( seen.has( String( noteId ) ) ) {
						continue;
					}
					seen.add( String( noteId ) );
					const comment: any = registry
						.select( coreStore )
						.getEntityRecord( 'root', 'comment', noteId );
					const status = comment?.meta?._wp_suggestion_status;
					if ( status === 'applied' || status === 'rejected' ) {
						continue;
					}
					const partnerPayload = parseSuggestionPayload(
						comment?.meta?._wp_suggestion
					);
					if (
						findStructuralOp( partnerPayload?.operations )
							?.groupId !== groupId
					) {
						continue;
					}
					partners.push( {
						commentId: noteId,
						clientId: id,
						payload: partnerPayload,
					} );
				}
			}
			return partners;
		},
		[ selectClientIdsWithDescendants, selectBlockAttributes, registry ]
	);

	/*
	 * Public apply / reject. Partners are resolved BEFORE the decision runs:
	 * applying a removal takes its block out of the tree, and the scan reads
	 * the group off the live blocks. Only the first decision reports through a
	 * snackbar — the group is one change and one gesture, so a half that
	 * fails to save stops the group: the remaining halves stay pending, with
	 * their blocks intact, for the user to decide again.
	 */
	const applySuggestion = useCallback(
		async ( args: {
			commentId: number | string;
			clientId?: string;
			payload: SuggestionPayload | null;
			silent?: boolean;
		} ) => {
			const partners = findGroupPartners( args );
			let resolved = await applyOneSuggestion( args );
			for ( const partner of partners ) {
				if ( ! resolved ) {
					break;
				}
				resolved = await applyOneSuggestion( {
					...partner,
					silent: true,
				} );
			}
		},
		[ applyOneSuggestion, findGroupPartners ]
	);

	const rejectSuggestion = useCallback(
		async ( args: {
			commentId: number | string;
			clientId?: string;
			payload?: SuggestionPayload | null;
			silent?: boolean;
		} ) => {
			const partners = findGroupPartners( args );
			let resolved = await rejectOneSuggestion( args );
			for ( const partner of partners ) {
				if ( ! resolved ) {
					break;
				}
				resolved = await rejectOneSuggestion( {
					...partner,
					silent: true,
				} );
			}
		},
		[ rejectOneSuggestion, findGroupPartners ]
	);

	// Decisions are wrapped so the note garbage collector can distinguish a
	// marker deliberately cleared by apply/reject from one withdrawn by the
	// user (undo, deleting the marked text). Wrapped here — not per-callback —
	// so every consumer of the provider gets the guard.
	const applySuggestionGuarded = useMemo(
		() => withDecisionInFlight( registry, applySuggestion ),
		[ registry, applySuggestion ]
	);
	const rejectSuggestionGuarded = useMemo(
		() => withDecisionInFlight( registry, rejectSuggestion ),
		[ registry, rejectSuggestion ]
	);

	return {
		createSuggestion,
		updateSuggestion,
		deleteSuggestion,
		applySuggestion: applySuggestionGuarded,
		rejectSuggestion: rejectSuggestionGuarded,
	};
}
