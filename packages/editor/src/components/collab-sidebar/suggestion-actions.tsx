import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
} from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getBlockType } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { check, closeSmall } from '@wordpress/icons';
import { store as editorStore } from '../../store';
import {
	findPostAttributeOps,
	findStructuralOp,
	hasAttributeConflict,
	parseSuggestionPayload,
	useSuggestionsProvider,
} from '../suggestion-mode';
import SuggestionSummary from '../suggestion-mode/suggestion-summary';
import { isAttributeEqual } from '../suggestion-mode/operations';
import { unlock } from '../../lock-unlock';
import {
	describeAnchor,
	useSuggestionAnchorPresent,
} from '../suggestion-mode/anchor-index';
import {
	APPLIED,
	OUTDATED,
	REJECTED,
	getDecision,
	getSuggestionStatus,
	isPendingStatus,
	isProvisionalStatus,
} from '../suggestion-mode/suggestion-status';
import {
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_REPLACEMENT,
	findSuggestionText,
	stripSuggestionMarkers,
	suggestionRelations,
	suggestionsEmptiedBy,
} from '../inline-suggestions';
import { suggestionContextLines } from './suggestion-context';

const EMPTY_ARRAY: Array< string | null > = [];
const EMPTY_LINES: string[] = [];

const STRUCTURAL_OP_TYPES = new Set( [
	'block-insert-after',
	'block-remove',
	'block-move',
] );

/**
 * Whether a post field does not yet hold what a suggestion proposed for it.
 * A term field's proposal can name terms that do not exist yet; accepting
 * creates them and assigns their ids, so a term field is compared by the ids
 * it proposed and by how many terms it proposed.
 *
 * @param op    A `post-attribute-set` operation.
 * @param value The field's saved value.
 * @return Whether the field still differs from the proposal.
 */
function isPostFieldStillProposed( op: any, value: unknown ): boolean {
	if ( Array.isArray( op.after ) && Array.isArray( value ) ) {
		return (
			op.after.some(
				( term: unknown ) =>
					typeof term === 'number' && ! value.includes( term )
			) || value.length < op.after.length
		);
	}
	return ! isAttributeEqual( op.after ?? null, value );
}

/**
 * Plain visible text of a block, read from its first non-empty rich-text
 * attribute with suggestion markers unwrapped. Lets a structural summary say
 * which block it means. Returns null for a block with no text (an image
 * without a caption, a container, an empty paragraph).
 *
 * @param blockName  Block name.
 * @param attributes Block attributes.
 * @return The block's text, or null.
 */
function readBlockText(
	blockName: string | undefined,
	attributes: Record< string, any > | null | undefined
): string | null {
	if ( ! blockName || ! attributes ) {
		return null;
	}
	const definitions: Record< string, any > =
		getBlockType( blockName )?.attributes ?? {};
	for ( const [ key, definition ] of Object.entries( definitions ) ) {
		if (
			definition?.type !== 'rich-text' &&
			definition?.source !== 'rich-text'
		) {
			continue;
		}
		const value = stripSuggestionMarkers( attributes[ key ] );
		let text = '';
		if ( value instanceof RichTextData ) {
			text = value.text;
		} else if ( typeof value === 'string' ) {
			text = RichTextData.fromHTMLString( value ).text;
		}
		// Drop the object replacement character inline images leave behind.
		text = text.replace( /\uFFFC/g, '' ).trim();
		if ( text ) {
			return text;
		}
	}
	return null;
}

/**
 * How a suggestion note presents, from its status and whether the loaded
 * content still carries the suggestion:
 *
 * - `pending`: awaiting a decision; Accept and Reject.
 * - `pending-again`: decided in an editor that never saved the post, so the
 *   suggestion is still there; Accept and Reject, with a hint.
 * - `unsaved`: decided here, waiting for the post to be saved.
 * - `stuck`: final, yet the post still carries the suggestion (left by an
 *   editor from before decisions were saved with the post); Apply again,
 *   Reject again and Reopen.
 * - `resolved`: final, and the post reflects it.
 * - `outdated`: someone else's save removed the suggestion before anyone
 *   decided; Reopen.
 */
