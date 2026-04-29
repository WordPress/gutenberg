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

/**
 * Internal dependencies
 */
import {
	parseSuggestionPayload,
	useSuggestionsProvider,
} from '../suggestion-mode';
import SuggestionDiff from '../suggestion-mode/suggestion-diff';
import { store as editorStore } from '../../store';

/**
 * Read-only status constants — keep in sync with `_wp_suggestion_status`
 * enum declared in `block-comments.php`.
 */
const APPLIED = 'applied';
const REJECTED = 'rejected';

/**
 * Controls rendered inside a note comment's thread when the comment has
 * a `_wp_suggestion` payload. Surfaces the diff, plus Apply / Reject
 * buttons. Shows a staleness confirmation when the post has changed since
 * the suggestion was captured, and disables Apply when the target block
 * is no longer present in the block tree.
 *
 * @param {{ thread: Object }} props
 */
export default function SuggestionActions( { thread } ) {
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

	return (
		<Stack
			direction="column"
			gap="sm"
			className="editor-collab-sidebar-panel__suggestion"
		>
			<SuggestionDiff operations={ payload.operations } />
			{ isResolved ? (
				<WCText variant="muted" size="12px">
					{ suggestionStatus === APPLIED
						? __( 'Applied' )
						: __( 'Rejected' ) }
				</WCText>
			) : (
				<>
					{ applyDisabledReason && (
						<WCText variant="muted" size="12px">
							{ applyDisabledReason }
						</WCText>
					) }
					<Stack direction="row" gap="sm" justify="flex-start">
						<Button
							variant="primary"
							size="small"
							disabled={ applyDisabled }
							accessibleWhenDisabled
							onClick={ onApplyClick }
						>
							{ __( 'Apply' ) }
						</Button>
						<Button
							variant="secondary"
							size="small"
							disabled={ busy }
							accessibleWhenDisabled
							onClick={ onReject }
						>
							{ __( 'Reject' ) }
						</Button>
					</Stack>
				</>
			) }
			{ showStaleDialog && (
				<ConfirmDialog
					isOpen
					onConfirm={ () => {
						setShowStaleDialog( false );
						runApply();
					} }
					onCancel={ () => setShowStaleDialog( false ) }
					confirmButtonText={ __( 'Apply anyway' ) }
				>
					{ __(
						'The post has changed since this suggestion was made. Applying it may produce unexpected results. Continue?'
					) }
				</ConfirmDialog>
			) }
		</Stack>
	);
}
