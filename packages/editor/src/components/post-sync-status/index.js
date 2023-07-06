/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	PanelRow,
	Modal,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { ReusableBlocksRenameHint } from '@wordpress/block-editor';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostSyncStatus() {
	const { editPost } = useDispatch( editorStore );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ syncType, setSyncType ] = useState( 'fully' );

	const { syncStatus, postType, isNewPost } = useSelect( ( select ) => {
		const { getEditedPostAttribute, isCleanNewPost } =
			select( editorStore );
		return {
			syncStatus: getEditedPostAttribute( 'wp_pattern_sync_status' ),
			postType: getEditedPostAttribute( 'type' ),
			isNewPost: isCleanNewPost(),
		};
	}, [] );

	useEffect( () => {
		if ( isNewPost ) {
			setIsModalOpen( true );
		}
		// We only want the modal to open when the page is first loaded.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const setSyncStatus = () => {
		editPost( {
			meta: {
				wp_pattern_sync_status:
					syncType === 'unsynced' ? 'unsynced' : null,
			},
		} );
	};

	if ( postType !== 'wp_block' ) {
		return null;
	}
	const { action } = getQueryArgs( window.location.href );
	const currentSyncStatus = action === 'edit' ? syncStatus : syncType;

	return (
		<PanelRow className="edit-post-sync-status">
			{ isModalOpen && (
				<Modal
					title={ __( 'Set pattern sync status' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
					} }
					overlayClassName="reusable-blocks-menu-items__convert-modal"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							setIsModalOpen( false );
							setSyncStatus();
						} }
					>
						<VStack spacing="5">
							<ReusableBlocksRenameHint />
							<ToggleControl
								label={ __( 'Synced' ) }
								help={ __(
									'Editing the pattern will update it anywhere it is used.'
								) }
								checked={ syncType === 'fully' }
								onChange={ () => {
									setSyncType(
										syncType === 'fully'
											? 'unsynced'
											: 'fully'
									);
								} }
							/>
							<HStack justify="right">
								<Button variant="primary" type="submit">
									{ __( 'Create' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
			<span>{ __( 'Sync status' ) }</span>
			<div>
				{ currentSyncStatus === 'unsynced'
					? __( 'Not synced' )
					: __( 'Fully synced' ) }
			</div>
		</PanelRow>
	);
}
