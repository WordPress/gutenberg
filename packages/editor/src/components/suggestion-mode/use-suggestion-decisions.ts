/**
 * Apply and reject: the reviewer's half of Suggest mode. Each decision reads
 * the live block, computes the change with the pure operations, dispatches it
 * past the interceptor, records the decision through the suggestion store,
 * and rolls the block back or leaves the tree untouched when the save fails.
 * Notices and the grouped-replacement fan-out live here too.
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store/constants';
import { getPostFieldProposalId } from '../../store/suggest-post-edits';
import { unlock } from '../../lock-unlock';
import { useSuggestionSession } from './suggestion-session';
import { withoutProposedAttributes } from './marker';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils';
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
import {
	applyOperations,
	applyPostOperations,
	findBlockByNoteId,
	findInlineOp,
	findPostAttributeOps,
	findStructuralOp,
	parseSuggestionPayload,
	planStructuralApply,
	planStructuralReject,
	rollbackAttributesFor,
} from './operations';
import type { BlockPlan, PlanStep, SuggestionPayload } from './operations';
import { withDecisionInFlight } from './decision-state';
import { useSuggestionStore } from './suggestion-store';

/**
 * The attribute update that drops a block's attribute proposal: the whole
 * marker for a pending-attributes marker, only `after` on a structural one.
 *
 * @param currentAttributes Block's current attributes.
 * @return Partial attributes for `updateBlockAttributes`, or null when the
 * block proposes nothing.
 */
function clearProposedAttributes(
	currentAttributes: Record< string, any > | null | undefined
) {
	const metadata = withoutProposedAttributes( currentAttributes?.metadata );
	return metadata ? { metadata } : null;
}

/**
 * Apply/reject callbacks for the current editor.
 *
 * @return The decision callbacks.
 */
