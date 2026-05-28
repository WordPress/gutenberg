/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import {
	Button,
	Modal,
	Notice,
	RangeControl,
	Spinner,
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	__experimentalRequestDistributedEditingHistory,
	__experimentalRequestDistributedEditingHistoryPlan,
} from '../../store/distributed-editing-api';

function getRestBaseForPostType( postType ) {
	return postType === 'page' ? 'pages' : 'posts';
}

function getHistoryItemLabel( item ) {
	if ( ! item ) {
		return __( 'No revision selected' );
	}

	const dateFormat =
		getDateSettings()?.formats?.datetimeAbbreviated || 'M j, Y g:i a';
	const date = item.date ? dateI18n( dateFormat, item.date ) : '';

	return sprintf(
		/* translators: 1: revision date, 2: editor display name, 3: editing session label. */
		__( '%1$s by %2$s, %3$s' ),
		date || __( 'Unknown date' ),
		item.author_display_name || __( 'Unknown editor' ),
		item.session_label || __( 'Unknown session' )
	);
}

function DocumentHistoryPreview( { item } ) {
	const blocks = useMemo( () => {
		if ( ! item?.preview_available || typeof item.content !== 'string' ) {
			return null;
		}

		try {
			return parse( item.content );
		} catch {
			return null;
		}
	}, [ item ] );

	if ( ! item ) {
		return null;
	}

	if ( ! blocks ) {
		return (
			<div className="editor-document-history-modal__empty-preview">
				{ __( 'Preview unavailable for this revision.' ) }
			</div>
		);
	}

	return (
		<div
			className="editor-document-history-modal__preview"
			data-distributed-editing-history-preview="formatted"
		>
			<BlockPreview.Async>
				<BlockPreview blocks={ blocks } viewportWidth={ 760 } />
			</BlockPreview.Async>
		</div>
	);
}

function EditorDocumentHistory( props, ref ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ items, setItems ] = useState( [] );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ actionStatus, setActionStatus ] = useState( null );
	const [ error, setError ] = useState( null );
	const { postId, postType, isDistributedEditingEnabled } = useSelect(
		( select ) => {
			const editor = select( editorStore );
			const settings =
				editor.getEditorSettings?.()?.distributedEditing || {};

			return {
				postId: editor.getCurrentPostId(),
				postType: editor.getCurrentPostType(),
				isDistributedEditingEnabled: Boolean( settings.enabled ),
			};
		},
		[]
	);
	const { __experimentalStageDistributedEditingHistoryContent } =
		useDispatch( editorStore );
	const selectedItem = items[ selectedIndex ] || null;
	const restBase = getRestBaseForPostType( postType );
	const loadHistory = useCallback( async () => {
		if ( ! postId || ! isDistributedEditingEnabled ) {
			return;
		}

		setIsLoading( true );
		setError( null );
		setActionStatus( null );

		try {
			const response =
				await __experimentalRequestDistributedEditingHistory( {
					postId,
					restBase,
				} );
			const nextItems = Array.isArray( response?.history_items )
				? response.history_items
				: [];

			setItems( nextItems );
			setSelectedIndex( Math.max( 0, nextItems.length - 1 ) );
		} catch ( historyError ) {
			setError(
				historyError?.message ||
					__( 'Could not load document history.' )
			);
		} finally {
			setIsLoading( false );
		}
	}, [ isDistributedEditingEnabled, postId, restBase ] );

	useEffect( () => {
		if ( isOpen ) {
			loadHistory();
		}
	}, [ isOpen, loadHistory ] );

	const stageHistoryAction = async ( historyAction ) => {
		if ( ! selectedItem ) {
			return;
		}

		setActionStatus( historyAction );
		setError( null );

		try {
			const response =
				await __experimentalRequestDistributedEditingHistoryPlan( {
					postId,
					restBase,
					historyAction,
					revisionId: selectedItem.revision_id,
					selectedContentHash: selectedItem.content_hash,
				} );
			const candidateContent = response?.candidate_post_content;

			if ( typeof candidateContent !== 'string' ) {
				throw new Error(
					__( 'WordPress did not return a history change.' )
				);
			}

			await __experimentalStageDistributedEditingHistoryContent( {
				content: candidateContent,
				label:
					historyAction === 'revert'
						? __( 'Revert revision' )
						: __( 'Restore revision' ),
				source: `history_${ historyAction }`,
			} );
			setIsOpen( false );
		} catch ( historyError ) {
			setError(
				historyError?.message ||
					__( 'Could not stage the selected history change.' )
			);
		} finally {
			setActionStatus( null );
		}
	};

	return (
		<>
			<Button
				__next40pxDefaultSize
				{ ...props }
				ref={ ref }
				icon={ backup }
				label={ __( 'Document history' ) }
				aria-disabled={ ! isDistributedEditingEnabled || ! postId }
				onClick={
					isDistributedEditingEnabled && postId
						? () => setIsOpen( true )
						: undefined
				}
				className="editor-history__document-history"
			/>
			{ isOpen && (
				<Modal
					className="editor-document-history-modal"
					onRequestClose={ () => setIsOpen( false ) }
					size="large"
					title={ __( 'Document history' ) }
				>
					<div
						className="editor-document-history-modal__controls"
						data-distributed-editing-history-modal="true"
					>
						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							disabled={
								! selectedItem?.can_revert ||
								Boolean( actionStatus )
							}
							isBusy={ actionStatus === 'revert' }
							onClick={ () => stageHistoryAction( 'revert' ) }
							variant="secondary"
						>
							{ __( 'Revert' ) }
						</Button>
						<RangeControl
							__next40pxDefaultSize
							className="editor-document-history-modal__slider"
							disabled={ isLoading || items.length < 2 }
							label={ __( 'Revision' ) }
							max={ Math.max( 0, items.length - 1 ) }
							min={ 0 }
							onChange={ ( value ) =>
								setSelectedIndex( Number( value ) || 0 )
							}
							step={ 1 }
							value={ selectedIndex }
						/>
						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							disabled={
								! selectedItem?.can_restore ||
								selectedItem?.is_current ||
								Boolean( actionStatus )
							}
							isBusy={ actionStatus === 'restore' }
							onClick={ () => stageHistoryAction( 'restore' ) }
							variant="primary"
						>
							{ __( 'Restore' ) }
						</Button>
					</div>
					<div className="editor-document-history-modal__meta">
						{ selectedItem
							? getHistoryItemLabel( selectedItem )
							: null }
					</div>
					{ error && (
						<Notice isDismissible={ false } status="error">
							{ error }
						</Notice>
					) }
					{ isLoading ? (
						<div className="editor-document-history-modal__loading">
							<Spinner />
						</div>
					) : (
						<DocumentHistoryPreview item={ selectedItem } />
					) }
				</Modal>
			) }
		</>
	);
}

export default forwardRef( EditorDocumentHistory );