type SuggestionPresentation =
	'pending' | 'pending-again' | 'unsaved' | 'stuck' | 'resolved' | 'outdated';

/**
 * Shared accept/reject wiring for a note that carries a suggestion payload.
 * `Note` calls it once and hands the result to both the header icon buttons
 * and the body, so their state never diverges and each note pays for one
 * block-editor subscription rather than two.
 *
 * @param thread The note thread.
 * @return Controls, or null if the thread has no payload.
 */
export function useSuggestionDecision( thread: any ) {
	const payload = useMemo(
		() => parseSuggestionPayload( thread?.meta?._wp_suggestion ),
		[ thread?.meta?._wp_suggestion ]
	);
	const anchorPresent = useSuggestionAnchorPresent( thread );
	const { applySuggestion, rejectSuggestion } = useSuggestionsProvider();
	const [ busy, setBusy ] = useState( false );
	const [ showStaleDialog, setShowStaleDialog ] = useState( false );

	// "Conflict" is checked per attribute rather than from the post's
	// `modified_gmt`: every auto-saved suggestion bumps the post's
	// modification time, so a post-level revision compare flags nearly
	// every suggestion as stale even when the block content hasn't
	// diverged. We only prompt when the specific attributes a suggestion
	// targets have actually moved away from the captured baseline.
	const postOps = useMemo(
		() => findPostAttributeOps( payload?.operations ),
		[ payload ]
	);
	const isPostSuggestion = postOps.length > 0;
	/*
	 * Where this suggestion sits among others in its block - inside
	 * someone's addition, or holding others' suggestions - and what
	 * rejecting it would do to them. Derived from the markers on read, like
	 * the summary text.
	 */
	const contextLines = useSelect(
		( select ) => {
			const inlineOp = payload?.operations?.find(
				( op: any ) => op.type === 'inline-suggestion' && op.attribute
			);
			if ( ! inlineOp || ! thread?.blockClientId ) {
				return EMPTY_LINES;
			}
			const value = select( blockEditorStore ).getBlockAttributes(
				thread.blockClientId
			)?.[ inlineOp.attribute ];
			const relations = suggestionRelations( value, thread.id );
			// Decided at all, provisionally or for good.
			const isDecided = ! isPendingStatus(
				getSuggestionStatus( thread )
			);
			const canEmpty =
				relations.children.length > 0 &&
				( inlineOp.suggestionType === SUGGESTION_TYPE_ADDITION ||
					inlineOp.suggestionType === SUGGESTION_TYPE_REPLACEMENT );
			const emptiedCount = canEmpty
				? suggestionsEmptiedBy( value, {
						id: thread.id,
						suggestionType: inlineOp.suggestionType,
						decision: 'reject',
					} ).length
				: 0;
			const { getEntityRecord } = select( coreStore ) as any;
			const lines = suggestionContextLines( {
				relations,
				emptiedCount,
				nameOf: ( noteId ) =>
					getEntityRecord( 'root', 'comment', Number( noteId ) )
						?.author_name || undefined,
				isResolved: isDecided,
			} );
			return lines.length ? lines : EMPTY_LINES;
		},
		[ payload, thread ]
	);

	const decidedBy = Number( thread?.meta?._wp_suggestion_decided_by ) || 0;
	const { blockExists, hasConflict, postFieldProposed, deciderName } =
		useSelect(
			( select ) => {
				const core: any = select( coreStore );
				const name = decidedBy
					? core.getEntityRecord( 'root', 'user', decidedBy, {
							context: 'view',
						} )?.name
					: undefined;
				const deciderLabel =
					decidedBy && decidedBy === core.getCurrentUser()?.id
						? null
						: name;
				// A post-level suggestion targets the post itself, which
				// always exists; its staleness is checked against the post's
				// fields.
				if ( isPostSuggestion ) {
					// The post's own value, not a pending proposal laid over
					// it: a reviewer who is suggesting sees proposals in the
					// fields.
					const { getPostFieldValueWithoutProposals } = unlock(
						select( editorStore )
					);
					const valueOf = ( op: any ) =>
						getPostFieldValueWithoutProposals(
							op.attribute,
							op.key
						) ?? null;
					return {
						blockExists: true,
						hasConflict: postOps.some(
							( op: any ) =>
								! isAttributeEqual(
									op.before ?? null,
									valueOf( op )
								)
						),
						postFieldProposed: postOps.some( ( op: any ) =>
							isPostFieldStillProposed( op, valueOf( op ) )
						),
						deciderName: deciderLabel,
					};
				}
				const { getBlock, getBlockAttributes } =
					select( blockEditorStore );
				const currentAttributes = thread?.blockClientId
					? getBlockAttributes( thread.blockClientId )
					: null;
				return {
					blockExists: thread?.blockClientId
						? !! getBlock( thread.blockClientId )
						: false,
					hasConflict:
						!! payload &&
						!! currentAttributes &&
						hasAttributeConflict(
							currentAttributes,
							payload.operations
						),
					postFieldProposed: false,
					deciderName: deciderLabel,
				};
			},
			[
				thread?.blockClientId,
				payload,
				isPostSuggestion,
				postOps,
				decidedBy,
			]
		);

	if ( ! payload ) {
		return null;
	}

	const suggestionStatus = getSuggestionStatus( thread );
	const decision = getDecision( suggestionStatus );
	/*
	 * Whether the post still carries the suggestion, so a decision on it did
	 * not reach the content. A post field only changes on accept; a rejected
	 * one never leaves anything behind.
	 */
	const stillProposed = isPostSuggestion
		? decision === APPLIED && postFieldProposed
		: anchorPresent === true;
	let presentation: SuggestionPresentation = 'pending';
	if ( suggestionStatus === OUTDATED ) {
		presentation = 'outdated';
	} else if ( isProvisionalStatus( suggestionStatus ) ) {
		presentation = stillProposed ? 'pending-again' : 'unsaved';
	} else if ( ! isPendingStatus( suggestionStatus ) ) {
		// Not while a decision is landing: its status is written first.
		presentation = stillProposed && ! busy ? 'stuck' : 'resolved';
	}
	const isResolved =
		presentation !== 'pending' && presentation !== 'pending-again';

	// A block-switcher transform (any `replaceBlocks`) is captured as a
	// removal plus an insertion, stamped with a shared group id. Either
	// decision resolves both halves, so say so — a reviewer who accepts one
	// card and watches the other resolve on its own is owed the explanation.
	const isGrouped = !! findStructuralOp( payload.operations )?.groupId;

	const runApply = async () => {
		setBusy( true );
		try {
			await applySuggestion( {
				commentId: thread.id,
				clientId: thread.blockClientId,
				payload,
			} );
		} catch {
			// Notice surfaced by the provider.
		} finally {
			setBusy( false );
		}
	};

	const onApplyClick = () => {
		if ( hasConflict ) {
			setShowStaleDialog( true );
			return;
		}
		runApply();
	};

	const onReject = async () => {
		setBusy( true );
		try {
			await rejectSuggestion( {
				commentId: thread.id,
				clientId: thread.blockClientId,
				payload,
			} );
		} catch {
			// Notice surfaced by the provider.
		} finally {
			setBusy( false );
		}
	};

	// Derive the disabled state and its reason from ONE predicate so the
	// button and the explanatory text can't disagree. A thread without a
	// resolved blockClientId has no live target either.
	const isTargetMissing =
		! isPostSuggestion && ( ! thread?.blockClientId || ! blockExists );
	const applyDisabled = busy || isTargetMissing;
	const applyDisabledReason = isTargetMissing
		? __( 'Target block has been deleted.' )
		: undefined;

	return {
		payload,
		suggestionStatus,
		decision,
		presentation,
		deciderName,
		anchorKind: describeAnchor( thread ),
		isResolved,
		isGrouped,
		isPostSuggestion,
		contextLines,
		busy,
		onApplyClick,
		onReject,
		applyDisabled,
		applyDisabledReason,
		showStaleDialog,
		dismissStaleDialog: () => setShowStaleDialog( false ),
		confirmStaleApply: () => {
			setShowStaleDialog( false );
			runApply();
		},
	};
}

