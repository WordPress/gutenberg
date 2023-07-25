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
	MenuItem,
	VisuallyHidden,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext, useState, useEffect } from '@wordpress/element';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { external } from '@wordpress/icons';

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
	const { goBack } = useNavigator();
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
	const [ globalStylesDiffs, setGlobalStylesDiffs ] = useState( [] );
	const [ diffModal, setDiffModal ] = useState( false );

	useEffect( () => {
		if ( editorCanvasContainerView !== 'global-styles-revisions' ) {
			goBack();
			setEditorCanvasContainerView( editorCanvasContainerView );
		}
	}, [ editorCanvasContainerView ] );

	const onCloseRevisions = () => {
		goBack();
	};

	const restoreRevision = ( revision ) => {
		setUserConfig( () => ( {
			styles: revision?.styles,
			settings: revision?.settings,
			behaviors: revision?.behaviors,
		} ) );
		setIsLoadingRevisionWithUnsavedChanges( false );
		onCloseRevisions();
	};

	const selectRevision = ( revision ) => {
		setGlobalStylesDiffs( deepCompare( revision, userConfig ) );
		setGlobalStylesRevision( {
			styles: revision?.styles,
			settings: revision?.settings,
			behaviors: revision?.behaviors,
			id: revision?.id,
		} );
		setSelectedRevisionId( revision?.id );
	};

	function deepCompare( obj1, obj2, depth = 0, parentPath = '' ) {
		if (
			typeof obj1 !== 'object' ||
			obj1 === null ||
			typeof obj2 !== 'object' ||
			obj2 === null
		) {
			return [ { path: parentPath, value1: obj1, value2: obj2 } ];
		}

		const keys1 = Object.keys( obj1 );
		const keys2 = Object.keys( obj2 );
		const allKeys = new Set( [ ...keys1, ...keys2 ] );

		let diffs = [];
		for ( const key of allKeys ) {
			const path = parentPath ? parentPath + '.' + key : key;
			const subDiffs = deepCompare(
				obj1[ key ],
				obj2[ key ],
				depth + 1,
				path
			);
			diffs = diffs.concat( subDiffs );
		}
		return diffs;
	}

	const isLoadButtonEnabled =
		!! globalStylesRevision?.id &&
		! areGlobalStyleConfigsEqual( globalStylesRevision, userConfig );
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
								<VStack>
									<MenuItem
										onClick={ () => setDiffModal( true ) }
										target="_blank"
										icon={ external }
										disabled={
											! globalStylesRevision?.id ||
											globalStylesRevision?.id ===
												'unsaved'
										}
									>
										{ __( 'View revision changes' ) }
										<VisuallyHidden as="span">
											{
												/* translators: accessibility text */
												__( '(opens in a new tab)' )
											}
										</VisuallyHidden>
									</MenuItem>
									<Button
										variant="primary"
										className="edit-site-global-styles-screen-revisions__button"
										disabled={
											! globalStylesRevision?.id ||
											globalStylesRevision?.id ===
												'unsaved'
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
										{ __( 'Apply' ) }
									</Button>
								</VStack>
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
					{ diffModal && (
						<ConfirmDialog
							title={ __( 'Changes:' ) }
							isOpen={ diffModal }
							confirmButtonText={ __( 'Apply' ) }
							onConfirm={ () =>
								restoreRevision( globalStylesRevision )
							}
							onCancel={ () => setDiffModal( false ) }
						>
							<>
								<h2>
									{ __(
										'Loading this revision will discard all unsaved changes.'
									) }
								</h2>
								<p>
									{ __(
										'Do you want to replace your unsaved changes in the editor?'
									) }
								</p>
								{ globalStylesDiffs.length }
							</>
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