export function useSuggestionDecisions() {
	const store = useSuggestionStore();
	const { createNotice } = useDispatch( noticesStore );
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
	const { requestInterceptorBypass } = useSuggestionSession();
	const registry = useRegistry();

	/**
	 * Drop the proposals a post-level decision resolved, so the fields show
	 * the post's value again.
	 *
	 * @param postOps The decided post-level operations.
	 */
	const clearPostFieldProposals = useCallback(
		( postOps: any[], commentId: number | string ) => {
			const { clearPostFieldProposal } = unlock(
				registry.dispatch( STORE_NAME )
			) as any;
			const proposals = unlock(
				registry.select( STORE_NAME )
			).getPostFieldProposals();
			for ( const op of postOps ) {
				const id = getPostFieldProposalId( op.attribute, op.key );
				// A proposal restored from another of the user's notes is
				// not the one decided.
				const linked = proposals[ id ]?.commentId;
				if ( linked && String( linked ) !== String( commentId ) ) {
					continue;
				}
				clearPostFieldProposal( id );
			}
		},
		[ registry ]
	);

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
	 * @return Whether the decision landed.
	 */
	const applyOneSuggestion = useCallback(
		async ( {
			commentId,
			clientId,
			payload,
		}: {
			commentId: number | string;
			clientId?: string;
			payload: SuggestionPayload | null;
		} ) => {
			if ( ! payload || ! Array.isArray( payload.operations ) ) {
				createNotice( 'error', __( 'Invalid suggestion payload.' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
				return false;
			}

			/*
			 * A post-level suggestion (the title, excerpt, a meta key...) has
			 * no block: accept writes the proposed fields to the post past the
			 * Suggestion mode guard, which would otherwise hold them as a
			 * fresh proposal when the reviewer is suggesting too. Rolled back
			 * if the decision fails to save, like the attribute path below.
			 */
			const postOps = findPostAttributeOps( payload.operations );
			if ( postOps.length > 0 ) {
				const editor = unlock( registry.select( STORE_NAME ) ) as any;
				const { applyPostFieldSuggestion } = unlock(
					registry.dispatch( STORE_NAME )
				) as any;
				const previous = applyPostOperations(
					postOps.map( ( op ) => ( {
						...op,
						after: editor.getPostFieldValueWithoutProposals(
							op.attribute,
							op.key
						),
					} ) )
				);
				try {
					applyPostFieldSuggestion( applyPostOperations( postOps ) );
					await store.setLifecycleStatus( commentId, 'applied' );
					clearPostFieldProposals( postOps, commentId );
				} catch ( error: any ) {
					applyPostFieldSuggestion( previous );
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
					// The same block can hold a pending attribute proposal in
					// its marker; this write touches only the marked
					// attribute, so that proposal stays where it is (F-14).
					requestInterceptorBypass( targetClientId );
					updateBlockAttributes( targetClientId, {
						[ attributeKey ]: nextValue,
					} );

					await store.setLifecycleStatus( commentId, 'applied' );
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
					await store.setLifecycleStatus( commentId, 'applied' );

					const plan = planStructuralApply(
						structuralOp,
						payload.operations,
						targetClientId,
						registry.select( blockEditorStore )
					);
					if ( plan ) {
						runPlan( plan );
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
			// One update lands the proposed values and drops the proposal.
			const clearedProposal =
				clearProposedAttributes( currentAttributes );
			const newAttributes = {
				...applyOperations( currentAttributes, payload.operations ),
				...( clearedProposal ?? {} ),
			};
			// A failed save puts the proposal back along with the values.
			const rollbackPayload = {
				...rollbackAttributesFor(
					currentAttributes,
					payload.operations
				),
				...( clearedProposal
					? { metadata: currentAttributes?.metadata }
					: {} ),
			};

			try {
				// Bypass the suggest-mode interceptor for this dispatch so
				// the applied attributes actually land on the live block
				// instead of being diverted into a proposal. Outside Suggest
				// mode the interceptor isn't running and this is a no-op.
				requestInterceptorBypass( targetClientId );
				updateBlockAttributes( targetClientId, newAttributes );

				await store.setLifecycleStatus( commentId, 'applied' );
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
			store,
			updateBlockAttributes,
			selectBlockAttributes,
			resolveTarget,
			runPlan,
			createNotice,
			requestInterceptorBypass,
			clearPostFieldProposals,
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
	 * @return Whether the decision landed.
	 */
	const rejectOneSuggestion = useCallback(
		async ( {
			commentId,
			clientId,
			payload,
		}: {
			commentId: number | string;
			clientId?: string;
			payload?: SuggestionPayload | null;
		} ) => {
			/*
			 * A post-level suggestion never touched the post: reject only
			 * records the decision and drops the proposed value from the
			 * editor so the field shows the post's value again.
			 */
			const rejectedPostOps = findPostAttributeOps( payload?.operations );
			if ( rejectedPostOps.length > 0 ) {
				try {
					await store.setLifecycleStatus( commentId, 'rejected' );
					clearPostFieldProposals( rejectedPostOps, commentId );
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
						// As on the apply path: a co-resident attribute
						// proposal lives in the marker and survives this.
						requestInterceptorBypass( targetClientId );
						updateBlockAttributes( targetClientId, {
							[ attributeKey ]: nextValue,
						} );

						await store.setLifecycleStatus( commentId, 'rejected' );
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
			// live-block change, so only the proposal on the marker is
			// dropped.
			const structuralOp = findStructuralOp( payload?.operations );

			try {
				await store.setLifecycleStatus( commentId, 'rejected' );

				/*
				 * Undo the live-block change only once the decision is
				 * persisted. A structural change can't be rolled back
				 * faithfully (position, children and selection would all
				 * have to be restored), so the
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
					 * marker's proposal: the live block never took the
					 * proposed value, so there is nothing to roll back, but
					 * the proposal must go or it keeps rendering the rejected
					 * value. Dropping it is a decision, not an edit, so it
					 * stays off the undo stack.
					 */
					const clear = clearProposedAttributes(
						selectBlockAttributes( clientId )
					);
					if ( clear ) {
						requestInterceptorBypass( clientId );
						markNextChangeAsNotPersistent?.( {
							history: 'ignore',
						} );
						updateBlockAttributes( clientId, clear );
					}
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
			store,
			createNotice,
			selectBlockAttributes,
			resolveTarget,
			runPlan,
			updateBlockAttributes,
			markNextChangeAsNotPersistent,
			requestInterceptorBypass,
			clearPostFieldProposals,
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
					const comment: any = store.getNote( noteId );
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
		[ selectClientIdsWithDescendants, selectBlockAttributes, store ]
	);

	/*
	 * Public apply / reject. Partners are resolved BEFORE the decision runs:
	 * applying a removal takes its block out of the tree, and the scan reads
	 * the group off the live blocks. The group is one change and one gesture,
	 * so a half that fails to save stops the group: the remaining halves stay
	 * pending, with their blocks intact, for the user to decide again.
	 *
	 * The gesture reports once, after every half has settled. Each partner
	 * waits on its own status save before touching the tree, so a snackbar
	 * raised by the first half announced the change while the other half
	 * still showed its pending treatment (accepting a transform's removal
	 * left the new block marked as an insertion for a round-trip).
	 */
	const decideGroup = useCallback(
		async (
			decideOne: ( args: {
				commentId: number | string;
				clientId?: string;
				payload: SuggestionPayload | null;
			} ) => Promise< boolean >,
			args: {
				commentId: number | string;
				clientId?: string;
				payload?: SuggestionPayload | null;
			},
			message: string
		) => {
			const partners = findGroupPartners( args );
			const decided = await decideOne( {
				...args,
				payload: args.payload ?? null,
			} );
			let resolved = decided;
			for ( const partner of partners ) {
				if ( ! resolved ) {
					break;
				}
				resolved = await decideOne( partner );
			}
			if ( decided ) {
				createNotice( 'success', message, {
					type: 'snackbar',
					isDismissible: true,
				} );
			}
		},
		[ findGroupPartners, createNotice ]
	);

	const applySuggestion = useCallback(
		( args: {
			commentId: number | string;
			clientId?: string;
			payload: SuggestionPayload | null;
		} ) =>
			decideGroup(
				applyOneSuggestion,
				args,
				__( 'Suggestion applied.' )
			),
		[ decideGroup, applyOneSuggestion ]
	);

	const rejectSuggestion = useCallback(
		( args: {
			commentId: number | string;
			clientId?: string;
			payload?: SuggestionPayload | null;
		} ) =>
			decideGroup(
				rejectOneSuggestion,
				args,
				__( 'Suggestion rejected.' )
			),
		[ decideGroup, rejectOneSuggestion ]
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
		applySuggestion: applySuggestionGuarded,
		rejectSuggestion: rejectSuggestionGuarded,
	};
}