type SuggestionDecision = NonNullable<
	ReturnType< typeof useSuggestionDecision >
>;

/**
 * Header-slot icon buttons (check and close) for accepting or rejecting a
 * suggestion. Rendered inline with the note's author info so the decision
 * affordance is always in view, even when the thread is long.
 *
 * @param props          Props.
 * @param props.decision Controls from `useSuggestionDecision`.
 */
export function SuggestionActionButtons( {
	decision,
}: {
	decision: SuggestionDecision | null;
} ) {
	if ( ! decision || decision.isResolved ) {
		return null;
	}

	const { showStaleDialog, dismissStaleDialog, confirmStaleApply } = decision;

	return (
		<Stack
			direction="row"
			justify="flex-end"
			className="editor-collab-sidebar-panel__suggestion-header-actions"
			onClick={ ( event ) => {
				// Keep the click from bubbling into the thread's expand/
				// collapse handler — the icon button is its own affordance.
				event.stopPropagation();
			} }
		>
			<Button
				size="small"
				icon={ check }
				label={ __( 'Accept suggestion' ) }
				showTooltip
				disabled={ decision.applyDisabled }
				accessibleWhenDisabled
				onClick={ decision.onApplyClick }
			/>
			<Button
				size="small"
				icon={ closeSmall }
				label={ __( 'Reject suggestion' ) }
				showTooltip
				disabled={ decision.busy }
				accessibleWhenDisabled
				onClick={ decision.onReject }
			/>
			{ /*
				The dialog sits beside the buttons whose click opens it; both
				read the one `decision` object `Note` owns.
			*/ }
			{ showStaleDialog && (
				<ConfirmDialog
					isOpen
					onConfirm={ confirmStaleApply }
					onCancel={ dismissStaleDialog }
					confirmButtonText={ __( 'Apply anyway' ) }
				>
					{ decision.isPostSuggestion
						? __(
								'This post setting has changed since the suggestion was made. Applying it will overwrite the newer edit. Continue?'
							)
						: __(
								'This block has changed since the suggestion was made. Applying it will overwrite the newer edit. Continue?'
							) }
				</ConfirmDialog>
			) }
		</Stack>
	);
}

