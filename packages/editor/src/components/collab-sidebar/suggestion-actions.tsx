import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
} from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { check, closeSmall } from '@wordpress/icons';
import {
	findStructuralOp,
	hasAttributeConflict,
	parseSuggestionPayload,
	useSuggestionsProvider,
} from '../suggestion-mode';
import SuggestionSummary from '../suggestion-mode/suggestion-summary';
import { findSuggestionText } from '../inline-suggestions';

const EMPTY_ARRAY: Array< string | null > = [];

/**
 * Read-only status constants — keep in sync with `_wp_suggestion_status`
 * enum declared in `block-comments.php`.
 */
const APPLIED = 'applied';
const REJECTED = 'rejected';

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
	const suggestionStatus = thread?.meta?._wp_suggestion_status;
	const { applySuggestion, rejectSuggestion } = useSuggestionsProvider();
	const [ busy, setBusy ] = useState( false );
	const [ showStaleDialog, setShowStaleDialog ] = useState( false );

	// "Conflict" is checked per attribute rather than from the post's
	// `modified_gmt`: every auto-saved suggestion bumps the post's
	// modification time, so a post-level revision compare flags nearly
	// every suggestion as stale even when the block content hasn't
	// diverged. We only prompt when the specific attributes a suggestion
	// targets have actually moved away from the captured baseline.
	const { blockExists, hasConflict } = useSelect(
		( select ) => {
			const { getBlock, getBlockAttributes } = select( blockEditorStore );
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
			};
		},
		[ thread?.blockClientId, payload ]
	);

	if ( ! payload ) {
		return null;
	}

	const isResolved =
		suggestionStatus === APPLIED || suggestionStatus === REJECTED;

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
	const isTargetMissing = ! thread?.blockClientId || ! blockExists;
	const applyDisabled = busy || isTargetMissing;
	const applyDisabledReason = isTargetMissing
		? __( 'Target block has been deleted.' )
		: undefined;

	return {
		payload,
		suggestionStatus,
		isResolved,
		isGrouped,
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
			gap={ '0' as any }
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
					{ __(
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
			return operations.map( ( op: any ) =>
				op.type !== 'inline-suggestion' || ! op.attribute || op.text
					? null
					: findSuggestionText(
							attributes[ op.attribute ],
							thread.id
						)
			);
		},
		[ operations, thread?.blockClientId, thread?.id ]
	);
	const resolvedOperations = useMemo(
		() =>
			operations.map( ( op: any, index: number ) =>
				markerTexts[ index ]
					? { ...op, text: markerTexts[ index ] }
					: op
			),
		[ operations, markerTexts ]
	);

	return <SuggestionSummary operations={ resolvedOperations } />;
}

/**
 * Body for a note that carries a suggestion payload: the compact
 * Add/Delete/Formatting summary and a resolved-state label if applicable.
 * Accept/Reject and the staleness dialog live in the header slot via
 * `SuggestionActionButtons` so the click and the dialog share state.
 *
 * @param props          Props.
 * @param props.thread   The note thread.
 * @param props.decision Controls from `useSuggestionDecision`.
 */
export default function SuggestionActions( {
	thread,
	decision,
}: {
	thread: any;
	decision: SuggestionDecision | null;
} ) {
	if ( ! decision ) {
		return null;
	}

	const {
		payload,
		suggestionStatus,
		isResolved,
		isGrouped,
		applyDisabledReason,
	} = decision;

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
			{ isResolved && (
				<Text
					variant="body-sm"
					className="editor-collab-sidebar-panel__suggestion-status"
				>
					{ suggestionStatus === APPLIED
						? __( 'Applied' )
						: __( 'Rejected' ) }
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
		</Stack>
	);
}
