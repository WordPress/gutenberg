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
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { ReusableBlocksRenameHint } = unlock( blockEditorPrivateApis );

export default function PostSyncStatus() {
	const { syncStatus, postType } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const meta = getEditedPostAttribute( 'meta' );

		// When the post is first created, the top level wp_pattern_sync_status is not set so get meta value instead.
		const currentSyncStatus =
			meta?.wp_pattern_sync_status === 'unsynced'
				? 'unsynced'
				: getEditedPostAttribute( 'wp_pattern_sync_status' );

		return {
			syncStatus: currentSyncStatus,
			postType: getEditedPostAttribute( 'type' ),
		};
	} );

	if ( postType !== 'wp_block' ) {
		return null;
	}

	return (
		<PanelRow className="edit-post-sync-status">
			<span>{ __( 'Sync status' ) }</span>
			<div>
				{ syncStatus === 'unsynced'
					? __( 'Not synced' )
					: __( 'Fully synced' ) }
			</div>
		</PanelRow>
	);
}

export function PostSyncStatusModal() {
	const { editPost } = useDispatch( editorStore );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ syncType, setSyncType ] = useState( undefined );

	const { postType, isNewPost } = useSelect( ( select ) => {
		const { getEditedPostAttribute, isCleanNewPost } =
			select( editorStore );
		return {
			postType: getEditedPostAttribute( 'type' ),
			isNewPost: isCleanNewPost(),
		};
	}, [] );

	useEffect( () => {
		if ( isNewPost && postType === 'wp_block' ) {
			setIsModalOpen( true );
		}
		// We only want the modal to open when the page is first loaded.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const setSyncStatus = () => {
		editPost( {
			meta: {
				wp_pattern_sync_status: syncType,
			},
		} );
	};

	if ( postType !== 'wp_block' || ! isNewPost ) {
		return null;
	}

	return (
		<>
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
								checked={ ! syncType }
								onChange={ () => {
									setSyncType(
										! syncType ? 'unsynced' : undefined
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
		</>
	);
}