/**
 * Render a suggestion's summary, resolving inline-suggestion marker text from
 * the linked block's live content first.
 *
 * An inline suggestion (Option B) stores no before/after text in its payload —
 * the proposed words live in the in-content `<mark>` marker, so its text is
 * derived on read (`findSuggestionText`) the same way the canvas decoration
 * derives the marker's range. Resolution happens inside `useSelect` so the
 * summary tracks the marker as contiguous typing grows it, then the enriched
 * operations feed the pure `summarizeOperations`. Threads with no inline op
 * (structural or whole-attribute suggestions) pass through untouched.
 *
 * @param props            Props.
 * @param props.thread     The note thread.
 * @param props.operations Suggestion operations.
 */
function ResolvedSuggestionSummary( {
	thread,
	operations,
}: {
	thread: any;
	operations: any[];
} ) {
	// Select only the marker texts: `useSelect` compares arrays element by
	// element, so strings stay equal across unrelated store updates where
	// freshly mapped op objects would re-render every note per keystroke.
	const markerTexts = useSelect(
		( select ) => {
			if ( ! thread?.blockClientId ) {
				return EMPTY_ARRAY;
			}
			const attributes = select( blockEditorStore ).getBlockAttributes(
				thread.blockClientId
			);
			if ( ! attributes ) {
				return EMPTY_ARRAY;
			}
			/*
			 * Two entries per op, kept flat so the comparison stays per
			 * string: the text the op proposes, then (for a replacement,
			 * whose one id also marks the replaced run) the replaced text.
			 */
			return operations.flatMap( ( op: any ) => {
				if (
					op.type !== 'inline-suggestion' ||
					! op.attribute ||
					op.text
				) {
					return [ null, null ];
				}
				const value = attributes[ op.attribute ];
				if ( op.suggestionType === SUGGESTION_TYPE_REPLACEMENT ) {
					return [
						findSuggestionText(
							value,
							thread.id,
							SUGGESTION_TYPE_ADDITION
						),
						findSuggestionText(
							value,
							thread.id,
							SUGGESTION_TYPE_DELETION
						),
					];
				}
				return [ findSuggestionText( value, thread.id ), null ];
			} );
		},
		[ operations, thread?.blockClientId, thread?.id ]
	);
	/*
	 * A structural op carries no text of its own, so read it from the block:
	 * the live one first, which tracks typing into an inserted block, then
	 * the snapshot the interceptor records on the op.
	 */
	const blockTexts = useSelect(
		( select ) => {
			if (
				! operations.some( ( op: any ) =>
					STRUCTURAL_OP_TYPES.has( op.type )
				)
			) {
				return EMPTY_ARRAY;
			}
			const { getBlockAttributes } = select( blockEditorStore );
			return operations.map( ( op: any ) => {
				if ( ! STRUCTURAL_OP_TYPES.has( op.type ) ) {
					return null;
				}
				// `op.clientId` is session-local and goes stale on reload;
				// the thread's block id is resolved from block metadata.
				const liveAttributes =
					( op.clientId && getBlockAttributes( op.clientId ) ) ||
					( thread?.blockClientId &&
						getBlockAttributes( thread.blockClientId ) ) ||
					null;
				return readBlockText(
					op.blockName,
					liveAttributes ?? op.block?.attributes
				);
			} );
		},
		[ operations, thread?.blockClientId ]
	);
	const resolvedOperations = useMemo(
		() =>
			operations.map( ( op: any, index: number ) => {
				const text =
					markerTexts[ index * 2 ] ?? blockTexts[ index ] ?? null;
				const deletedText = markerTexts[ index * 2 + 1 ];
				if ( ! text && ! deletedText ) {
					return op;
				}
				return {
					...op,
					...( text && { text } ),
					...( deletedText && { deletedText } ),
				};
			} ),
		[ operations, markerTexts, blockTexts ]
	);

	return <SuggestionSummary operations={ resolvedOperations } />;
}

