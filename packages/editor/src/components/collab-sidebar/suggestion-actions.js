/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import {
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { check, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	parseSuggestionPayload,
	useSuggestionsProvider,
} from '../suggestion-mode';
import SuggestionSummary from '../suggestion-mode/suggestion-summary';
import { store as editorStore } from '../../store';

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

	const { blockExists, isStale } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const post = select( editorStore ).getCurrentPost?.();
			const currentModified = post?.modified_gmt ?? null;
			return {
				blockExists: thread?.blockClientId
					? !! getBlock( thread.blockClientId )
					: false,
				isStale:
					!! payload?.baseRevision &&
					!! currentModified &&
					payload.baseRevision !== currentModified,
			};
		},
		[ thread?.blockClientId, payload?.baseRevision ]
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
		if ( isStale ) {
			setShowStaleDialog( true );
			return;
		}
		runApply();
	};

	const onReject = async () => {
		setBusy( true );
		try {
			await rejectSuggestion( { commentId: thread.id } );
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

	return (
		<HStack
			className="editor-collab-sidebar-panel__suggestion-header-actions"
			spacing="0"
			justify="flex-end"
			expanded={ false }
			onClick={ ( event ) => {
				// Keep the click from bubbling into the thread's expand/
				// collapse handler — the icon button is its own affordance.
				event.stopPropagation();
			} }
		>
			<Button
				size="small"
				icon={ check }
				iconSize={ 20 }
				label={ __( 'Accept suggestion' ) }
				showTooltip
				disabled={ decision.applyDisabled }
				accessibleWhenDisabled
				onClick={ decision.onApplyClick }
			/>
			<Button
				size="small"
				icon={ close }
				iconSize={ 20 }
				label={ __( 'Reject suggestion' ) }
				showTooltip
				disabled={ decision.busy }
				accessibleWhenDisabled
				onClick={ decision.onReject }
			/>
		</HStack>
	);
}

/**
 * Body for a note that carries a suggestion payload: the compact
 * Add/Delete/Formatting summary, a resolved-state label if applicable, and
 * the staleness confirm dialog. Accept/Reject themselves live in the
 * header slot via `SuggestionActionButtons`.
 *
 * @param {{ thread: Object }} props
 */
export default function SuggestionActions( { thread } ) {
	const decision = useSuggestionDecision( thread );
	if ( ! decision ) {
		return null;
	}

	const {
		payload,
		suggestionStatus,
		isResolved,
		applyDisabledReason,
		showStaleDialog,
		dismissStaleDialog,
		confirmStaleApply,
	} = decision;

	return (
		<VStack spacing="2" className="editor-collab-sidebar-panel__suggestion">
			<SuggestionSummary operations={ payload.operations } />
			{ isResolved && (
				<Text variant="muted" size="12px">
					{ suggestionStatus === APPLIED
						? __( 'Applied' )
						: __( 'Rejected' ) }
				</Text>
			) }
			{ ! isResolved && applyDisabledReason && (
				<Text variant="muted" size="12px">
					{ applyDisabledReason }
				</Text>
			) }
			{ showStaleDialog && (
				<ConfirmDialog
					isOpen
					onConfirm={ confirmStaleApply }
					onCancel={ dismissStaleDialog }
					confirmButtonText={ __( 'Apply anyway' ) }
				>
					{ __(
						'The post has changed since this suggestion was made. Applying it may produce unexpected results. Continue?'
					) }
				</ConfirmDialog>
			) }
		</VStack>
	);
}
