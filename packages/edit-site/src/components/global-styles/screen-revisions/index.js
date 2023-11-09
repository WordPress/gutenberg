/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	__experimentalUseNavigator as useNavigator,
	__experimentalConfirmDialog as ConfirmDialog,
	Spinner,
	__experimentalSpacer as Spacer,
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
import SidebarFixedBottom from '../../sidebar-edit-mode/sidebar-fixed-bottom';
import { store as editSiteStore } from '../../../store';
import useGlobalStylesRevisions from './use-global-styles-revisions';
import RevisionsButtons from './revisions-buttons';

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

function ScreenRevisions() {
	const { goTo } = useNavigator();
	const { user: userConfig, setUserConfig } =
		useContext( GlobalStylesContext );
	const { blocks, editorCanvasContainerView } = useSelect( ( select ) => {
		return {
			editorCanvasContainerView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			blocks: select( blockEditorStore ).getBlocks(),
		};
	}, [] );
	const { revisions, isLoading, hasUnsavedChanges } =
		useGlobalStylesRevisions();
	const [ selectedRevisionId, setSelectedRevisionId ] = useState();
	const [ globalStylesRevision, setGlobalStylesRevision ] =
		useState( userConfig );
	const [
		isLoadingRevisionWithUnsavedChanges,
		setIsLoadingRevisionWithUnsavedChanges,
	] = useState( false );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const selectedRevisionMatchesEditorStyles = areGlobalStyleConfigsEqual(
		globalStylesRevision,
		userConfig
	);

	const onCloseRevisions = () => {
		goTo( '/' ); // Return to global styles main panel.
	};

	const restoreRevision = ( revision ) => {
		setUserConfig( () => ( {
			styles: revision?.styles,
			settings: revision?.settings,
		} ) );
		setIsLoadingRevisionWithUnsavedChanges( false );
		onCloseRevisions();
	};

	const selectRevision = ( revision ) => {
		setGlobalStylesRevision( {
			styles: revision?.styles || {},
			settings: revision?.settings || {},
			id: revision?.id,
		} );
		setSelectedRevisionId( revision?.id );
	};

	useEffect( () => {
		if ( editorCanvasContainerView !== 'global-styles-revisions' ) {
			goTo( '/' ); // Return to global styles main panel.
			setEditorCanvasContainerView( editorCanvasContainerView );
		}
	}, [ editorCanvasContainerView ] );

	const firstRevision = revisions[ 0 ];
	const shouldSelectFirstItem =
		! selectedRevisionMatchesEditorStyles &&
		( ! selectedRevisionId || 'unsaved' === selectedRevisionId );

	useEffect( () => {
		/*
		 * Ensure that the first item is selected loaded into the preview pane
		 * where no revision is selected and the selected styles don't match the current editor styles.
		 * This is required in case editor styles are changed outside the revisions panel,
		 * e.g., via the reset styles function of useGlobalStylesReset().
		 * See: https://github.com/WordPress/gutenberg/issues/55866
		 */
		if ( shouldSelectFirstItem ) {
			selectRevision( firstRevision );
		}
	}, [ shouldSelectFirstItem, firstRevision, selectRevision ] );

	// Only display load button if there is a revision to load and it is different from the current editor styles.
	const isLoadButtonEnabled =
		!! globalStylesRevision?.id && ! selectedRevisionMatchesEditorStyles;
	const shouldShowRevisions = ! isLoading && revisions.length;

	return (
		<>
			<ScreenHeader
				title={ __( 'Revisions' ) }
				description={ __(
					'Revisions are added to the timeline when style changes are saved.'
				) }
			/>
			{ isLoading && (
				<Spinner className="edit-site-global-styles-screen-revisions__loading" />
			) }
			{ shouldShowRevisions ? (
				<>
					<Revisions
						blocks={ blocks }
						userConfig={ globalStylesRevision }
						onClose={ onCloseRevisions }
					/>
					<div className="edit-site-global-styles-screen-revisions">
						<RevisionsButtons
							onChange={ selectRevision }
							selectedRevisionId={ selectedRevisionId }
							userRevisions={ revisions }
						/>
						{ isLoadButtonEnabled && (
							<SidebarFixedBottom>
								<Button
									variant="primary"
									className="edit-site-global-styles-screen-revisions__button"
									disabled={
										! globalStylesRevision?.id ||
										globalStylesRevision?.id === 'unsaved'
									}
									onClick={ () => {
										if ( hasUnsavedChanges ) {
											setIsLoadingRevisionWithUnsavedChanges(
												true
											);
										} else {
											restoreRevision(
												globalStylesRevision
											);
										}
									} }
								>
									{ globalStylesRevision?.id === 'parent'
										? __( 'Reset to defaults' )
										: __( 'Apply' ) }
								</Button>
							</SidebarFixedBottom>
						) }
					</div>
					{ isLoadingRevisionWithUnsavedChanges && (
						<ConfirmDialog
							isOpen={ isLoadingRevisionWithUnsavedChanges }
							confirmButtonText={ __( 'Apply' ) }
							onConfirm={ () =>
								restoreRevision( globalStylesRevision )
							}
							onCancel={ () =>
								setIsLoadingRevisionWithUnsavedChanges( false )
							}
						>
							{ __(
								'Any unsaved changes will be lost when you apply this revision.'
							) }
						</ConfirmDialog>
					) }
				</>
			) : (
				<Spacer marginX={ 4 } data-testid="global-styles-no-revisions">
					{
						// Adding an existing translation here in case these changes are shipped to WordPress 6.3.
						// Later we could update to something better, e.g., "There are currently no style revisions.".
						__( 'No results found.' )
					}
				</Spacer>
			) }
		</>
	);
}

export default ScreenRevisions;
