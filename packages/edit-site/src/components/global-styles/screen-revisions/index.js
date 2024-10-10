/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext, useState, useEffect } from '@wordpress/element';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from '../header';
import { unlock } from '../../../lock-unlock';
import Revisions from '../../revisions';
import { store as editSiteStore } from '../../../store';
import useGlobalStylesRevisions from './use-global-styles-revisions';
import RevisionsButtons from './revisions-buttons';
import StyleBook from '../../style-book';
import Pagination from '../../pagination';

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

const PAGE_SIZE = 10;

function ScreenRevisions() {
	const { user: currentEditorGlobalStyles, setUserConfig } =
		useContext( GlobalStylesContext );
	const { blocks, editorCanvasContainerView } = useSelect(
		( select ) => ( {
			editorCanvasContainerView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			blocks: select( blockEditorStore ).getBlocks(),
		} ),
		[]
	);
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const [ currentRevisions, setCurrentRevisions ] = useState( [] );
	const { revisions, isLoading, hasUnsavedChanges, revisionsCount } =
		useGlobalStylesRevisions( {
			query: {
				per_page: PAGE_SIZE,
				page: currentPage,
			},
		} );

	const numPages = Math.ceil( revisionsCount / PAGE_SIZE );

	const [ currentlySelectedRevision, setCurrentlySelectedRevision ] =
		useState( currentEditorGlobalStyles );
	const [
		isLoadingRevisionWithUnsavedChanges,
		setIsLoadingRevisionWithUnsavedChanges,
	] = useState( false );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const selectedRevisionMatchesEditorStyles = areGlobalStyleConfigsEqual(
		currentlySelectedRevision,
		currentEditorGlobalStyles
	);

	// The actual code that triggers the revisions screen to navigate back
	// to the home screen in in `packages/edit-site/src/components/global-styles/ui.js`.
	const onCloseRevisions = () => {
		const canvasContainerView =
			editorCanvasContainerView === 'global-styles-revisions:style-book'
				? 'style-book'
				: undefined;
		setEditorCanvasContainerView( canvasContainerView );
	};

	const restoreRevision = ( revision ) => {
		setUserConfig( () => revision );
		setIsLoadingRevisionWithUnsavedChanges( false );
		onCloseRevisions();
	};

	useEffect( () => {
		if ( ! isLoading && revisions.length ) {
			setCurrentRevisions( revisions );
		}
	}, [ revisions, isLoading ] );

	const firstRevision = revisions[ 0 ];
	const currentlySelectedRevisionId = currentlySelectedRevision?.id;
	const shouldSelectFirstItem =
		!! firstRevision?.id &&
		! selectedRevisionMatchesEditorStyles &&
		! currentlySelectedRevisionId;

	useEffect( () => {
		/*
		 * Ensure that the first item is selected and loaded into the preview pane
		 * when no revision is selected and the selected styles don't match the current editor styles.
		 * This is required in case editor styles are changed outside the revisions panel,
		 * e.g., via the reset styles function of useGlobalStylesReset().
		 * See: https://github.com/WordPress/gutenberg/issues/55866
		 */
		if ( shouldSelectFirstItem ) {
			setCurrentlySelectedRevision( firstRevision );
		}
	}, [ shouldSelectFirstItem, firstRevision ] );

	// Only display load button if there is a revision to load,
	// and it is different from the current editor styles.
	const isLoadButtonEnabled =
		!! currentlySelectedRevisionId &&
		currentlySelectedRevisionId !== 'unsaved' &&
		! selectedRevisionMatchesEditorStyles;
	const hasRevisions = !! currentRevisions.length;

	return (
		<>
			<ScreenHeader
				title={
					revisionsCount &&
					// translators: %s: number of revisions.
					sprintf( __( 'Revisions (%s)' ), revisionsCount )
				}
				description={ __(
					'Click on previously saved styles to preview them. To restore a selected version to the editor, hit "Apply." When you\'re ready, use the Save button to save your changes.'
				) }
				onBack={ onCloseRevisions }
			/>
			{ ! hasRevisions && (
				<Spinner className="edit-site-global-styles-screen-revisions__loading" />
			) }
			{ hasRevisions &&
				( editorCanvasContainerView ===
				'global-styles-revisions:style-book' ? (
					<StyleBook
						userConfig={ currentlySelectedRevision }
						isSelected={ () => {} }
						onClose={ () => {
							setEditorCanvasContainerView(
								'global-styles-revisions'
							);
						} }
					/>
				) : (
					<Revisions
						blocks={ blocks }
						userConfig={ currentlySelectedRevision }
						closeButtonLabel={ __( 'Close revisions' ) }
					/>
				) ) }
			<RevisionsButtons
				onChange={ setCurrentlySelectedRevision }
				selectedRevisionId={ currentlySelectedRevisionId }
				userRevisions={ currentRevisions }
				canApplyRevision={ isLoadButtonEnabled }
				onApplyRevision={ () =>
					hasUnsavedChanges
						? setIsLoadingRevisionWithUnsavedChanges( true )
						: restoreRevision( currentlySelectedRevision )
				}
			/>
			{ numPages > 1 && (
				<div className="edit-site-global-styles-screen-revisions__footer">
					<Pagination
						className="edit-site-global-styles-screen-revisions__pagination"
						currentPage={ currentPage }
						numPages={ numPages }
						changePage={ setCurrentPage }
						totalItems={ revisionsCount }
						disabled={ isLoading }
						label={ __( 'Global Styles pagination navigation' ) }
					/>
				</div>
			) }
			{ isLoadingRevisionWithUnsavedChanges && (
				<ConfirmDialog
					isOpen={ isLoadingRevisionWithUnsavedChanges }
					confirmButtonText={ __( 'Apply' ) }
					onConfirm={ () =>
						restoreRevision( currentlySelectedRevision )
					}
					onCancel={ () =>
						setIsLoadingRevisionWithUnsavedChanges( false )
					}
					size="medium"
				>
					{ __(
						'Are you sure you want to apply this revision? Any unsaved changes will be lost.'
					) }
				</ConfirmDialog>
			) }
		</>
	);
}

export default ScreenRevisions;