/**
 * Why an outdated suggestion no longer applies, by what held it.
 *
 * @param anchor Anchor descriptor of the note, if any.
 * @return The label.
 */
function outdatedLabel( anchor: ReturnType< typeof describeAnchor > ) {
	if ( anchor?.kind === 'structural' ) {
		return anchor.pendingType === 'pending-attributes'
			? __( 'No longer applies - the block changed.' )
			: __( 'No longer applies - the block was removed.' );
	}
	return __( 'No longer applies - the text was removed.' );
}

/**
 * The hint on a decision that was made but never saved with the post.
 *
 * @param decision    The decision.
 * @param deciderName Who made it, `null` for the current user, or undefined
 *                    while unknown.
 * @return The hint.
 */
function notSavedHint(
	decision: ReturnType< typeof getDecision >,
	deciderName: string | null | undefined
) {
	if ( deciderName === null ) {
		return decision === REJECTED
			? __( 'You rejected this suggestion, but the post was not saved.' )
			: __( 'You accepted this suggestion, but the post was not saved.' );
	}
	if ( deciderName && decision === REJECTED ) {
		return sprintf(
			// translators: %s: name of the user who rejected the suggestion.
			__( '%s rejected this suggestion, but the post was not saved.' ),
			deciderName
		);
	}
	if ( deciderName ) {
		return sprintf(
			// translators: %s: name of the user who accepted the suggestion.
			__( '%s accepted this suggestion, but the post was not saved.' ),
			deciderName
		);
	}
	return decision === REJECTED
		? __( 'This suggestion was rejected, but the post was not saved.' )
		: __( 'This suggestion was accepted, but the post was not saved.' );
}

