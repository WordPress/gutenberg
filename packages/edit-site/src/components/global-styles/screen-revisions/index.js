/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	__experimentalUseNavigator as useNavigator,
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
import { unlock } from '../../../private-apis';
import Revisions from '../../revisions';
import SidebarFixedBottom from '../../sidebar-edit-mode/sidebar-fixed-bottom';
import { store as editSiteStore } from '../../../store';
import useGetGlobalStylesRevisions from './use-get-global-styles-revisions';
import RestoreGlobalStylesRevisionModal from './restore-global-styles-revision-modal';
import RevisionsButtons from './revisions-buttons';

const { GlobalStylesContext, isGlobalStyleConfigEqual } = unlock(
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
		useGetGlobalStylesRevisions();
	const [ globalStylesRevision, setGlobalStylesRevision ] = useState( {} );

	const [ currentRevisionId, setCurrentRevisionId ] = useState(
		revisions?.[ 0 ]?.id
	);
	const [
		isLoadingRevisionWithUnsavedChanges,
		setIsLoadingRevisionWithUnsavedChanges,
	] = useState( false );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

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
		} ) );
		setIsLoadingRevisionWithUnsavedChanges( false );
		onCloseRevisions();
	};

	const selectRevision = ( revision ) => {
		setGlobalStylesRevision( {
			styles: revision?.styles,
			settings: revision?.settings,
			id: revision?.id,
		} );
		setCurrentRevisionId( revision?.id );
	};

	const isLoadButtonEnabled =
		!! globalStylesRevision?.id &&
		! isGlobalStyleConfigEqual( globalStylesRevision, userConfig );

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
			{ ! isLoading && (
				<Revisions
					blocks={ blocks }
					userConfig={ globalStylesRevision }
					onClose={ onCloseRevisions }
				/>
			) }
			<div className="edit-site-global-styles-screen-revisions">
				<RevisionsButtons
					onChange={ selectRevision }
					currentRevisionId={ currentRevisionId }
					userRevisions={ revisions }
				/>
				{ isLoadButtonEnabled && (
					<SidebarFixedBottom>
						<Button
							variant="primary"
							className="edit-site-global-styles-screen-revisions__button"
							aria-label={ __( 'Load revision' ) }
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
									restoreRevision( globalStylesRevision );
								}
							} }
						>
							{ globalStylesRevision?.id === 'parent'
								? __( 'Reset to defaults' )
								: __( 'Load revision' ) }
						</Button>
					</SidebarFixedBottom>
				) }
			</div>
			{ isLoadingRevisionWithUnsavedChanges && (
				<RestoreGlobalStylesRevisionModal
					onClose={ () =>
						setIsLoadingRevisionWithUnsavedChanges( false )
					}
					onSubmit={ () => restoreRevision( globalStylesRevision ) }
				/>
			) }
		</>
	);
}

export default ScreenRevisions;
