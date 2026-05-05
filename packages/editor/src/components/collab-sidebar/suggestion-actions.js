/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
	__experimentalText as WCText,
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { check, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	hasAttributeConflict,
	parseSuggestionPayload,
	useSuggestionsProvider,
} from '../suggestion-mode';
import SuggestionSummary from '../suggestion-mode/suggestion-summary';

/**
 * Read-only status constants — keep in sync with `_wp_suggestion_status`
 * enum declared in `block-comments.php`.
 */
const APPLIED = 'applied';
const REJECTED = 'rejected';

/**
 * Shared accept/reject wiring for a note that carries a suggestion payload.
 * Both the header icon buttons and the body (for resolution state and the
 * staleness dialog) consume the same hook so their behavior never diverges.
 *
 * @param {Object} thread The note thread.
 * @return {Object|null} Controls, or null if the thread has no payload.
 */
function useSuggestionDecision( thread ) {
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

	const applyDisabled = busy || ( thread?.blockClientId && ! blockExists );
	const applyDisabledReason = ! blockExists
		? __( 'Target block has been deleted.' )
		: undefined;

	return {
		payload,
		suggestionStatus,
		isResolved,
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

/**
 * Header-slot icon buttons (check and close) for accepting or rejecting a
 * suggestion. Rendered inline with the note's author info so the decision
 * affordance is always in view, even when the thread is long.
 *
 * @param {{ thread: Object }} props
 */
export function SuggestionActionButtons( { thread } ) {
	const decision = useSuggestionDecision( thread );
	if ( ! decision || decision.isResolved ) {
		return null;
	}

	const { showStaleDialog, dismissStaleDialog, confirmStaleApply } = decision;

	return (
		<Stack
			direction="row"
			justify="flex-end"
			gap="0"
			className="editor-collab-sidebar-panel__suggestion-header-actions"
			onClick={ ( event ) => {
				// Keep the click from bubbling into the thread's expand/
				// collapse handler — the icon button is its own affordance.
				event.stopPropagation();
			} }
		>
			<Button
				size="compact"
				icon={ check }
				iconSize={ 24 }
				label={ __( 'Accept suggestion' ) }
				showTooltip
				disabled={ decision.applyDisabled }
				accessibleWhenDisabled
				onClick={ decision.onApplyClick }
			/>
			<Button
				size="compact"
				icon={ closeSmall }
				iconSize={ 24 }
				label={ __( 'Reject suggestion' ) }
				showTooltip
				disabled={ decision.busy }
				accessibleWhenDisabled
				onClick={ decision.onReject }
			/>
			{ /*
				Render the staleness dialog from the same hook instance that
				owns the click handlers — `SuggestionActionButtons` and
				`SuggestionActions` each call `useSuggestionDecision`, so
				their `showStaleDialog` states are independent. Keeping the
				dialog colocated with the buttons ensures the click that
				opens it and the dialog itself share state.
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
 * Body for a note that carries a suggestion payload: the compact
 * Add/Delete/Formatting summary and a resolved-state label if applicable.
 * Accept/Reject and the staleness dialog live in the header slot via
 * `SuggestionActionButtons` so the click and the dialog share state.
 *
 * @param {{ thread: Object }} props
 */
export default function SuggestionActions( { thread } ) {
	const decision = useSuggestionDecision( thread );
	if ( ! decision ) {
		return null;
	}

	const { payload, suggestionStatus, isResolved, applyDisabledReason } =
		decision;

	return (
		<Stack
			direction="column"
			gap="sm"
			className="editor-collab-sidebar-panel__suggestion"
		>
			<SuggestionSummary operations={ payload.operations } />
			{ isResolved && (
				<WCText variant="muted" size="12px">
					{ suggestionStatus === APPLIED
						? __( 'Applied' )
						: __( 'Rejected' ) }
				</WCText>
			) }
			{ ! isResolved && applyDisabledReason && (
				<WCText variant="muted" size="12px">
					{ applyDisabledReason }
				</WCText>
			) }
		</Stack>
	);
}
