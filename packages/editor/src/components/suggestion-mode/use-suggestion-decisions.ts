/**
 * Apply and reject: the reviewer's half of Suggestion mode. Each decision
 * records a provisional status through the suggestion store, then reads the
 * live block, computes the change with the pure operations and dispatches it
 * past the interceptor. A failed status write leaves the editor untouched.
 * The decision becomes final when the post is saved. Notices and the
 * grouped-replacement fan-out live here too.
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store/constants';
import { getPostFieldProposalId } from '../../store/suggest-post-edits';
import { unlock } from '../../lock-unlock';
import { useSuggestionSession } from './suggestion-session';
import { createProposedTerms } from './create-proposed-terms';
import { getAttributeApplyRefusal, getPostApplyRefusal } from './apply-refusal';
import {
	nestedMarkerFor,
	withoutMarkerEntry,
	withoutOutdatedProposals,
	withoutProposedAttributes,
} from './marker';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils/metadata';
import {
	applyOperations,
	applyPostOperations,
	findBlockByNoteId,
	findPostAttributeOps,
	findStructuralOp,
	parseSuggestionPayload,
	planStructuralApply,
	planStructuralReject,
} from './operations';
import type { BlockPlan, PlanStep, SuggestionPayload } from './operations';
import { withDecisionInFlight } from './decision-state';
import { useSuggestionStore } from './suggestion-store';
import { getSuggestionStatus, isPendingStatus } from './suggestion-status';
import type { SuggestionDecision } from './suggestion-status';

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
		__unstableMarkLastChangeAsPersistent: markLastChangeAsPersistent,
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
	 * Record a decision, then make its change to the content.
	 *
	 * The provisional status is written first, for every kind of suggestion:
	 * a failed write then changes nothing, and the content can never lose a
	 * suggestion's anchor before the server knows a decision was made, so a
	 * save racing the decision cannot read it as someone else's removal
	 * (`outdated`). If the content change itself fails, the note goes back to
	 * pending, since the post still carries the suggestion.
	 *
	 * @param commentId      Comment id.
	 * @param decision       The decision.
	 * @param change         The content change. May return false when there
	 *                       is nothing it can change.
	 * @param failureMessage Notice shown when the decision does not land.
	 * @return Whether the decision landed.
	 */
	const decide = useCallback(
		async (
			commentId: number | string,
			decision: SuggestionDecision,
			change: () => boolean | void,
			failureMessage: string
		) => {
			const fail = ( error: any ) => {
				createNotice( 'error', error?.message || failureMessage, {
					type: 'snackbar',
					isDismissible: true,
				} );
				return false;
			};
			try {
				await store.setProvisionalDecision( commentId, decision );
			} catch ( error: any ) {
				return fail( error );
			}
			let changed: boolean | void;
			let changeError: any;
			try {
				changed = change();
			} catch ( error: any ) {
				changed = false;
				changeError = error;
			}
			if ( changed === false ) {
				await store.reopenNote( commentId ).catch( () => {} );
				return fail( changeError );
			}
			return true;
		},
		[ store, createNotice ]
	);

	/**
	 * Apply a suggestion: record the provisional decision on the note, then
	 * land the proposal on the live block. The post save makes it final.
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
			 * fresh proposal when the reviewer is suggesting too.
			 */
			const postOps = findPostAttributeOps( payload.operations );
			if ( postOps.length > 0 ) {
				/*
				 * Accept edits the post with the reviewer's capabilities, so
				 * it takes only the fields a suggestion can propose. The
				 * taxonomies are among them and may not be loaded yet.
				 */
				try {
					await registry
						.resolveSelect( coreStore )
						.getTaxonomies( { per_page: -1 } );
				} catch {
					// Unloaded, a terms suggestion is refused below.
				}
				const postRefusal = getPostApplyRefusal(
					postOps,
					unlock( registry.select( STORE_NAME ) )
						.isProposablePostField
				);
				if ( postRefusal ) {
					createNotice( 'error', postRefusal, {
						type: 'snackbar',
						isDismissible: true,
					} );
					return false;
				}
				/*
				 * New terms are created only now, as the reviewer, and before
				 * the decision is recorded. When one cannot be created nothing
				 * is decided and the note stays pending.
				 */
				let acceptedOps: typeof postOps;
				try {
					acceptedOps = await createProposedTerms(
						registry,
						postOps
					);
				} catch ( error: any ) {
					createNotice(
						'error',
						typeof error?.message === 'string' && error.message
							? error.message
							: __( 'The suggested term could not be created.' ),
						{ type: 'snackbar', isDismissible: true }
					);
					return false;
				}
				return decide(
					commentId,
					'applied',
					() => {
						const { applyPostFieldSuggestion } = unlock(
							registry.dispatch( STORE_NAME )
						) as any;
						applyPostFieldSuggestion(
							applyPostOperations( acceptedOps )
						);
						clearPostFieldProposals( postOps, commentId );
					},
					__( 'Failed to save suggestion status.' )
				);
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

			/*
			 * The attribute values a payload proposes are another author's,
			 * and the reviewer's save writes them. They are checked before
			 * anything is decided, and again as they land.
			 */
			const findRefusal = () =>
				getAttributeApplyRefusal( {
					blockName: registry
						.select( blockEditorStore )
						.getBlockName( targetClientId ),
					attributes: selectBlockAttributes( targetClientId ),
					commentId,
					payload,
				} );
			const refusal = findRefusal();
			if ( refusal ) {
				createNotice( 'error', refusal, {
					type: 'snackbar',
					isDismissible: true,
				} );
				return false;
			}
			const assertApplicable = () => {
				const late = findRefusal();
				if ( late ) {
					throw new Error( late );
				}
			};

			const failureMessage = __( 'Failed to save suggestion status.' );

			// Structural ops (block-remove, block-insert-after, block-move)
			// mutate the tree rather than a single block's attributes, so they
			// run a planned set of block-editor actions.
			const structuralOp = findStructuralOp( payload.operations );
			/*
			 * A suggestion nested on another author's (a second proposal, or
			 * a removal of their suggested block) is decided on its own: an
			 * accepted removal removes the block, an accepted proposal lands
			 * and leaves the block's other suggestions pending.
			 */
			const nested = nestedMarkerFor(
				selectBlockAttributes( targetClientId ),
				commentId
			);
			if ( nested && structuralOp?.type !== 'block-remove' ) {
				return decide(
					commentId,
					'applied',
					() => {
						assertApplicable();
						const currentAttributes =
							selectBlockAttributes( targetClientId );
						const applied = applyOperations(
							currentAttributes,
							payload.operations
						);
						requestInterceptorBypass( targetClientId );
						updateBlockAttributes( targetClientId, {
							...applied,
							metadata: withoutOutdatedProposals(
								withoutMarkerEntry(
									applied.metadata,
									commentId
								),
								applied
							),
						} );
					},
					failureMessage
				);
			}
			if ( structuralOp ) {
				return decide(
					commentId,
					'applied',
					() => {
						assertApplicable();
						const plan = planStructuralApply(
							structuralOp,
							payload.operations,
							targetClientId,
							registry.select( blockEditorStore )
						);
						if ( plan ) {
							runPlan( plan );
						}
					},
					failureMessage
				);
			}

			return decide(
				commentId,
				'applied',
				() => {
					assertApplicable();
					const currentAttributes =
						selectBlockAttributes( targetClientId );
					// One update lands the proposed values and drops the
					// proposal, with any other author's proposal it left
					// with nothing to change.
					const applied = applyOperations(
						currentAttributes,
						payload.operations
					);
					const metadata = withoutOutdatedProposals(
						clearProposedAttributes( applied )?.metadata ??
							applied.metadata,
						applied
					);
					// Bypass the Suggestion mode interceptor for this dispatch
					// so the applied attributes land on the live block instead
					// of being diverted into a proposal. Outside Suggestion
					// mode the interceptor isn't running and this is a no-op.
					requestInterceptorBypass( targetClientId );
					updateBlockAttributes( targetClientId, {
						...applied,
						...( metadata ? { metadata } : {} ),
					} );
				},
				failureMessage
			);
		},
		[
			decide,
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
	 * Reject a suggestion: record the provisional decision on the note, then
	 * take the proposal out of the content. For structural suggestions (e.g.
	 * `block-remove`) that clears the `metadata.suggestion` marker on the live
	 * block so the dimmed/struck visual treatment goes away. The post save
	 * makes it final.
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
			const failureMessage = __( 'Failed to reject suggestion.' );

			/*
			 * A post-level suggestion never touched the post: reject only
			 * records the decision and drops the proposed value from the
			 * editor so the field shows the post's value again.
			 */
			const rejectedPostOps = findPostAttributeOps( payload?.operations );
			if ( rejectedPostOps.length > 0 ) {
				return decide(
					commentId,
					'rejected',
					() => clearPostFieldProposals( rejectedPostOps, commentId ),
					failureMessage
				);
			}

			// A structural op undoes its live-block change (see
			// `planStructuralReject`); an attribute-set payload made no
			// live-block change, so only the proposal on the marker is
			// dropped.
			const structuralOp = findStructuralOp( payload?.operations );
			return decide(
				commentId,
				'rejected',
				() => {
					/*
					 * A suggestion nested on another author's made no change
					 * of its own to the block: rejecting it drops it and
					 * leaves the block's other suggestions as they are.
					 */
					const remaining =
						clientId &&
						nestedMarkerFor(
							selectBlockAttributes( clientId ),
							commentId
						)
							? withoutMarkerEntry(
									selectBlockAttributes( clientId )?.metadata,
									commentId
								)
							: null;
					if ( clientId && remaining ) {
						requestInterceptorBypass( clientId );
						updateBlockAttributes( clientId, {
							metadata: remaining,
						} );
					} else if ( structuralOp && clientId ) {
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
						 * proposed value, so there is nothing to roll back,
						 * but the proposal must go or it keeps rendering the
						 * rejected value.
						 */
						const clear = clearProposedAttributes(
							selectBlockAttributes( clientId )
						);
						if ( clear ) {
							requestInterceptorBypass( clientId );
							updateBlockAttributes( clientId, clear );
						}
					}
				},
				failureMessage
			);
		},
		[
			decide,
			selectBlockAttributes,
			runPlan,
			updateBlockAttributes,
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
				const marker = metadata?.suggestion as
					{ groupId?: string } | undefined;
				if ( marker?.groupId !== groupId ) {
					continue;
				}
				for ( const noteId of getNoteIdsFromMetadata( metadata ) ) {
					if ( seen.has( String( noteId ) ) ) {
						continue;
					}
					seen.add( String( noteId ) );
					const comment: any = store.getNote( noteId );
					// Decided already, saved or not, or outdated.
					if ( ! isPendingStatus( getSuggestionStatus( comment ) ) ) {
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
			// Typing stays one undo level until the next change to the field, so
			// close it here or undo would take the suggestion back with the decision.
			markLastChangeAsPersistent();
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
		[ findGroupPartners, createNotice, markLastChangeAsPersistent ]
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
				__( 'Suggestion accepted.' )
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