/**
 * Body for a note that carries a suggestion payload: the compact
 * Add/Delete/Formatting summary and a status label if applicable.
 * Accept/Reject and the staleness dialog live in the header slot via
 * `SuggestionActionButtons` so the click and the dialog share state. A note
 * whose final decision never reached the post, or that is outdated, offers
 * its way back here.
 *
 * @param props          Props.
 * @param props.thread   The note thread.
 * @param props.decision Controls from `useSuggestionDecision`.
 * @param props.onReopen Puts the note back to awaiting a decision.
 */
export default function SuggestionActions( {
	thread,
	decision,
	onReopen,
}: {
	thread: any;
	decision: SuggestionDecision | null;
	onReopen?: () => void;
} ) {
	if ( ! decision ) {
		return null;
	}

	const {
		payload,
		presentation,
		isResolved,
		isGrouped,
		contextLines,
		applyDisabledReason,
	} = decision;
	const decisionLabel =
		decision.decision === REJECTED ? __( 'Rejected' ) : __( 'Applied' );

	let status: string | null = null;
	let hint: string | null = null;
	if ( presentation === 'pending-again' ) {
		hint = notSavedHint( decision.decision, decision.deciderName );
	} else if ( presentation === 'unsaved' ) {
		status = decisionLabel;
		hint = __( 'Save the post to keep this decision.' );
	} else if ( presentation === 'stuck' ) {
		status =
			decision.decision === REJECTED
				? __( 'Rejected, but the suggestion is still in the post.' )
				: __( 'Applied, but the change is not in the post.' );
	} else if ( presentation === 'resolved' ) {
		status = decisionLabel;
	} else if ( presentation === 'outdated' ) {
		status = outdatedLabel( decision.anchorKind );
	}

	const canReopen =
		!! onReopen &&
		( presentation === 'stuck' || presentation === 'outdated' );

	return (
		<Stack
			direction="column"
			gap="sm"
			className="editor-collab-sidebar-panel__suggestion"
		>
			<ResolvedSuggestionSummary
				thread={ thread }
				operations={ payload.operations }
			/>
			{ contextLines.map( ( line ) => (
				<Text
					key={ line }
					variant="body-sm"
					className="editor-collab-sidebar-panel__suggestion-status editor-collab-sidebar-panel__suggestion-context"
				>
					{ line }
				</Text>
			) ) }
			{ ! isResolved && isGrouped && (
				<Text
					variant="body-sm"
					className="editor-collab-sidebar-panel__suggestion-status editor-collab-sidebar-panel__suggestion-group-hint"
				>
					{ __(
						'Part of one block change. Both halves resolve together.'
					) }
				</Text>
			) }
			{ status && (
				<Text
					variant="body-sm"
					className="editor-collab-sidebar-panel__suggestion-status"
				>
					{ status }
				</Text>
			) }
			{ hint && (
				<Text
					variant="body-sm"
					className="editor-collab-sidebar-panel__suggestion-status"
				>
					{ hint }
				</Text>
			) }
			{ ! isResolved && applyDisabledReason && (
				<Text
					variant="body-sm"
					className="editor-collab-sidebar-panel__suggestion-status"
				>
					{ applyDisabledReason }
				</Text>
			) }
			{ ( presentation === 'stuck' || canReopen ) && (
				<Stack
					direction="row"
					gap="sm"
					wrap="wrap"
					onClick={ ( event ) => {
						// Keep the click from toggling the thread.
						event.stopPropagation();
					} }
				>
					{ presentation === 'stuck' && (
						<>
							<Button
								variant="secondary"
								size="compact"
								disabled={ decision.applyDisabled }
								accessibleWhenDisabled
								onClick={ decision.onApplyClick }
							>
								{ __( 'Apply again' ) }
							</Button>
							<Button
								variant="secondary"
								size="compact"
								disabled={ decision.busy }
								accessibleWhenDisabled
								onClick={ decision.onReject }
							>
								{ __( 'Reject again' ) }
							</Button>
						</>
					) }
					{ canReopen && (
						<Button
							variant="tertiary"
							size="compact"
							disabled={ decision.busy }
							accessibleWhenDisabled
							onClick={ onReopen }
						>
							{ __( 'Reopen' ) }
						</Button>
					) }
				</Stack>
			) }
		</Stack>
	);
}
